import CalendarTimeperiodService from "../../../../../services/calendar-timeperiod"
import { validator } from "../../../../../utils/validator"
import { IsDate, IsOptional, ValidateNested } from "class-validator"
import { Type } from "class-transformer"
import { selector } from "../../../../../types/calendar-timeperiod"

export default async (req, res) => {
    const { id } = req.params

    const validated = await validator(AdminGetCalendarTimeperiodsParams, req.query)

    let selector: selector = {
        calendar_id: id
    }

    if (validated.from) {
        selector.from = { gte: validated.from };
    }

    if (validated.to) {
        selector.to = { lte: validated.to };
    }
    
    const calendarTimeperiodService: CalendarTimeperiodService = req.scope.resolve("calendarTimeperiodService")
    const calendarTimeperiods = await calendarTimeperiodService.list(selector, {
        relations: [],
    })

    res.status(200).json({
        calendarTimeperiods,
        count: calendarTimeperiods.length,
    })
}

export class AdminGetCalendarTimeperiodsParams {
    @IsDate()
    @IsOptional()
    @Type(() => Date)
    from?: Date
  
    @IsDate()
    @IsOptional()
    @Type(() => Date)
    to?: Date
}