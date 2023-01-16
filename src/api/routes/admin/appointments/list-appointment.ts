import { validator } from "../../../../utils/validator";
import AppointmentService from "../../../../services/appointment";
import {
  AdminListAppointmentsSelector,
  selector,
} from "../../../../types/appointment";
import { IsDate, IsOptional, IsString, IsNumber } from "class-validator";
import { Type } from "class-transformer";
import { Appointment, AppointmentStatus } from "../../../../models/appointment";
import { pick } from "lodash";

export default async (req, res) => {
  // const validated = await validator(AdminGetAppointmentsParams, req.query);

  try {
    const { skip, take, select, relations } = req.listConfig;

    const appointmentService: AppointmentService =
      req.scope.resolve("appointmentService");

    const [appointments, count] = await appointmentService.listAndCount(
      req.filterableFields,
      {
        ...req.listConfig,
        order: { from: "ASC" }, //TODO: Is there a better way to force the ordering?
      }
    );

    let data: Partial<Appointment>[] = appointments;

    const fields = [...select, ...relations];

    if (fields.length) {
      data = appointments.map((o) => pick(o, fields));
    }

    res.status(200).json({
      appointments: data,
      count: count,
      limit: take,
      offset: skip,
    });
  } catch (e) {
    console.error(e);
  }
};

export class AdminGetAppointmentsParams extends AdminListAppointmentsSelector {
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  offset = 0;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit = 50;

  @IsString()
  @IsOptional()
  expand?: string;

  @IsString()
  @IsOptional()
  fields?: string;
}
