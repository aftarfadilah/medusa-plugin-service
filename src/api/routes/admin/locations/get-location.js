export default async (req, res) => {
    try {
        const locationHandlerService = req.scope.resolve("locationHandlerService");
        const getResponse = await locationHandlerService.get(req, res);
        return res.json(getResponse);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
}
