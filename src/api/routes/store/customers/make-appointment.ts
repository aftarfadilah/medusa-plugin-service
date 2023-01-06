import AppointmentService from "../../../../services/appointment"
import { IsString, IsDateString } from "class-validator"
import { validator } from "@medusajs/medusa/dist/utils/validator"
import { MedusaError } from "medusa-core-utils"
import { OrderService } from "@medusajs/medusa"

export default async (req, res) => {
    const cus_id: string | undefined = req.user?.customer_id
    const validated = await validator(PostMakeAppointmentReq, req.body)
    const orderService: OrderService = req.scope.resolve("orderService")
    const appointmentService: AppointmentService = req.scope.resolve("appointmentService")

    const order = await orderService.retrieve(validated.order_id)

    // check order owner
    if (order.customer_id != cus_id) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Order not valid!", "400")
    
    const appointment = await appointmentService.makeAppointment(validated)
    
    res.status(200).json({ appointment: appointment })
}

export class PostMakeAppointmentReq {    
    @IsDateString()
    slot_time: Date

    @IsString()
    order_id: string

    @IsString()
    location_id: string

    @IsString()
    calendar_id: string
}