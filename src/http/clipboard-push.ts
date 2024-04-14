import { Express, Request, Response, NextFunction } from "express";
import { checkSchema, validationResult } from 'express-validator';
import fs from "fs";
import Zip from "adm-zip";
import convert from "heic-convert";
import { LocalStorage } from "node-localstorage";
import { exec } from "child_process";

module.exports = (app: Express) => app.post('/clipboard-push', checkSchema({
    platform: {
        in: ['body'],
        isString: true
    },
    data: {
        in: ['body'],
        isString: true
    }
}), async (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty()) {
        res.status(400).send('Invalid request');
        return;
    }

    const {platform, data} = req.body;

    // parse data for different platforms
    if (platform === 'ios') {
        // decode and extract data file
        fs.writeFileSync('clipboard.zip', data, 'base64');
        const zip = new Zip('clipboard.zip');
        const entryName = zip.getEntries()[0].entryName;
        const extensionName = entryName.split('.').pop();
        zip.extractAllTo('.', true);

        // parse data for different file types
        if (extensionName === 'rtf') {
            new LocalStorage('type').setItem('type', 'txt');
            // need catdoc CLI tool installed
            exec(`catdoc -d unicode ${entryName}`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    return;
                }
                fs.writeFileSync('clipboard.txt', stdout);
            });
        } else if (extensionName === 'txt') {
            new LocalStorage('type').setItem('type', 'txt');
        } else if (extensionName === 'png') {
            new LocalStorage('type').setItem('type', 'png');
        } else if (extensionName === 'heic') {
            const inputBuffer = fs.readFileSync(entryName);
            const outputBuffer = await convert({
                buffer: inputBuffer,
                format: 'PNG'
            });
            fs.writeFileSync('clipboard.png', Buffer.from(outputBuffer));
        }
    }
    res.send('Clipboard updated!');
});