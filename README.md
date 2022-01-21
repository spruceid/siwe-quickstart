# siwe-quickstart
SIWE Quickstart is an extremely basic Client/Server demo to help developers get their hands on a fully functional and easy to understand demo. 

## Requirements:

NodeJS for npm, has been tested with latest LTS at time of writing (16.13). Other package managers will probably work, but haven't been tested.

To view the complete version of the project just clone and `cd` into the repo, then:

```bash
$ cd 02_siwe_quickstart
$ npm run dev
```

The dependencies will install, then the server will launch on `localhost:8000` and the client will launch on `localhost:8080`, which can visited to play around with the app. The app itself is a SIWE secured scratch pad app where a logged in user can create and edit notes on their personal scratch pad, but cannot view or edit other users. No DBs required!

## How it works

An in depth exploration of the project can be found at [docs.login.xyz](docs.login.xyz), but to give a rough sketch:

### 00_start

This shows the repo just after a pretty normal "initial commit" including 4 files:
`.eslintrc.js` for good looking code.
`.gitignore` to avoid committing `node_modules` and `dist`.
`package.json` containing our numerous devDeps.
`webpack.config.js` containing our build steps.

## 01_basic_app

This contains a basic, unauthenticated scratch pad app. A single text file is written to and read from the server and interacted with by a user at the client.

Adds 3 folders:
`src` which includes `index.html`, `index.js` (together, the client) and `app.js` (the server). Also includes the `scss` directory for the all important paint-job.
`data` which will contain the sole file read and written to, `text.txt`.
`assets` which currently contains just the background image, but will be used for other static images in...

## 02_siwe_quickstart

After adding an `ethers` dependency to the front end and a `siwe` dependency to both the client and server, we're ready to add SIWE authentication. The result is an address-specific scratch-pad authenticated and secured with SIWE, no DB required!