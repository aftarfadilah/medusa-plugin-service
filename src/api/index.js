import { Router } from "express";
import admin from "./routes/admin";

export default (rootDirectory, options) => {
    const app = Router();

    admin(app, rootDirectory, options);

    return app;
};