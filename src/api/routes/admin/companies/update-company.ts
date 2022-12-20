import { validator } from "../../../../utils/validator"
import { IsString, IsArray, IsDate, IsOptional } from "class-validator"
import { Type } from "class-transformer"
import CompanyService from "../../../../services/company"
import { EntityManager } from "typeorm"
import { defaultAdminCompanyFields, defaultAdminCompanyRelations } from "."

export default async (req, res) => {
    const { id } = req.params
    
    const validated = await validator(AdminPostCompaniesCompanyReq, req.body)

    const companyService: CompanyService = req.scope.resolve("companyService")

    const manager: EntityManager = req.scope.resolve("manager")
    await manager.transaction(async (transactionManager) => {
        await companyService
        .withTransaction(transactionManager)
        .update(id, validated)
    })

    const company = await companyService.retrieve(id, {
        select: defaultAdminCompanyFields,
        relations: defaultAdminCompanyRelations,
    })

    res.json({ company })
}

export class AdminPostCompaniesCompanyReq {
    @IsString()
    @IsOptional()
    name: string

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    work_day_from: Date

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    work_day_to: Date
}