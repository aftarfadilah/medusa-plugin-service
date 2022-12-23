import { validator } from "../../../../utils/validator"
import { IsArray, IsString, IsObject, IsOptional } from "class-validator"
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
    @IsOptional()
    title: string

    @IsString()
    @IsOptional()
    company_id: string

    @IsArray()
    @IsOptional()
    calendars: string[]
  
    @IsString()
    @IsOptional()
    first_name: string

    @IsString()
    @IsOptional()
    last_name: string
  
    @IsString()
    @IsOptional()
    address_1: string

    @IsString()
    @IsOptional()
    address_2: string

    @IsString()
    @IsOptional()
    city: string

    @IsString()
    @IsOptional()
    country_code: string

    @IsString()
    @IsOptional()
    province: string

    @IsString()
    @IsOptional()
    postal_code: string

    @IsString()
    @IsOptional()
    phone: string

    @IsString()
    @IsOptional()
    longitude: string

    @IsString()
    @IsOptional()
    latitude: string

    @IsObject()
    @IsOptional()
    metadata?: Record<string, unknown>
}