import { Router } from "express"
import middlewares from "../../../middleware"
import requireCustomerAuthentication from "@medusajs/medusa/dist/api/middlewares/require-customer-authentication"

const route = Router()

export default (app) => {
  app.use("/appointments", route)

  // Authenticated endpoints
  route.use(requireCustomerAuthentication())
  route.get("/:id", middlewares.wrap(require("./get-appointment").default))

  return app
}

export * from "./get-appointment"