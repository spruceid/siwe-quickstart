const http = require('http')
const fs = require('fs')

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
  const fileName = qualify('file.txt')
  readFile(fileName)
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
  const fileName = qualify('file.txt')
  writeFile(fileName, content)
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

      // if the action is load, read the data currently in the
      // local file and send it to the frontend
      if (payload.action === 'load') {
        load(response, payload)

      // if the action is save, store the content in the local file
      } else if (payload.action === 'save') {
        save(response, payload)

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
