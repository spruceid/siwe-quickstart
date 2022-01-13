import { ethers } from 'ethers'
import { SiweMessage } from 'siwe'

const input = document.getElementById('input')
const saveBtn = document.getElementById('saveBtn')
const loadBtn = document.getElementById('loadBtn')
const appDiv = document.getElementById('app')

const connectWalletBtn = document.getElementById('connectWalletBtn')
const siweBtn = document.getElementById('siweBtn')
const loggedInUser = document.getElementById('loggedInUser')
const ensAvatar = document.getElementById('ensAvatar')

saveBtn.onclick = save
loadBtn.onclick = load
connectWalletBtn.onclick = connectWallet
siweBtn.onclick = signInWithEthereum
ensAvatar.onerror = function () { 
  console.log('user does not have an ensAvatar')
  ensAvatar.style.display = 'none' 
}

const domain = window.location.hostname
const provider = new ethers.providers.Web3Provider(window.ethereum)
const signer = provider.getSigner()

function connectWallet () {
  provider.send('eth_requestAccounts', [])
    .then(() => {
      connectWalletBtn.style.display = 'none'
      siweBtn.style.display = 'block'
    })
    .catch(() => console.log('user rejected request'))
}

async function checkWalletIsConnected () {
  if (await signer.getAddress() !== null) {
    connectWalletBtn.style.display = 'none'
    siweBtn.style.display = 'block'
  }
}

async function signInWithEthereum () {
  const action = 'signIn'

  const message = createSiweMessage(await signer.getAddress(), 'Sign in with Ethereum to the app.')

  const signature = await signer.signMessage(message)

  const headers = new window.Headers()
  headers.append('Accept', 'text/plain')

  const options = {
    body: JSON.stringify({
      action,
      message,
      signature
    }),
    headers: headers,
    method: 'post'
  }

  window.fetch('http://localhost:8888', options).then(async response => {
    if (response.ok) {
      signer.getAddress().then(async address => {
        const ensName = await provider.lookupAddress(address)
        input.value = await response.text()
        siweBtn.style.display = 'none'
        appDiv.style.display = 'block'
        if (ensName === null) {
          loggedInUser.innerHTML = `Logged in as: ${address}`
        } else {
          loggedInUser.innerHTML = `Logged in as: ${ensName}`
          ensAvatar.src = `https://metadata.ens.domains/mainnet/avatar/${ensName}`
        }
      }, () => console.log('failed to get active address'))
    } else {
      console.log('response to SIWE request was not successful')
    }
  })
}

async function load () {
  const action = 'load'

  const message = createSiweMessage(await signer.getAddress(), 'Load your previously saved input.')

  const signature = await signer.signMessage(message)

  const headers = new window.Headers()
  headers.append('Accept', 'text/plain')

  const options = {
    body: JSON.stringify({
      action,
      message,
      signature
    }),
    headers: headers,
    method: 'post'
  }

  window.fetch('http://localhost:8888', options).then(async response => {
    input.value = await response.text()
  })
}

async function save () {
  const action = 'save'

  const message = createSiweMessage(await signer.getAddress(), 'Save your current input.')

  const signature = await signer.signMessage(message)

  const headers = new window.Headers()

  const options = {
    body: JSON.stringify({
      action,
      content: input.value,
      message,
      signature
    }),
    headers: headers,
    method: 'post'
  }

  window.fetch('http://localhost:8888', options)
}

function createSiweMessage (address, statement) {
  return new SiweMessage({
    domain,
    address,
    statement,
    uri: 'http://' + domain,
    version: '1',
    chainId: '1'
  }).signMessage()
}

checkWalletIsConnected()
