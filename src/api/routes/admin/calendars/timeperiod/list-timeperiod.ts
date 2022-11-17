import CalendarTimeperiodService from "../../../../../services/calendar-timeperiod"
import { validator } from "../../../../../utils/validator"
import { IsString, IsOptional, ValidateNested } from "class-validator"
import { Type } from "class-transformer"
import { selector } from "../../../../../types/calendar-timeperiod"

export default async (req, res) => {
    const { id } = req.params

    const validated = await validator(AdminGetCalendarTimeperiodsParams, req.query)

    const calendarTimeperiodService: CalendarTimeperiodService = req.scope.resolve("calendarTimeperiodService")

    const [calendarTimeperiods, count] = await calendarTimeperiodService.listCustom(id, validated.from, validated.to);

    res.status(200).json({
        calendarTimeperiods,
        count: count,
    })
}

export class AdminGetCalendarTimeperiodsParams {
    @IsString()
    @IsOptional()
    from?: string
  
    @IsString()
    @IsOptional()
    to?: string
}