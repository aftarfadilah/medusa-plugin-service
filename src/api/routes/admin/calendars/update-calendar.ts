import { validator } from "../../../../utils/validator"
import { IsString, IsObject, IsOptional } from "class-validator"
import CalendarService from "../../../../services/calendar"
import { EntityManager } from "typeorm"
import { defaultAdminCalendarFields, defaultAdminCalendarRelations } from "."

export default async (req, res) => {
    const { id } = req.params

    const validated = await validator(AdminPostCalendarsCalendarReq, req.body)

    const calendarService: CalendarService = req.scope.resolve("calendarService")

    const manager: EntityManager = req.scope.resolve("manager")
    await manager.transaction(async (transactionManager) => {
        await calendarService
        .withTransaction(transactionManager)
        .update(id, validated)
    })

    const calendar = await calendarService.retrieve(id, {
        select: defaultAdminCalendarFields,
        relations: defaultAdminCalendarRelations,
    })

    res.json({ calendar })
}

export class AdminPostCalendarsCalendarReq {
    @IsString()
    @IsOptional()
    name: string
  
    @IsString()
    @IsOptional()
    color: string

    @IsObject()
    @IsOptional()
    metadata?: Record<string, unknown>
}