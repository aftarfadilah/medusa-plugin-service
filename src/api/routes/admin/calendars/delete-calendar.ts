import { EntityManager } from "typeorm";
import CalendarService from "../../../../services/calendar";

export default async (req, res) => {
    const { id } = req.params

    const calendarService: CalendarService = req.scope.resolve("calendarService")
    const manager: EntityManager = req.scope.resolve("manager")
    await manager.transaction(async (transactionManager) => {
        return await calendarService.withTransaction(transactionManager).delete(id)
    })

    res.json({
        id,
        object: "calendar",
        deleted: true,
    })
}
