import { Express, Request, Response } from "express";
import { checkSchema, validationResult } from "express-validator";
import fs from "fs";
import { LocalStorage } from "node-localstorage";

module.exports = (app: Express) => app.post('/clipboard-pull', checkSchema({
    platform: {
        in: ['body'],
        isString: true,
        isIn: {
            options: [['ios', 'wayland']]
        }
    }
}),
async (req: Request, res: Response) => {
    if (!validationResult(req).isEmpty()) {
        res.status(400).send('Invalid request');
        console.log('Invalid request');
        return;
    }

    const platform: string = req.body.platform;
    const extensionName = new LocalStorage('mime').getItem('mime');

    if (platform === 'ios') {
        try {
            // select the correct file mime and send content
            if (extensionName === 'txt' || extensionName === 'png') {
                const clipboard_data = fs.readFileSync(`clipboard.${extensionName}`, 'base64');
                res.json({data: clipboard_data});
            } else {
                throw new Error('Unsupported file mime');
            }
        } catch (error) {
            console.log(error);
            res.status(500).send(error);
            return;
        }
    }
});