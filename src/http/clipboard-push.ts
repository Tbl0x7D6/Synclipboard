import { Express } from "express";

module.exports = (app: Express) => app.post('/clipboard-push', (req, res) => {
    console.log(req.body);
    res.send('Clipboard push');
});