import { ServiceSetting } from "../models/service-setting";
import { addDay } from "../utils/date-utils";

const automationSlotTimesJob = async (container, options) => {
    const eventBus_ = container.resolve("eventBusService");
    const setting_ = container.resolve("serviceSettingService");

    // do cronjob everyhour
    eventBus_.createCronJob("automation-slot-times", {}, "0 * * * *", async () => {
        const setting = {}
        const getSetting: ServiceSetting[] = await setting_.all({}, {})

        for (const settingData of Object.values(getSetting)) {
            setting[settingData.option] = settingData.value
        }
        
        const today = new Date()
        const todayIndex = today.getDay()
        const todayTime = today.getHours()
        const isAutomationSlotEnable = (setting['automation_slot'] === 'true')
        const automationSlotW = setting['automation_slot_w']
        const automationSlotT = parseInt(setting['automation_slot_t'])
        const automationSlotD = setting['automation_slot_d']

        // check if automation enabled
        if (!isAutomationSlotEnable) return false

        // check date
        if (todayIndex != automationSlotD) return false

        // check time
        if (todayTime != automationSlotT) return false

        // calculation today + (7 * automation_slot_w)
        const maxReleased = addDay(today, 7 * automationSlotW)

        await setting_.set('automation_max_slot_date_time', maxReleased)
    })
}

export default automationSlotTimesJob;