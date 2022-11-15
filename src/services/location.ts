import { EventBusService, TransactionBaseService } from '@medusajs/medusa';
import { formatException } from '@medusajs/medusa/dist/utils/exception-formatter';
import { buildQuery } from '@medusajs/medusa/dist/utils/build-query';
import { MedusaError } from "medusa-core-utils"
import { EntityManager } from "typeorm"
import { LocationRepository } from "../repositories/location";
import { Location } from '../models/location';
import { CreateLocationInput, UpdateLocationInput } from '../types/location';
import { setMetadata } from '@medusajs/medusa/dist/utils';
import { FindConfig, Selector } from '@medusajs/medusa/dist/types/common';

type InjectedDependencies = {
    manager: EntityManager
    locationRepository: typeof LocationRepository
    eventBusService: EventBusService
}

class LocationService extends TransactionBaseService {
    protected manager_: EntityManager
    protected transactionManager_: EntityManager | undefined

    protected readonly locationRepository_: typeof LocationRepository
    protected readonly eventBus_: EventBusService

    static readonly IndexName = `locations`
    static readonly Events = {
        UPDATED: "location.updated",
        CREATED: "location.created",
        DELETED: "location.deleted",
    }

    constructor({ manager, locationRepository, eventBusService }: InjectedDependencies) {
        super(arguments[0]);

        this.manager_ = manager;
        this.locationRepository_ = locationRepository;
        this.eventBus_ = eventBusService;
    }

    async list(
        selector: Selector<Location>,
        config: FindConfig<Location> = {
          skip: 0,
          take: 50,
          relations: [],
        }
      ): Promise<Location[]> {
        const locationRepo = this.manager_.getCustomRepository(this.locationRepository_)
    
        const query = buildQuery(selector, config)
    
        return locationRepo.find(query)
    }

    async retrieve(locationId: string, config: FindConfig<Location>) {
        const manager = this.manager_
        const locationRepo = manager.getCustomRepository(this.locationRepository_)

        const location = await locationRepo.findOne(locationId, config)

        if (!location) {
            throw new MedusaError(
                MedusaError.Types.NOT_FOUND,
                `Location with ${locationId} was not found`
            )
        }

        return location
    }

    async create(locationObject: CreateLocationInput): Promise<Location> {
        return await this.atomicPhase_(async (manager) => {
            const locationRepo = manager.getCustomRepository(this.locationRepository_)

            const {
                ...rest
            } = locationObject

            try {
                let location: any = locationRepo.create(rest)
                location = await locationRepo.save(location)

                const result = await this.retrieve(location.id, {
                    relations: ["country"],
                })

                await this.eventBus_
                    .withTransaction(manager)
                    .emit(LocationService.Events.CREATED, {
                        id: result.id,
                    })
                return result
            } catch (error) {
                throw formatException(error)
            }
        })
    }

    async delete(locationId: string): Promise<void> {
        return await this.atomicPhase_(async (manager) => {
            const locationRepo = manager.getCustomRepository(this.locationRepository_)

            const location = await locationRepo.findOne(
                { id: locationId },
                { relations: ["country"] }
            )

            if (!location) {
                return
            }

            await locationRepo.softRemove(location)

            await this.eventBus_
                .withTransaction(manager)
                .emit(LocationService.Events.DELETED, {
                    id: locationId,
                })

            return Promise.resolve()
        })
    }

    async update(
        locationId: string,
        update: UpdateLocationInput
    ): Promise<Location> {
        return await this.atomicPhase_(async (manager) => {
            const locationRepo = manager.getCustomRepository(this.locationRepository_)

            const location = await this.retrieve(locationId, {})

            const {
                metadata,
                ...rest
            } = update


            if (metadata) {
                location.metadata = setMetadata(location, metadata)
            }

            for (const [key, value] of Object.entries(rest)) {
                if (typeof value !== `undefined`) {
                    location[key] = value
                }
            }

            const result = await locationRepo.save(location)

            await this.eventBus_
                .withTransaction(manager)
                .emit(LocationService.Events.UPDATED, {
                    id: result.id,
                    fields: Object.keys(update),
                })
            return result
        })
    }
}

export default LocationService;