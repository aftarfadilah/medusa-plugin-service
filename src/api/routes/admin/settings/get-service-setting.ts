import ServiceSettingService from "../../../../services/service-setting"

export default async (req, res) => {
    const { option } = req.params

    const serviceSettingService: ServiceSettingService = req.scope.resolve("serviceSettingService")
    const serviceSetting = await serviceSettingService.get(option)

    res.status(200).json({ serviceSetting })
}
