import { EventBusService } from "@medusajs/medusa";
import CalendarTimeperiodService from "../services/calendar-timeperiod";
import AppointmentService from "../services/appointment";

type InjectedDependencies = {
    eventBusService: EventBusService;
    appointmentService: AppointmentService;
    calendarTimeperiodService: CalendarTimeperiodService;
}

class OrderDoingSubscriber {
    appointment_: AppointmentService;
    calendarTimeperiod_: CalendarTimeperiodService;

    constructor({ eventBusService, appointmentService, calendarTimeperiodService }: InjectedDependencies ) {
        this.appointment_ = appointmentService;
        this.calendarTimeperiod_ = calendarTimeperiodService;

        // Todo everytime appointment time get updated, calendar_timeperiod should update the time too.
        eventBusService.subscribe("appointment.updated", async ({ id }: { id: string }) => {
            const appointment = await this.appointment_.retrieve(id, {})
            const calendarTimeperiodId = appointment.metadata?.calendar_timeperiod_id as string || undefined
            if (calendarTimeperiodId) await this.calendarTimeperiod_.update(calendarTimeperiodId, { from: appointment.from, to: appointment.to })
        });
    }
}

export default OrderDoingSubscriber;