import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";
import { Role } from "../../../generated/prisma/enums.js";

export class RegisterDTO {
  @IsString()
  @IsNotEmpty({ message: "Full name is required" })
  fullName!: string;

  @IsEmail({}, { message: "Invalid email format" })
  @IsNotEmpty({ message: "Email is required" })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: "Password is required" })
  @MinLength(8, { message: "Password must be at least 8 characters" })
  password!: string;

  @IsOptional()
  @IsEnum(Role, { message: "Role must be either USER or ADMIN" })
  role?: Role;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class LoginDTO {
  @IsEmail({}, { message: "Invalid email format" })
  @IsNotEmpty({ message: "Email is required" })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: "Password is required" })
  password!: string;
}

export class ForgotPasswordDTO {
  @IsEmail({}, { message: "Invalid email format" })
  @IsNotEmpty({ message: "Email is required" })
  email!: string;
}

export class ResetPasswordDTO {
  @IsString()
  @IsNotEmpty({ message: "Token is required" })
  token!: string;

  @IsString()
  @MinLength(8, { message: "New password must be at least 8 characters" })
  password!: string;
}