import { Router } from "express";
import * as bodyParser from "body-parser";
import cors from "cors";
import { getConfigFile } from "medusa-core-utils";

import middlewares from "../middleware";

const route = Router()

export default (app, rootDirectory) => {
    app.use("/admin/service", route);

    const { configModule } = getConfigFile(rootDirectory, "medusa-config");
    const { projectConfig } = configModule;

    const corsOptions = {
        origin: projectConfig.admin_cors.split(","),
        credentials: true,
    };

    route.options("/", cors(corsOptions));
    route.options("/products", cors(corsOptions));
    
    route.get(
        "/products",
        cors(corsOptions),
        bodyParser.json(),
        middlewares.wrap(require("./list-products").default)
    );

    route.post(
        "/",
        cors(corsOptions),
        bodyParser.json(),
        middlewares.wrap(require("./create-service").default)
    );

    route.get(
        "/",
        cors(corsOptions),
        bodyParser.json(),
        middlewares.wrap(require("./list-service").default)
    );

    route.get(
        "/:id",
        cors(corsOptions),
        bodyParser.json(),
        middlewares.wrap(require("./get-service").default)
    );

    route.put(
        "/",
        cors(corsOptions),
        bodyParser.json(),
        middlewares.wrap(require("./update-service").default)
    );

    route.delete(
        "/:id",
        cors(corsOptions),
        bodyParser.json(),
        middlewares.wrap(require("./delete-service").default)
    );

    return app;
}