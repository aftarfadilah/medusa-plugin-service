import { validator } from "../../../../utils/validator"
import CalendarService from "../../../../services/calendar"
import { selector } from "../../../../types/calendar"
import { IsDate, IsOptional, IsString } from "class-validator"
import { Type } from "class-transformer"

export default async (req, res) => {
    const validated = await validator(AdminGetCalendarsParams, req.query)

    const selector: selector = {}

    if (validated.name) {
        selector.name = validated.name
    }

    const calendarService: CalendarService = req.scope.resolve("calendarService")
    const [calendars, count] = await calendarService.list(selector, {
        relations: ["timeperiods"],
    })

    res.status(200).json({
        calendars,
        count: count,
    })
}

export class AdminGetCalendarsParams {
    @IsString()
    @IsOptional()
    name?: string

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    from?: Date
  
    @IsDate()
    @IsOptional()
    @Type(() => Date)
    to?: Date
}