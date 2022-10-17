import { Router } from "express";
import * as bodyParser from "body-parser";
import cors from "cors";
import { getConfigFile } from "medusa-core-utils";

import middlewares from "../middleware";

const route = Router()

export default (app: Router, rootDirectory: string): Router => {
    app.use("/admin/service", route);

    // To Do Fix Error on CORS
    const { configModule } = getConfigFile(rootDirectory, "medusa-config") as Record<string, unknown>;
    const { projectConfig } = configModule as { projectConfig: { admin_cors: string } };

    const corsOptions = {
        origin: projectConfig.admin_cors.split(","),
        credentials: true,
    };

    //app.use('/', cors(corsOptions));

    //route.options("/", cors(corsOptions));

    // route.post(
    //     "/",
    //     cors(corsOptions),
    //     bodyParser.json(),
    //     middlewares.wrap(require("./create-service").default)
    // );

    route.get(
        "/products",
        bodyParser.json(),
        middlewares.wrap(require("./list-products").default)
    );

    route.post(
        "/",
        bodyParser.json(),
        middlewares.wrap(require("./create-service").default)
    );

    route.get(
        "/",
        bodyParser.json(),
        middlewares.wrap(require("./list-service").default)
    );

    route.get(
        "/:id",
        bodyParser.json(),
        middlewares.wrap(require("./get-service").default)
    );

    route.put(
        "/",
        bodyParser.json(),
        middlewares.wrap(require("./update-service").default)
    );

    route.delete(
        "/:id",
        bodyParser.json(),
        middlewares.wrap(require("./delete-service").default)
    );

    return app;
}