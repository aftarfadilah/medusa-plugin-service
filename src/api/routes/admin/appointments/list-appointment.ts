import { validator } from "../../../../utils/validator"
import AppointmentService from "../../../../services/appointment"
import { selector } from "../../../../types/appointment"
import { IsDate, IsOptional, IsString } from "class-validator"
import { Type } from "class-transformer"

export default async (req, res) => {
    const validated = await validator(AdminGetAppointmentsParams, req.query)

    const selector: selector = {}

    if (validated.name) {
        selector.name = validated.name
    }

    if (validated.code) {
        selector.code = validated.code
    }

    const appointmentService: AppointmentService = req.scope.resolve("appointmentService")
    const appointments = await appointmentService.list(selector, {
        relations: ["order"],
    })

    res.status(200).json({
        appointments,
        count: appointments.length,
    })
}

export class AdminGetAppointmentsParams {
    @IsString()
    @IsOptional()
    name?: string

    @IsString()
    @IsOptional()
    code?: string

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    from: Date
  
    @IsDate()
    @IsOptional()
    @Type(() => Date)
    to: Date
}