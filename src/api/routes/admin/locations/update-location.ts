import { validator } from "../../../../utils/validator"
import { IsNotEmpty, IsString, IsObject, IsOptional } from "class-validator"
import LocationService from "../../../../services/location"
import { EntityManager } from "typeorm"
import { defaultAdminLocationFields, defaultAdminLocationRelations } from "."

export default async (req, res) => {
    const { id } = req.params

    const validated = await validator(AdminPostLocationsLocationReq, req.body)

    const locationService: LocationService = req.scope.resolve("locationService")

    const manager: EntityManager = req.scope.resolve("manager")
    await manager.transaction(async (transactionManager) => {
        await locationService
        .withTransaction(transactionManager)
        .update(id, validated)
    })

    const location = await locationService.retrieve(id, {
        select: defaultAdminLocationFields,
        relations: defaultAdminLocationRelations,
    })

    res.json({ location })
}

export class AdminPostLocationsLocationReq {
    @IsString()
    title: string
  
    @IsString()
    first_name: string

    @IsString()
    last_name: string
  
    @IsString()
    @IsNotEmpty()
    address_1: string

    @IsString()
    address_2: string

    @IsString()
    city: string

    @IsString()
    country_code: string

    @IsString()
    province: string

    @IsString()
    postal_code: string

    @IsString()
    phone: string

    @IsObject()
    @IsOptional()
    metadata?: Record<string, unknown>
}