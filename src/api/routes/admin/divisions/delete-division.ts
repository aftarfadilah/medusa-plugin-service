import { EntityManager } from "typeorm";
import DivisionService from "../../../../services/division";

export default async (req, res) => {
    const { id } = req.params

    const divisionService: DivisionService = req.scope.resolve("divisionService")
    const manager: EntityManager = req.scope.resolve("manager")
    await manager.transaction(async (transactionManager) => {
        return await divisionService.withTransaction(transactionManager).delete(id)
    })

    res.json({
        id,
        object: "division",
        deleted: true,
    })
}
