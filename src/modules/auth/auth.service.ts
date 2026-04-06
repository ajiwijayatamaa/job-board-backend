import jwt from "jsonwebtoken";
import { Provider, Role } from "../../generated/prisma/enums.js";
import { hashPassword, comparePassword } from "../../lib/argon.js";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";

export class AuthService {
  async register(body: {
    name: string;
    email: string;
    password: string;
    role?: Role | string;
  }) {
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      throw new ApiError("Email already exists", 400);
    }

    const hashedPassword = await hashPassword(body.password);

    const normalizedRole =
      typeof body.role === "string" ? body.role.toUpperCase() : undefined;

    let registerRole: Role = Role.USER;

    if (normalizedRole) {
      if (normalizedRole === Role.USER || normalizedRole === Role.ADMIN) {
        registerRole = normalizedRole;
      } else {
        throw new ApiError("Invalid role. Use USER or ADMIN", 400);
      }
    }

    const user = await prisma.user.create({
      data: {
        fullName: body.name,
        email: body.email,
        password: hashedPassword,
        role: registerRole,
        provider: Provider.CREDENTIALS,
      },
    });

    const token = this.generateToken(user);

    return {
      message: "Register success",
      data: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        role: user.role,
        token,
      },
    };
  }

  async login(body: { email: string; password: string }) {
    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      throw new ApiError("Invalid email or password", 400);
    }

    const isValidPassword = await comparePassword(body.password, user.password);

    if (!isValidPassword) {
      throw new ApiError("Invalid email or password", 400);
    }

    const token = this.generateToken(user);

    return {
      message: "Login success",
      data: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        role: user.role,
        token,
      },
    };
  }

  private generateToken(user: { id: number; email: string; role: Role }) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "20m" },
    );
  }
}
