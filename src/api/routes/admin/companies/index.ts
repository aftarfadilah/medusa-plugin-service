import { Router } from "express";
import { Company } from "../../../../models/company";
import middlewares from "../../../middleware";
import "reflect-metadata"

const route = Router()

export default (app) => {
    app.use("/companies", route);

    route.post("/", middlewares.wrap(require("./create-company").default));

    route.get("/", middlewares.wrap(require("./list-company").default));

    route.get("/:id", middlewares.wrap(require("./get-company").default));

    route.put("/:id", middlewares.wrap(require("./update-company").default));

    route.delete("/:id", middlewares.wrap(require("./delete-company").default));

    return app;
}

export const defaultAdminCompanyRelations = [
    "locations",
    "calendars"
]

export const defaultAdminCompanyFields: (keyof Company)[] = [
    "id",
    "name",
    "work_day_from",
    "work_day_to",
    "created_at",
    "updated_at",
    "deleted_at",
]

export * from "./list-company";
export * from "./create-company";
export * from "./update-company";
export * from "./delete-company";
export * from "./get-company";