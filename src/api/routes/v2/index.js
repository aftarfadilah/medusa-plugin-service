import { Router } from "express";
import store from "./store"

const route = Router();

export default (app, rootDirectory, options) => {
    app.use("/v2", route)

    store(route, rootDirectory, options);

    return app;
};