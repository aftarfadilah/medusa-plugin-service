import { Request, Response } from 'express';
import { IProductHandler } from '../../interfaces/product-handler';

export default async (req: Request, res: Response): Promise<Response<void | Response<{ message: string }>>> => {
    try {
        const productHandlerService : IProductHandler = req.scope.resolve("productHandlerService");
        const getResponse = await productHandlerService.list(req, res);
        return res.json(getResponse);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
}
