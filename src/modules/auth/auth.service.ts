import crypto from "crypto";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { Provider, Role } from "../../generated/prisma/enums.js";
import { PrismaClient, User } from "../../generated/prisma/client.js";
import { hashPassword, comparePassword } from "../../lib/argon.js";
import { ApiError } from "../../utils/api-error.js";
import { MailService } from "../mail/mail.service.js";
import {
  LoginDTO,
  RegisterDTO,
  ResetPasswordDTO,
} from "./dto/auth.dto.js";

export class AuthService {
  private googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  constructor(
    private prisma: PrismaClient,
    private mailService: MailService
  ) {}

  private generateAccessToken(user: {
    id: number;
    email: string;
    role: Role;
  }) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_ACCESS_SECRET as string,
      { expiresIn: "20m" }
    );
  }

  private generateRandomToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString("hex");
  }

  private generateRefreshTokenValue() {
    return this.generateRandomToken(64);
  }

  private hashToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  private getExpiryDate(hours = 1) {
    return new Date(Date.now() + hours * 3600000);
  }

  private normalizeRole(role?: string | Role): Role {
    if (!role) return Role.USER;

    const normalized =
      typeof role === "string" ? role.toUpperCase() : role;

    if (normalized === Role.USER) return Role.USER;
    if (normalized === Role.ADMIN) return Role.ADMIN;

    throw new ApiError("Invalid role", 400);
  }

  private mapUserResponse(
    user: User & {
      company?: {
        id: number;
        companyName: string;
        phone: string | null;
      } | null;
    },
    token?: string
  ) {
    return {
      id: user.id,
      fullName: user.fullName || "",
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      profilePhoto: user.profilePhoto || null,
      ...(user.company && {
        company: {
          id: user.company.id,
          name: user.company.companyName,
          phone: user.company.phone,
        },
      }),
      ...(token && { token }),
    };
  }

  private async issueRefreshToken(userId: number) {
    const raw = this.generateRefreshTokenValue();
    const hashed = this.hashToken(raw);

    await this.prisma.refreshToken.upsert({
      where: { userId },
      update: {
        token: hashed,
        expiredAt: this.getExpiryDate(24 * 7),
        revokedAt: false,
      },
      create: {
        userId,
        token: hashed,
        expiredAt: this.getExpiryDate(24 * 7),
        revokedAt: false,
      },
    });

    return raw;
  }

  private async rotateRefreshToken(token: string) {
    const hashed = this.hashToken(token);

    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: hashed },
      include: { user: { include: { company: true } } },
    });

    if (!stored || !stored.user)
      throw new ApiError("Invalid refresh token", 401);

    if (stored.revokedAt)
      throw new ApiError("Token revoked", 401);

    if (stored.expiredAt < new Date())
      throw new ApiError("Token expired", 401);

    const newRaw = this.generateRefreshTokenValue();
    const newHashed = this.hashToken(newRaw);

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: {
        token: newHashed,
        expiredAt: this.getExpiryDate(24 * 7),
        revokedAt: false,
      },
    });

    return {
      user: stored.user,
      accessToken: this.generateAccessToken(stored.user),
      refreshToken: newRaw,
    };
  }

  private async revokeToken(token: string) {
    const hashed = this.hashToken(token);

    await this.prisma.refreshToken.updateMany({
      where: { token: hashed },
      data: { revokedAt: true },
    });
  }

  googleLogin = async (idToken: string, roleInput?: string) => {
    const role = this.normalizeRole(roleInput);

    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload?.email) {
      throw new ApiError("Google account has no email", 400);
    }

    let user = await this.prisma.user.findUnique({
      where: { email: payload.email },
      include: { company: true },
    });

    if (user && user.provider === Provider.CREDENTIALS) {
      throw new ApiError(
        "Email already registered with credentials",
        400
      );
    }

    if (user && roleInput && user.role !== role) {
      throw new ApiError("Account role does not match", 403);
    }

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          fullName: payload.name || "",
          email: payload.email,
          provider: Provider.GOOGLE,
          providerId: payload.sub!,
          password: crypto.randomBytes(16).toString("hex"),
          role,
          isVerified: payload.email_verified ?? false,
          profilePhoto: payload.picture,
          company:
            role === Role.ADMIN
              ? {
                  create: {
                    companyName: "New Company",
                  },
                }
              : undefined,
        },
        include: { company: true },
      });
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.issueRefreshToken(user.id);

    return {
      message: "Google login success",
      data: this.mapUserResponse(user, accessToken),
      refreshToken,
    };
  };

  register = async (body: RegisterDTO) => {
    const existing = await this.prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existing) throw new ApiError("Email already exists", 400);

    const role = this.normalizeRole(body.role);

    const hashedPassword = await hashPassword(body.password);
    const token = this.generateRandomToken();

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          fullName: body.fullName,
          email: body.email,
          password: hashedPassword,
          role,
          provider: Provider.CREDENTIALS,
          company:
            role === Role.ADMIN
              ? {
                  create: {
                    companyName: body.companyName!,
                    phone: body.phone,
                  },
                }
              : undefined,
        },
        include: { company: true },
      });

      await tx.verificationToken.create({
        data: {
          userId: newUser.id,
          token,
          expiresAt: this.getExpiryDate(),
        },
      });

      return newUser;
    });

    await this.mailService.sendEmail(
      user.email,
      "Verify Your Email",
      "verification",
      {
        email: user.email,
        verifyUrl: `${process.env.BASE_URL_FE}/verify-email?token=${token}`,
      }
    );

    return {
      message: "Register success. Please verify your email.",
      data: this.mapUserResponse(user),
    };
  };

  login = async (body: LoginDTO) => {
    const requestedRole = this.normalizeRole(body.role);

    const user = await this.prisma.user.findUnique({
      where: { email: body.email },
      include: { company: true },
    });

    if (
      !user ||
      user.provider !== Provider.CREDENTIALS ||
      !user.password ||
      !(await comparePassword(body.password, user.password))
    ) {
      throw new ApiError("Invalid email or password", 400);
    }

    if (!user.isVerified) {
      throw new ApiError("Please verify your email first", 401);
    }

    if (body.role && user.role !== requestedRole) {
      throw new ApiError("Account role does not match", 403);
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.issueRefreshToken(user.id);

    return {
      message: "Login success",
      data: this.mapUserResponse(user, accessToken),
      refreshToken,
    };
  };

  forgotPassword = async (email: string) => {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || user.provider !== Provider.CREDENTIALS) {
      return { message: "If email exists, reset link sent" };
    }

    const token = this.generateRandomToken();

    await this.prisma.passwordResetToken.upsert({
      where: { userId: user.id },
      update: {
        token,
        expiresAt: this.getExpiryDate(),
      },
      create: {
        userId: user.id,
        token,
        expiresAt: this.getExpiryDate(),
      },
    });

    await this.mailService.sendEmail(
      user.email,
      "Reset Your Password",
      "reset-password",
      {
        email: user.email,
        resetUrl: `${process.env.BASE_URL_FE}/reset-password?token=${token}`,
      }
    );

    return { message: "If email exists, reset link sent" };
  };

  resetPassword = async (body: ResetPasswordDTO) => {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { token: body.token },
    });

    if (!record || record.expiresAt < new Date()) {
      throw new ApiError("Invalid or expired token", 400);
    }

    const hashedPassword = await hashPassword(body.password);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { password: hashedPassword },
      }),
      this.prisma.passwordResetToken.delete({
        where: { id: record.id },
      }),
    ]);

    return { message: "Password reset success" };
  };

  refresh = async (token: string) => {
    const result = await this.rotateRefreshToken(token);

    return {
      message: "Token refreshed",
      data: this.mapUserResponse(result.user, result.accessToken),
      refreshToken: result.refreshToken,
    };
  };

  logout = async (token: string) => {
    await this.revokeToken(token);
    return { message: "Logout success" };
  };

  verifyEmail = async (token: string) => {
    const record = await this.prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!record || record.expiresAt < new Date()) {
      throw new ApiError("Invalid or expired token", 400);
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { isVerified: true },
      }),
      this.prisma.verificationToken.delete({
        where: { id: record.id },
      }),
    ]);

    return { message: "Email verified successfully" };
  };
}
