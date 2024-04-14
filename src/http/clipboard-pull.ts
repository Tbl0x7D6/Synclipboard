import { Express } from "express";
import fs from "fs";

module.exports = (app: Express) => app.get('/clipboard-pull', async (req, res) => {
    const clipboard_data = fs.readFileSync('clipboard', 'utf8');
    res.send(clipboard_data);
    console.log('send: ' + clipboard_data);
});