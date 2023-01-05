import AppointmentService from "../../../../services/appointment";
import {CustomerService, OrderService} from "@medusajs/medusa";

export default async (req, res) => {
  const { appointment: appointmentId } = req.query;

  console.log("Current detailed request", appointmentId);

  const appointmentService: AppointmentService =
    req.scope.resolve("appointmentService");
  const orderService: OrderService = req.scope.resolve("orderService");
  const customerService: CustomerService = req.scope.resolve("customerService");

  const appointment = await appointmentService.retrieve(appointmentId, {});

  if (!appointment)
    await res.status(404).json({ message: "ERROR_NO_APPOINTMENTS_FOUND" });

  const isCurrentAppointment = appointmentService.checkIfCurrent(
    appointment,
    2
  );

  if (!isCurrentAppointment)
    await res.status(404).json({ message: "ERRPR_NOT_CURRENT_APPOINTMENT" });

  appointment.order = await orderService.retrieve(appointment.order_id, {
    relations: ["items","customer"],
  });


  await res.status(200).json({ appointment });
};
