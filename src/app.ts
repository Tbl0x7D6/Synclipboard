import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

const port = Number(process.env.PORT);
const hostname = process.env.HOSTNAME as string;
const maxFileSize = Number(process.env.MAX_FILE_SIZE);

const app = express();
app.use(cors());
app.use(bodyParser.json({limit: maxFileSize}));

require('./http/clipboard-push')(app);
require('./http/clipboard-pull')(app);

app.listen(port, hostname, () => {
    console.log('Server is running on port 3000');
});