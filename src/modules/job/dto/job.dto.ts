import { Transform } from "class-transformer";
import {
  IsArray,
  IsDate,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { PaginationQueryParams } from "../../pagination/dto/pagination.dto.js";

export class CreateJobDTO {
  @IsNotEmpty({ message: "Job title tidak boleh kosong" })
  @IsString({ message: "Job title harus berupa string" })
  title!: string;

  @IsNotEmpty({ message: "Deskripsi tidak boleh kosong" })
  @IsString({ message: "Deskripsi harus berupa string" })
  description!: string;

  @IsNotEmpty({ message: "Kategori tidak boleh kosong" })
  @IsString({ message: "Kategori harus berupa string" })
  category!: string;

  @IsNotEmpty({ message: "Kota tidak boleh kosong" })
  @Transform(({ value }) => value.trim().toLowerCase())
  @IsString({ message: "Kota harus berupa string" })
  city!: string;

  @IsNotEmpty({ message: "Deadline tidak boleh kosong" })
  @Transform(({ value }) => new Date(value))
  @IsDate({ message: "Deadline harus berupa tanggal yang valid" })
  deadline!: Date;

  @Transform(({ value }) => {
    if (typeof value === "string") return JSON.parse(value);
    return value;
  })
  @IsArray({ message: "Tags harus berupa array" })
  @IsString({ each: true, message: "Setiap tag harus berupa string" })
  @IsNotEmpty({ message: "Tags tidak boleh kosong" })
  tags!: string[];

  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined && value !== "" ? parseFloat(value) : undefined,
  )
  @IsNumber({}, { message: "Salary harus berupa angka" })
  @Min(0, { message: "Salary tidak boleh negatif" })
  salary?: number;

  // banner dihandle multer → cloudinary jadi gk masuk DTO
}

export class UpdateJobDTO {
  @IsOptional()
  @IsString({ message: "Job title harus berupa string" })
  title?: string;

  @IsOptional()
  @IsString({ message: "Deskripsi harus berupa string" })
  description?: string;

  @IsOptional()
  @IsString({ message: "Kategori harus berupa string" })
  category?: string;

  @IsOptional()
  @Transform(({ value }) => value.trim().toLowerCase())
  @IsString({ message: "Kota harus berupa string" })
  city?: string;

  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined && value !== "" ? new Date(value) : undefined,
  )
  @IsDate({ message: "Deadline harus berupa tanggal yang valid" })
  deadline?: Date;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === "string") return JSON.parse(value);
    return value;
  })
  @IsArray({ message: "Tags harus berupa array" })
  @IsString({ each: true, message: "Setiap tag harus berupa string" })
  tags?: string[];

  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined && value !== "" ? parseFloat(value) : undefined,
  )
  @IsNumber({}, { message: "Salary harus berupa angka" })
  @Min(0, { message: "Salary tidak boleh negatif" })
  salary?: number;
}

export class UpdateJobStatusDTO {
  @IsNotEmpty({ message: "Status tidak boleh kosong" })
  @IsString({ message: "Status harus berupa string" })
  @IsIn(["DRAFT", "PUBLISHED"], {
    message: "Status harus DRAFT atau PUBLISHED",
  })
  status!: "DRAFT" | "PUBLISHED" | "CLOSED";
}

export class GetJobsDTO extends PaginationQueryParams {
  @IsOptional()
  @IsString({ message: "Search harus berupa string" })
  search?: string;

  @IsOptional()
  @IsString({ message: "Category harus berupa string" })
  category?: string;

  @IsOptional()
  @IsString({ message: "City harus berupa string" })
  city?: string;
}

export class GetPublicJobsDTO extends PaginationQueryParams {
  @IsOptional()
  @IsString({ message: "Search harus berupa string" })
  search?: string;

  @IsOptional()
  @IsString({ message: "Category harus berupa string" })
  category?: string;

  @IsOptional()
  @IsString({ message: "City harus berupa string" })
  city?: string;

  @IsOptional()
  @IsString({ message: "Tag harus berupa string" })
  tag?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate({ message: "startDate harus berupa tanggal yang valid" })
  startDate?: Date;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate({ message: "endDate harus berupa tanggal yang valid" })
  endDate?: Date;

  @IsOptional()
  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  @IsNumber({}, { message: "Latitude harus berupa angka" })
  latitude?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  @IsNumber({}, { message: "Longitude harus berupa angka" })
  longitude?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? parseFloat(value) : 50)) // Default 50km
  @IsNumber({}, { message: "Radius harus berupa angka" })
  radius?: number;
}
