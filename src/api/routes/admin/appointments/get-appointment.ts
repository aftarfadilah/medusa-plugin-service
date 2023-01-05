import AppointmentService from "../../../../services/appointment";

export default async (req, res) => {
  const { id } = req.params;

  const appointmentService: AppointmentService =
    req.scope.resolve("appointmentService");

  const appointment = await appointmentService.retrieve(id, req.retrieveConfig);
  res.status(200).json({ appointment });
};
