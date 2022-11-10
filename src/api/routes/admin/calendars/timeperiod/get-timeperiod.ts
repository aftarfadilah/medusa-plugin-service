import CalendarTimeperiodService from "../../../../../services/calendar-timeperiod"

export default async (req, res) => {
    const { id, idTime } = req.params

    const calendarTimeperiodService: CalendarTimeperiodService = req.scope.resolve("calendarTimeperiodService")
    const calendarTimeperiod = await calendarTimeperiodService.retrieve(idTime, { relations: ["calendar"] })

    res.status(200).json({ calendarTimeperiod })
}
