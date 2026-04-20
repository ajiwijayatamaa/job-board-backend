import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Provider, Role } from "../../generated/prisma/enums.js";
import { hashPassword, comparePassword } from "../../lib/argon.js";
import { PrismaClient, User } from "../../generated/prisma/client.js";
import { ApiError } from "../../utils/api-error.js";
import { MailService } from "../mail/mail.service.js";
import { LoginDTO, RegisterDTO, ResetPasswordDTO } from "./dto/auth.dto.js";

export class AuthService {
  constructor(
    private prisma: PrismaClient,
    private mailService: MailService,
  ) {}

  register = async (body: RegisterDTO) => {
    const existingUser = await this.prisma.user.findUnique({ where: { email: body.email } });
    if (existingUser) throw new ApiError("Email already exists", 400);

    const registerRole = this.normalizeRole(body.role);
    if (registerRole === Role.ADMIN && !body.companyName) {
      throw new ApiError("Company name is required for admin registration", 400);
    }

    const hashedPassword = await hashPassword(body.password);
    const { user, verificationToken } = await this.prisma.$transaction(async (tx) => {
      const vToken = this.generateRandomToken();
      const newUser = await tx.user.create({
        data: {
          fullName: body.name,
          email: body.email,
          password: hashedPassword,
          role: registerRole,
          provider: Provider.CREDENTIALS,
          company: registerRole === Role.ADMIN ? {
            create: { companyName: body.companyName!, phone: body.phone },
          } : undefined,
        },
        include: { company: true },
      });

      await tx.verificationToken.create({
        data: { userId: newUser.id, token: vToken, expiresAt: this.getExpiryDate() },
      });

      return { user: newUser, verificationToken: vToken };
    });

    await this.mailService.sendEmail(
      user.email,
      "Verify Your Email",
      "verfication",
      {
        email: user.email,
        verifyUrl: `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`,
      },
    );
    return {
      message: "Register success. Please check your email to verify your account.",
      data: this.mapUserResponse(user, this.generateToken(user)),
    };
  };

  verifyEmail = async (token: string) => {
    const verificationToken = await this.prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken) throw new ApiError("Invalid verification token", 400);
    if (verificationToken.expiresAt < new Date()) 
      throw new ApiError("Verification token expired. Please login to resend email.", 400);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: verificationToken.userId },
        data: { isVerified: true },
      }),
      this.prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      }),
    ]);

    return { message: "Email verified successfully. Please login again to refresh your session." };
  };

  resendVerification = async (userId: number) => {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) throw new ApiError("User not found", 404);
    if (user.isVerified) throw new ApiError("Account already verified", 400);

    const token = this.generateRandomToken();
    const expiresAt = this.getExpiryDate();

    await this.prisma.verificationToken.upsert({
      where: { userId: user.id },
      update: { token, expiresAt },
      create: { userId: user.id, token, expiresAt },
    });

    await this.mailService.sendEmail(
      user.email,
      "Verify Your Email",
      "verfication",
      {
        email: user.email,
        verifyUrl: `${process.env.FRONTEND_URL}/verify-email?token=${token}`,
      },
    );

    return { message: "Verification email resent." };
  };

  login = async (body: LoginDTO) => {
    const user = await this.prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !(await comparePassword(body.password, user.password))) {
      throw new ApiError("Invalid email or password", 400);
    }

    if (!user.isVerified) {
      throw new ApiError("Please verify your email before logging in", 401);
    }

    return {
      message: "Login success",
      data: this.mapUserResponse(user, this.generateToken(user)),
    };
  };

  forgotPassword = async (email: string) => {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user && user.provider === Provider.CREDENTIALS) {
      const token = this.generateRandomToken();
      const expiresAt = this.getExpiryDate();

      await this.prisma.passwordResetToken.upsert({
        where: { userId: user.id },
        update: { token, expiresAt },
        create: { userId: user.id, token, expiresAt },
      });

      await this.mailService.sendEmail(
        user.email,
        "Reset Your Password",
        "reset-password",
        {
          email: user.email,
          resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${token}`,
        },
      );

      return { token, email: user.email };
    }

    return null;
  };

  resetPassword = async (body: ResetPasswordDTO) => {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token: body.token },
      include: { user: true },
    });

    if (!resetToken || resetToken.expiresAt < new Date()) throw new ApiError("Invalid or expired reset token", 400);

    const hashedPassword = await hashPassword(body.password);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: resetToken.userId }, data: { password: hashedPassword } }),
      this.prisma.passwordResetToken.delete({ where: { id: resetToken.id } }),
    ]);

    return { message: "Password reset success" };
  };

  private generateToken = (user: { id: number; email: string; role: Role; isVerified: boolean }) => {
    return jwt.sign({ ...user }, process.env.JWT_SECRET as string, { expiresIn: "20m" });
  };

  private generateRandomToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  private getExpiryDate(hours: number = 1): Date {
    return new Date(Date.now() + hours * 3600000);
  }

  private normalizeRole(role?: string | Role): Role {
    if (!role) return Role.USER;
    const normalized = typeof role === "string" ? role.toUpperCase() : role;
    if (normalized === Role.USER || normalized === Role.ADMIN) return normalized as Role;
    throw new ApiError("Invalid role. Use USER or ADMIN", 400);
  }

  /**
   * Memetakan data user untuk response API
   */
  private mapUserResponse(
    user: User & { company?: { id: number; companyName: string; phone: string | null } | null }, 
    token?: string
  ) {
    return {
      id: user.id,
      name: user.fullName || "",
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
}
