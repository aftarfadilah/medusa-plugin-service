import { EntityManager } from "typeorm";
import AppointmentService from "../../../../services/appointment";

export default async (req, res) => {
    const { id } = req.params

    const appointmentService: AppointmentService = req.scope.resolve("appointmentService")
    const manager: EntityManager = req.scope.resolve("manager")
    await manager.transaction(async (transactionManager) => {
        return await appointmentService.withTransaction(transactionManager).delete(id)
    })

    res.json({
        id,
        object: "appointment",
        deleted: true,
    })
}
