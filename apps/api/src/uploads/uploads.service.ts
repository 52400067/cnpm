import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";

import {
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { OrganizerStatus, UserRole, UserStatus } from "@tickethub/shared";

import { db } from "../database/db";

import { organizerProfiles, users } from "../database/schema";

// Du lieu nhan tu Controller
export interface PresignImageDto {
  filename: string;
  contentType: "image/jpeg" | "image/png" | "image/webp";
  sizeBytes: number;
}

@Injectable()
export class UploadsService {
  async presignEventImage(userId: string, dto: PresignImageDto) {
    // 1. Kiem tra Organizer da duoc xac minh
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
      throw new ForbiddenException("Ban to chuc chua duoc xac minh");
    }

    // 2. Kiem tra du lieu anh
    const maxSize = 5 * 1024 * 1024;

    if (
      !Number.isInteger(dto.sizeBytes) ||
      dto.sizeBytes <= 0 ||
      dto.sizeBytes > maxSize
    ) {
      throw new BadRequestException(
        "Kich thuoc anh khong hop le (toi da 5 MiB)",
      );
    }

    const extensions: Record<PresignImageDto["contentType"], string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };

    const extension = extensions[dto.contentType];

    if (!extension) {
      throw new BadRequestException("Chi ho tro anh JPG, PNG va WebP");
    }

    // Kiem tra duoi file phu hop voi contentType
    const validFilename =
      dto.contentType === "image/jpeg"
        ? /\.jpe?g$/i.test(dto.filename)
        : dto.contentType === "image/png"
          ? /\.png$/i.test(dto.filename)
          : /\.webp$/i.test(dto.filename);

    if (!validFilename) {
      throw new BadRequestException("Ten file khong khop voi dinh dang anh");
    }

    // 3. Lay cau hinh AWS S3 tu .env
    const region = process.env.S3_REGION;
    const bucket = process.env.S3_BUCKET;
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

    if (!region || !bucket || !accessKeyId || !secretAccessKey) {
      throw new ServiceUnavailableException("AWS S3 chua duoc cau hinh");
    }

    // 4. Tao AWS S3 Client
    const s3 = new S3Client({
      region,
      requestChecksumCalculation: "WHEN_REQUIRED",
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // 5. Tao ten file duy nhat
    const fileName = `${randomUUID()}.${extension}`;

    // Luu anh theo tung Organizer
    const key = `events/${profile.id}/${fileName}`;

    // 6. Tao lenh upload anh
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: dto.contentType,
    });

    // 7. Tao Presigned URL het han sau 5 phut
    const uploadUrl = await getSignedUrl(s3, command, {
      expiresIn: 300,
      signableHeaders: new Set(["content-type"]),
    });

    // 8. URL cong khai (neu da cau hinh CloudFront)
    const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL?.trim().replace(
      /\/+$/,
      "",
    );

    const publicUrl = publicBaseUrl ? `${publicBaseUrl}/${key}` : null;

    // 9. Tra ket qua cho Controller
    return {
      uploadUrl,
      key,
      publicUrl,
      method: "PUT",
      headers: {
        "Content-Type": dto.contentType,
      },
      expiresIn: 300,
      maxBytes: maxSize,
    };
  }

  async confirmEventImage(userId: string, key: string) {
    // 1. Kiem tra tai khoan Organizer
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
      throw new ForbiddenException("Ban to chuc chua duoc xac minh");
    }

    // 2. Kiem tra anh thuoc dung Organizer
    const prefix = `events/${profile.id}/`;

    if (
      !key.startsWith(prefix) ||
      !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}\.(jpg|png|webp)$/i.test(
        key.slice(prefix.length),
      )
    ) {
      throw new ForbiddenException("Ban khong co quyen xac nhan anh nay");
    }

    // 3. Xac dinh MIME type tu duoi file
    const extension = key.split(".").pop()?.toLowerCase();

    const contentType =
      extension === "jpg"
        ? "image/jpeg"
        : extension === "png"
          ? "image/png"
          : "image/webp";

    // 4. Lay cau hinh AWS S3
    const bucket = process.env.S3_BUCKET;
    const region = process.env.S3_REGION;
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

    if (!bucket || !region || !accessKeyId || !secretAccessKey) {
      throw new ServiceUnavailableException("AWS S3 chua duoc cau hinh");
    }

    const s3 = new S3Client({
      region,
      requestChecksumCalculation: "WHEN_REQUIRED",
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // 5. Kiem tra kich thuoc va Content-Type thuc te
    const metadata = await s3.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );

    const maxSize = 5 * 1024 * 1024;

    if (!metadata.ContentLength || metadata.ContentLength > maxSize) {
      throw new BadRequestException("Anh khong hop le hoac vuot qua 5 MiB");
    }

    if (metadata.ContentType !== contentType) {
      throw new BadRequestException("Content-Type cua anh khong hop le");
    }

    // 6. Doc 12 byte dau de kiem tra chu ky anh
    const object = await s3.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        Range: "bytes=0-11",
      }),
    );

    const bytes = await object.Body?.transformToByteArray();

    if (!bytes) {
      throw new BadRequestException("Khong doc duoc noi dung anh");
    }

    let validImage = false;

    if (contentType === "image/png") {
      const signature = [137, 80, 78, 71, 13, 10, 26, 10];

      validImage = signature.every((value, index) => bytes[index] === value);
    } else if (contentType === "image/jpeg") {
      validImage = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    } else if (contentType === "image/webp") {
      validImage =
        String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
        String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
    }

    if (!validImage) {
      throw new BadRequestException(
        "Noi dung file khong phai dinh dang anh hop le",
      );
    }

    // 7. Tra thong tin anh da xac nhan
    const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL?.trim().replace(
      /\/+$/,
      "",
    );

    return {
      key,
      contentType,
      sizeBytes: metadata.ContentLength,
      verified: true,
      publicUrl: publicBaseUrl ? `${publicBaseUrl}/${key}` : null,
    };
  }
}
