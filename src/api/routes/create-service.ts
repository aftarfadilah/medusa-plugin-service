import { Request, Response } from "express";
import { IServiceHandler } from '../../interfaces/service-handler';

export default async (req: Request, res: Response): Promise<Response<void | Response<{ message: string }>>> => {
    try {
        const serviceHandlerService : IServiceHandler = req.scope.resolve("serviceHandlerService");
        const getResponse = await serviceHandlerService.create(req, res);
        return res.json(getResponse);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
}
