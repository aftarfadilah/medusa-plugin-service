import { defaultStoreLocationRelations } from "."
import LocationService from "../../../../services/location"

export default async (req, res) => {
    const { id } = req.params

    const locationService: LocationService = req.scope.resolve("locationService")
    const location = await locationService.retrieve(id, { relations: defaultStoreLocationRelations })

    res.status(200).json({ location })
}
