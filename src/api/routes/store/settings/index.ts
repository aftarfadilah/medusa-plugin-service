import { Router } from "express";
import { ServiceSetting } from "../../../../models/service-setting";
import middlewares from "../../../middleware";
import "reflect-metadata"
import requireCustomerAuthentication from "@medusajs/medusa/dist/api/middlewares/require-customer-authentication"

const route = Router()

export default (app) => {
    app.use("/settings", route);
    route.use(requireCustomerAuthentication())

    route.get("/", middlewares.wrap(require("./list-setting").default));

    route.get("/:option", middlewares.wrap(require("./get-setting").default));

    return app;
}

export * from "./list-setting";
export * from "./get-setting";