import CalendarService from "../../../../services/calendar"

export default async (req, res) => {
    const { id } = req.params

    const calendarService: CalendarService = req.scope.resolve("calendarService")
    const calendar = await calendarService.retrieve(id, { relations: ["timeperiod"] })

    res.status(200).json({ calendar })
}
