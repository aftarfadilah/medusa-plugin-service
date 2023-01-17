import AppointmentService from "../../../../services/appointment";
import { CustomerService, OrderService } from "@medusajs/medusa";
import {MedusaError} from "medusa-core-utils";

export default async (req, res) => {
  const { appointment: appointmentId } = req.query;

  const appointmentService: AppointmentService =
    req.scope.resolve("appointmentService");

  const appointment = await appointmentService.retrieve(appointmentId, {
    relations: [
      "order",
      "order.items",
      "order.customer",
      "order.customer.billing_address",
    ],
  });

  if (!appointment)
    throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `ERROR::NO_APPOINTMENTS_FOUND`
    );

  const isCurrentAppointment = appointmentService.checkIfCurrent(
    appointment,
    2
  );

  if (!isCurrentAppointment)
    throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `ERROR::NOT_CURRENT_APPOINTMENT`
    );

  // appointment.order = await orderService.retrieve(appointment.order_id, {
  //   relations: ["items", "customer"],
  // });

  await res.status(200).json({ appointment });
};
