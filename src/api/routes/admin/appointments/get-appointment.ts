import AppointmentService from "../../../../services/appointment";

export default async (req, res) => {
  const { id } = req.params;
  console.log("Req query", req.query);

  const appointmentService: AppointmentService =
    req.scope.resolve("appointmentService");
  const appointment = await appointmentService.retrieve(id, {
    relations: ["order"],
  });

  res.status(200).json({ appointment });
};
