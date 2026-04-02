import { hashPassword } from "../../lib/argon.js";
import { prisma } from "../../lib/prisma.js";

export class UserService {
  async create(body: {
    name: string;
    email: string;
    password: string;
  }) {
    const hashedPassword = await hashPassword(body.password);

    await prisma.user.create({
      data: {
        fullName: body.name,
        email: body.email,
        password: hashedPassword,
      },
    });

    return { message: "Create user success" };
  }
}