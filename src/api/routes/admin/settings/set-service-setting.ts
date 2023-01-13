import { validator } from "../../../../utils/validator"
import { IsString, IsOptional, IsBoolean } from "class-validator"
import ServiceSettingService from "../../../../services/service-setting"
import { EntityManager } from "typeorm"

export default async (req, res) => {
    const { option } = req.params

    const serviceSettingService: ServiceSettingService = req.scope.resolve("serviceSettingService")
    const validated = await validator(AdminPostServiceSettingReq, req.body)

    const manager: EntityManager = req.scope.resolve("manager")
    await manager.transaction(async (transactionManager) => {
        await serviceSettingService
        .withTransaction(transactionManager)
        .set(option, validated.value, validated.is_public)
    })

    const serviceSetting = await serviceSettingService.get(option)

    res.json({ serviceSetting })
}

export class AdminPostServiceSettingReq {
    @IsString()
    @IsOptional()
    value?: string

    @IsBoolean()
    @IsOptional()
    is_public?: boolean
}