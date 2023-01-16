import AppointmentService from "../../../../services/appointment";

export default async (req, res) => {
  const { birthday, division, currentTime } = req.query;

  const appointmentService: AppointmentService =
    req.scope.resolve("appointmentService");

  const timestamp = parseInt(birthday);
  const birthdayDate = new Date(timestamp);

  if (!birthdayDate)
    await res
      .status(404)
      .json({ message: "Please pass a correct timestamp as your birthday." });

  const appointment = await appointmentService.getCurrent(
    division,
    currentTime,
    birthdayDate
  );

  if (!appointment)
    await res.status(404).json({ message: "No running appointment found" });

  await res.status(200).json({ appointment });
};
