import { Router } from "express";
import middlewares from "../../../middleware";
import requireCustomerAuthentication from "@medusajs/medusa/dist/api/middlewares/require-customer-authentication";

const route = Router();

export default (app) => {
  app.use("/appointments", route);

  route.get(
      "/current",
      middlewares.wrap(require("./get-current").default)
  );

  route.get(
      "/current-detailed",
      middlewares.wrap(require("./get-current-detailed").default)
  );

  // Authenticated endpoints
  route.use(requireCustomerAuthentication());
  route.get("/:id", middlewares.wrap(require("./get-appointment").default));
  route.post("/:id/cancel", middlewares.wrap(require("./cancel-appointment").default));


  return app;
};

export * from "./get-appointment";
