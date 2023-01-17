import AppointmentService from "../../../../services/appointment";
import { MedusaError } from "medusa-core-utils";

export default async (req, res) => {
  const { birthday, division, currentTime } = req.query;

  const appointmentService: AppointmentService =
    req.scope.resolve("appointmentService");

  const timestamp = parseInt(birthday);
  const birthdayDate = new Date(timestamp);

  if (!birthdayDate)
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `ERROR::WRONG_BIRTHDAY_TIMESTAMP`
    );

  const appointment = await appointmentService.getCurrent(
    division,
    currentTime,
    birthdayDate
  );

  if (!appointment)
    throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `ERROR::NO_RUNNING_APPOINTMENT`
    );

  await res.status(200).json({ appointment });
};
