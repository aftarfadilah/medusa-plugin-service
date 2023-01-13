import { EventBusService, TransactionBaseService } from '@medusajs/medusa';
import { formatException } from '@medusajs/medusa/dist/utils/exception-formatter';
import { MedusaError } from "medusa-core-utils"
import { EntityManager } from "typeorm"
import { ServiceSettingRepository } from "../repositories/service-setting";
import { ServiceSetting } from '../models/service-setting';

type InjectedDependencies = {
    manager: EntityManager
    serviceSettingRepository: typeof ServiceSettingRepository
    eventBusService: EventBusService
}

class ServiceSettingService extends TransactionBaseService {
    protected manager_: EntityManager
    protected transactionManager_: EntityManager | undefined

    protected readonly serviceSettingRepository_: typeof ServiceSettingRepository
    protected readonly eventBus_: EventBusService
    protected readonly options: any

    static readonly IndexName = `service-setting`
    static readonly Events = {
        UPDATED: "service_setting.updated",
        CREATED: "service_setting.created",
        DELETED: "service_setting.deleted",
    }

    constructor({ manager, serviceSettingRepository, eventBusService }: InjectedDependencies, options) {
        super(arguments[0]);

        this.manager_ = manager;
        this.serviceSettingRepository_ = serviceSettingRepository;
        this.eventBus_ = eventBusService;
        this.options = options
    }

    async all(): Promise<ServiceSetting[]> {
        const serviceSettingRepo = this.manager_.getCustomRepository(this.serviceSettingRepository_)
        return serviceSettingRepo.find()
    }

    async get(option: string) {
        const manager = this.manager_
        const serviceSettingRepo = manager.getCustomRepository(this.serviceSettingRepository_)

        const serviceSetting = await serviceSettingRepo.findOne({ option: option }, {})

        if (!serviceSetting) {
            throw new MedusaError(
                MedusaError.Types.NOT_FOUND,
                `ServiceSetting with ${option} was not found`
            )
        }

        return serviceSetting
    }

    async create(option: string, value: string): Promise<ServiceSetting> {
        return await this.atomicPhase_(async (manager) => {
            const serviceSettingRepo = manager.getCustomRepository(this.serviceSettingRepository_)

            try {
                let serviceSetting: any = serviceSettingRepo.create({ option: option, value: value })
                serviceSetting = await serviceSettingRepo.save(serviceSetting)
                const result = await this.get(option)

                await this.eventBus_
                    .withTransaction(manager)
                    .emit(ServiceSettingService.Events.CREATED, {
                        id: result.id,
                    })
                return result
            } catch (error) {
                throw formatException(error)
            }
        })
    }

    async delete(option: string): Promise<void> {
        return await this.atomicPhase_(async (manager) => {
            const serviceSettingRepo = manager.getCustomRepository(this.serviceSettingRepository_)

            const serviceSetting = await serviceSettingRepo.findOne( { option: option }, {} )

            if (!serviceSetting) {
                return
            }

            await serviceSettingRepo.softRemove(serviceSetting)

            await this.eventBus_
                .withTransaction(manager)
                .emit(ServiceSettingService.Events.DELETED, {
                    option: option,
                })

            return Promise.resolve()
        })
    }

    async set(option: string, value: string, is_public?: boolean): Promise<ServiceSetting> {
        return await this.atomicPhase_(async (manager) => {
            const serviceSettingRepo = manager.getCustomRepository(this.serviceSettingRepository_)

            let serviceSetting = await serviceSettingRepo.findOne({ where: { option: option } })
            let result

            // if option is not found, then we create new one
            if (!serviceSetting) {
                serviceSetting = await this.create(option, value)
                result = await serviceSettingRepo.findOne({ where: { option: option } })
            } else {
                serviceSetting["value"] = value
                if (is_public != undefined) serviceSetting["is_public"] = is_public
                result = await serviceSettingRepo.save(serviceSetting)
            }

            await this.eventBus_
                .withTransaction(manager)
                .emit(ServiceSettingService.Events.UPDATED, {
                    option: result.option,
                    value: result.value,
            })
            return result
        })
    }

    // To do sync default setting from plugin options, if there not created one
    async settingSync() {
        const settingList = this.options.settings
        const allSetting = await this.all()

        for (const x in settingList) {
            if (!allSetting.find((d) => d.option == x)) {
                await this.set(x, settingList[x])
            }
        }
    }
}

export default ServiceSettingService;