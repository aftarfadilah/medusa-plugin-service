import { Router } from "express";
import { ServiceSetting } from "../../../../models/service-setting";
import middlewares from "../../../middleware";
import "reflect-metadata"
import authenticate from "@medusajs/medusa/dist/api/middlewares/authenticate"

const route = Router()

export default (app) => {
    app.use("/settings", route);
    route.use(authenticate())

    route.get("/", middlewares.wrap(require("./list-service-setting").default));

    route.get("/:option", middlewares.wrap(require("./get-service-setting").default));

    route.put("/:option", middlewares.wrap(require("./set-service-setting").default));

    return app;
}

export const defaultAdminInvoiceSettingsRelations = []

export const defaultAdminInvoiceSettingsFields: (keyof ServiceSetting)[] = [
    "id",
    "option",
    "value",
    "is_public",
    "created_at",
    "updated_at",
    "deleted_at",
]

export * from "./list-service-setting";
export * from "./get-service-setting";
export * from "./set-service-setting";