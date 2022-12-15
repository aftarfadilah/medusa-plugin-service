import { validator } from "../../../../utils/validator"
import AppointmentService from "../../../../services/appointment"
import { selector } from "../../../../types/appointment"
import { IsDate, IsOptional, IsString, IsNumber } from "class-validator"
import { Type } from "class-transformer"

export default async (req, res) => {
    const validated = await validator(AdminGetAppointmentsParams, req.query)

    const selector: selector = {}

    if (validated.name) {
        selector.name = validated.name
    }

    if (validated.order_id) {
        selector.order_id = validated.order_id
    }

    if (validated.code) {
        selector.code = validated.code
    }

    const appointmentService: AppointmentService = req.scope.resolve("appointmentService")
    const [appointments, count] = await appointmentService.list(selector, {
        relations: ["order"],
        skip: validated.offset,
        take: validated.limit
    })

    res.status(200).json({
        appointments,
        count: count,
        limit: validated.limit,
        offset: validated.offset
    })
}

export class AdminGetAppointmentsParams {
    @IsString()
    @IsOptional()
    name?: string

    @IsString()
    @IsOptional()
    code?: string

    @IsString()
    @IsOptional()
    order_id?: string

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    from: Date
  
    @IsDate()
    @IsOptional()
    @Type(() => Date)
    to: Date

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    limit = 50
  
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    offset = 0
}