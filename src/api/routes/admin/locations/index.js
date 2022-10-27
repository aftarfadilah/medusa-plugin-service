import { Router } from "express";
import middlewares from "../../../middleware";

const route = Router()

export default (app) => {
    app.use("/locations", route);

    route.post("/", middlewares.wrap(require("./create-location").default));

    route.get("/", middlewares.wrap(require("./list-location").default));

    route.get("/:id", middlewares.wrap(require("./get-location").default));

    route.put("/", middlewares.wrap(require("./update-location").default));

    route.delete("/:id", middlewares.wrap(require("./delete-location").default));

    return app;
}

export * from "./list-location";
export * from "./create-location";
export * from "./update-location";
export * from "./delete-location";
export * from "./get-location";