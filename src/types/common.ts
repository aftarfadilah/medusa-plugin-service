import { IsDate, IsOptional } from "class-validator";
import { Transform } from "class-transformer";
import { transformDate } from "../utils/date-transform";

export class DateComparisonOperator {
  @IsOptional()
  @IsDate()
  @Transform(transformDate)
  lt?: Date;

  @IsOptional()
  @IsDate()
  @Transform(transformDate)
  gt?: Date;

  @IsOptional()
  @IsDate()
  @Transform(transformDate)
  gte?: Date;

  @IsOptional()
  @IsDate()
  @Transform(transformDate)
  lte?: Date;
}
