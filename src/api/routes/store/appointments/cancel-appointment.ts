import { MedusaError } from "medusa-core-utils"
import AppointmentService from "../../../../services/appointment"

export default async (req, res) => {
    const { id } = req.params
    const cus_id: string | undefined = req.user?.customer_id

    const appointmentService: AppointmentService = req.scope.resolve("appointmentService")
    const appointment = await appointmentService.retrieve(id, { relations: ["order"] })
    
    // check if customer can see the appointment or it's their own appointment
    if (appointment.order.customer_id != cus_id)
        throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            "ERROR_APPOINTMENT_NOT_FOUND", //rethink about the error name :)
        );

    const appointmentCanceled = await appointmentService.cancelAppointment(appointment.id)
    res.status(200).json({ appointment: appointmentCanceled })
}
