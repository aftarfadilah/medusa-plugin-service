import AppointmentService from "../../../../services/appointment"
import { IsString } from "class-validator"
import { validator } from "@medusajs/medusa/dist/utils/validator"
import CalendarTimeperiodService from "../../../../services/calendar-timeperiod"
import CalendarService from "../../../../services/calendar"

export default async (req, res) => {
    const { id } = req.params
    const cus_id: string | undefined = req.user?.customer_id
    const validated = await validator(StorePutMakeAppointmentReq, req.body)

    const appointmentService: AppointmentService = req.scope.resolve("appointmentService")
    const calendarService: CalendarService = req.scope.resolve("calendarService")
    const calendarTimeperiodService: CalendarTimeperiodService = req.scope.resolve("calendarTimeperiodService")
    
    const appointment = await appointmentService.retrieve(id, { relations: ["order"] })
    
    // check if it's their own appointment
    if (appointment.order.customer_id == cus_id) {
        const calendar = await calendarService.retrieve(validated.calendar_id, {}) // check calendar exists or not

        // create timeperiod
        const timeperiod = await calendarTimeperiodService.create({
            calendar_id: validated.calendar_id,
            title: `Appointment for ${appointment.order_id}`,
            type: "blocked",
            from: new Date(),
            to: new Date(),
            metadata: {
                appointment_id: appointment.id
            }
        })

        await appointmentService.update(id, {
            metadata: {
                calendar_timeperiod_id: timeperiod.id
            }
        })

        const get_appointment = await appointmentService.retrieve(id, { relations: ["order"] })
        res.status(200).json({ appointment: get_appointment })
    } else {
        res.status(404).json({"message": "Appointment not valid!"})
    }
}

export class StorePutMakeAppointmentReq {
    @IsString()
    location_id: string

    @IsString()
    calendar_id: string
}