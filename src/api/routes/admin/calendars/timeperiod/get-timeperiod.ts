import CalendarTimeperiodService from "../../../../../services/calendar-timeperiod"

export default async (req, res) => {
    const { id, idTime } = req.params

    const calendarTimeperiodService: CalendarTimeperiodService = req.scope.resolve("calendarTimeperiodService")
    const calendarTimeperiod = await calendarTimeperiodService.retrieve_({ id: idTime, calendar_id: id }, { relations: ["calendar"] })

    res.status(200).json({ calendarTimeperiod })
}
