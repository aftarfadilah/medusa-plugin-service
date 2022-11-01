import { validator } from "../../../../../utils/validator"
import { IsString, IsObject, IsDate, IsOptional } from "class-validator"
import CalendarTimeperiodService from "../../../../../services/calendar-timeperiod"
import CalendarService from "../../../../../services/calendar"
import { EntityManager } from "typeorm"
import { defaultAdminCalendarTimeperiodFields, defaultAdminCalendarTimeperiodRelations } from "."
import { Type } from "class-transformer"

export default async (req, res) => {
    const { id, idTime } = req.params

    const calendarService: CalendarService = req.scope.resolve("calendarService")
    await calendarService.retrieve(id, {}); // make sure parent / calendar_id is exists

    const validated = await validator(AdminPostCalendarsCalendarReq, req.body)

    const calendarTimeperiodService: CalendarTimeperiodService = req.scope.resolve("calendarTimeperiodService")

    const manager: EntityManager = req.scope.resolve("manager")
    await manager.transaction(async (transactionManager) => {
        await calendarTimeperiodService
        .withTransaction(transactionManager)
        .update(idTime, validated)
    })

    const calendar = await calendarTimeperiodService.retrieve(idTime, {
        select: defaultAdminCalendarTimeperiodFields,
        relations: defaultAdminCalendarTimeperiodRelations,
    })

    res.json({ calendar })
}

export class AdminPostCalendarsCalendarReq {
    @IsString()
    @IsOptional()
    title: string

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    from: Date

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    to: Date

    @IsString()
    @IsOptional()
    type: string

    @IsString()
    @IsOptional()
    calendar_id: string

    @IsObject()
    @IsOptional()
    metadata?: Record<string, unknown>
}