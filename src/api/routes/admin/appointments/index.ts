import { Router } from "express";
import { Appointment } from "../../../../models/appointment";
import middlewares from "../../../middleware";
import "reflect-metadata";
import { FindParams } from "@medusajs/medusa/dist/types/common";
import {
  defaultAdminOrdersFields,
  defaultAdminOrdersRelations,
  Order,
} from "@medusajs/medusa";
import { AdminGetAppointmentsParams } from "./list-appointment";
import {transformQuery} from "../../../middleware/transform-query";

const route = Router();

export default (app) => {
  app.use("/appointments", route);

  route.post("/", middlewares.wrap(require("./create-appointment").default));

  try {
    route.get(
      "/",
      transformQuery(AdminGetAppointmentsParams, {
        defaultRelations: defaultAdminAppointmentRelations,
        defaultFields: defaultAdminAppointmentsFields,
        isList: true,
      }),
      middlewares.wrap(require("./list-appointment").default)
    );
  } catch (e) {
    console.error(e);
  }

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

export const defaultAdminAppointmentRelations = ["order", "order.customer"];

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
