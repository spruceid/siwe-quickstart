import cors from 'cors';
import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { generateNonce, SiweMessage, ErrorTypes } from 'siwe';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:8080',
    // exclude TRACE and TRACK methods to avoid XST attacks
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
}));

const authenticate = (req, res, next) => {
    try {
        req.user = jwt.verify(req.cookies.siweSecure, process.env.TOKEN_SECRET);
    } catch(e) {
        console.log(e);
        res.status(403).send();
        return;
    }
    next();
}

app.get('/nonce', async (req, res) => {
    const payload =  { 'nonce': generateNonce() }
    const nonce_jwt = jwt.sign(payload, process.env.TOKEN_SECRET, { expiresIn: '600s' });
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(nonce_jwt);
});

app.post('/verify', async (req, res) => {
    try {
        if (!req.body.message) {
            res.status(422).json({
                message: 'Expected prepareMessage object as body.'
            });
            return;
        }

        const message = new SiweMessage(req.body.message);
        const fields = await message.validate(req.body.signature);
        const decoded = jwt.verify(req.body.nonce_jwt, process.env.TOKEN_SECRET);

        if (fields.nonce !== decoded.nonce) {
            res.status(422).json({
                message: `Invalid nonce.`,
            });
            return;
        }

        const siwe_jwt = jwt.sign(
            {...fields},
            process.env.TOKEN_SECRET,
            { expiresIn: process.env.TOKEN_EXPIRATION_SECONDS });

        res.cookie('siweSecure', siwe_jwt, {
            maxAge: process.env.TOKEN_EXPIRATION_SECONDS * 1000,
            httpOnly: true, // httpOnly true to ensure authenticity of tokens
            secure: false // set this to true in production
        }).status(200).send();

    } catch (e) {
        console.error(e);
        switch (e) {
            case ErrorTypes.EXPIRED_MESSAGE: {
                res.status(440).json({ message: e.message });
                break;
            }
            case ErrorTypes.INVALID_SIGNATURE: {
                res.status(422).json({ message: e.message });
                break;
            }
            default: {
                res.status(500).json({ message: e.message });
                break;
            }
        }
    }
});

app.get('/personal_information', authenticate, (req, res) => {
    console.log("User is authenticated!");
    res.setHeader('Content-Type', 'text/plain');
    res.send(`You are authenticated and your address is: ${req.user.address}`);
});

app.listen(3000);
