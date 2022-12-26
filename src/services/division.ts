import { EventBusService, TransactionBaseService } from '@medusajs/medusa';
import { formatException } from '@medusajs/medusa/dist/utils/exception-formatter';
import { buildQuery } from '@medusajs/medusa/dist/utils/build-query';
import { MedusaError } from "medusa-core-utils"
import { EntityManager } from "typeorm"
import { CreateDivisionInput } from '../types/division';
import { FindConfig, Selector } from '@medusajs/medusa/dist/types/common';
import CalendarService from './calendar';
import LocationService from './location';
import { DivisionRepository } from '../repositories/division';
import { Division } from '../models/division';

type InjectedDependencies = {
    manager: EntityManager
    divisionRepository: typeof DivisionRepository
    eventBusService: EventBusService
    calendarService: CalendarService
    locationService: LocationService
}

class DivisionService extends TransactionBaseService {
    protected manager_: EntityManager
    protected transactionManager_: EntityManager | undefined

    protected readonly divisionRepository_: typeof DivisionRepository
    protected readonly eventBus_: EventBusService
    protected readonly calendar_: CalendarService
    protected readonly location_: LocationService

    static readonly IndexName = `divisions`
    static readonly Events = {
        CREATED: "division.created",
        DELETED: "division.deleted",
    }

    constructor({ manager, divisionRepository, eventBusService, calendarService, locationService }: InjectedDependencies) {
        super(arguments[0]);

        this.manager_ = manager;
        this.divisionRepository_ = divisionRepository;
        this.eventBus_ = eventBusService;
        this.calendar_ = calendarService
        this.location_ = locationService
    }

    async list(
        selector: Selector<Division>,
        config: FindConfig<Division> = {
          skip: 0,
          take: 50,
          relations: [],
        }
      ): Promise<Division[]> {
        const divisionRepo = this.manager_.getCustomRepository(this.divisionRepository_)
    
        const query = buildQuery(selector, config)
    
        return divisionRepo.find(query)
    }

    async retrieve(divisionId: string, config: FindConfig<Division>) {
        const manager = this.manager_
        const divisionRepo = manager.getCustomRepository(this.divisionRepository_)

        const division = await divisionRepo.findOne(divisionId, config)

        if (!division) {
            throw new MedusaError(
                MedusaError.Types.NOT_FOUND,
                `Division with ${divisionId} was not found`
            )
        }

        return division
    }

    async create(divisionObject: CreateDivisionInput): Promise<Division> {
        const { calendar_id, location_id } = divisionObject
        const isExist = await this.list({ calendar_id: calendar_id, location_id: location_id })
        
        // prevent duplicate division with same location and calendar id
        // @ts-ignore
        if (isExist.length > 0) throw new MedusaError("CONFLICT", "Division Already Exists for this location_id and calendar_id combination")
        
        return await this.atomicPhase_(async (manager) => {
            const divisionRepo = manager.getCustomRepository(this.divisionRepository_)

            const {
                ...rest
            } = divisionObject

            try {
                let division: any = divisionRepo.create(rest)
                division = await divisionRepo.save(division)

                const result = await this.retrieve(division.id, {
                    relations: ["calendar", "location"],
                })

                await this.eventBus_
                    .withTransaction(manager)
                    .emit(DivisionService.Events.CREATED, {
                        id: result.id,
                    })
                return result
            } catch (error) {
                throw formatException(error)
            }
        })
    }

    async delete(divisionId: string): Promise<void> {
        return await this.atomicPhase_(async (manager) => {
            const divisionRepo = manager.getCustomRepository(this.divisionRepository_)

            const division = await divisionRepo.findOne(
                { id: divisionId },
                { relations: ["calendar", "location"] }
            )

            if (!division) {
                return
            }

            await divisionRepo.softRemove(division)

            await this.eventBus_
                .withTransaction(manager)
                .emit(DivisionService.Events.DELETED, {
                    id: divisionId,
                })

            return Promise.resolve()
        })
    }
}

export default DivisionService;