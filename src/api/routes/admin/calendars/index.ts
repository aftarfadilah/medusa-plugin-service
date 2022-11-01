import { Router } from "express";
import { Calendar } from "../../../../models/calendar";
import middlewares from "../../../middleware";
import "reflect-metadata"

import timeperiod from "./timeperiod";

const route = Router()

export default (app) => {
    app.use("/calendars", route);

    timeperiod(route);

    route.post("/", middlewares.wrap(require("./create-calendar").default));

    route.get("/", middlewares.wrap(require("./list-calendar").default));

    route.get("/:id", middlewares.wrap(require("./get-calendar").default));

    route.put("/:id", middlewares.wrap(require("./update-calendar").default));

    route.delete("/:id", middlewares.wrap(require("./delete-calendar").default));

    return app;
}

export const defaultAdminCalendarRelations = []

export const defaultAdminCalendarFields: (keyof Calendar)[] = [
    "id",
    "name",
    "color",
    "metadata",
    "created_at",
    "updated_at",
    "deleted_at",
]

export * from "./list-calendar";
export * from "./create-calendar";
export * from "./update-calendar";
export * from "./delete-calendar";
export * from "./get-calendar";