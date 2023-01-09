import { Router } from "express";
import { DefaultWorkingHour } from "../../../../models/default-working-hour";
import middlewares from "../../../middleware";
import "reflect-metadata"

const route = Router()

export default (app) => {
    app.use("/default-working-hour", route);

    route.get("/:id", middlewares.wrap(require("./get-dwh").default));

    route.put("/:id", middlewares.wrap(require("./update-dwh").default));

    return app;
}

export const defaultAdminDefaultWorkingHourRelations = []

export const defaultAdminDefaultWorkingHourFields: (keyof DefaultWorkingHour)[] = [
    "id",
    "location_id",
    "day",
    "from",
    "to",
    "is_working_day",
    "created_at",
    "updated_at",
    "deleted_at",
]

export * from "./update-dwh";
export * from "./get-dwh";