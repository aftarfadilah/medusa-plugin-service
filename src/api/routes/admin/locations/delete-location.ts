import { EntityManager } from "typeorm";
import LocationService from "../../../../services/location";

export default async (req, res) => {
    const { id } = req.params

    const locationService: LocationService = req.scope.resolve("locationService")
    const manager: EntityManager = req.scope.resolve("manager")
    await manager.transaction(async (transactionManager) => {
        return await locationService.withTransaction(transactionManager).delete(id)
    })

    res.json({
        id,
        object: "location",
        deleted: true,
    })
}
