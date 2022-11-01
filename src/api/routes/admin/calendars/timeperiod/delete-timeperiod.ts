import { EntityManager } from "typeorm";
import CalendarTimeperiodService from "../../../../../services/calendar-timeperiod";
import CalendarService from "../../../../../services/calendar";

export default async (req, res) => {
    const { id, idTime } = req.params

    const calendarTimeperiodService: CalendarTimeperiodService = req.scope.resolve("calendarTimeperiodService")
    const calendarService: CalendarService = req.scope.resolve("calendarService")
    const manager: EntityManager = req.scope.resolve("manager")
    await manager.transaction(async (transactionManager) => {
        await calendarService.retrieve(id, {}); // make sure parent / calendar_id is exists
        return await calendarTimeperiodService.withTransaction(transactionManager).delete(idTime)
    })

    res.json({
        id,
        object: "calendartimeperiod",
        deleted: true,
    })
}
