import jwt from "jsonwebtoken";
import { Provider, Role } from "../../generated/prisma/enums.js";
import { hashPassword, comparePassword } from "../../lib/argon.js";
import { PrismaClient } from "../../generated/prisma/client.js";
import { ApiError } from "../../utils/api-error.js";
import { MailService } from "../mail/mail.service.js";
import { AuthHelper } from "./helpers/auth.helpers.js";

export class AuthService {
  constructor(
    private prisma: PrismaClient,
    private mailService: MailService,
  ) {}

  register = async (body: {
    name: string;
    email: string;
    password: string;
    role?: Role | string;
    companyName?: string;
    phone?: string;
  }) => {
    const existingUser = await this.prisma.user.findUnique({ where: { email: body.email } });
    if (existingUser) throw new ApiError("Email already exists", 400);

    const registerRole = AuthHelper.normalizeRole(body.role);
    if (registerRole === Role.ADMIN && !body.companyName) {
      throw new ApiError("Company name is required for admin registration", 400);
    }

    const hashedPassword = await hashPassword(body.password);
    const { user, verificationToken } = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          fullName: body.name, email: body.email, password: hashedPassword,
          role: registerRole, provider: Provider.CREDENTIALS,
        },
      });

      if (registerRole === Role.ADMIN) {
        (newUser as any).company = await tx.company.create({
          data: { adminId: newUser.id, companyName: body.companyName!, phone: body.phone },
        });
      }

      const vToken = AuthHelper.generateRandomToken();
      await tx.verificationToken.create({
        data: { userId: newUser.id, token: vToken, expiresAt: AuthHelper.getExpiryDate() },
      });

      return { user: newUser, verificationToken: vToken };
    });

    await this.mailService.sendVerificationEmail(user.email, verificationToken);
    return {
      message: "Register success. Please check your email to verify your account.",
      data: AuthHelper.mapUserResponse(user, this.generateToken(user)),
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

    const token = AuthHelper.generateRandomToken();
    const expiresAt = AuthHelper.getExpiryDate();

    await this.prisma.verificationToken.upsert({
      where: { userId: user.id },
      update: { token, expiresAt },
      create: { userId: user.id, token, expiresAt },
    });

    await this.mailService.sendVerificationEmail(user.email, token);

    return { message: "Verification email resent." };
  };

  login = async (body: { email: string; password: string }) => {
    const user = await this.prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !(await comparePassword(body.password, user.password))) {
      throw new ApiError("Invalid email or password", 400);
    }

    return {
      message: "Login success",
      data: AuthHelper.mapUserResponse(user, this.generateToken(user)),
    };
  };

  forgotPassword = async (email: string) => {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user && user.provider === Provider.CREDENTIALS) {
      const token = AuthHelper.generateRandomToken();
      const expiresAt = AuthHelper.getExpiryDate();

      await this.prisma.passwordResetToken.upsert({
        where: { userId: user.id },
        update: { token, expiresAt },
        create: { userId: user.id, token, expiresAt },
      });

      await this.mailService.sendResetPasswordEmail(user.email, token);

      return { token, email: user.email };
    }

    return null;
  };

  resetPassword = async (body: { token: string; password: string }) => {
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
}
