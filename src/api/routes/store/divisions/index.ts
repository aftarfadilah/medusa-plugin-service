import { Router } from "express";
import middlewares from "../../../middleware";
import "reflect-metadata"
import { Division } from "../../../../models/division";

const route = Router()

export default (app) => {
    app.use("/divisions", route);

    route.get("/", middlewares.wrap(require("./list-division").default));

    route.get("/:id", middlewares.wrap(require("./get-division").default));

    return app;
}

export const defaultStoreDivisionRelations = [
    "location",
    "calendar"
]

export const defaultStoreDivisionFields: (keyof Division)[] = [
    "id",
    "calendar_id",
    "location_id",
    "created_at",
    "updated_at",
]

export * from "./list-division"
export * from "./get-division";