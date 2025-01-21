import { BrowserProvider } from 'ethers';
import { SiweMessage } from 'siwe';

const scheme = window.location.protocol.slice(0, -1);
const domain = window.location.host;
const origin = window.location.origin;
const provider = new BrowserProvider(window.ethereum);

const profileElm = document.getElementById('profile');
const noProfileElm = document.getElementById('noProfile');
const welcomeElm = document.getElementById('welcome');

const ensLoaderElm = document.getElementById('ensLoader');
const ensContainerElm = document.getElementById('ensContainer');
const ensTableElm = document.getElementById('ensTable');

const nftElm = document.getElementById('nft');
const nftLoaderElm = document.getElementById('nftLoader');
const nftContainerElm = document.getElementById('nftContainer');
const nftTableElm = document.getElementById('nftTable');

let address;
let chain;

const BACKEND_ADDR = "http://localhost:3000";
async function createSiweMessage(address, statement) {
    chain = (await provider.getNetwork()).name
    const res = await fetch(`${BACKEND_ADDR}/nonce`, {
        credentials: 'include',
    });
    const message = new SiweMessage({
        scheme,
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
        ensTableElm.innerHTML.concat(`<tr><th>ENS Text Key</th><th>Value</th></tr>`);
        const resolver = await provider.getResolver(ensName);

        const keys = ["email", "url", "description", "com.twitter"];
        ensTableElm.innerHTML += `<tr><td>name:</td><td>${ensName}</td></tr>`;
        for (const key of keys)
            ensTableElm.innerHTML += `<tr><td>${key}:</td><td>${await resolver.getText(key)}</td></tr>`;
        ensLoaderElm.innerHTML = '';
        ensContainerElm.classList = '';
    } else {
        welcomeElm.innerHTML = `Hello, ${address}`;
        noProfileElm.classList = '';
    }

    welcomeElm.classList = '';
}

async function getNFTs() {
    try {
        let res = await fetch(`https://testnets-api.opensea.io/api/v2/chain/${chain}/account/${address}/nfts`);
        if (!res.ok) {
            throw new Error(res.statusText)
        }

        let body = await res.json();

        if (!body.nfts || !Array.isArray(body.nfts) || body.nfts.length === 0) {
            return []
        }

        return body.nfts.map((asset) => {
            let {name, contract, collection} = asset;
            let address = contract;
            return {name, address, collection};
        });
    } catch (err) {
        console.error(`Failed to resolve nfts: ${err.message}`);
        return [];
    }
}

async function displayNFTs() {
    nftLoaderElm.innerHTML = 'Loading NFT Ownership...';
    nftElm.classList = '';

    let nfts = await getNFTs();
    if (nfts.length === 0) {
        nftLoaderElm.innerHTML = 'No NFTs found';
        return;
    }

    let tableHtml = "<tr><th>Name</th><th>Address</th><th>Token ID</th></tr>";
    nfts.forEach((nft) => {
        tableHtml += `<tr><td>${nft.name}</td><td>${nft.address}</td><td>${nft.collection}</td></tr>`
    });

    nftTableElm.innerHTML = tableHtml;
    nftContainerElm.classList = '';
    nftLoaderElm.innerHTML = '';
}

async function signInWithEthereum() {
    const signer = await provider.getSigner();
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
    displayNFTs();
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
    displayNFTs();
}

const connectWalletBtn = document.getElementById('connectWalletBtn');
const siweBtn = document.getElementById('siweBtn');
const infoBtn = document.getElementById('infoBtn');
connectWalletBtn.onclick = connectWallet;
siweBtn.onclick = signInWithEthereum;
infoBtn.onclick = getInformation;
