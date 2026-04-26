import { Transform } from "class-transformer";
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { PaginationQueryParams } from "../../pagination/dto/pagination.dto.js";

export class CreateApplicationDTO {
  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined && value !== "" ? parseInt(value) : undefined,
  )
  @IsNumber({}, { message: "cvId harus berupa angka" })
  cvId?: number;

  @Transform(({ value }) =>
    value !== undefined && value !== "" ? parseFloat(value) : undefined,
  )
  @IsNotEmpty({ message: "Expected salary wajib diisi" })
  @IsNumber({}, { message: "Expected salary harus berupa angka" })
  @Min(0, { message: "Expected salary tidak boleh negatif" })
  expectedSalary!: number;
}

export class GetMyApplicationsDTO extends PaginationQueryParams {
  @IsOptional()
  @IsString({ message: "Search harus berupa string" })
  search?: string;

  @IsOptional()
  @IsString({ message: "Status harus berupa string" })
  @IsIn(["PENDING", "PROCESSED", "INTERVIEW", "ACCEPTED", "REJECTED"], {
    message: "Status harus PENDING, PROCESSED, INTERVIEW, ACCEPTED, atau REJECTED",
  })
  status?: "PENDING" | "PROCESSED" | "INTERVIEW" | "ACCEPTED" | "REJECTED";
}

export class GetApplicantsDTO extends PaginationQueryParams {
  @IsOptional()
  @IsString({ message: "Search harus berupa string" })
  search?: string;

  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined && value !== "" ? parseInt(value) : undefined,
  )
  @IsNumber({}, { message: "Min usia harus berupa angka" })
  @Min(0, { message: "Min usia tidak boleh negatif" })
  minAge?: number;

  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined && value !== "" ? parseInt(value) : undefined,
  )
  @IsNumber({}, { message: "Max usia harus berupa angka" })
  @Min(0, { message: "Max usia tidak boleh negatif" })
  maxAge?: number;

  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined && value !== "" ? parseFloat(value) : undefined,
  )
  @IsNumber({}, { message: "Min ekspektasi gaji harus berupa angka" })
  @Min(0, { message: "Min ekspektasi gaji tidak boleh negatif" })
  minExpectedSalary?: number;

  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined && value !== "" ? parseFloat(value) : undefined,
  )
  @IsNumber({}, { message: "Max ekspektasi gaji harus berupa angka" })
  @Min(0, { message: "Max ekspektasi gaji tidak boleh negatif" })
  maxExpectedSalary?: number;

  @IsOptional()
  @IsString({ message: "Education harus berupa string" })
  education?: string;
}

export class UpdateApplicantStatusDTO {
  @IsNotEmpty({ message: "Status tidak boleh kosong" })
  @IsString({ message: "Status harus berupa string" })
  @IsIn(["PROCESSED", "INTERVIEW", "ACCEPTED", "REJECTED"], {
    message: "Status harus PROCESSED, INTERVIEW, ACCEPTED, atau REJECTED",
  })
  status!: "PROCESSED" | "INTERVIEW" | "ACCEPTED" | "REJECTED";

  @IsOptional()
  @IsString({ message: "Alasan penolakan harus berupa string" })
  rejectionReason?: string;
}
