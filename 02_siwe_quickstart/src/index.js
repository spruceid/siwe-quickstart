import { ethers } from 'ethers';
import './scss/style.scss';

// Get access to all needed DOM elements.
const input = document.getElementById('input');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const appDiv = document.getElementById('app');

const connectWalletBtn = document.getElementById('connectWalletBtn');
const siweBtn = document.getElementById('siweBtn');
const loggedInUser = document.getElementById('loggedInUser');
const ensAvatar = document.getElementById('ensAvatar');

const loggedWrap = document.querySelector('.logged-wrap');
const loggedWrapImg = document.querySelector('.logged-wrap__img');
const changedText = document.querySelector('.changed-text');

const disconnectBtn = document.querySelector('.disconnect-btn');

// Add some events
ensAvatar.onerror = () => {
  console.log('user does not have an ensAvatar');
  ensAvatar.style.display = 'none';
};

document.querySelector('.disconnect').addEventListener('click', () => {
  disconnectBtn.classList.toggle('show');
});

// Get global ETH objects
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

// Use the user's ethereum address to get a pre-baked SIWE message from the server.
async function getSiweMessage(action, address) {
  const headers = new window.Headers();
  headers.append('Accept', 'text/plain');

  const options = {
    body: JSON.stringify({
      action: 'newMessage',
      address,
      // NOTE: the action here is for the generated message
      // not the action being sent to the server
      statement: action,
    }),
    headers,
    method: 'post',
  };

  const response = await window.fetch('http://localhost:8888', options);

  if (response.ok) {
    const text = await response.text();
    return text;
  }

  throw new Error(`Failed to get message from server: ${response.statusText}`);
}

// Await the user connecting the wallet, then update the UI.
async function connectWallet() {
  try {
    await provider.send('eth_requestAccounts', []);
    connectWalletBtn.style.display = 'none';
    siweBtn.style.display = 'block';
  } catch (_) {
    console.error('user rejected request');
  }
}

// Check for existing user wallet
async function checkWalletIsConnected() {
  if (await signer.getAddress() !== null) {
    connectWalletBtn.style.display = 'none';
    siweBtn.style.display = 'block';
  }
}

// Keep it simple.
function signOut() {
  window.location.reload();
}

// Complete SIWE flow with server, update the UI on log in.
async function signInWithEthereum() {
  // Get the user's wallet's network
  const network = await signer.provider.getNetwork();

  // Reject unexpected chainIds.
  if (network.chainId !== 1) {
    document.querySelector('.alert').style.display = 'flex';
    return;
  }

  const action = 'signIn';

  // Get SIWE Message from the server
  const message = await getSiweMessage(action, await signer.getAddress());

  // Await the user to sign the message
  const signature = await signer.signMessage(message);

  // Post the message as proof of wallet ownership to the server
  const headers = new window.Headers();
  headers.append('Accept', 'text/plain');

  const options = {
    body: JSON.stringify({
      action,
      message,
      signature,
    }),
    headers,
    method: 'post',
  };

  const response = await window.fetch('http://localhost:8888', options);
  if (response.ok) {
    // Update the UI with the users address and show the form
    try {
      const address = await signer.getAddress();
      input.value = await response.text();
      siweBtn.style.display = 'none';
      appDiv.style.display = 'flex';
      loggedWrap.style.display = 'flex';
      changedText.innerHTML = 'Try typing in and saving some text!';

      const ensName = await provider.lookupAddress(address);
      if (ensName === null) {
        const copyBtn = document.createElement('span');

        copyBtn.onclick = () => {
          navigator.clipboard.writeText(address);
        };

        copyBtn.innerHTML = '';
        copyBtn.classList.add('logged-in__img');

        loggedInUser.appendChild(copyBtn);

        const addressElement = document.createElement('span');
        addressElement.innerHTML = `${address.slice(0, 5)} ... ${address.slice(-4)}`;
        addressElement.classList.add('logged-in__adress');

        loggedInUser.appendChild(addressElement);

        loggedWrapImg.style.display = 'none';
      } else {
        loggedInUser.innerHTML = `${ensName}`;
        const uri = await provider.getAvatar(ensName);
        ensAvatar.src = uri;
      }
    } catch (err) {
      console.error(`failed to get current address ${err}`);
    }
  } else {
    console.error(`response to SIWE request was not successful: ${response.statusText}`);
  }
}

async function load() {
  const action = 'load';

  const message = await getSiweMessage(action, await signer.getAddress());

  const signature = await signer.signMessage(message);

  const headers = new window.Headers();
  headers.append('Accept', 'text/plain');

  const options = {
    body: JSON.stringify({
      action,
      message,
      signature,
    }),
    headers,
    method: 'post',
  };

  const response = await window.fetch('http://localhost:8888', options);
  if (response.ok) {
    input.value = await response.text();
    return;
  }

  throw new Error(`bad response from server in load: ${response.statusText}`);
}

async function save() {
  const action = 'save';

  const message = await getSiweMessage(action, await signer.getAddress());

  const signature = await signer.signMessage(message);

  const headers = new window.Headers();

  const options = {
    body: JSON.stringify({
      action,
      content: input.value,
      message,
      signature,
    }),
    headers,
    method: 'post',
  };

  window.fetch('http://localhost:8888', options);
}

saveBtn.onclick = save;
loadBtn.onclick = load;
connectWalletBtn.onclick = connectWallet;
siweBtn.onclick = signInWithEthereum;
disconnectBtn.onclick = signOut;

checkWalletIsConnected();
