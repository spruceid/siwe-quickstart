import { ethers } from 'ethers';
import { SiweMessage } from 'siwe';

const domain = window.location.host;
const origin = window.location.origin;
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

const profileElm = document.getElementById('profile');
const noProfileElm = document.getElementById('noProfile');
const welcomeElm = document.getElementById('welcome');

const ensLoaderElm = document.getElementById('ensLoader');
const ensContainerElm = document.getElementById('ensContainer');
const ensTableElm = document.getElementById('ensTable');

const ensAddr = "https://api.thegraph.com/subgraphs/name/ensdomains/ens";
const tablePrefix = `<tr><th>ENS Text Key</th><th>Value</th></tr>`;

let address;

const BACKEND_ADDR = "http://localhost:3000";
async function createSiweMessage(address, statement) {
    const res = await fetch(`${BACKEND_ADDR}/nonce`, {
        credentials: 'include',
    });
    const message = new SiweMessage({
        domain,
        address,
        statement,
        uri: origin,
        version: '1',
        chainId: '1',
        nonce: await res.text()
    });
    return message.prepareMessage();
}

function connectWallet() {
    provider.send('eth_requestAccounts', [])
        .catch(() => console.log('user rejected request'));
}

async function getENSMetadata(ensName) {
    const body = JSON.stringify({
        query: `{
    domains(where:{ name: "${ensName}" }) {
        name
        resolver {
            texts
        }
    }
}`
    });

    let res = await fetch(ensAddr, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body
    });

    const wrapper = await res.json();
    const {data} = wrapper;
    const {domains} = data;
    let textKeys = [];
    for (let i = 0, x = domains.length; i < x; i++) {
        let domain = domains[i];
        if (domain.name === ensName) {
            textKeys = domain.resolver.texts;
            break;
        }
    }

    const resolver = await provider.getResolver(ensName);

    let nextProfile = `<tr><td>name:</td><td>${ensName}</td></tr>`;
    for (let i = 0, x = textKeys.length; i < x; i++) {
        nextProfile += `<tr><td>${textKeys[i]}:</td><td>${await resolver.getText(textKeys[i])}</td></tr>`
    }

    return tablePrefix + nextProfile
}

async function signInWithEthereum() {
    profileElm.classList = 'hidden';
    noProfileElm.classList = 'hidden';
    welcomeElm.classList = 'hidden';

    address = await signer.getAddress()
    const message = await createSiweMessage(
        address,
        'Sign in with Ethereum to the app.'
    );
    const signature = await signer.signMessage(message);

    const res = await fetch(`${BACKEND_ADDR}/verify`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, signature }),
        credentials: 'include'
    });

    if (!res.ok) {
        console.error(`Failed in getInformation: ${res.statusText}`);
        return 
    }
    console.log(await res.text());

    displayENSProfile();
}

async function getInformation() {
    const res = await fetch(`${BACKEND_ADDR}/personal_information`, {
        credentials: 'include',
    });

    if (!res.ok) {
        console.error(`Failed in getInformation: ${res.statusText}`);
        return 
    }

    let result = await res.text();
    console.log(result);
    address = result.split(" ")[result.split(" ").length - 1];
    displayENSProfile();
}

async function displayENSProfile() {
    const ensName = await provider.lookupAddress(address);

    if (ensName) {
        profileElm.classList = '';

        welcomeElm.innerHTML = `Hello, ${ensName}`;
        let avatar = await provider.getAvatar(ensName);
        if (avatar) {
            welcomeElm.innerHTML += ` <img class="avatar" src=${avatar}/>`;
        }

        ensLoaderElm.innerHTML = 'Loading...';
        ensTableElm.innerHTML = await getENSMetadata(ensName);
        ensLoaderElm.innerHTML = '';
        ensContainerElm.classList = '';
    } else {
        welcomeElm.innerHTML = `Hello, ${address}`;
        noProfileElm.classList = '';
    }

    welcomeElm.classList = '';
}

const connectWalletBtn = document.getElementById('connectWalletBtn');
const siweBtn = document.getElementById('siweBtn');
const infoBtn = document.getElementById('infoBtn');
connectWalletBtn.onclick = connectWallet;
siweBtn.onclick = signInWithEthereum;
infoBtn.onclick = getInformation;