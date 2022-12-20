import { validator } from "../../../../utils/validator"
import AppointmentService from "../../../../services/appointment"
import { selector } from "../../../../types/appointment"
import { IsOptional, IsNumber } from "class-validator"
import { Type } from "class-transformer"

export default async (req, res) => {
    const { id }  = req.params
    const validated = await validator(AdminGetCustoemrOrdersAppointmentParams, req.query)

    const selector: selector = {}

    if (id) {
        selector.order_id = id
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

export class AdminGetCustoemrOrdersAppointmentParams {
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    limit = 50
  
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    offset = 0
}