import LocationService from "../../../../services/location"
import { IsString, IsOptional} from "class-validator"
import { Transform, Type } from "class-transformer"
import { validator } from "@medusajs/medusa/dist/utils/validator"

export default async (req, res) => {
    const { id } = req.params

    const validated = await validator(GetSlotTimeStoreParams, req.query)

    const locationService: LocationService = req.scope.resolve("locationService")
    const available_times = await locationService.getSlotTime(id, validated.from, validated.to)
    res.status(200).json({ available_times })
}

export class GetSlotTimeStoreParams {
    @IsOptional()
    @Transform(({ value }) => {
        return value === "null" ? null : value
    })
    @Type(() => Date)
    from?: Date | null

    @IsOptional()
    @Transform(({ value }) => {
        return value === "null" ? null : value
    })
    @Type(() => Date)
    to?: Date | null
}