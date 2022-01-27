import { ethers } from 'ethers'
import { SiweMessage } from 'siwe'

const domain = window.location.host
const origin = window.location.origin
const provider = new ethers.providers.Web3Provider(window.ethereum)
const signer = provider.getSigner()

let message = null;
let signature = null;

function createSiweMessage(address, statement) {
    const message = new SiweMessage({
        domain,
        address,
        statement,
        uri: origin,
        version: '1',
        chainId: '1'
    });
    return message.signMessage();
}

function connectWallet() {
    provider.send('eth_requestAccounts', [])
        .catch(() => console.log('user rejected request'))
}

async function signInWithEthereum() {
    message = createSiweMessage(
        await signer.getAddress(),
        'Sign in with Ethereum to the app.'
    )
    signature = await signer.signMessage(message);
    console.log(signature)
}

async function sendForVerification() {
    const res = await fetch("http://localhost:3000/verify", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, signature }),
    });
    console.log(res);
}

const connectWalletBtn = document.getElementById('connectWalletBtn')
const siweBtn = document.getElementById('siweBtn')
const verifyBtn = document.getElementById('verifyBtn')
connectWalletBtn.onclick = connectWallet
siweBtn.onclick = signInWithEthereum
verifyBtn.onclick = sendForVerification
