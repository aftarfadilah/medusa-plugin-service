import {Router} from "express"

export default (rootDirectory, pluginOptions) => {
    const router = Router()

    router.post("/service", (req, res) => {
        const myService = req.scope.resolve("serviceService")

        res.json({
            message: "Welcome to My Store!",
        })
    })

    router.get("/service", (req, res) => {
        res.json({
            message: "Welcome to My Store!",
        })
    })

    router.get("/service/:id", (req, res) => {
        res.json({
            message: "Welcome to My Store!",
        })
    })

    router.put("/service", (req, res) => {
        res.json({
            message: "Welcome to My Store!",
        })
    })

    router.delete("/service/:id", (req, res) => {
        res.json({
            message: "Welcome to My Store!",
        })
    })

    return router
}