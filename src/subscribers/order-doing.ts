import { EntityManager } from "typeorm";
import AppointmentService from "../services/appointment";
import { AppointmentStatus } from "../models/appointment";
import { AdminPostAppointmentsReq } from "../api/routes/admin/appointments/create-appointment";
import { validator } from "../utils/validator"
import { EventBusService } from "@medusajs/medusa";

type InjectedDependencies = { 
    manager: EntityManager;
    eventBusService: EventBusService;
    appointmentService: AppointmentService;
}

class OrderDoingSubscriber {
    manager_: EntityManager;
    appointmentService_: AppointmentService;

    constructor({ manager, eventBusService, appointmentService }: InjectedDependencies ) {
        this.manager_ = manager;
        this.appointmentService_ = appointmentService;

        eventBusService.subscribe("order.placed", async ({ id }: { id: string }) => {
            const dataInput = {
                location: "",
                order_id: id,
                is_confirmed: false,
                status: AppointmentStatus.DRAFT
            }
    
            const validated = await validator(AdminPostAppointmentsReq, dataInput)
            await this.manager_.transaction(async (transactionManager) => {
                return await this.appointmentService_.withTransaction(transactionManager).create(validated);
            })
        });
    }
}

export default OrderDoingSubscriber;