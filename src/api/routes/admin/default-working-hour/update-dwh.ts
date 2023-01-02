import { validator } from "../../../../utils/validator"
import { IsString, IsMilitaryTime, IsBoolean, IsOptional } from "class-validator"
import { EntityManager } from "typeorm"
import { defaultAdminDefaultWorkingHourFields, defaultAdminDefaultWorkingHourRelations } from "."
import DefaultWorkingHourService from "../../../../services/default-working-hour"

export default async (req, res) => {
    const { id } = req.params

    const validated = await validator(AdminPostDWHReq, req.body)

    const dwh_: DefaultWorkingHourService = req.scope.resolve("defaultWorkingHourService")

    const manager: EntityManager = req.scope.resolve("manager")
    await manager.transaction(async (transactionManager) => {
        await dwh_
        .withTransaction(transactionManager)
        .update(id, validated)
    })

    const dwh = await dwh_.retrieve(id, {
        select: defaultAdminDefaultWorkingHourFields,
        relations: defaultAdminDefaultWorkingHourRelations,
    })

    res.json({ dwh })
}

export class AdminPostDWHReq {
    @IsString()
    @IsMilitaryTime()
    @IsOptional()
    from: string

    @IsString()
    @IsMilitaryTime()
    @IsOptional()
    to: string

    @IsBoolean()
    @IsOptional()
    is_working_day: boolean
}