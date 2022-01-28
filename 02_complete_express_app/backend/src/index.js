import { SiweMessage, generateNonce } from 'siwe';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import Session from 'express-session';

const app = express();
app.use(bodyParser.json());
app.use(cors({
    origin: 'http://localhost:8080',
    credentials: true,
}))
app.use(Session({
    name: 'siwe-quickstart',
    secret: "siwe-quickstart-secret",
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false, sameSite: true }
}));

app.get('/nonce', async function(req, res) {
    req.session.nonce = generateNonce();
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(req.session.nonce);
});

app.get('/personal_information', function(req, res) {
    if (!req.session.siwe) {
        res.status(401).json({ message: 'You have to first sign_in' });
        return;
    }

    console.log("User is authenticated!");
    res.send(`You are authenticated and your address is: ${req.session.siwe.address}`)
});

app.post('/sign_in', async function(req, res) {
    try {
        if (!req.body.message) {
            res.status(422).json({ message: 'Expected signMessage object as body.' });
            return;
        }

        let message = new SiweMessage(req.body.message);
        message.signature = req.body.signature;
        const fields = await message.validate();
        if (fields.nonce !== req.session.nonce) {
            console.log(req.session);
            res.status(422).json({
                message: `Invalid nonce.`,
            });
            return;
        }
        req.session.siwe = fields;
        req.session.cookie.expires = new Date(fields.expirationTime);
        req.session.save(() =>
            res
                .status(200)
                .json({
                    text: getText(req.session.siwe.address),
                    address: req.session.siwe.address,
                    ens: req.session.ens,
                })
                .end(),
        );
    } catch (e) {
        req.session.siwe = null;
        req.session.nonce = null;
        req.session.ens = null;
        console.error(e);
        switch (e) {
            case ErrorTypes.EXPIRED_MESSAGE: {
                req.session.save(() => res.status(440).json({ message: e.message }));
                break;
            }
            case ErrorTypes.INVALID_SIGNATURE: {
                req.session.save(() => res.status(422).json({ message: e.message }));
                break;
            }
            default: {
                req.session.save(() => res.status(500).json({ message: e.message }));
                break;
            }
        }
    }
});

app.listen(3000);
