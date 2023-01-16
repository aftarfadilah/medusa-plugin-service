import { AppointmentStatus } from "../models/appointment";
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { DateComparisonOperator } from "./common";

export type CreateAppointmentInput = {
  notified_via_email_at?: Date | null;
  notified_via_sms_at?: Date | null;
  from?: Date | null;
  to?: Date | null;
  order_id: string;
  is_confirmed: boolean;
  status: AppointmentStatus;
  metadata?: Record<string, unknown>;
};

export type UpdateAppointmentInput = {
  notified_via_email_at?: Date | null;
  notified_via_sms_at?: Date | null;
  from?: Date | null;
  to?: Date | null;
  order_id?: string;
  is_confirmed?: boolean;
  status?: AppointmentStatus;
  metadata?: Record<string, unknown>;
};

export type selector = {
  code?: string;
  name?: string;
  order_id?: string;
  from?: Date;
  to?: Date;
};

export class AdminListAppointmentsSelector {
  @IsString()
  @IsOptional()
  q?: string;

  @IsString()
  @IsOptional()
  id?: string;

  @IsArray()
  @IsEnum(AppointmentStatus, { each: true })
  @IsOptional()
  status?: string[];

  @IsString()
  @IsOptional()
  display_id?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  order_id?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DateComparisonOperator)
  from?: DateComparisonOperator;

  @IsOptional()
  @ValidateNested()
  @Type(() => DateComparisonOperator)
  to?: DateComparisonOperator;

  @IsOptional()
  @ValidateNested()
  @Type(() => DateComparisonOperator)
  canceled_at?: DateComparisonOperator;

  @IsOptional()
  @ValidateNested()
  @Type(() => DateComparisonOperator)
  created_at?: DateComparisonOperator;

  @IsOptional()
  @ValidateNested()
  @Type(() => DateComparisonOperator)
  updated_at?: DateComparisonOperator;
}
