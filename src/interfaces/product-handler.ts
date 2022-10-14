import { Request, Response } from "express";
export type IProductHandler = {
    list: Function
}

export type IProductHandlerFunction = {
    req: Request
    res: Response
}