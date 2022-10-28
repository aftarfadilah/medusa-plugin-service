import { validator } from "../../../../utils/validator"
import LocationService from "../../../../services/location"
import { selector } from "../../../../types/location"
import { IsNumber, IsOptional, IsString } from "class-validator"
import { Type } from "class-transformer"

export default async (req, res) => {
    const validated = await validator(AdminGetLocationsParams, req.query)

    const selector: selector = {}

    if (validated.code) {
        selector.code = validated.code
    }

    const locationService: LocationService = req.scope.resolve("locationService")
    const locations = await locationService.list(selector, {
        take: validated.limit,
        skip: validated.offset,
        relations: ["country"],
    })

    res.status(200).json({
        locations,
        count: locations.length,
        offset: validated.offset,
        limit: validated.limit,
    })
}

export class AdminGetLocationsParams {
    @IsString()
    @IsOptional()
    code?: string

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    limit = 50
  
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    offset = 0
}