import { defaultStoreDivisionRelations } from "."
import DivisionService from "../../../../services/division"

export default async (req, res) => {
    const { id } = req.params

    const divisionService: DivisionService = req.scope.resolve("divisionService")
    const division = await divisionService.retrieve(id, { relations: defaultStoreDivisionRelations })

    res.status(200).json({ division })
}
