import { IsArray, IsNotEmpty, IsString, IsObject, IsOptional } from "class-validator"

import LocationService from "../../../../services/location";
import { validator } from "../../../../utils/validator"
import { EntityManager } from "typeorm"

export default async (req, res) => {
    const validated = await validator(AdminPostLocationsReq, req.body)

    const locationService: LocationService = req.scope.resolve("locationService")

    const manager: EntityManager = req.scope.resolve("manager")
    const result = await manager.transaction(async (transactionManager) => {
        return await locationService.withTransaction(transactionManager).create(validated);
    })

    res.status(200).json({ location: result })
}

export class AdminPostLocationsReq {
    @IsString()
    title: string

    @IsString()
    company_id: string

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