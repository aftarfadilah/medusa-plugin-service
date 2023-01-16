import ServiceSettingService from "../../../../services/service-setting"

export default async (req, res) => {
    const settingService: ServiceSettingService = req.scope.resolve("serviceSettingService")
    const setting = await settingService.all(true)

    res.status(200).json({ setting })
}