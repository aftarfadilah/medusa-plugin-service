import { Router } from "express";
import { Appointment } from "../../../../models/appointment";
import middlewares from "../../../middleware";
import "reflect-metadata"

const route = Router()

export default (app) => {
    app.use("/appointments", route);

    route.post("/", middlewares.wrap(require("./create-appointment").default));

    route.get("/", middlewares.wrap(require("./list-appointment").default));

    route.get("/:id", middlewares.wrap(require("./get-appointment").default));

    route.put("/:id", middlewares.wrap(require("./update-appointment").default));

    route.delete("/:id", middlewares.wrap(require("./delete-appointment").default));

    return app;
}

export const defaultAdminAppointmentRelations = []

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
]

export * from "./list-appointment";
export * from "./create-appointment";
export * from "./update-appointment";
export * from "./delete-appointment";
export * from "./get-appointment";