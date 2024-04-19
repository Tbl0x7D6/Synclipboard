import { Express, Request, Response } from "express";
import { checkSchema, validationResult } from 'express-validator';
import fs from "fs";
import Zip from "adm-zip";
import convert from "heic-convert";
import { LocalStorage } from "node-localstorage";
import { exec } from "child_process";

module.exports = (app: Express) => app.post('/clipboard-push', checkSchema({
    platform: {
        in: ['body'],
        isString: true,
        isIn: {
            options: [['ios', 'wayland']]
        }
    },
    mime: {
        in: ['body'],
        isString: true,
        isIn: {
            options: [['txt', 'png', 'undefined']]
        }
    },
    data: {
        in: ['body'],
        isString: true
    }
}), async (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty()) {
        res.status(400).send('Invalid request');
        console.log('Invalid request');
        return;
    }

    const platform: string = req.body.platform;
    const mime: string = req.body.mime;
    const data: string = req.body.data;

    // parse data for different platforms
    if (platform === 'ios') {
        try {
            // decode and extract data file
            fs.writeFileSync('clipboard.zip', data, 'base64');
            const zip = new Zip('clipboard.zip');
            const entryName = zip.getEntries()[0].entryName;
            const extensionName = entryName.split('.').pop();
            zip.extractAllTo('.', true);

            // parse data for different file mimes
            if (extensionName === 'rtf') {
                new LocalStorage('mime').setItem('mime', 'txt');
                // need catdoc CLI tool installed
                exec(`catdoc -d unicode ${entryName}`, (error, stdout, stderr) => {
                    if (error) {
                        throw new Error('Conversion failed');
                    }
                    fs.writeFileSync('clipboard.txt', stdout.trim(), 'utf8');
                });
            } else if (extensionName === 'txt') {
                new LocalStorage('mime').setItem('mime', 'txt');
            } else if (extensionName === 'png') {
                new LocalStorage('mime').setItem('mime', 'png');
            } else if (extensionName === 'heic') {
                new LocalStorage('mime').setItem('mime', 'png');
                const inputBuffer = fs.readFileSync(entryName);
                const outputBuffer = await convert({
                    buffer: inputBuffer,
                    format: 'PNG'
                });
                fs.writeFileSync('clipboard.png', Buffer.from(outputBuffer));
            } else {
                throw new Error('Unsupported file mime');
            }
        } catch (error) {
            console.log(error);
            res.status(500).send(error);
            return;
        }
    } else if (platform === 'wayland') {
        try {
            if (mime === 'undefined') {
                throw new Error('Unsupported file mime');
            }
            // BUG: need trim operation!
            fs.writeFileSync(`clipboard.${mime}`, data, 'base64');
            new LocalStorage('mime').setItem('mime', mime);
        } catch (error) {
            console.log(error);
            res.status(500).send(error);
            return;
        }
    }
    res.send('Clipboard updated');
});