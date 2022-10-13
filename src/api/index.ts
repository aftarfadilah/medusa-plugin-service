import express, { Request, Response, Router } from "express";
import { IServiceHandler } from "interfaces/service-handler";

export default (rootDirectory, pluginOptions): Router => {
    const router = Router()
    router.use(express.json())

    router.post("/service", async (req: Request, res: Response) : Promise<Response<void>> => {
        const serviceHandlerService : IServiceHandler = req.scope.resolve("serviceHandlerService");
        const getResponse = await serviceHandlerService.create(req, res);
        res.json(getResponse);
    })

    router.get("/service", async (req: Request, res: Response) : Promise<Response<void>> => {
        const serviceHandlerService : IServiceHandler = req.scope.resolve("serviceHandlerService");
        const getResponse = await serviceHandlerService.list(req, res);
        res.json(getResponse);
    })

    router.get("/service/:id", async (req: Request, res: Response) : Promise<Response<void>> => {
        const serviceHandlerService : IServiceHandler = req.scope.resolve("serviceHandlerService");
        const getResponse = await serviceHandlerService.get(req, res);
        res.json(getResponse);
    })

    router.put("/service", async (req: Request, res: Response) : Promise<Response<void>> => {
        const serviceHandlerService : IServiceHandler = req.scope.resolve("serviceHandlerService");
        const getResponse = await serviceHandlerService.update(req, res);
        res.json(getResponse);
    })

    router.delete("/service/:id", async (req: Request, res: Response) : Promise<Response<void>> => {
        const serviceHandlerService : IServiceHandler = req.scope.resolve("serviceHandlerService");
        const getResponse = await serviceHandlerService.delete(req, res);
        res.json(getResponse);
    })

    return router
}