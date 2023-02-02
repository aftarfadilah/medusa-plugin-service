import { Router } from "express"
import middlewares from "@medusajs/medusa/dist/api/middlewares"
import requireCustomerAuthentication from "@medusajs/medusa/dist/api/middlewares/require-customer-authentication"
import { Location } from "models/location"

const route = Router()

export default (app) => {
  app.use("/locations", route)

  // Authenticated endpoints
  route.use(requireCustomerAuthentication())
  
  route.get("/", middlewares.wrap(require("./list-location").default))

  route.get("/:id", middlewares.wrap(require("./get-location").default))

  route.get("/:id/get-slot-time", middlewares.wrap(require("./get-slot-time-location").default))

  route.get("/v2/:id/get-slot-time", middlewares.wrap(require("./get-slot-time-location-v2").default))

  return app
}

export const defaultStoreLocationRelations = [
  "country",
  "company",
  "calendars"
]

export const defaultStoreLocationFields: (keyof Location)[] = [
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
  "latitude",
  "longitude",
  "created_at",
  "updated_at",
  "deleted_at",
  "metadata",
]

export * from "./get-slot-time-location"
export * from "./list-location"
export * from "./get-location"