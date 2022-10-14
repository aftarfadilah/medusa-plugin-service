import express, { Request, Response, Router } from "express";
import { IServiceHandler } from "interfaces/service-handler";
import { IProductHandler } from "interfaces/product-handler";

export default (rootDirectory, pluginOptions): Router => {
    const router = Router()
    router.use(express.json())

    router.get("/admin/service/products", async (req: Request, res: Response) : Promise<Response<void>> => {
        const productHandlerService : IProductHandler = req.scope.resolve("productHandlerService");
        const getResponse = await productHandlerService.list(req, res);
        res.json(getResponse);
    })

    router.post("/admin/service", async (req: Request, res: Response) : Promise<Response<void>> => {
        const serviceHandlerService : IServiceHandler = req.scope.resolve("serviceHandlerService");
        const getResponse = await serviceHandlerService.create(req, res);
        res.json(getResponse);
    })

    router.get("/admin/service", async (req: Request, res: Response) : Promise<Response<void>> => {
        const serviceHandlerService : IServiceHandler = req.scope.resolve("serviceHandlerService");
        const getResponse = await serviceHandlerService.list(req, res);
        res.json(getResponse);
    })

    router.get("/admin/service/:id", async (req: Request, res: Response) : Promise<Response<void>> => {
        const serviceHandlerService : IServiceHandler = req.scope.resolve("serviceHandlerService");
        const getResponse = await serviceHandlerService.get(req, res);
        res.json(getResponse);
    })

    router.put("/admin/service", async (req: Request, res: Response) : Promise<Response<void>> => {
        const serviceHandlerService : IServiceHandler = req.scope.resolve("serviceHandlerService");
        const getResponse = await serviceHandlerService.update(req, res);
        res.json(getResponse);
    })

    router.delete("/admin/service/:id", async (req: Request, res: Response) : Promise<Response<void>> => {
        const serviceHandlerService : IServiceHandler = req.scope.resolve("serviceHandlerService");
        const getResponse = await serviceHandlerService.delete(req, res);
        res.json(getResponse);
    })

    return router
}