import { Router } from "express";
import admin from "./routes/admin";
import store from "./routes/store"
import errorHandler from "./middleware/error-handler"

export default (rootDirectory, options) => {
    const app = Router();

    admin(app, rootDirectory, options);
    store(app, rootDirectory, options);

    app.use(errorHandler())

    return app;
};