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
import { EntityManager } from "typeorm";
import { AppointmentRepository } from "../repositories/appointment";
import { OrderRepository } from "@medusajs/medusa/dist/repositories/order";
import { Appointment, AppointmentStatus } from "../models/appointment";
import {
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from "../types/appointment";
import { setMetadata } from "@medusajs/medusa/dist/utils";
import { FindConfig, Selector } from "@medusajs/medusa/dist/types/common";
import { selector } from "../../types/appointment";
import CalendarService from "./calendar";
import CalendarTimeperiodService from "./calendar-timeperiod";
import LocationService from "./location";
import { divideTimes } from "../utils/date-utils";
import { includes } from "lodash";
import DivisionService from "./division";
import { format } from "date-fns";

type InjectedDependencies = {
  manager: EntityManager;
  appointmentRepository: typeof AppointmentRepository;
  calendarService: CalendarService;
  calendarTimeperiodService: CalendarTimeperiodService;
  locationService: LocationService;
  eventBusService: EventBusService;
  orderService: OrderService;
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

  static readonly IndexName = `appointments`;
  static readonly Events = {
    UPDATED: "appointment.updated",
    CREATED: "appointment.created",
    DELETED: "appointment.deleted",
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

    console.log("Query", query);

    return appointmentRepo.findAndCount(query);
  }

  async retrieve(appointmentId: string, config: FindConfig<Appointment>) {
    const manager = this.manager_;
    const appointmentRepo = manager.getCustomRepository(
      this.appointmentRepository_
    );
    const orderRepo = this.manager_.getCustomRepository(this.orderRepository_);

    // Get the appointment first
    const appointment = await appointmentRepo.findOne(appointmentId, config);

    if (!appointment) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Appointment ${appointmentId} has not been found.`
      );
    }

    return appointment;

    // Get the order of the appointment
    const { select, relations, totalsToSelect } =
      this.transformQueryForTotals(config);

    const query = {
      where: { id: appointment.order_id },
    } as FindConfig<Order>;

    if (relations && relations.length > 0) {
      query.relations = relations;
    }

    if (select && select.length > 0) {
      query.select = select;
    }

    const rels = query.relations;
    delete query.relations;
    const rawOrder = await orderRepo.findOneWithRelations(rels, query);

    if (!rawOrder) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Order ${appointment.order_id} to the appointment ${appointmentId} has not been found.`
      );
    }

    appointment.order = rawOrder;

    return this.decorateTotals(appointment, totalsToSelect);
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
    const selector: Selector<Appointment> = {};

    const hourInMs = 1000 * 60 * 60;
    const now = new Date(parseInt(currentTime));
    // console.log("Now", now);
    // Check in the previous and next 2 hours

    const previousDateTime = new Date(now.getTime() - 2 * hourInMs);
    const afterDateTime = new Date(now.getTime() + 2 * hourInMs);

    selector.from = {
      gte: previousDateTime,
    };

    // selector.to = {
    // lte: afterDateTime,
    // };

    // console.log("Selector", selector);

    // const response = await appointmentRepo.findAndCount(query);
    const response = await this.list(selector);

    // console.log("Response", response);
    const [appointmentList, appointmentCount] = response;

    if (appointmentCount === 0)
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "No appointment found",
        "400"
      );

    // console.log("Appointment list", appointmentList);

    for (const appointment of appointmentList) {
      const { metadata } = appointment;

      /**
       * TODO: Check if this appointment is from the right divison
       * In the meta_data of the appointment should be a calendar_timeperiod id
       * Retrieve the calendar_timeperiod and check if the division is correct and assign this to the value
       */
      const appointmentTimePeriodId = metadata["calendar_time_period_id"];

      // console.log("appointmentTimePeriod", appointmentTimePeriodId);

      if (appointmentTimePeriodId) {
        const appointmentTimePeriod = await this.calendarTimeperiod_.retrieve(
          appointmentTimePeriodId,
          {
            relations: ["calendar", "calendar.division"],
          }
        );

        // console.log("Appointmentment -> Timeperiod ", appointmentTimePeriod);

        const { id: appointmentDivisionId } =
          appointmentTimePeriod.calendar.division;

        console.log("Comparing", divisionId, appointmentDivisionId);

        const isRightDivision = divisionId === appointmentDivisionId;

        const appointment_ = await this.retrieve(appointment.id, {
          relations: ["order", "order.customer"],
        });

        const customerBirthday = appointment_.order.customer.metadata
          .birthday as string;
        console.log("metadata", metadata);

        if (!customerBirthday) {
          throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            "No birthday found for customer",
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

        console.log("Is right division", isRightDivision);
        console.log("Is right customer", isRightCustomer);

        if (isRightDivision && isRightCustomer) {
          console.log("Correct appointment", appointment);

          return appointment;
        }
      }

      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "No appointment found",
        "400"
      );

      // return undefined;

      // if (isRightDivision) {
      //   return appointment;
      //
      //   // const appointment_ =  await this.retrieve(appointment.id, {
      //   //     relations: ["order"]
      //   // });
      //   //
      //   // appointment_.order = await this.order_.retrieve(appointment_.order.id, {relations: ["items"]})
      // }
    }
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
  isSlotTimeAvailable(from: Date, to: Date, slot_time) {
    const divideBy = 5;
    const resultDivide = divideTimes(new Date(from), new Date(to), divideBy);
    for (const x in resultDivide) {
      const st = slot_time.filter((xx) => xx.date == x);
      const stl = st[0].slot_times;
      for (const xx of resultDivide[x]) {
        if (includes(stl, xx)) continue;
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
  }) {
    const { order_id, location_id, calendar_id, slot_time } =
      makeAppointmentInput;

    // check calendar exists or not
    await this.calendar_.retrieve(calendar_id, {});

    // check if order already have appointment
    const isOrderHaveAppointment = await this.isOrderHaveAppointment(order_id);
    if (isOrderHaveAppointment)
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Order Already Have Appointment !",
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

      if (+variant_time > 0) {
        duration_min = +variant_time;
      } else {
        duration_min = +product_time;
      }

      totalDurationMin += duration_min;
    }

    // calculated slot_time + duration_min items
    const slot_time_until = new Date(
      new Date(slot_time).getTime() + totalDurationMin * 60 * 1000
    );

    // get slot time
    const today_time_slot = await this.location_.getSlotTime(
      location_id,
      slot_time,
      slot_time_until,
      { calendar_id: calendar_id }
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
        "Slot Time Not Available!",
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
        location: location,
      },
    });

    return await this.retrieve(appointment.id, {
      relations: ["order", "order.items"],
    });
  }

  protected transformQueryForTotals(config: FindConfig<Order>): {
    relations: string[] | undefined;
    select: FindConfig<Order>["select"];
    totalsToSelect: FindConfig<Order>["select"];
  } {
    let { select, relations } = config;

    if (!select) {
      return {
        select,
        relations,
        totalsToSelect: [],
      };
    }

    const totalFields = [
      "subtotal",
      "tax_total",
      "shipping_total",
      "discount_total",
      "gift_card_total",
      "total",
      "paid_total",
      "refunded_total",
      "refundable_amount",
      "items.refundable",
      "swaps.additional_items.refundable",
      "claims.additional_items.refundable",
    ];

    const totalsToSelect = select.filter((v) => totalFields.includes(v));
    if (totalsToSelect.length > 0) {
      const relationSet = new Set(relations);
      relationSet.add("items");
      relationSet.add("items.tax_lines");
      relationSet.add("items.adjustments");
      relationSet.add("swaps");
      relationSet.add("swaps.additional_items");
      relationSet.add("swaps.additional_items.tax_lines");
      relationSet.add("swaps.additional_items.adjustments");
      relationSet.add("claims");
      relationSet.add("claims.additional_items");
      relationSet.add("claims.additional_items.tax_lines");
      relationSet.add("claims.additional_items.adjustments");
      relationSet.add("discounts");
      relationSet.add("discounts.rule");
      relationSet.add("gift_cards");
      relationSet.add("gift_card_transactions");
      relationSet.add("refunds");
      relationSet.add("shipping_methods");
      relationSet.add("shipping_methods.tax_lines");
      relationSet.add("region");
      relations = [...relationSet];

      select = select.filter((v) => !totalFields.includes(v));
    }

    const toSelect = [...select];
    if (toSelect.length > 0 && toSelect.indexOf("tax_rate") === -1) {
      toSelect.push("tax_rate");
    }

    return {
      relations,
      select: toSelect,
      totalsToSelect,
    };
  }

  protected async decorateTotals(
    appointment: Appointment,
    totalsFields: string[] = []
  ): Promise<Appointment> {
    const { order } = appointment;

    for (const totalField of totalsFields) {
      switch (totalField) {
        case "shipping_total": {
          order.shipping_total = await this.totalsService_.getShippingTotal(
            order
          );
          break;
        }
        case "gift_card_total": {
          const giftCardBreakdown = await this.totalsService_.getGiftCardTotal(
            order
          );
          order.gift_card_total = giftCardBreakdown.total;
          order.gift_card_tax_total = giftCardBreakdown.tax_total;
          break;
        }
        case "discount_total": {
          order.discount_total = await this.totalsService_.getDiscountTotal(
            order
          );
          break;
        }
        case "tax_total": {
          order.tax_total = await this.totalsService_.getTaxTotal(order);
          break;
        }
        case "subtotal": {
          order.subtotal = await this.totalsService_.getSubtotal(order);
          break;
        }
        case "total": {
          order.total = await this.totalsService_
            .withTransaction(this.manager_)
            .getTotal(order);
          break;
        }
        case "refunded_total": {
          order.refunded_total = this.totalsService_.getRefundedTotal(order);
          break;
        }
        case "paid_total": {
          order.paid_total = this.totalsService_.getPaidTotal(order);
          break;
        }
        case "refundable_amount": {
          const paid_total = this.totalsService_.getPaidTotal(order);
          const refunded_total = this.totalsService_.getRefundedTotal(order);
          order.refundable_amount = paid_total - refunded_total;
          break;
        }
        case "items.refundable": {
          const items: LineItem[] = [];
          for (const item of order.items) {
            items.push({
              ...item,
              refundable: await this.totalsService_.getLineItemRefund(order, {
                ...item,
                quantity: item.quantity - (item.returned_quantity || 0),
              } as LineItem),
            } as LineItem);
          }
          order.items = items;
          break;
        }
        case "swaps.additional_items.refundable": {
          for (const s of order.swaps) {
            const items: LineItem[] = [];
            for (const item of s.additional_items) {
              items.push({
                ...item,
                refundable: await this.totalsService_.getLineItemRefund(order, {
                  ...item,
                  quantity: item.quantity - (item.returned_quantity || 0),
                } as LineItem),
              } as LineItem);
            }
            s.additional_items = items;
          }
          break;
        }
        case "claims.additional_items.refundable": {
          for (const c of order.claims) {
            const items: LineItem[] = [];
            for (const item of c.additional_items) {
              items.push({
                ...item,
                refundable: await this.totalsService_.getLineItemRefund(order, {
                  ...item,
                  quantity: item.quantity - (item.returned_quantity || 0),
                } as LineItem),
              } as LineItem);
            }
            c.additional_items = items;
          }
          break;
        }
        default: {
          break;
        }
      }
    }

    return { ...appointment, order } as Appointment;
  }
}

export default AppointmentService;
