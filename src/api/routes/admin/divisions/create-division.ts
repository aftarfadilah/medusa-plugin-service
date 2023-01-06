import { IsArray, IsNotEmpty, IsString, IsObject, IsOptional } from "class-validator"

import LocationService from "../../../../services/location";
import { validator } from "../../../../utils/validator"
import { EntityManager } from "typeorm"
import DivisionService from "../../../../services/division";

export default async (req, res) => {
    const validated = await validator(AdminPostDivisionsReq, req.body)

    const divisionService: DivisionService = req.scope.resolve("divisionService")

    const manager: EntityManager = req.scope.resolve("manager")
    const result = await manager.transaction(async (transactionManager) => {
        return await divisionService.withTransaction(transactionManager).create(validated);
    })

    res.status(200).json({ division: result })
}

export class AdminPostDivisionsReq {
    @IsString()
    location_id: string

    @IsString()
    calendar_id: string
}