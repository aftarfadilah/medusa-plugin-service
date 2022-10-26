import { Router } from "express";
import middlewares from "../../../middleware";

const route = Router()

export default (app) => {
    app.use("/services", route);

    route.post("/", middlewares.wrap(require("./create-service").default));

    route.get("/", middlewares.wrap(require("./list-service").default));

    route.get("/:id", middlewares.wrap(require("./get-service").default));

    route.put("/", middlewares.wrap(require("./update-service").default));

    route.delete("/:id", middlewares.wrap(require("./delete-service").default));

    return app;
}

export * from "./create-service";
export * from "./update-service";
export * from "./delete-service";
export * from "./list-service";
export * from "./get-service";