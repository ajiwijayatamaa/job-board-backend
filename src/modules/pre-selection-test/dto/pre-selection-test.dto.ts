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
  ValidateNested,
} from "class-validator";

export class CreateTestOptionDTO {
  @IsNotEmpty()
  @IsString()
  optionText!: string;

  @IsNotEmpty()
  @IsBoolean()
  isCorrect!: boolean;
}

export class CreateTestQuestionDTO {
  @IsNotEmpty()
  @IsString()
  questionText!: string;

  @IsNotEmpty()
  @IsString()
  correctAnswer!: string;

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => CreateTestOptionDTO)
  options!: CreateTestOptionDTO[];
}

export class CreatePreSelectionTestDTO {
  @IsNotEmpty()
  @IsNumber()
  jobId!: number;

  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsArray()
  @ArrayMinSize(25)
  @ArrayMaxSize(25)
  @ValidateNested({ each: true })
  @Type(() => CreateTestQuestionDTO)
  questions!: CreateTestQuestionDTO[];
}

export class UpdatePreSelectionTestDTO {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(25)
  @ArrayMaxSize(25)
  @ValidateNested({ each: true })
  @Type(() => CreateTestQuestionDTO)
  questions?: CreateTestQuestionDTO[];
}

export class AnswerItemDTO {
  @IsNotEmpty()
  @IsNumber()
  questionId!: number;

  @IsNotEmpty()
  @IsString()
  selectedAnswer!: string;
}

export class SubmitTestDTO {
  @IsNotEmpty()
  @IsNumber()
  applicationId!: number;

  @IsArray()
  @ArrayMinSize(25)
  @ArrayMaxSize(25)
  @ValidateNested({ each: true })
  @Type(() => AnswerItemDTO)
  answers!: AnswerItemDTO[];
}
