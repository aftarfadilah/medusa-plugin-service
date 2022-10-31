import { IsString, IsObject, IsHexColor, IsOptional } from "class-validator"
import CalendarService from "../../../../services/calendar";
import { validator } from "../../../../utils/validator"
import { EntityManager } from "typeorm"

export default async (req, res) => {
    const validated = await validator(AdminPostCalendarsReq, req.body)

    const calendarService: CalendarService = req.scope.resolve("calendarService")

    const manager: EntityManager = req.scope.resolve("manager")
    const result = await manager.transaction(async (transactionManager) => {
        return await calendarService.withTransaction(transactionManager).create(validated);
    })

    res.status(200).json({ calendar: result })
}

export class AdminPostCalendarsReq {
    @IsString()
    name: string
    
    @IsHexColor()
    @IsOptional()
    color: string

    @IsObject()
    @IsOptional()
    metadata?: Record<string, unknown>
}
