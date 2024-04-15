import { Express } from "express";
import fs from "fs";
import { LocalStorage } from "node-localstorage";

module.exports = (app: Express) => app.get('/clipboard-pull', async (req, res) => {
    try {
        // select the correct file type and send content
        const extensionName = new LocalStorage('type').getItem('type');

        if (extensionName === 'txt') {
            const clipboard_data = fs.readFileSync('clipboard.txt', 'utf8');
            res.send(clipboard_data);
        } else if (extensionName === 'png') {
            res.sendFile('clipboard.png', {root: __dirname + '/..'});
        } else {
            throw new Error('Unsupported file type');
        }
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
        return;
    }
});