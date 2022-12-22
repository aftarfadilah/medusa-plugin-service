import AppointmentService from "../../../../services/appointment";

export default async (req, res) => {
  const { birthday, division } = req.query;

  const appointmentService: AppointmentService =
    req.scope.resolve("appointmentService");

  const timestamp = parseInt(birthday);
  const birthdayDate = new Date(timestamp);

  if(!birthdayDate)
    await res.status(404).json({ message: "Please pass a correct timestamp as your birthday." });

  let isCustomer = true;

  const year = birthdayDate.getFullYear();
  const month = birthdayDate.getMonth();
  const date = birthdayDate.getDate();

  //TODO: Get birthday of customer and check

  if (year !== 1991) isCustomer = false;

  if (month !== 0) isCustomer = false;

  if (date !== 11) isCustomer = false;

  // check if customer can see the appointment or it's their own appointment
  if (isCustomer) {
    const appointment = await appointmentService.getCurrent(division);

    if (!appointment)
      await res.status(404).json({ message: "No running appointment found" });

    await res.status(200).json({ appointment });
  } else {
    await res.status(404).json({ message: "This is not your appointment." });
  }
};
