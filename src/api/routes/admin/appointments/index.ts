import { Router } from "express";
import { Appointment } from "../../../../models/appointment";
import middlewares from "../../../middleware";
import "reflect-metadata";
import { transformQuery } from "@medusajs/medusa/dist/api/middlewares";
import { FindParams } from "@medusajs/medusa/dist/types/common";
import {
  defaultAdminOrdersFields,
  defaultAdminOrdersRelations,
  Order,
} from "@medusajs/medusa";

const route = Router();

export default (app) => {
  app.use("/appointments", route);

  route.post("/", middlewares.wrap(require("./create-appointment").default));

  route.get("/", middlewares.wrap(require("./list-appointment").default));

  // Get the order of the appointment with the same params as in get-order admin appointment
  // const defaultRelations = [
  //   ...defaultAdminAppointmentRelations,
  //   // ...defaultAdminOrdersRelations.map((field) => `order.${field}`),
  // ];
  //
  // const defaultFields = [
  //   ...defaultAdminAppointmentsFields,
  //   // ...defaultAdminOrdersFields.map((field) => `order.${field}`),
  // ];
  //
  // const allowedFields = [
  //   ...allowedAdminAppointmentsFields,
  //   // ...defaultAdminOrdersFields.map((field) => `order.${field}`),
  // ];
  //
  // const allowedRelations = [
  //   ...allowedAdminAppointmentsRelations,
  //   // ...defaultAdminOrdersRelations.map((field) => `order.${field}`),
  // ];

  route.get(
    "/:id",
    transformQuery(FindParams, {
      defaultRelations: defaultAdminAppointmentRelations,
      defaultFields: defaultAdminAppointmentsFields,
      allowedFields: defaultAdminAppointmentsFields,
      allowedRelations: allowedAdminAppointmentsFields,
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

export const defaultAdminAppointmentRelations = ["order"];

export const defaultAdminAppointmentsFields: (keyof Appointment)[] = [
  "id",
  "status",
  "display_id",
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

export const allowedAdminAppointmentsFields = [
  "id",
  "status",
  "display_id",
  "notified_via_email_at",
  "notified_via_sms_at",
  "from",
  "to",
  "order_id",
  "code",
  "is_confirmed",
  "metadata",
];

export const allowedAdminAppointmentsRelations = ["appointment"];

export * from "./list-appointment";
export * from "./create-appointment";
export * from "./update-appointment";
export * from "./delete-appointment";
export * from "./get-appointment";
