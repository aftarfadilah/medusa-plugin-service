import { Request, Response } from "express";
export type IServiceHandler = {
    update: Function
    delete: Function
    create: Function
    list: Function
    get: Function
}

export type IServiceHandlerFunction = {
    req: Request
    res: Response
}