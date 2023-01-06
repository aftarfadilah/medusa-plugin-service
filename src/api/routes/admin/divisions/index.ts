import { Router } from "express";
import middlewares from "../../../middleware";
import "reflect-metadata"
import { Division } from "../../../../models/division";

const route = Router()

export default (app) => {
    app.use("/divisions", route);

    route.post("/", middlewares.wrap(require("./create-division").default));

    route.get("/", middlewares.wrap(require("./list-division").default));

    route.get("/:id", middlewares.wrap(require("./get-division").default));

    route.delete("/:id", middlewares.wrap(require("./delete-division").default));

    return app;
}

export const defaultAdminDivisionRelations = [
    "location",
    "calendar"
]

export const defaultAdminDivisionFields: (keyof Division)[] = [
    "id",
    "calendar_id",
    "location_id",
    "created_at",
    "updated_at",
]

export * from "./list-division";
export * from "./create-division";
export * from "./delete-division";
export * from "./get-division";