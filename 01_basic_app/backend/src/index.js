import { SiweMessage, generateNonce } from 'siwe';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';

const app = express();
app.use(bodyParser.json());
app.use(cors())

app.post('/verify', function(req, res) {
    const { message, signature } = req.body;
    const siweMessage = new SiweMessage(message);
    siweMessage.signature = signature;
    res.send(siweMessage.validate());
})

app.get('/nonce', function(_, res) {
    res.send(generateNonce());
})

app.listen(3000);
