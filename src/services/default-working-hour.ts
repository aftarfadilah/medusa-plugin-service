import { EventBusService, TransactionBaseService } from '@medusajs/medusa';
import { formatException } from '@medusajs/medusa/dist/utils/exception-formatter';
import { buildQuery } from '@medusajs/medusa/dist/utils/build-query';
import { MedusaError } from "medusa-core-utils"
import { EntityManager } from "typeorm"
import { DefaultWorkingHourRepository } from "../repositories/default-working-hour";
import { DefaultWorkingHour } from '../models/default-working-hour';
import { CreateDefaultWorkingHourInput, UpdateDefaultWorkingHourInput } from '../types/default-working-hour';
import { setMetadata } from '@medusajs/medusa/dist/utils';
import { FindConfig, Selector } from '@medusajs/medusa/dist/types/common';

type InjectedDependencies = {
    manager: EntityManager
    defaultWorkingHourRepository: typeof DefaultWorkingHourRepository
    eventBusService: EventBusService
}

class DefaultWorkingHourService extends TransactionBaseService {
    protected manager_: EntityManager
    protected transactionManager_: EntityManager | undefined

    protected readonly defaultWorkingHourRepository_: typeof DefaultWorkingHourRepository
    protected readonly eventBus_: EventBusService

    static readonly IndexName = `companies`
    static readonly Events = {
        UPDATED: "default-working-hour.updated",
        CREATED: "default-working-hour.created",
        DELETED: "default-working-hour.deleted",
    }

    constructor({ manager, defaultWorkingHourRepository, eventBusService }: InjectedDependencies) {
        super(arguments[0]);

        this.manager_ = manager;
        this.defaultWorkingHourRepository_ = defaultWorkingHourRepository;
        this.eventBus_ = eventBusService;
    }

    async list(
        selector: Selector<DefaultWorkingHour>,
        config: FindConfig<DefaultWorkingHour> = {
          skip: 0,
          take: 50,
          relations: [],
        }
      ): Promise<DefaultWorkingHour[]> {
        const defaultWorkingHourRepo = this.manager_.getCustomRepository(this.defaultWorkingHourRepository_)
    
        const query = buildQuery(selector, config)
    
        return defaultWorkingHourRepo.find(query)
    }

    async retrieve(defaultWorkingHourId, config) {
        const manager = this.manager_
        const defaultWorkingHourRepo = manager.getCustomRepository(this.defaultWorkingHourRepository_)

        const defaultWorkingHour = await defaultWorkingHourRepo.findOne(defaultWorkingHourId, config)

        if (!defaultWorkingHour) {
            throw new MedusaError(
                MedusaError.Types.NOT_FOUND,
                `DefaultWorkingHour with ${defaultWorkingHourId} was not found`
            )
        }

        return defaultWorkingHour
    }

    async create(defaultWorkingHourObject: CreateDefaultWorkingHourInput): Promise<DefaultWorkingHour> {
        return await this.atomicPhase_(async (manager) => {
            const defaultWorkingHourRepo = manager.getCustomRepository(this.defaultWorkingHourRepository_)

            const {
                ...rest
            } = defaultWorkingHourObject

            try {
                let defaultWorkingHour: any = defaultWorkingHourRepo.create(rest)
                defaultWorkingHour = await defaultWorkingHourRepo.save(defaultWorkingHour)

                const result = await this.retrieve(defaultWorkingHour.id, {})

                await this.eventBus_
                    .withTransaction(manager)
                    .emit(DefaultWorkingHourService.Events.CREATED, {
                        id: result.id,
                    })
                return result
            } catch (error) {
                throw formatException(error)
            }
        })
    }

    async delete(defaultWorkingHourId: string): Promise<void> {
        return await this.atomicPhase_(async (manager) => {
            const defaultWorkingHourRepo = manager.getCustomRepository(this.defaultWorkingHourRepository_)

            const defaultWorkingHour = await defaultWorkingHourRepo.findOne(
                { id: defaultWorkingHourId },
                {}
            )

            if (!defaultWorkingHour) {
                return
            }

            await defaultWorkingHourRepo.softRemove(defaultWorkingHour)

            await this.eventBus_
                .withTransaction(manager)
                .emit(DefaultWorkingHourService.Events.DELETED, {
                    id: defaultWorkingHourId,
                })

            return Promise.resolve()
        })
    }

    async update(
        defaultWorkingHourId: string,
        update: UpdateDefaultWorkingHourInput
    ): Promise<DefaultWorkingHour> {
        return await this.atomicPhase_(async (manager) => {
            const defaultWorkingHourRepo = manager.getCustomRepository(this.defaultWorkingHourRepository_)

            const defaultWorkingHour = await this.retrieve(defaultWorkingHourId, {})

            const {
                ...rest
            } = update

            for (const [key, value] of Object.entries(rest)) {
                if (typeof value !== `undefined`) {
                    defaultWorkingHour[key] = value
                }
            }

            const result = await defaultWorkingHourRepo.save(defaultWorkingHour)

            await this.eventBus_
                .withTransaction(manager)
                .emit(DefaultWorkingHourService.Events.UPDATED, {
                    id: result.id,
                    fields: Object.keys(update),
                })
            return result
        })
    }

    async getDataDayExist(locationId: string) {
        const checkDay = await this.list({ location_id: locationId })
        const result = []
        
        for (const x of checkDay) {
            result.push(x.day)
        }

        return result
    }

    // Todo Setup DefaultWorkingHour Data for Location
    async setupDWHLocation(locationId: string) {
        const collectionDataDay = await this.getDataDayExist(locationId)
        for (let i = 0; i < 7; i++) {
            // check data day exist for location
            if (collectionDataDay.includes(i)) continue

            // Todo, We Should Make Default Creation for DWH Creation
            await this.create({
                location_id: locationId,
                day: i,
                from: "00:00:00",
                to: "00:00:00",
                is_working_day: false,
            })
        }
    }

    // Remove DWH data After Location Get Deleted
    async deleteDWHLocation(locationId: string) {
        const collectionDataDay = await this.list({ location_id: locationId })
        for (const x of collectionDataDay) {
            await this.delete(x.id)
        }
    }
}

export default DefaultWorkingHourService;