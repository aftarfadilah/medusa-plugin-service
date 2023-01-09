import LocationService from "../services/location";
import DefaultWorkingHourService from "services/default-working-hour";

// To do create dwh data for location where don't have dwh data.
const dwhWorkerJob = async (container, options) => {
    console.log('checking all location about dwh data')
    const location_: LocationService = container.resolve("locationService");
    const dwh_: DefaultWorkingHourService = container.resolve("defaultWorkingHourService")
    const location = await location_.list({}, {})
    for (const x of location) {
        await dwh_.setupDWHLocation(x.id)
    }
}

export default dwhWorkerJob;