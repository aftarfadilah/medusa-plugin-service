import { Router } from "express";
import { CalendarTimeperiod } from "../../../../../models/calendar-timeperiod";
import middlewares from "../../../../middleware";
import "reflect-metadata"

const route = Router()

export default (app) => {
    app.use("/", route);
    
    route.post("/:id/timeperiod/", middlewares.wrap(require("./create-timeperiod").default));

    route.get("/:id/timeperiod/", middlewares.wrap(require("./list-timeperiod").default));

    route.get("/:id/timeperiod/:idTime", middlewares.wrap(require("./get-timeperiod").default));

    route.put("/:id/timeperiod/:idTime", middlewares.wrap(require("./update-timeperiod").default));

    route.delete("/:id/timeperiod/:idTime", middlewares.wrap(require("./delete-timeperiod").default));

    return app;
}

export const defaultAdminCalendarTimeperiodRelations = []

export const defaultAdminCalendarTimeperiodFields: (keyof CalendarTimeperiod)[] = [
    "id",
    "title",
    "from",
    "to",
    "type",
    "calendar_id",
    "metadata",
    "created_at",
    "updated_at",
    "deleted_at",
]

export * from "./list-timeperiod";
export * from "./create-timeperiod";
export * from "./update-timeperiod";
export * from "./delete-timeperiod";
export * from "./get-timeperiod";