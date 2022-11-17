import { EventBusService, TransactionBaseService } from '@medusajs/medusa';
import { formatException } from '@medusajs/medusa/dist/utils/exception-formatter';
import { buildQuery } from '@medusajs/medusa/dist/utils/build-query';
import { MedusaError } from "medusa-core-utils"
import { EntityManager, LessThanOrEqual, MoreThanOrEqual } from "typeorm"
import { CalendarTimeperiodRepository } from "../repositories/calendar-timeperiod";
import { CalendarTimeperiod } from '../models/calendar-timeperiod';
import { CreateCalendarTimeperiodInput, UpdateCalendarTimeperiodInput } from '../types/calendar-timeperiod';
import { setMetadata } from '@medusajs/medusa/dist/utils';
import { FindConfig, Selector } from '@medusajs/medusa/dist/types/common';

type InjectedDependencies = {
    manager: EntityManager
    calendarTimeperiodRepository: typeof CalendarTimeperiodRepository
    eventBusService: EventBusService
}

class CalendarTimeperiodService extends TransactionBaseService {
    protected manager_: EntityManager
    protected transactionManager_: EntityManager | undefined

    protected readonly calendarTimeperiodRepository_: typeof CalendarTimeperiodRepository
    protected readonly eventBus_: EventBusService

    static readonly IndexName = `calendartimeperiods`
    static readonly Events = {
        UPDATED: "calendartimeperiod.updated",
        CREATED: "calendartimeperiod.created",
        DELETED: "calendartimeperiod.deleted",
    }

    constructor({ manager, calendarTimeperiodRepository, eventBusService }: InjectedDependencies) {
        super(arguments[0]);

        this.manager_ = manager;
        this.calendarTimeperiodRepository_ = calendarTimeperiodRepository;
        this.eventBus_ = eventBusService;
    }

    async list(
        selector: Selector<CalendarTimeperiod>,
        config: FindConfig<CalendarTimeperiod> = {
          skip: 0,
          take: 50,
          relations: [],
        }
      ): Promise<CalendarTimeperiod[]> {
        const calendarTimeperiodRepo = this.manager_.getCustomRepository(this.calendarTimeperiodRepository_)
    
        const query = buildQuery(selector, config)
    
        return calendarTimeperiodRepo.find(query)
    }

    async listCustom(calendarId: string, from?: string, to?: string): Promise<[CalendarTimeperiod[], number]> {
        const calendarTimeperiodRepo = this.manager_.getCustomRepository(this.calendarTimeperiodRepository_)
        
        if (from && to) {
            return calendarTimeperiodRepo.findAndCount({ where: { calendar_id: calendarId, from: MoreThanOrEqual(from), to: LessThanOrEqual(to) } })
        }
        
        if (to) {
            return calendarTimeperiodRepo.findAndCount({ where: { calendar_id: calendarId, to: LessThanOrEqual(to) } })
        }

        if (from) {
            return calendarTimeperiodRepo.findAndCount({ where: { calendar_id: calendarId, from: MoreThanOrEqual(from) } })
        }

        return calendarTimeperiodRepo.findAndCount({ where: { calendar_id: calendarId } })
    }

    async retrieve(calendarTimeperiodId, config: FindConfig<CalendarTimeperiod>) {
        const manager = this.manager_
        const calendarTimeperiodRepo = manager.getCustomRepository(this.calendarTimeperiodRepository_)

        const calendar = await calendarTimeperiodRepo.findOne(calendarTimeperiodId, config)

        if (!calendar) {
            throw new MedusaError(
                MedusaError.Types.NOT_FOUND,
                `Calendar Timeperiod with ${calendarTimeperiodId} was not found`
            )
        }

        return calendar
    }

    async create(calendarTimeperiodObject: CreateCalendarTimeperiodInput): Promise<CalendarTimeperiod> {
        return await this.atomicPhase_(async (manager) => {
            const calendarTimeperiodRepo = manager.getCustomRepository(this.calendarTimeperiodRepository_)

            const {
                ...rest
            } = calendarTimeperiodObject

            try {
                let calendarTimeperiod: any = calendarTimeperiodRepo.create(rest)
                calendarTimeperiod = await calendarTimeperiodRepo.save(calendarTimeperiod)

                const result = await this.retrieve(calendarTimeperiod.id, {
                    relations: [],
                })

                await this.eventBus_
                    .withTransaction(manager)
                    .emit(CalendarTimeperiodService.Events.CREATED, {
                        id: result.id,
                    })
                return result
            } catch (error) {
                throw formatException(error)
            }
        })
    }

    async delete(calendarTimeperiodId: string): Promise<void> {
        return await this.atomicPhase_(async (manager) => {
            const calendarTimeperiodRepo = manager.getCustomRepository(this.calendarTimeperiodRepository_)

            const calendar = await calendarTimeperiodRepo.findOne(
                { id: calendarTimeperiodId },
                { relations: [] }
            )

            if (!calendar) {
                return
            }

            await calendarTimeperiodRepo.softRemove(calendar)

            await this.eventBus_
                .withTransaction(manager)
                .emit(CalendarTimeperiodService.Events.DELETED, {
                    id: calendarTimeperiodId,
                })

            return Promise.resolve()
        })
    }

    async update(
        calendarTimeperiodId: string,
        update: UpdateCalendarTimeperiodInput
    ): Promise<CalendarTimeperiod> {
        return await this.atomicPhase_(async (manager) => {
            const calendarTimeperiodRepo = manager.getCustomRepository(this.calendarTimeperiodRepository_)
            const relations = []

            const calendarTimeperiod = await this.retrieve(calendarTimeperiodId, {
                relations,
            })

            const {
                metadata,
                ...rest
            } = update

            if (metadata) {
                calendarTimeperiod.metadata = setMetadata(calendarTimeperiod, metadata)
            }

            for (const [key, value] of Object.entries(rest)) {
                if (typeof value !== `undefined`) {
                    calendarTimeperiod[key] = value
                }
            }

            const result = await calendarTimeperiodRepo.save(calendarTimeperiod)

            await this.eventBus_
                .withTransaction(manager)
                .emit(CalendarTimeperiodService.Events.UPDATED, {
                    id: result.id,
                    fields: Object.keys(update),
                })
            return result
        })
    }
}

export default CalendarTimeperiodService;