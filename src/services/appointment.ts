import { EventBusService, TransactionBaseService, OrderService } from '@medusajs/medusa';
import { formatException } from '@medusajs/medusa/dist/utils/exception-formatter';
import { buildQuery } from '@medusajs/medusa/dist/utils/build-query';
import { MedusaError } from "medusa-core-utils"
import { EntityManager } from "typeorm"
import { AppointmentRepository } from "../repositories/appointment";
import { Appointment } from '../models/appointment';
import { CreateAppointmentInput, UpdateAppointmentInput } from '../types/appointment';
import { setMetadata } from '@medusajs/medusa/dist/utils';
import { FindConfig, Selector } from '@medusajs/medusa/dist/types/common';
import { selector } from "../../types/appointment"

type InjectedDependencies = {
    manager: EntityManager
    appointmentRepository: typeof AppointmentRepository
    eventBusService: EventBusService
    orderService: OrderService
}

class AppointmentService extends TransactionBaseService {
    protected manager_: EntityManager
    protected transactionManager_: EntityManager | undefined

    protected readonly appointmentRepository_: typeof AppointmentRepository
    protected readonly eventBus_: EventBusService
    protected readonly order_ : OrderService

    static readonly IndexName = `appointments`
    static readonly Events = {
        UPDATED: "appointment.updated",
        CREATED: "appointment.created",
        DELETED: "appointment.deleted",
    }

    constructor({ manager, appointmentRepository, eventBusService, orderService }: InjectedDependencies) {
        super(arguments[0]);

        this.manager_ = manager;
        this.appointmentRepository_ = appointmentRepository;
        this.eventBus_ = eventBusService;
        this.order_ = orderService;
    }

    async list(
        selector: Selector<Appointment>,
        config: FindConfig<Appointment> = {
          skip: 0,
          take: 50,
          relations: [],
        }
      ): Promise<[Appointment[], number]> {
        const appointmentRepo = this.manager_.getCustomRepository(this.appointmentRepository_)
        const query = buildQuery(selector, config)
        return appointmentRepo.findAndCount(query)
    }

    async retrieve(appointmentId: string, config: FindConfig<Appointment>) {
        const manager = this.manager_
        const appointmentRepo = manager.getCustomRepository(this.appointmentRepository_)

        const appointment = await appointmentRepo.findOne(appointmentId, config)

        if (!appointment) {
            throw new MedusaError(
                MedusaError.Types.NOT_FOUND,
                `Appointment was ${appointmentId} not found`
            )
        }

        return appointment
    }

    async create(appointmentObject: CreateAppointmentInput): Promise<Appointment> {
        return await this.atomicPhase_(async (manager) => {
            const appointmentRepo = manager.getCustomRepository(this.appointmentRepository_)

            const {
                ...rest
            } = appointmentObject

            try {
                let appointment: any = appointmentRepo.create(rest)
                appointment = await appointmentRepo.save(appointment)

                const result = await this.retrieve(appointment.id, {
                    relations: ["order"],
                })

                await this.eventBus_
                    .withTransaction(manager)
                    .emit(AppointmentService.Events.CREATED, {
                        id: result.id,
                    })
                return result
            } catch (error) {
                throw formatException(error)
            }
        })
    }

    async delete(appointmentId: string): Promise<void> {
        return await this.atomicPhase_(async (manager) => {
            const appointmentRepo = manager.getCustomRepository(this.appointmentRepository_)

            const appointment = await appointmentRepo.findOne(
                { id: appointmentId },
                { relations: ["order"] }
            )

            if (!appointment) {
                return
            }

            await appointmentRepo.softRemove(appointment)

            await this.eventBus_
                .withTransaction(manager)
                .emit(AppointmentService.Events.DELETED, {
                    id: appointmentId,
                })

            return Promise.resolve()
        })
    }

    async update(
        appointmentId: string,
        update: UpdateAppointmentInput
    ): Promise<Appointment> {
        return await this.atomicPhase_(async (manager) => {
            const appointmentRepo = manager.getCustomRepository(this.appointmentRepository_)
            const relations = ["order"]

            const appointment = await this.retrieve(appointmentId, {
                relations,
            })

            const {
                metadata,
                ...rest
            } = update


            if (metadata) {
                appointment.metadata = setMetadata(appointment, metadata)
            }

            for (const [key, value] of Object.entries(rest)) {
                if (typeof value !== `undefined`) {
                    appointment[key] = value
                }
            }

            const result = await appointmentRepo.save(appointment)

            await this.eventBus_
                .withTransaction(manager)
                .emit(AppointmentService.Events.UPDATED, {
                    id: result.id,
                    fields: Object.keys(update),
                })
            return result
        })
    }

    async getCurrent(division:string) {
        const manager = this.manager_;

        const selector: selector = {};

        const hourInMs = 1000 * 60 * 60;
        const now = new Date();

        // Check in the previous and next 2 hours
        selector.from = new Date(now.getTime() - 2 * hourInMs);
        selector.to = new Date(now.getTime() + 2 * hourInMs);

        const appointmentRepo = manager.getCustomRepository(
            this.appointmentRepository_
        );

        const query = buildQuery(selector)
        const response = await appointmentRepo.findAndCount(query);

        const [appointmentList,_] = response;

        for (const appointment of appointmentList) {

            const { from, to } = appointment;

            const now = new Date().getTime();

            const isCurrentAppointment = now > from.getTime() && now < to.getTime();

            if(isCurrentAppointment){

                /**
                 * TODO: Check if this appointment is from the right divison
                 * In the meta_data of the appointment should be a calendar_timeperiod id
                 * Retrieve the calendar_timeperiod and check if the division is correct and assign this to the value
                 */

                const isRightDivision = true;

                if(isRightDivision){

                    return appointment;

                    // const appointment_ =  await this.retrieve(appointment.id, {
                    //     relations: ["order"]
                    // });
                    //
                    // appointment_.order = await this.order_.retrieve(appointment_.order.id, {relations: ["items"]})
                }
            }

        }

    }

    checkIfCurrent(appointment:Appointment, hourRange:number) {

        const {from,to} = appointment;
        const now = new Date().getTime();

        const range = hourRange * 1000 * 60 * 60;

        const minTime = from.getTime() - range;
        const maxTime = to.getTime() + range;

        if(now < minTime )
          return false;

        if(now > maxTime)
          return false;

        return true;


    }

}

export default AppointmentService;