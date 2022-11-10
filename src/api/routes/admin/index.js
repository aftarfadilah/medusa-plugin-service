import { Router } from "express";
import * as bodyParser from "body-parser";
import cors from "cors";
import { getConfigFile } from "medusa-core-utils";
import authenticate from "@medusajs/medusa/dist/api/middlewares/authenticate"

import services from "./services";
import products from "./products";
import locations from "./locations";
import companies from "./companies";
import calendars from "./calendars";
import appointments from "./appointments";

const route = Router()

export default (app, rootDirectory, config) => {
    app.use("/admin/ms", route);

    const { configModule } = getConfigFile(rootDirectory, "medusa-config");
    const { projectConfig } = configModule;

    const corsOptions = {
        origin: projectConfig.admin_cors.split(","),
        credentials: true,
    };

    route.use(bodyParser.json());
    route.use(cors(corsOptions));
    route.use(authenticate());

    services(route);
    products(route);
    locations(route);
    companies(route);
    calendars(route);
    appointments(route);

    return app;
}