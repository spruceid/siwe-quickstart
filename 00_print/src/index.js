const siwe = require('siwe');

const scheme = "https";
const domain = "localhost";
const origin = "https://localhost/login";

function createSiweMessage(address, statement) {
    const siweMessage = new siwe.SiweMessage({
        scheme,
        domain,
        address,
        statement,
        uri: origin,
        version: '1',
        chainId: '1'
    });
    return siweMessage.prepareMessage();
}

console.log(createSiweMessage(
    "0x6Ee9894c677EFa1c56392e5E7533DE76004C8D94",
    "This is a test statement."
));