import {
  EventBusService,
  LineItem,
  Order,
  TotalsService,
  TransactionBaseService,
  OrderService,
} from "@medusajs/medusa";
import { formatException } from "@medusajs/medusa/dist/utils/exception-formatter";
import { buildQuery } from "@medusajs/medusa/dist/utils/build-query";
import { MedusaError } from "medusa-core-utils";
import { Brackets, EntityManager } from "typeorm";
import { AppointmentRepository } from "../repositories/appointment";
import { OrderRepository } from "@medusajs/medusa/dist/repositories/order";
import { Appointment, AppointmentStatus } from "../models/appointment";
import {
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from "../types/appointment";
import { setMetadata } from "@medusajs/medusa/dist/utils";
import {
  FindConfig,
  QuerySelector,
  Selector,
} from "@medusajs/medusa/dist/types/common";
import CalendarService from "./calendar";
import CalendarTimeperiodService from "./calendar-timeperiod";
import LocationService from "./location";
import { divideTimes } from "../utils/date-utils";
import { includes } from "lodash";
import DivisionService from "./division";
import ServiceSettingService from "./service-setting";

type InjectedDependencies = {
  manager: EntityManager;
  appointmentRepository: typeof AppointmentRepository;
  calendarService: CalendarService;
  calendarTimeperiodService: CalendarTimeperiodService;
  locationService: LocationService;
  orderService: OrderService;
  eventBusService: EventBusService;
  serviceSettingService: ServiceSettingService;
  orderRepository: typeof OrderRepository;
  totalsService: TotalsService;
  divisionService: DivisionService;
};

class AppointmentService extends TransactionBaseService {
  protected manager_: EntityManager;
  protected transactionManager_: EntityManager | undefined;

  protected readonly appointmentRepository_: typeof AppointmentRepository;
  protected readonly orderRepository_: typeof OrderRepository;
  protected readonly eventBus_: EventBusService;
  protected readonly totalsService_: TotalsService;
  protected readonly calendar_: CalendarService;
  protected readonly calendarTimeperiod_: CalendarTimeperiodService;
  protected readonly location_: LocationService;
  protected readonly order_: OrderService;
  protected readonly setting_: ServiceSettingService;

  static readonly IndexName = `appointments`;
  static readonly Events = {
    UPDATED: "appointment.updated",
    CREATED: "appointment.created",
    DELETED: "appointment.deleted",
    CANCELED: "appointment.canceled",
  };

  constructor({
    manager,
    appointmentRepository,
    eventBusService,
    totalsService,
    orderRepository,
    calendarService,
    calendarTimeperiodService,
    locationService,
    orderService,
    serviceSettingService,
  }: InjectedDependencies) {
    super(arguments[0]);

    this.manager_ = manager;
    this.appointmentRepository_ = appointmentRepository;
    this.eventBus_ = eventBusService;
    this.totalsService_ = totalsService;
    this.orderRepository_ = orderRepository;
    this.calendar_ = calendarService;
    this.calendarTimeperiod_ = calendarTimeperiodService;
    this.location_ = locationService;
    this.order_ = orderService;
    this.setting_ = serviceSettingService;
  }

  async list(
    selector: Selector<Appointment>,
    config: FindConfig<Appointment> = {
      skip: 0,
      take: 50,
      relations: [],
    }
  ): Promise<[Appointment[], number]> {
    const appointmentRepo = this.manager_.getCustomRepository(
      this.appointmentRepository_
    );

    const query = buildQuery(selector, config);

    return appointmentRepo.findAndCount(query);
  }

  async listAndCount(
    selector: QuerySelector<Appointment>,
    config: FindConfig<Appointment> = {
      skip: 0,
      take: 50,
      order: { from: "ASC" },
    }
  ): Promise<[Appointment[], number]> {
    console.log("Config", config);

    const appointmentRepo = this.manager_.getCustomRepository(
      this.appointmentRepository_
    );

    let q;
    if (selector.q) {
      q = selector.q;
      delete selector.q;
    }

    const query = buildQuery(selector, config);

    if (q) {
      const where = query.where;

      delete where.display_id;

      query.join = {
        alias: "appointment",
        innerJoin: {
          order: "appointment.order",
        },
      };

      query.where = (qb): void => {
        qb.where(where);

        //TODO: Add where clause for appointment.order.customer.first_name

        qb.andWhere(
          new Brackets((qb) => {
            qb.where(`order.email ILIKE :q`, { q: `%${q}%` })
              // .orWhere(`order.customer.first_name ILIKE :qfn`, {
              //   qfn: `%${q}%`,
              // })
              .orWhere(`appointment.display_id::varchar(255) ILIKE :dId`, {
                dId: `${q}`,
              });
            // .orWhere(`order.customer.last_name ILIKE :q`, { q: `%${q}%` })
            // .orWhere(`order.customer.phone ILIKE :q`, { q: `%${q}%` });
          })
        );
      };
    }

    query.select = config.select;
    const rels = config.relations;

    delete query.relations;

    const appointments = await appointmentRepo.findWithRelations(rels, query);
    const count = await appointmentRepo.count(query);

    return [appointments, count];

    // const query = buildQuery(selector, config);
    //
    // return appointmentRepo.findAndCount(query);
  }

  async retrieve(appointmentId: string, config: FindConfig<Appointment>) {
    const manager = this.manager_;
    const appointmentRepo = manager.getCustomRepository(
      this.appointmentRepository_
    );

    const appointment = await appointmentRepo.findOne(appointmentId, config);

    if (!appointment) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `ERROR_NO_APPOINTMENTS_FOUND`
      );
    }

    return appointment;
  }

  async create(
    appointmentObject: CreateAppointmentInput
  ): Promise<Appointment> {
    return await this.atomicPhase_(async (manager) => {
      const appointmentRepo = manager.getCustomRepository(
        this.appointmentRepository_
      );

      const { ...rest } = appointmentObject;

      try {
        let appointment: any = appointmentRepo.create(rest);
        appointment = await appointmentRepo.save(appointment);

        const result = await this.retrieve(appointment.id, {
          relations: ["order"],
        });

        await this.eventBus_
          .withTransaction(manager)
          .emit(AppointmentService.Events.CREATED, {
            id: result.id,
          });
        return result;
      } catch (error) {
        throw formatException(error);
      }
    });
  }

  async delete(appointmentId: string): Promise<void> {
    return await this.atomicPhase_(async (manager) => {
      const appointmentRepo = manager.getCustomRepository(
        this.appointmentRepository_
      );

      const appointment = await appointmentRepo.findOne(
        { id: appointmentId },
        { relations: ["order"] }
      );

      if (!appointment) {
        return;
      }

      await appointmentRepo.softRemove(appointment);

      await this.eventBus_
        .withTransaction(manager)
        .emit(AppointmentService.Events.DELETED, {
          id: appointmentId,
        });

      return Promise.resolve();
    });
  }

  async update(
    appointmentId: string,
    update: UpdateAppointmentInput
  ): Promise<Appointment> {
    return await this.atomicPhase_(async (manager) => {
      const appointmentRepo = manager.getCustomRepository(
        this.appointmentRepository_
      );
      const relations = ["order"];

      const appointment = await this.retrieve(appointmentId, {
        relations,
      });

      const { metadata, ...rest } = update;

      if (metadata) {
        appointment.metadata = setMetadata(appointment, metadata);
      }

      for (const [key, value] of Object.entries(rest)) {
        if (typeof value !== `undefined`) {
          appointment[key] = value;
        }
      }

      const result = await appointmentRepo.save(appointment);

      await this.eventBus_
        .withTransaction(manager)
        .emit(AppointmentService.Events.UPDATED, {
          id: result.id,
          fields: Object.keys(update),
        });
      return result;
    });
  }

  async getCurrent(divisionId: string, currentTime: string, birthDate: Date) {
    const hourInMs = 1000 * 60 * 60;
    const now = new Date(parseInt(currentTime));
    // Check in the previous and next 2 hours
    const dateTimeFrom = new Date(now.getTime() - 2 * hourInMs);
    const dateTimeTo = new Date(now.getTime() + 2 * hourInMs);

    const selector: Selector<Appointment> = {
      from: {
        gte: dateTimeFrom,
        lte: dateTimeTo,
      },
      to: {
        gte: dateTimeFrom,
        lte: dateTimeTo,
      },
    };

    const response = await this.list(selector, {
      order: {
        from: "ASC",
      },
    });

    const [appointmentList, appointmentCount] = response;

    if (appointmentCount === 0)
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "ERROR_NO_APPOINTMENTS_FOUND",
        "400"
      );

    for (const appointment of appointmentList) {
      const { metadata } = appointment;

      const appointmentTimePeriodId = metadata["calendar_time_period_id"];

      if (appointmentTimePeriodId) {
        const appointmentTimePeriod = await this.calendarTimeperiod_.retrieve(
          appointmentTimePeriodId,
          {
            relations: ["calendar", "calendar.division"],
          }
        );

        const { id: appointmentDivisionId } =
          appointmentTimePeriod.calendar.division;

        const isRightDivision = divisionId === appointmentDivisionId;

        const appointment_ = await this.retrieve(appointment.id, {
          relations: ["order", "order.customer"],
        });

        const customerBirthday = appointment_.order.customer.metadata
          .birthday as string;

        if (!customerBirthday) {
          throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            "ERROR_NO_BIRTHDAY_DATA_FOR_CUSTOMER",
            "400"
          );
        }

        const [expectedYearString, expectedMonthString, expectedDayString] =
          customerBirthday.split("-");

        const year = birthDate.getFullYear();
        const month = birthDate.getMonth();
        const day = birthDate.getDate();

        const sameYear = parseInt(expectedYearString) === year;
        const sameMonth = parseInt(expectedMonthString) - 1 === month;
        const sameDay = parseInt(expectedDayString) === day;

        const isRightCustomer = sameYear && sameMonth && sameDay;

        if (isRightDivision && isRightCustomer) {
          return appointment;
        }
      }
    }

    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "ERROR_NO_APPOINTMENTS_FOUND",
      "400"
    );
  }

  checkIfCurrent(appointment: Appointment, hourRange: number) {
    const { from, to } = appointment;
    const now = new Date().getTime();

    const range = hourRange * 1000 * 60 * 60;

    const minTime = from.getTime() - range;
    const maxTime = to.getTime() + range;

    if (now < minTime) return false;

    if (now > maxTime) return false;

    return true;
  }

  async isOrderHaveAppointment(orderId: string) {
    const [appointment, count] = await this.list({ order_id: orderId });
    let realCount = 0;
    for (const x of appointment) {
      if (x.status == AppointmentStatus.SCHEDULED) realCount += 1;
    }
    if (realCount > 0) return true;
    return false;
  }

  // calculate from and to appointment into slot time and check with available slot time
  isSlotTimeAvailable(from: Date, to: Date, availableSlotTime) {
    const divideBy = 5;
    const selectedTimeSlots = divideTimes(
      new Date(from),
      new Date(to),
      divideBy
    );

    console.log("Is slot time available", from, to, availableSlotTime);

    for (const dateEntry of Object.entries(selectedTimeSlots)) {
      const [dateKey, dateTimeSlots] = dateEntry;

      // because availableSlotTime is object, then we find slotTime date with dateKey
      let availableSlotTime_ = availableSlotTime.filter(
        (slotTime) => slotTime.date == dateKey
      );
      availableSlotTime_ = availableSlotTime_[0].slot_times;

      // @ts-ignore
      for (const dateTimeSlot of dateTimeSlots) {
        // compare selectedTimeSlots with availableSlotTime_, if missing one in availableSlotTime then it will be return to false
        if (includes(availableSlotTime_, dateTimeSlot)) continue;
        return false;
      }
    }

    return true;
  }

  async makeAppointment(makeAppointmentInput: {
    order_id: string;
    location_id: string;
    calendar_id: string;
    slot_time: Date;
    timezone_offset: number;
  }) {
    const {
      order_id,
      location_id,
      calendar_id,
      slot_time: slot_time_iso,
      timezone_offset,
    } = makeAppointmentInput;

    const timezone_offset_in_ms = timezone_offset * 60 * 1000 * -1;

    const slot_time = new Date(
      new Date(slot_time_iso).getTime() + timezone_offset_in_ms
    );

    // check calendar exists or not
    const calendar = await this.calendar_.retrieve(calendar_id, {});

    // check if order already have appointment
    const isOrderHaveAppointment = await this.isOrderHaveAppointment(order_id);
    if (isOrderHaveAppointment)
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "ERROR_ORDER_ALREADY_HAS_APPOINTMENT",
        "400"
      );

    const location = await this.location_.retrieve(location_id, {
      relations: ["country", "company"],
    });
    const order = await this.order_.retrieve(order_id, {
      relations: ["items"],
    });

    // calculated duration_min on product general or variant
    const items_list: LineItem[] = order.items;
    let totalDurationMin: number = 0;

    for (const x of items_list) {
      let duration_min: number = 0;
      const variant_time: string = x.variant.metadata?.duration_min as string;
      const product_time: string = x.variant.product.metadata
        ?.duration_min as string;

      if (!variant_time && !product_time)
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "ERROR_APPOINTMENT_HAS_NO_DURATION",
          "400"
        );

      if (!!variant_time) {
        duration_min = +variant_time;
      } else if (!!product_time) {
        duration_min = +product_time;
      }

      totalDurationMin += duration_min;
    }

    // calculated slot_time + duration_min items
    const slot_time_until = new Date(
      new Date(slot_time).getTime() + totalDurationMin * 60 * 1000
    );

    // get slot time
    const today_time_slot = await this.location_.getSlotTime_(
      calendar_id,
      location_id,
      slot_time,
      slot_time_until
    );

    // is slot time available
    const isSlotTimeAvailable = this.isSlotTimeAvailable(
      slot_time,
      slot_time_until,
      today_time_slot
    );
    if (!isSlotTimeAvailable)
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "ERROR_SLOT_TIME_NOT_AVAILABLE",
        "404"
      );

    const dataInput = {
      order_id: order_id,
      is_confirmed: false,
      status: AppointmentStatus.DRAFT,
    };

    const ap = await this.create(dataInput);
    const appointment: Appointment = await this.retrieve(ap.id, {
      relations: ["order", "order.items"],
    });

    // create timeperiod
    const timeperiod = await this.calendarTimeperiod_.create({
      calendar_id: calendar_id,
      title: `Appointment for ${appointment.order_id}`,
      type: "blocked",
      from: new Date(slot_time),
      to: new Date(slot_time_until),
      metadata: {
        appointment_id: appointment.id,
      },
    });

    // update status to scheduled
    await this.update(appointment.id, {
      status: AppointmentStatus.SCHEDULED,
      from: new Date(slot_time),
      to: new Date(slot_time_until),
      metadata: {
        calendar_timeperiod_id: timeperiod.id,
        location: {
          ...location,
          calendar: calendar,
        },
      },
    });

    return await this.retrieve(appointment.id, {
      relations: ["order", "order.items"],
    });
  }

  async cancelAppointment(appointmentId: string): Promise<Appointment> {
    return await this.atomicPhase_(async (manager) => {
      const isCancellationAllow =
        (await this.setting_.get("cancellation_allow")).value === "true";
      const cancellationMaxDayBeforeAppointment = parseInt(
        (await this.setting_.get("cancellation_max_day_before_appointment"))
          .value
      );

      // check if cancellation is allowed
      if (!isCancellationAllow)
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "ERROR_APPOINTMENT_CANNOT_BE_CANCELED"
        );

      const appointment = await this.retrieve(appointmentId, {});

      if (appointment.status == AppointmentStatus.CANCELED)
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "ERROR_APPOINTMENT_ALREADY_CANCELED" //rethink about the error name :)
        );

      // only scheduled appointment can be canceled
      if (appointment.status != AppointmentStatus.SCHEDULED)
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          "ERROR_NO_APPOINTMENTS_FOUND" //rethink about the error name :)
        );

      const appointmentStartTime = new Date(appointment.from).getTime();
      const cancellationBeforeTime =
        new Date().getTime() +
        cancellationMaxDayBeforeAppointment * 1000 * 60 * 60 * 24; // today + max day before appointment

      // check it's late to be cancelled or not
      if (appointmentStartTime < cancellationBeforeTime)
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "ERROR_APPOINTMENT_TOO_LATE_TO_CANCEL"
        );

      await this.update(appointmentId, { status: AppointmentStatus.CANCELED });

      // delete calendar timeperiod so the time will be available
      const calendarTimeperiodId = appointment.metadata
        ?.calendar_timeperiod_id as string;
      if (calendarTimeperiodId)
        await this.calendarTimeperiod_.delete(calendarTimeperiodId);

      const result = await this.retrieve(appointmentId, {});

      await this.eventBus_
        .withTransaction(manager)
        .emit(AppointmentService.Events.CANCELED, {
          id: result.id,
        });

      return result;
    });
  }
}

export default AppointmentService;
