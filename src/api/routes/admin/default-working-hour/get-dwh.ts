import { defaultAdminDefaultWorkingHourRelations } from "."
import DefaultWorkingHourService from "../../../../services/default-working-hour"

export default async (req, res) => {
    const { id } = req.params

    const dwh_: DefaultWorkingHourService = req.scope.resolve("defaultWorkingHourService")
    const dwh = await dwh_.retrieve(id, { relations: defaultAdminDefaultWorkingHourRelations })

    res.status(200).json({ dwh })
}
