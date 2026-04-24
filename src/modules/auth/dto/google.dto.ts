import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class GoogleLoginDTO {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsOptional()
  @IsString()
  role?: string;
}