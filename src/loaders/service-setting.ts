import ServiceSettingService from "../services/service-setting";

// To do sync default setting from plugin options, if there not created one everytime plugin running
const serviceSettingJob = async (container, options) => {
    const serviceSetting_: ServiceSettingService = container.resolve("serviceSettingService");
    serviceSetting_.settingSync()
    console.log("Sync Setting with Default One If Option not in Database")
}

export default serviceSettingJob;