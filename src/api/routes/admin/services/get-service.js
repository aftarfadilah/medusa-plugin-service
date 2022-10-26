export default async (req, res) => {
    try {
        const serviceHandlerService = req.scope.resolve("serviceHandlerService");
        const getResponse = await serviceHandlerService.get(req, res);
        return res.json(getResponse);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
}
