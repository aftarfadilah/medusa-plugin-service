import { Router } from "express";
import { Location } from "../../../../models/location";
import middlewares from "../../../middleware";
import "reflect-metadata"

const route = Router()

export default (app) => {
    app.use("/locations", route);

    route.post("/", middlewares.wrap(require("./create-location").default));

    route.get("/", middlewares.wrap(require("./list-location").default));

    route.get("/:id", middlewares.wrap(require("./get-location").default));

    route.put("/:id", middlewares.wrap(require("./update-location").default));

    route.delete("/:id", middlewares.wrap(require("./delete-location").default));

    return app;
}

export const defaultAdminLocationRelations = [
    "country",
    "company",
    "calendars"
]

export const defaultAdminLocationFields: (keyof Location)[] = [
    "id",
    "title",
    "company_id",
    "address_1",
    "address_2",
    "city",
    "code",
    "country_code",
    "first_name",
    "last_name",
    "phone",
    "postal_code",
    "province",
    "created_at",
    "updated_at",
    "deleted_at",
    "metadata",
]

export * from "./list-location";
export * from "./create-location";
export * from "./update-location";
export * from "./delete-location";
export * from "./get-location";