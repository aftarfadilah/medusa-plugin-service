import { EntityRepository, Repository } from "typeorm"

import { Company } from "../models/company"

@EntityRepository(Company)
export class CompanyRepository extends Repository<Company> { }