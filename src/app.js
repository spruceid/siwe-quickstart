const http = require('http')
const fs = require('fs')
const siwe = require('siwe')

const messageStore = {}
const statements = {
  'load': 'Load your previously saved input.',
  'save': 'Save your current input.',
  'signIn': 'Sign-in with Ethereum.'
}

// make sure the data directory exists
try {
  const stat = fs.statSync('data')
  if (!stat.isDirectory()) {
    console.error("'data' is not a directory")
    process.exit(1)
  }
} catch (err) {
  console.error("directory 'data' does not exist")
  process.exit(1)
}

const defaultText = 'Greetings!'
const port = 8888

function load (response, payload) {
  parseAndValidateSiweMessage(payload.message, payload.signature)
    .then(message => qualify(message.address))
    .then(fileName => readFile(fileName))
    .then((content) => {
      response
        .writeHead(200, {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'text/plain'
        })
        .end(content)
    })
    .catch((err) => {
      console.error(err)
      internalServerError(response)
    })
}

function save (response, payload) {
  const content = payload.content || ''
  parseAndValidateSiweMessage(payload.message, payload.signature)
    .then(message => qualify(message.address))
    .then(fileName => writeFile(fileName, content))
    .then(() => {
      response
        .writeHead(200, {
          'Access-Control-Allow-Origin': '*'
        })
        .end()
    })
    .catch((err) => {
      console.error(err)
      internalServerError(response)
    })
}

async function signIn (response, payload) {
  try {
    const message = await parseAndValidateSiweMessage(payload.message, payload.signature)
    const fileName = qualify(message.address)
    await fs.promises.access(fileName)
      .then(
        () => readFile(fileName),
        () => createDefaultFile(fileName).then(() => defaultText)
      )
      .then((content) => {
        response
          .writeHead(200, {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*'
          })
          .end(content)
      })
  } catch (err) {
    console.error(err)
    internalServerError(response)
  }
}

function parseAndValidateSiweMessage (messageText, signature) {
  const message = new siwe.SiweMessage(messageText)
  if (messageText !== messageStore[message.nonce]) {
    return Promise.reject('received message did not match stored message')
  }
  message.signature = signature
  return message.validate()
}

function createSiweMessage (address, statement) {
  const message = new siwe.SiweMessage({
    domain: "localhost",
    address,
    statement,
    uri: 'http://localhost',
    version: '1',
    chainId: '1'
  })
  const messageText = message.signMessage()
  const nonce = message.nonce
  messageStore[nonce] = messageText
  return messageText
}

function qualify (fileName) {
  return 'data/' + fileName
}

function readFile (fileName) {
  return fs.promises.readFile(fileName, { encoding: 'utf8' })
}

function writeFile (fileName, content) {
  return fs.promises.writeFile(fileName, content, { encoding: 'utf8' })
}

function createDefaultFile (fileName) {
  return fs.promises.writeFile(fileName, defaultText, { encoding: 'utf8' })
}

function internalServerError (response) {
  response
    .writeHead(500, {
      'Access-Control-Allow-Origin': '*'
    })
    .end()
}

http.createServer((request, response) => {
  // only accept post requests from the frontend
  if (request.method !== 'POST') {
    console.log(`received ${request.method}`)
    response.writeHead(404).end()
  } else {
    // receive the data into `body`
    let body = ''
    request.on('data', chunk => { body += chunk })

    // once all the data is received we can parse the request
    request.on('end', () => {
      const payload = JSON.parse(body)

      if (payload.requestMessage === true) {
        const statement = statements[payload.action]
        if (statement) {
          const message = createSiweMessage(payload.address, statement)
          response
            .writeHead(200, {
              'Content-Type': 'text/plain',
              'Access-Control-Allow-Origin': '*'
            })
            .end(message)
        } else {
          response
            .writeHead(400, {
              'Access-Control-Allow-Origin': '*'
            })
            .end()
        }
        return
      }

      // if the action is load, read the data currently in the
      // local file and send it to the frontend
      if (payload.action === 'load') {
        load(response, payload)

      // if the action is save, store the content in the local file
      } else if (payload.action === 'save') {
        save(response, payload)

      // if the action is signIn, create the default file if the user
      // does not already have a file, and then send the content of
      // the file to the frontend
      } else if (payload.action === 'signIn') {
        signIn(response, payload)

      // reject any other actions
      } else {
        response
          .writeHead(400, {
            'Access-Control-Allow-Origin': '*'
          })
          .end()
      }
    })
  }
})
  .listen(port, () => {
    console.log(`server running at ${port}`)
  })
