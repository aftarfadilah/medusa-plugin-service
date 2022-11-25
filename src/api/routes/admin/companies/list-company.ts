import { validator } from "../../../../utils/validator"
import CompanyService from "../../../../services/company"
import { selector } from "../../../../types/company"
import { IsNumber, IsOptional, IsString } from "class-validator"
import { Type } from "class-transformer"
import { defaultAdminCompanyRelations } from "."

export default async (req, res) => {
    const validated = await validator(AdminGetCompaniesParams, req.query)

    const selector: selector = {}

    if (validated.name) {
        selector.name = validated.name
    }

    const companyService: CompanyService = req.scope.resolve("companyService")
    const companies = await companyService.list(selector, {
        take: validated.limit,
        skip: validated.offset,
        relations: defaultAdminCompanyRelations, // calendars ralations is from models jointable ok
    })

    res.status(200).json({
        companies,
        count: companies.length,
        offset: validated.offset,
        limit: validated.limit,
    })
}

export class AdminGetCompaniesParams {
    @IsString()
    @IsOptional()
    name?: string

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    limit = 50
  
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    offset = 0
}