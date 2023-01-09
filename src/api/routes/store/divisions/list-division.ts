import { validator } from "../../../../utils/validator"
import DivisionService from "../../../../services/division"
import { IsNumber, IsOptional, IsString } from "class-validator"
import { Type } from "class-transformer"
import { defaultStoreDivisionRelations } from "."
import { selector } from "../../../../types/division"

export default async (req, res) => {
    const validated = await validator(StoreGetDivisionsParams, req.query)

    const selector: selector = {}

    if (validated.calendar_id) selector.calendar_id = validated.calendar_id

    if (validated.location_id) selector.location_id = validated.location_id

    const divisionService: DivisionService = req.scope.resolve("divisionService")
    const divisions = await divisionService.list(selector, {
        take: validated.limit,
        skip: validated.offset,
        relations: defaultStoreDivisionRelations,
    })

    res.status(200).json({
        divisions,
        count: divisions.length,
        offset: validated.offset,
        limit: validated.limit,
    })
}

export class StoreGetDivisionsParams {
    @IsString()
    @IsOptional()
    location_id: string

    @IsString()
    @IsOptional()
    calendar_id: string
    
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    limit = 50
  
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    offset = 0
}