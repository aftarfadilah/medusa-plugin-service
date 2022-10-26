export default async (req, res) => {
    try {
        const productHandlerService = req.scope.resolve("productHandlerService");
        const getResponse = await productHandlerService.list(req, res);
        return res.json(getResponse);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
}
