import { IsString, IsArray, IsOptional, IsDate } from "class-validator"
import { Type } from "class-transformer"
import CompanyService from "../../../../services/company";
import { validator } from "../../../../utils/validator"
import { EntityManager } from "typeorm"

export default async (req, res) => {
    const validated = await validator(AdminPostCompaniesReq, req.body)

    const companyService: CompanyService = req.scope.resolve("companyService")

    const manager: EntityManager = req.scope.resolve("manager")
    const result = await manager.transaction(async (transactionManager) => {
        return await companyService.withTransaction(transactionManager).create(validated);
    })

    res.status(200).json({ company: result })
}

export class AdminPostCompaniesReq {
    @IsString()
    name: string
  
    @IsString()
    location_id: string

    @IsDate()
    @Type(() => Date)
    work_day_from: Date

    @IsDate()
    @Type(() => Date)
    work_day_to: Date

    @IsArray()
    @IsOptional()
    calendars: string[]
}