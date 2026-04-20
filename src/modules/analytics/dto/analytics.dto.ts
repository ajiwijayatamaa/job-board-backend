import { Transform } from "class-transformer";
import { IsDate, IsOptional } from "class-validator";

export class GetAnalyticsDTO {
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate({ message: "startDate harus berupa tanggal yang valid" })
  startDate?: Date;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate({ message: "endDate harus berupa tanggal yang valid" })
  endDate?: Date;
}
