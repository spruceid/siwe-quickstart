import { SiweMessage, generateNonce } from 'siwe';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.get('/nonce', function(_, res) {
    res.setHeader('Content-Type', 'text/plain');
    res.send(generateNonce());
})

app.post('/verify', function(req, res) {
    const { message, signature } = req.body;
    const siweMessage = new SiweMessage(message);
    siweMessage.signature = signature;
    try {
        siweMessage.validate();
        res.send(true);
    } catch {
        res.send(false);
    }
})

app.listen(3000);
