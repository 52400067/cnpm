import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "../database/db";
import { users, outbox } from "../database/schema";
import {
  UserStatus,
  OutboxStatus,
  RegisterRequest,
  LoginRequest,
} from "@tickethub/shared";
import { env } from "../config/env.config";

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  async verifyPassword(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  async checkIdentifier(identifier: string): Promise<boolean> {
    const email = identifier.toLowerCase().trim();
    if (!email) return false;
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
      columns: { id: true },
    });
    return Boolean(user);
  }

  async register(dto: RegisterRequest) {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, dto.email.toLowerCase().trim()),
    });

    if (existing) {
      throw new ConflictException({
        success: false,
        error: {
          code: "EMAIL_ALREADY_EXISTS",
          message: "Địa chỉ email đã được đăng ký trong hệ thống",
          timestamp: new Date().toISOString(),
        },
      });
    }

    const passwordHash = await this.hashPassword(dto.password);

    const result = await db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values({
          email: dto.email.toLowerCase().trim(),
          passwordHash,
          fullName: dto.fullName.trim(),
          phone: dto.phone,
          role: dto.role,
          status: UserStatus.PENDING_EMAIL,
          failedLoginAttempts: 0,
        })
        .returning();

      if (!newUser) {
        throw new Error("Không thể tạo bản ghi người dùng");
      }

      const emailToken = await this.jwtService.signAsync(
        { sub: newUser.id, type: "email_verification" },
        { secret: env.JWT_SECRET, expiresIn: 86400 },
      );

      await tx.insert(outbox).values({
        eventType: "USER_REGISTERED",
        payload: {
          userId: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          verificationToken: emailToken,
        },
        status: OutboxStatus.PENDING,
      });

      return {
        userId: newUser.id,
        email: newUser.email,
        status: newUser.status,
        verificationToken: emailToken,
        message:
          "Liên kết kích hoạt đã được gửi tới email của bạn (hiệu lực 24 giờ).",
      };
    });

    return result;
  }

  async verifyEmail(token: string) {
    let payload: { sub: string; type: string };
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: env.JWT_SECRET,
      });
    } catch {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: "INVALID_VERIFICATION_TOKEN",
          message: "Mã xác thực email không hợp lệ hoặc đã hết hạn",
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (payload.type !== "email_verification") {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: "INVALID_TOKEN_TYPE",
          message: "Mã token không đúng mục đích xác thực email",
          timestamp: new Date().toISOString(),
        },
      });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.sub),
    });

    if (!user) {
      throw new NotFoundException({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "Người dùng không tồn tại",
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (user.status === UserStatus.ACTIVE) {
      return { status: UserStatus.ACTIVE };
    }

    await db
      .update(users)
      .set({
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return { status: UserStatus.ACTIVE };
  }

  async login(dto: LoginRequest) {
    const user = await db.query.users.findFirst({
      where: eq(users.email, dto.email.toLowerCase().trim()),
    });

    if (!user) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Email hoặc mật khẩu không chính xác",
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Kiểm tra tài khoản bị tạm khóa do nhập sai nhiều lần
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / (60 * 1000),
      );
      throw new ForbiddenException({
        success: false,
        error: {
          code: "ACCOUNT_LOCKED",
          message: `Tài khoản tạm thời bị khóa do nhập sai mật khẩu quá 5 lần. Thử lại sau ${remainingMinutes} phút.`,
          timestamp: new Date().toISOString(),
        },
      });
    }

    const isMatch = await this.verifyPassword(user.passwordHash, dto.password);

    if (!isMatch) {
      const attempts = user.failedLoginAttempts + 1;
      const lockedUntil =
        attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await db
        .update(users)
        .set({
          failedLoginAttempts: attempts,
          lockedUntil,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      if (attempts >= 5) {
        throw new ForbiddenException({
          success: false,
          error: {
            code: "ACCOUNT_LOCKED",
            message:
              "Tài khoản đã bị tạm khóa 15 phút do nhập sai mật khẩu 5 lần liên tiếp.",
            timestamp: new Date().toISOString(),
          },
        });
      }

      throw new UnauthorizedException({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: `Email hoặc mật khẩu không chính xác. Số lần còn lại: ${5 - attempts}`,
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (user.status === UserStatus.PENDING_EMAIL) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: "EMAIL_NOT_VERIFIED",
          message:
            "Tài khoản chưa được kích hoạt email. Vui lòng kiểm tra hộp thư.",
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (user.status === UserStatus.LOCKED) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: "ACCOUNT_SUSPENDED",
          message: "Tài khoản đã bị quản trị viên khóa.",
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Đăng nhập thành công, reset số lần nhập sai nếu có
    if (user.failedLoginAttempts > 0 || user.lockedUntil !== null) {
      await db
        .update(users)
        .set({
          failedLoginAttempts: 0,
          lockedUntil: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
    }

    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      { secret: env.JWT_SECRET, expiresIn: 900 },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, tokenType: "refresh", jti: crypto.randomUUID() },
      { secret: env.JWT_SECRET, expiresIn: 604800 },
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
      },
    };
  }

  async refreshToken(oldRefreshToken: string) {
    let payload: { sub: string; tokenType: string };
    try {
      payload = await this.jwtService.verifyAsync(oldRefreshToken, {
        secret: env.JWT_SECRET,
      });
    } catch {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: "INVALID_REFRESH_TOKEN",
          message: "Refresh token không hợp lệ hoặc đã hết hạn",
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (payload.tokenType !== "refresh") {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: "INVALID_TOKEN_TYPE",
          message: "Token cung cấp không phải refresh token",
          timestamp: new Date().toISOString(),
        },
      });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.sub),
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: "USER_INACTIVE",
          message: "Tài khoản không tồn tại hoặc không ở trạng thái hoạt động",
          timestamp: new Date().toISOString(),
        },
      });
    }

    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      { secret: env.JWT_SECRET, expiresIn: 900 },
    );

    const newRefreshToken = await this.jwtService.signAsync(
      { sub: user.id, tokenType: "refresh", jti: crypto.randomUUID() },
      { secret: env.JWT_SECRET, expiresIn: 604800 },
    );

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900,
    };
  }

  async getCurrentUser(userId: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new NotFoundException({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "Không tìm thấy thông tin người dùng",
          timestamp: new Date().toISOString(),
        },
      });
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt,
    };
  }
}
