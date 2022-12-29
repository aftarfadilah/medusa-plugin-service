import ServiceSettingService from "../../../../services/service-setting"

export default async (req, res) => {
    const serviceSettingService: ServiceSettingService = req.scope.resolve("serviceSettingService")
    const serviceSetting = await serviceSettingService.all()

    res.status(200).json({ serviceSetting })
}