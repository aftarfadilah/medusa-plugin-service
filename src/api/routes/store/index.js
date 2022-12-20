import cors from "cors"
import { Router } from "express"
import * as bodyParser from "body-parser";
import authenticateCustomer from "@medusajs/medusa/dist/api/middlewares/authenticate-customer"
import customerRoutes from "./customers"
import appointmentRoutes from "./appointments"
import locationRoutes from "./locations"
import { getConfigFile } from "medusa-core-utils";

const route = Router()

export default (app, rootDirectory, config) => {
  app.use("/store", route)

  const { configModule } = getConfigFile(rootDirectory, "medusa-config");
  const { projectConfig } = configModule;

  const corsOptions = {
      origin: projectConfig.store_cors.split(","),
      credentials: true,
  };
  
  route.use(bodyParser.json());
  route.use(cors(corsOptions));
  route.use(authenticateCustomer())

  customerRoutes(route)
  appointmentRoutes(route)
  locationRoutes(route)

  return app
}
