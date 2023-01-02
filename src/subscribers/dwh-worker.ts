import { EntityManager } from "typeorm";
import { EventBusService, OrderService } from "@medusajs/medusa";
import DefaultWorkingHourService from "../services/default-working-hour";

type InjectedDependencies = { 
    manager: EntityManager;
    eventBusService: EventBusService;
    defaultWorkingHourService: DefaultWorkingHourService
}

class OrderDoingSubscriber {
    manager_: EntityManager;
    order_: OrderService;
    dwh_: DefaultWorkingHourService;

    constructor({ manager, eventBusService, defaultWorkingHourService }: InjectedDependencies ) {
        this.manager_ = manager;
        this.dwh_ = defaultWorkingHourService

        eventBusService.subscribe("location.created", async ({ id }: { id: string }) => {
            await this.dwh_.setupDWHLocation(id)
        });

        eventBusService.subscribe("location.deleted", async ({ id }: { id: string }) => {
            await this.dwh_.deleteDWHLocation(id)
        });
    }
}

export default OrderDoingSubscriber;