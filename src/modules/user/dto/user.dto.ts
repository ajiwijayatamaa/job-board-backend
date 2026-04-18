import { Gender } from "../../../generated/prisma/enums.js";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class UpdateProfileDTO {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  address?: string;
}