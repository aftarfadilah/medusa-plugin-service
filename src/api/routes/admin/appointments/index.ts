import { Router } from "express";
import { Appointment } from "../../../../models/appointment";
import middlewares from "../../../middleware";
import "reflect-metadata";
import { transformQuery } from "@medusajs/medusa/dist/api/middlewares";
import { FindParams } from "@medusajs/medusa/dist/types/common";
import { defaultAdminOrdersRelations, Order } from "@medusajs/medusa";

const route = Router();

export default (app) => {
  app.use("/appointments", route);

  const relations = [...defaultAdminOrdersRelations];

  route.post("/", middlewares.wrap(require("./create-appointment").default));

  route.get("/", middlewares.wrap(require("./list-appointment").default));

  // Get the order of the appointment with the same params as in get-order admin appointment

  route.get(
    "/:id",
    transformQuery(FindParams,  {
      defaultRelations: relations,
      defaultFields: defaultAdminOrdersFields,
      allowedFields: allowedAdminOrdersFields,
      allowedRelations: allowedAdminOrdersRelations,
      isList: false,
    }),
    middlewares.wrap(require("./get-appointment").default)
  );

  route.put("/:id", middlewares.wrap(require("./update-appointment").default));

  route.delete(
    "/:id",
    middlewares.wrap(require("./delete-appointment").default)
  );

  return app;
};

export const defaultAdminAppointmentRelations = [];

export const defaultAdminAppointmentFields: (keyof Appointment)[] = [
  "id",
  "status",
  "location",
  "notified_via_email_at",
  "notified_via_sms_at",
  "from",
  "to",
  "order_id",
  "code",
  "is_confirmed",
  "metadata",
  "created_at",
  "updated_at",
  "deleted_at",
] as (keyof Appointment)[];

export const defaultAdminOrdersFields = [
  "id",
  "status",
  "fulfillment_status",
  "payment_status",
  "display_id",
  "cart_id",
  "draft_order_id",
  "customer_id",
  "email",
  "region_id",
  "currency_code",
  "tax_rate",
  "canceled_at",
  "created_at",
  "updated_at",
  "metadata",
  "items.refundable",
  "swaps.additional_items.refundable",
  "claims.additional_items.refundable",
  "shipping_total",
  "discount_total",
  "tax_total",
  "refunded_total",
  "gift_card_total",
  "subtotal",
  "total",
  "paid_total",
  "refundable_amount",
  "no_notification",
] as (keyof Order)[];

export const allowedAdminOrdersFields = [
  "id",
  "status",
  "fulfillment_status",
  "payment_status",
  "display_id",
  "cart_id",
  "draft_order_id",
  "customer_id",
  "email",
  "region_id",
  "currency_code",
  "tax_rate",
  "canceled_at",
  "created_at",
  "updated_at",
  "metadata",
  "shipping_total",
  "discount_total",
  "tax_total",
  "refunded_total",
  "subtotal",
  "gift_card_total",
  "total",
  "paid_total",
  "refundable_amount",
  "no_notification",
];

export const allowedAdminOrdersRelations = [
  "order",
  "order.customer",
  "order.region",
  "order.edits",
  "order.sales_channel",
  "order.billing_address",
  "order.shipping_address",
  "order.discounts",
  "order.discounts.rule",
  "order.shipping_methods",
  "order.payments",
  "order.fulfillments",
  "order.returns",
  "order.claims",
  "order.swaps",
  "order.swaps.return_order",
  "order.swaps.additional_items",
];

export * from "./list-appointment";
export * from "./create-appointment";
export * from "./update-appointment";
export * from "./delete-appointment";
export * from "./get-appointment";
