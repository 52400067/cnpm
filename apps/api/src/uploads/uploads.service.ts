import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";

import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import {
  OrganizerStatus,
  type PresignImageRequest,
  UserRole,
  UserStatus,
} from "@tickethub/shared";

import { env } from "../config/env.config";
import { db } from "../database/db";
import { organizerProfiles, users } from "../database/schema";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const PNG_MAGIC_BYTES = [137, 80, 78, 71, 13, 10, 26, 10];

@Injectable()
export class UploadsService {
  private readonly s3Client: S3Client;
  private readonly bucket: string;

  constructor() {
    this.bucket = env.S3_BUCKET;

    const s3Config: {
      region: string;
      requestChecksumCalculation: "WHEN_REQUIRED";
      credentials?: { accessKeyId: string; secretAccessKey: string };
    } = {
      region: env.S3_REGION,
      requestChecksumCalculation: "WHEN_REQUIRED",
    };

    if (env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY) {
      s3Config.credentials = {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      };
    }

    this.s3Client = new S3Client(s3Config);
  }

  private getPublicUrl(key: string): string | null {
    const base = env.S3_PUBLIC_BASE_URL?.trim().replace(/\/+$/, "");
    return base ? `${base}/${key}` : null;
  }

  async presignEventImage(userId: string, dto: PresignImageRequest) {
    // 1. Kiểm tra Ban tổ chức đã được xác minh
    const [profile] = await db
      .select({
        id: organizerProfiles.id,
      })
      .from(organizerProfiles)
      .innerJoin(users, eq(organizerProfiles.userId, users.id))
      .where(
        and(
          eq(organizerProfiles.userId, userId),
          eq(organizerProfiles.status, OrganizerStatus.VERIFIED),
          eq(users.role, UserRole.ORGANIZER),
          eq(users.status, UserStatus.ACTIVE),
        ),
      )
      .limit(1);

    if (!profile) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: "ORGANIZER_NOT_VERIFIED",
          message: "Ban tổ chức chưa được xác minh tài khoản",
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 2. Kiểm tra dung lượng và đuôi tệp
    if (
      !Number.isInteger(dto.sizeBytes) ||
      dto.sizeBytes <= 0 ||
      dto.sizeBytes > MAX_IMAGE_BYTES
    ) {
      throw new BadRequestException({
        success: false,
        error: {
          code: "INVALID_IMAGE_SIZE",
          message: "Kích thước ảnh không hợp lệ (tối đa 5 MiB)",
          timestamp: new Date().toISOString(),
        },
      });
    }

    const extensions: Record<PresignImageRequest["contentType"], string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };

    const extension = extensions[dto.contentType];
    if (!extension) {
      throw new BadRequestException({
        success: false,
        error: {
          code: "UNSUPPORTED_IMAGE_FORMAT",
          message: "Hệ thống chỉ hỗ trợ định dạng JPG, PNG và WebP",
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 3. Tạo định danh duy nhất và đường dẫn lưu trữ S3
    const fileName = `${randomUUID()}.${extension}`;
    const key = `events/${profile.id}/${fileName}`;

    // 4. Khởi tạo PutObjectCommand
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: dto.contentType,
    });

    // 5. Ký Presigned URL có thời hạn 5 phút
    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 300,
      signableHeaders: new Set(["content-type"]),
    });

    return {
      uploadUrl,
      key,
      publicUrl: this.getPublicUrl(key),
      method: "PUT",
      headers: {
        "Content-Type": dto.contentType,
      },
      expiresIn: 300,
      maxBytes: MAX_IMAGE_BYTES,
    };
  }

  async confirmEventImage(userId: string, key: string) {
    // 1. Kiểm tra tài khoản Ban tổ chức
    const [profile] = await db
      .select({
        id: organizerProfiles.id,
      })
      .from(organizerProfiles)
      .innerJoin(users, eq(organizerProfiles.userId, users.id))
      .where(
        and(
          eq(organizerProfiles.userId, userId),
          eq(organizerProfiles.status, OrganizerStatus.VERIFIED),
          eq(users.role, UserRole.ORGANIZER),
          eq(users.status, UserStatus.ACTIVE),
        ),
      )
      .limit(1);

    if (!profile) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: "ORGANIZER_NOT_VERIFIED",
          message: "Ban tổ chức chưa được xác minh tài khoản",
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 2. Kiểm tra quyền sở hữu ảnh theo thư mục ban tổ chức
    const prefix = `events/${profile.id}/`;
    if (
      !key.startsWith(prefix) ||
      !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}\.(jpg|png|webp)$/i.test(
        key.slice(prefix.length),
      )
    ) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: "FORBIDDEN_IMAGE_KEY",
          message: "Bạn không có quyền xác nhận tập tin này",
          timestamp: new Date().toISOString(),
        },
      });
    }

    const extension = key.split(".").pop()?.toLowerCase();
    const contentType =
      extension === "jpg"
        ? "image/jpeg"
        : extension === "png"
          ? "image/png"
          : "image/webp";

    // 3. Kiểm tra metadata đối tượng trên S3
    let metadata;
    try {
      metadata = await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
    } catch {
      throw new NotFoundException({
        success: false,
        error: {
          code: "IMAGE_NOT_FOUND",
          message: "Không tìm thấy tệp ảnh trên lưu trữ đám mây",
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (
      !metadata.ContentLength ||
      metadata.ContentLength <= 0 ||
      metadata.ContentLength > MAX_IMAGE_BYTES
    ) {
      throw new BadRequestException({
        success: false,
        error: {
          code: "INVALID_IMAGE_SIZE",
          message: "Dung lượng ảnh không hợp lệ hoặc vượt quá giới hạn 5 MiB",
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Định dạng ảnh hợp lệ cần tối thiểu 12 bytes
    if (metadata.ContentLength < 12) {
      throw new BadRequestException({
        success: false,
        error: {
          code: "IMAGE_TOO_SMALL",
          message: "Tập tin không đủ dung lượng của một định dạng ảnh hợp lệ",
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (metadata.ContentType !== contentType) {
      throw new BadRequestException({
        success: false,
        error: {
          code: "CONTENT_TYPE_MISMATCH",
          message: "Content-Type của tệp tải lên không khớp",
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 4. Đọc 12 byte đầu để xác thực magic bytes
    let bytes: Uint8Array;
    try {
      const object = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Range: "bytes=0-11",
        }),
      );

      const buffer = await object.Body?.transformToByteArray();
      if (!buffer || buffer.length < 12) {
        throw new Error("Missing buffer");
      }
      bytes = buffer;
    } catch {
      throw new BadRequestException({
        success: false,
        error: {
          code: "IMAGE_READ_ERROR",
          message: "Không thể đọc nội dung kiểm tra định dạng tệp ảnh",
          timestamp: new Date().toISOString(),
        },
      });
    }

    let validImage = false;
    if (contentType === "image/png") {
      validImage = PNG_MAGIC_BYTES.every(
        (value, index) => bytes[index] === value,
      );
    } else if (contentType === "image/jpeg") {
      validImage = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    } else if (contentType === "image/webp") {
      validImage =
        String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
        String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
    }

    if (!validImage) {
      throw new BadRequestException({
        success: false,
        error: {
          code: "INVALID_IMAGE_SIGNATURE",
          message: "Nội dung tệp không khớp với chữ ký định dạng ảnh hợp lệ",
          timestamp: new Date().toISOString(),
        },
      });
    }

    return {
      key,
      contentType,
      sizeBytes: metadata.ContentLength,
      verified: true,
      publicUrl: this.getPublicUrl(key),
    };
  }
}
