import { BrowserProvider } from 'ethers';
import { SiweMessage } from 'siwe';

const scheme = window.location.protocol.slice(0, -1);
const domain = window.location.host;
const origin = window.location.origin;
const provider = new BrowserProvider(window.ethereum);

function createSiweMessage (address, statement) {
  const message = new SiweMessage({
    scheme,
    domain,
    address,
    statement,
    uri: origin,
    version: '1',
    chainId: '1'
  });
  return message.prepareMessage();
}

function connectWallet () {
  provider.send('eth_requestAccounts', [])
    .catch(() => console.log('user rejected request'));
}

async function signInWithEthereum () {
  const signer = await provider.getSigner();
  const message = createSiweMessage(
      signer.address, 
      'Sign in with Ethereum to the app.'
    );
  console.log(await signer.signMessage(message));
}

// Buttons from the HTML page
const connectWalletBtn = document.getElementById('connectWalletBtn');
const siweBtn = document.getElementById('siweBtn');
connectWalletBtn.onclick = connectWallet;
siweBtn.onclick = signInWithEthereum;
