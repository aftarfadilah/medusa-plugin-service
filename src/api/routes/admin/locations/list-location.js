export default async (req, res) => {
    try {
        const locationHandlerService = req.scope.resolve("locationHandlerService");
        const getResponse = await locationHandlerService.list(req, res);
        return res.json(getResponse);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
}
