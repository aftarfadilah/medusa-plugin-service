import { EntityManager } from "typeorm";
import AppointmentService from "../services/appointment";
import { PostMakeAppointmentReq } from "../api/routes/store/customers/make-appointment";
import { validator } from "../utils/validator";
import { EventBusService, OrderService } from "@medusajs/medusa";
import { MedusaError } from "medusa-core-utils";

type InjectedDependencies = {
  manager: EntityManager;
  eventBusService: EventBusService;
  appointmentService: AppointmentService;
  orderService: OrderService;
};

class OrderDoingSubscriber {
  manager_: EntityManager;
  appointment_: AppointmentService;
  order_: OrderService;

  constructor({
    manager,
    eventBusService,
    appointmentService,
    orderService,
  }: InjectedDependencies) {
    this.manager_ = manager;
    this.appointment_ = appointmentService;
    this.order_ = orderService;

    // subscribe for make appointment during checkout
    eventBusService.subscribe(
      "order.placed",
      async ({ id }: { id: string }) => {
        const order = await this.order_.retrieve(id, { relations: ["cart"] });

        let createAppointment =
          order.cart.context?.schedule_appointment_now == true;

        // check if make appoinment during checkout
        if (createAppointment) {
          // @ts-ignore
          const { location, slot_time, calendar, timezone_offset } =
            order.cart.context.appointment_values;

          if (!location || !slot_time || !calendar || !timezone_offset)
            throw new MedusaError(
              MedusaError.Types.INVALID_DATA,
              "location_id, calendar_id or slot_time not filled, create appointment failed.",
              "400"
            );

          const dataInput = {
            order_id: id,
            location_id: location.id,
            calendar_id: calendar.id,
            slot_time,
            timezone_offset,
          };

          const validated = await validator(PostMakeAppointmentReq, dataInput);
          await this.appointment_.makeAppointment(validated);
        }
      }
    );
  }
}

export default OrderDoingSubscriber;
