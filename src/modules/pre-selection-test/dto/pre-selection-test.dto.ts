import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { PaginationQueryParams } from "../../pagination/dto/pagination.dto.js";

export class CreateTestOptionDTO {
  @IsNotEmpty({ message: "Teks opsi tidak boleh kosong" })
  @IsString({ message: "Teks opsi harus berupa string" })
  optionText!: string;

  @IsNotEmpty({ message: "isCorrect tidak boleh kosong" })
  @IsBoolean({ message: "isCorrect harus berupa boolean" })
  isCorrect!: boolean;
}

export class CreateTestQuestionDTO {
  @IsNotEmpty({ message: "Teks soal tidak boleh kosong" })
  @IsString({ message: "Teks soal harus berupa string" })
  questionText!: string;

  @IsNotEmpty({ message: "Jawaban benar tidak boleh kosong" })
  @IsString({ message: "Jawaban benar harus berupa string" })
  correctAnswer!: string;

  @IsArray({ message: "Opsi jawaban harus berupa array" })
  @ArrayMinSize(2, { message: "Opsi jawaban minimal 2" })
  @ArrayMaxSize(5, { message: "Opsi jawaban maksimal 5" })
  @ValidateNested({ each: true })
  @Type(() => CreateTestOptionDTO)
  options!: CreateTestOptionDTO[];
}

export class CreatePreSelectionTestDTO {
  @IsNotEmpty({ message: "Job ID tidak boleh kosong" })
  @IsNumber({}, { message: "Job ID harus berupa angka" })
  jobId!: number;

  @IsNotEmpty({ message: "Judul tidak boleh kosong" })
  @IsString({ message: "Judul harus berupa string" })
  title!: string;

  @IsArray({ message: "Soal harus berupa array" })
  @ArrayMinSize(25, { message: "Soal harus berjumlah tepat 25" })
  @ArrayMaxSize(25, { message: "Soal harus berjumlah tepat 25" })
  @ValidateNested({ each: true })
  @Type(() => CreateTestQuestionDTO)
  questions!: CreateTestQuestionDTO[];

  @IsOptional()
  @IsNumber({}, { message: "Passing score harus berupa angka" })
  @Min(0, { message: "Passing score tidak boleh negatif" })
  @Max(100, { message: "Passing score maksimal 100" })
  passingScore?: number;
}

export class UpdatePreSelectionTestDTO {
  @IsOptional()
  @IsString({ message: "Judul harus berupa string" })
  title?: string;

  @IsOptional()
  @IsArray({ message: "Soal harus berupa array" })
  @ArrayMinSize(25, { message: "Soal harus berjumlah tepat 25" })
  @ArrayMaxSize(25, { message: "Soal harus berjumlah tepat 25" })
  @ValidateNested({ each: true })
  @Type(() => CreateTestQuestionDTO)
  questions?: CreateTestQuestionDTO[];

  @IsOptional()
  @IsNumber({}, { message: "Passing score harus berupa angka" })
  @Min(0, { message: "Passing score tidak boleh negatif" })
  @Max(100, { message: "Passing score maksimal 100" })
  passingScore?: number;
}

export class AnswerItemDTO {
  @IsNotEmpty({ message: "ID soal tidak boleh kosong" })
  @IsNumber({}, { message: "ID soal harus berupa angka" })
  questionId!: number;

  @IsNotEmpty({ message: "Jawaban tidak boleh kosong" })
  @IsString({ message: "Jawaban harus berupa string" })
  selectedAnswer!: string;
}

export class SubmitTestDTO {
  @IsNotEmpty({ message: "Job ID tidak boleh kosong" })
  @IsNumber({}, { message: "Job ID harus berupa angka" })
  jobId!: number;

  @IsArray({ message: "Jawaban harus berupa array" })
  @ArrayMinSize(25, { message: "Jawaban harus berjumlah tepat 25" })
  @ArrayMaxSize(25, { message: "Jawaban harus berjumlah tepat 25" })
  @ValidateNested({ each: true })
  @Type(() => AnswerItemDTO)
  answers!: AnswerItemDTO[];
}

export class GetTestResultsDTO extends PaginationQueryParams {
  @IsOptional()
  @IsString({ message: "Search harus berupa string" })
  search?: string; // filter berdasarkan nama user
}
