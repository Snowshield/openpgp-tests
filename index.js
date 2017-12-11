
const openpgp = require('openpgp');

console.log(1);

const aliceAndBob = ['alice', 'bob'];
const companionNameByName = (name) => {
  const index = aliceAndBob.indexOf(name);
  if (index === -1) {
    throw new Error("Bad name");
  }
  const companionIndex = Math.abs(index - 1);
  return aliceAndBob[companionIndex];
}

// const options = {
//     userIds: [{ id:'1' }], // multiple user IDs
//     // numBits: 4096, // RSA key size
//     numBits: 2048, // ~ 9 seconds
//     passphrase: 'passphrase one' // protects the private key
// };
const options = {
  alice: {
    userIds: [{ id: '1' }], // multiple user IDs
    // numBits: 4096, // RSA key size
    // numBits: 1024, // ~ 1 second
    numBits: 2048, // ~ 9 seconds
    passphrase: 'passphrase one' // protects the private key
  },
  bob: {
    userIds: [{ id: '2' }], // multiple user IDs
    // numBits: 4096, // RSA key size
    // numBits: 1024, // ~ 1 second
    numBits: 2048, // ~ 9 seconds
    passphrase: 'passphrase two' // protects the private key
  }
};

const keys = {
  alice: {
    private: null,
    public: null,
  },
  bob: {
    private: null,
    public: null,
  },
}

console.log(2);

const generateKeysForAliceAndBob = () => Promise.all(
  aliceAndBob
  .map((name) => {
    return openpgp.generateKey(options[name])
    .then((key) => {
      keys[name].private = key.privateKeyArmored;
      keys[name].public = key.publicKeyArmored;
    });
  })
);

console.log(3);

const textForCrypto = "Hello world";

const messages = {
  alice: "",
  bob: "",
};

const encryptMessages = () => Promise.all(
  aliceAndBob.map((name) => {
    const companionName = companionNameByName(name);

    const pubkey = keys[companionName].public;
    const privkey = keys[name].private; //encrypted private key
    const passphrase = options[name].passphrase; //what the privKey is encrypted with

    const privKeyObj = openpgp.key.readArmored(privkey).keys[0];
    privKeyObj.decrypt(passphrase);

    const encryptOptions = {
      data: textForCrypto,
      publicKeys: openpgp.key.readArmored(pubkey).keys,  // for encryption
      privateKeys: privKeyObj // for signing (optional)
    };

    return openpgp.encrypt(encryptOptions).then(function(ciphertext) {
      const encrypted = ciphertext.data; // '-----BEGIN PGP MESSAGE ... END PGP MESSAGE-----'

      messages[companionName] = encrypted;
    });
  })
);

console.log(4);

const decryptMessages = () => Promise.all(
  aliceAndBob.map((name) => {
    const companionName = companionNameByName(name);

    console.log(`${name} options 1`);

    const pubkey = keys[companionName].public;
    const privkey = keys[name].private; //encrypted private key
    const passphrase = options[name].passphrase; //what the privKey is encrypted with

    const privKeyObj = openpgp.key.readArmored(privkey).keys[0];
    privKeyObj.decrypt(passphrase);

    console.log(
      `${name} options 2`
    );

    // console.log(
    //   `${name} options 2`,
    //   message,
    //   openpgp.message.readArmored(message)
    // );

    const message = messages[name];

    const decryptOptions = {
      message: openpgp.message.readArmored(message),     // parse armored message
      publicKeys: openpgp.key.readArmored(pubkey).keys,    // for verification (optional)
      privateKey: privKeyObj // for decryption
    };

    // console.log(`${name} options 3`);

    // console.log(`${name} options`, options);

    return openpgp.decrypt(decryptOptions).then(function(plaintext) {
      console.log('decrypted', plaintext.data);
      return plaintext.data; // 'Hello, World!'
    })
    .catch((error) => console.log('error 2', error))
    ;
  })
).catch((error) => console.log('error 1', error));

generateKeysForAliceAndBob()
.then(encryptMessages)
.then(decryptMessages);

// openpgp.generateKey(options).then(function(key) {
//     const privkey = key.privateKeyArmored; // '-----BEGIN PGP PRIVATE KEY BLOCK ... '
//     const pubkey = key.publicKeyArmored;   // '-----BEGIN PGP PUBLIC KEY BLOCK ... '
// });

// console.log(
//   openpgp.key.readArmored(pubkey),
//   openpgp.key.readArmored(privkey)
// );
