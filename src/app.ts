import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

require('./http/clipboard-push')(app);

app.listen(3000, '0.0.0.0', () => {
    console.log('Server is running on port 3000');
});