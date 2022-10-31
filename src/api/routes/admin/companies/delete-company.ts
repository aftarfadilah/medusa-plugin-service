import { EntityManager } from "typeorm";
import CompanyService from "../../../../services/company";

export default async (req, res) => {
    const { id } = req.params

    const companyService: CompanyService = req.scope.resolve("companyService")
    const manager: EntityManager = req.scope.resolve("manager")
    await manager.transaction(async (transactionManager) => {
        return await companyService.withTransaction(transactionManager).delete(id)
    })

    res.json({
        id,
        object: "company",
        deleted: true,
    })
}
