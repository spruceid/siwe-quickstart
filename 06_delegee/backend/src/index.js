import cors from 'cors';
import { providers } from 'ethers';
import express from 'express';
import Session from 'express-session';
import { generateNonce, SiweMessage } from 'siwe';

const app = express();
app.use(express.json());
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

app.get('/nonce', async function (req, res) {
    req.session.nonce = generateNonce();
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(req.session.nonce);
});

app.post('/verify', async function (req, res) {
    if (!req.body.message) {
        res.status(422).json({ message: 'Expected prepareMessage object as body.' });
        return;
    }

    let message = new SiweMessage(req.body.message);
    const result = await message.verify({
        signature: req.body.signature,
        nonce: req.session.nonce,
        domain: 'localhost:8080',
    }, {
        provider: new providers.JsonRpcProvider(
            {
                allowGzip: true,
                url: `https://rinkeby.infura.io/v3/a75b179c937e4d7a936cb4502f5b0a59`,
                headers: {
                    Accept: '*/*',
                    Origin: `http://localhost:3000`,
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Content-Type': 'application/json',
                },
            },
            4,
        ),
        suppressExceptions: true,
        delegationHistory: {
            contractAddress: '0x469788fE6E9E9681C6ebF3bF78e7Fd26Fc015446',
            walletAddress: '0x76337AeAB46d33dc1c80B7459F1612F322CbacDb',
        }
    });

    if (!result.success) {
        res.status(422).json(result.error);
        return;
    }

    req.session.siwe = result.data;
    req.session.cookie.expires = new Date(result.data.expirationTime);
    req.session.save(() => res.status(200).end());
});

app.get('/personal_information', function (req, res) {
    if (!req.session.siwe) {
        res.status(401).json({ message: 'You have to first sign_in' });
        return;
    }
    console.log("User is authenticated!");
    res.setHeader('Content-Type', 'text/plain');
    res.send(`You are authenticated and your address is: ${req.session.siwe.address}`)
});

app.listen(3000);