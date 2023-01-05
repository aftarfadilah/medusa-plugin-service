import {
  EventBusService,
  LineItem,
  Order,
  TotalsService,
  TransactionBaseService,
} from "@medusajs/medusa";
import { formatException } from "@medusajs/medusa/dist/utils/exception-formatter";
import { buildQuery } from "@medusajs/medusa/dist/utils/build-query";
import { MedusaError } from "medusa-core-utils";
import { EntityManager } from "typeorm";
import { AppointmentRepository } from "../repositories/appointment";
import { Appointment } from "../models/appointment";
import {
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from "../types/appointment";
import { setMetadata } from "@medusajs/medusa/dist/utils";
import { FindConfig, Selector } from "@medusajs/medusa/dist/types/common";
import { OrderRepository } from "@medusajs/medusa/dist/repositories/order";

type InjectedDependencies = {
  manager: EntityManager;
  appointmentRepository: typeof AppointmentRepository;
  orderRepository: typeof OrderRepository;
  eventBusService: EventBusService;
  totalsService: TotalsService;
};

class AppointmentService extends TransactionBaseService {
  protected manager_: EntityManager;
  protected transactionManager_: EntityManager | undefined;

  protected readonly appointmentRepository_: typeof AppointmentRepository;
  protected readonly orderRepository_: typeof OrderRepository;
  protected readonly eventBus_: EventBusService;
  protected readonly totalsService_: TotalsService;

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
  }: InjectedDependencies) {
    super(arguments[0]);

    this.manager_ = manager;
    this.appointmentRepository_ = appointmentRepository;
    this.eventBus_ = eventBusService;
    this.totalsService_ = totalsService;
    this.orderRepository_ = orderRepository;
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

  async retrieve(appointmentId: string, config: FindConfig<Order>) {
    const manager = this.manager_;
    const appointmentRepo = manager.getCustomRepository(
      this.appointmentRepository_
    );
    const orderRepo = this.manager_.getCustomRepository(this.orderRepository_)

    // Get the appointment first
    const appointment = await appointmentRepo.findOne(appointmentId);

    if (!appointment) {
      throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Appointment ${appointmentId} has not been found.`
      );
    }

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
    const rawOrder = await orderRepo.findOneWithRelations(
      rels,
      query
    );

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
