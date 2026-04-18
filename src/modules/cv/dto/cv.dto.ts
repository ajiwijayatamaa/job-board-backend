import { IsNotEmpty, IsString } from "class-validator";

export class CreateCVDTO {
  @IsNotEmpty()
  @IsString()
  cvName!: string;
}