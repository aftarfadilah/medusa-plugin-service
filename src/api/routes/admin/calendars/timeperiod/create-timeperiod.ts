import { IsString, IsObject, IsDate, IsOptional } from "class-validator"
import CalendarTimeperiodService from "../../../../../services/calendar-timeperiod";
import { validator } from "../../../../../utils/validator"
import { EntityManager } from "typeorm"
import { Type } from "class-transformer"

export default async (req, res) => {
    const { id } = req.params
    req.body.calendar_id = id; // inject calendar_id into req.body 

    const validated = await validator(AdminPostCalendarTimeperiodsReq, req.body)

    const calendarTimeperiodService: CalendarTimeperiodService = req.scope.resolve("calendarTimeperiodService")

    const manager: EntityManager = req.scope.resolve("manager")
    const result = await manager.transaction(async (transactionManager) => {
        return await calendarTimeperiodService.withTransaction(transactionManager).create(validated);
    })

    res.status(200).json({ calendar: result })
}

export class AdminPostCalendarTimeperiodsReq {
    @IsString()
    title: string

    @IsDate()
    @Type(() => Date)
    from: Date

    @IsDate()
    @Type(() => Date)
    to: Date

    @IsString()
    type: string

    @IsString()
    calendar_id: string

    @IsObject()
    @IsOptional()
    metadata?: Record<string, unknown>
}
