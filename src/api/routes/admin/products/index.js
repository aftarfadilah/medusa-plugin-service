import { Router } from "express";
import middlewares from "../../../middleware";

const route = Router()

export default (app) => {
    app.use("/products", route);

    route.get("/", middlewares.wrap(require("./list-product").default));

    return app;
}

export * from "./list-product";