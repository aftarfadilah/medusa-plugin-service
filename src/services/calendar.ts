import { EventBusService, TransactionBaseService } from '@medusajs/medusa';
import { formatException } from '@medusajs/medusa/dist/utils/exception-formatter';
import { buildQuery } from '@medusajs/medusa/dist/utils/build-query';
import { MedusaError } from "medusa-core-utils"
import { EntityManager } from "typeorm"
import { CalendarRepository } from "../repositories/calendar";
import { Calendar } from '../models/calendar';
import { CreateCalendarInput, UpdateCalendarInput } from '../types/calendar';
import { setMetadata } from '@medusajs/medusa/dist/utils';
import { FindConfig, Selector } from '@medusajs/medusa/dist/types/common';

type InjectedDependencies = {
    manager: EntityManager
    calendarRepository: typeof CalendarRepository
    eventBusService: EventBusService
}

class CalendarService extends TransactionBaseService {
    protected manager_: EntityManager
    protected transactionManager_: EntityManager | undefined

    protected readonly calendarRepository_: typeof CalendarRepository
    protected readonly eventBus_: EventBusService

    static readonly IndexName = `calendars`
    static readonly Events = {
        UPDATED: "calendar.updated",
        CREATED: "calendar.created",
        DELETED: "calendar.deleted",
    }

    constructor({ manager, calendarRepository, eventBusService }: InjectedDependencies) {
        super(arguments[0]);

        this.manager_ = manager;
        this.calendarRepository_ = calendarRepository;
        this.eventBus_ = eventBusService;
    }

    async list(
        selector: Selector<Calendar>,
        config: FindConfig<Calendar> = {
          skip: 0,
          take: 50,
          relations: [],
        }
      ): Promise<Calendar[]> {
        const calendarRepo = this.manager_.getCustomRepository(this.calendarRepository_)
    
        const query = buildQuery(selector, config)
    
        return calendarRepo.find(query)
    }

    async retrieve(calendarId, config) {
        return await this.retrieve_({ id: calendarId }, config)
    }

    async retrieve_(selector, config) {
        const manager = this.manager_
        const calendarRepo = manager.getCustomRepository(this.calendarRepository_)

        const { relations, ...query } = buildQuery(selector, config)

        const calendar = await calendarRepo.findOneWithRelations(
            relations,
            query
        )

        if (!calendar) {
            const selectorConstraints = Object.entries(selector)
                .map(([key, value]) => `${key}: ${value}`)
                .join(", ")

            throw new MedusaError(
                MedusaError.Types.NOT_FOUND,
                `Calendar with ${selectorConstraints} was not found`
            )
        }

        return calendar
    }

    async create(calendarObject: CreateCalendarInput): Promise<Calendar> {
        return await this.atomicPhase_(async (manager) => {
            const calendarRepo = manager.getCustomRepository(this.calendarRepository_)

            const {
                ...rest
            } = calendarObject

            try {
                let calendar: any = calendarRepo.create(rest)
                calendar = await calendarRepo.save(calendar)

                const result = await this.retrieve(calendar.id, {
                    relations: [],
                })

                await this.eventBus_
                    .withTransaction(manager)
                    .emit(CalendarService.Events.CREATED, {
                        id: result.id,
                    })
                return result
            } catch (error) {
                throw formatException(error)
            }
        })
    }

    async delete(calendarId: string): Promise<void> {
        return await this.atomicPhase_(async (manager) => {
            const calendarRepo = manager.getCustomRepository(this.calendarRepository_)

            const calendar = await calendarRepo.findOne(
                { id: calendarId },
                { relations: [] }
            )

            if (!calendar) {
                return
            }

            await calendarRepo.softRemove(calendar)

            await this.eventBus_
                .withTransaction(manager)
                .emit(CalendarService.Events.DELETED, {
                    id: calendarId,
                })

            return Promise.resolve()
        })
    }

    async update(
        calendarId: string,
        update: UpdateCalendarInput
    ): Promise<Calendar> {
        return await this.atomicPhase_(async (manager) => {
            const calendarRepo = manager.getCustomRepository(this.calendarRepository_)
            const relations = []

            const calendar = await this.retrieve(calendarId, {
                relations,
            })

            const {
                ...rest
            } = update

            for (const [key, value] of Object.entries(rest)) {
                if (typeof value !== `undefined`) {
                    calendar[key] = value
                }
            }

            const result = await calendarRepo.save(calendar)

            await this.eventBus_
                .withTransaction(manager)
                .emit(CalendarService.Events.UPDATED, {
                    id: result.id,
                    fields: Object.keys(update),
                })
            return result
        })
    }
}

export default CalendarService;