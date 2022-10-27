import { Router } from "express";
import * as bodyParser from "body-parser";
import cors from "cors";
import { getConfigFile } from "medusa-core-utils";

import services from "./services";
import products from "./products";
import locations from "./locations";

const route = Router()

export default (app, rootDirectory, config) => {
    app.use("/admin/ms", route);

    const { configModule } = getConfigFile(rootDirectory, "medusa-config");
    const { projectConfig } = configModule;

    const corsOptions = {
        origin: projectConfig.admin_cors.split(","),
        credentials: true,
    };

    route.use(cors(corsOptions));
    route.use(bodyParser.json());
    
    services(route);
    products(route);
    locations(route);

    return app;
}