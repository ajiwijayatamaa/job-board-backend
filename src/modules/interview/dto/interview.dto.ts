import { Transform } from "class-transformer";
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

// DTO untuk membuat jadwal interview baru
export class CreateInterviewDTO {
  @IsNotEmpty({ message: "Application ID tidak boleh kosong" })
  @Transform(({ value }) => parseInt(value))
  @IsNumber({}, { message: "Application ID harus berupa angka" })
  applicationId!: number;

  @IsNotEmpty({ message: "Tanggal interview tidak boleh kosong" })
  @IsDateString(
    {},
    {
      message:
        "Tanggal interview harus berupa format ISO yang valid, contoh: 2025-08-01T09:00:00Z",
    },
  )
  interviewDate!: string;

  @IsOptional()
  @IsString({ message: "Location link harus berupa string" })
  locationLink?: string;
}

// DTO untuk memperbarui jadwal interview
export class UpdateInterviewDTO {
  @IsOptional()
  @IsDateString(
    {},
    {
      message:
        "Tanggal interview harus berupa format ISO yang valid, contoh: 2025-08-01T09:00:00Z",
    },
  )
  interviewDate?: string;

  @IsOptional()
  @IsString({ message: "Location link harus berupa string" })
  locationLink?: string;
}
