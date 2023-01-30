import { Router } from "express";
import admin from "./routes/admin";
import store from "./routes/store"
import v2 from "./routes/v2";
import errorHandler from "./middleware/error-handler"

export default (rootDirectory, options) => {
    const app = Router();

    admin(app, rootDirectory, options);
    store(app, rootDirectory, options);
    v2(app, rootDirectory, options);

    app.use(errorHandler())

    return app;
};