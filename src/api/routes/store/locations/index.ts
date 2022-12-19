import { Router } from "express"
import middlewares from "@medusajs/medusa/dist/api/middlewares"
import requireCustomerAuthentication from "@medusajs/medusa/dist/api/middlewares/require-customer-authentication"

const route = Router()

export default (app) => {
  app.use("/locations", route)

  // Authenticated endpoints
  route.use(requireCustomerAuthentication())
  
  route.get("/get-slot-time/:id", middlewares.wrap(require("./get-slot-time-location").default))

  return app
}

export * from "./get-slot-time-location"