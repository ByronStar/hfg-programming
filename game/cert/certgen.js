"use strict"

const forge = require('node-forge');
const fs = require('fs')
const ifs = require('os').networkInterfaces()

let ipAddr = Object.keys(ifs).map(x => ifs[x].filter(x => x.family === 'IPv4' && !x.internal)[0]).filter(x => x)[0].address

//createCA('hfg.hopto.org', ipAddr);

// generate a key pair
let keys = forge.pki.rsa.generateKeyPair(2048);
// save('progsp.hfg-gmuend.de.key', keys.toString())
save('progsp.hfg-gmuend.de.key', forge.pki.privateKeyToPem(keys.privateKey))

// create a certification request (CSR)
let csr = forge.pki.createCertificationRequest();
csr.publicKey = keys.publicKey;

csr.setSubject(getSubject(ipAddr));
// set (optional) attributes
csr.setAttributes(getAttrs(false, ipAddr));
// sign certification request
csr.sign(keys.privateKey);
// verify certification request
//console.log(csr.verify());
//save('progsp.hfg-gmuend.de.csr', forge.pki.certificationRequestToPem(csr))

let caCert = forge.pki.certificateFromPem(fs.readFileSync('rootCA.pem', 'utf8'))
// console.log(fs.readFileSync('rootCA.crt', 'utf8'))
let issuer = caCert.subject.attributes.map(v => {
  if (v.name == 'localityName') {
    console.log(v)
    v.value = 'Schwäbisch Gmünd'
  }
  return v
})

let caPrivateKey = forge.pki.privateKeyFromPem(fs.readFileSync('rootCA.key', 'utf8'))
let cert = createCert(csr.publicKey, caPrivateKey, csr.subject.attributes, issuer, csr.getAttribute({ name: 'extensionRequest' }).extensions, 1)
// convert a Forge certificate to PEM
save('progsp.hfg-gmuend.de.pem', forge.pki.certificateToPem(cert))

function createCert(publicKey, privateKey, subject, issuer, extensions, years) {
  let cert = forge.pki.createCertificate();
  cert.publicKey = publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + years);
  cert.setSubject(subject);
  cert.setIssuer(issuer);
  cert.setExtensions(extensions);
  cert.sign(privateKey, forge.md.sha256.create());
  return cert
}

function createCA(commonName, ipAddr) {
  // generate a key pair
  let rootKeys = forge.pki.rsa.generateKeyPair(4096);
  save('rootCA.key', forge.pki.privateKeyToPem(rootKeys.privateKey))
  let rootCA = createCert(rootKeys.publicKey, rootKeys.privateKey, getSubject(commonName), getSubject(commonName), getExtensions(true, ipAddr), 2)
  save('rootCA.pem', forge.pki.certificateToPem(rootCA))
}

function getSubject(commonName) {
  return [{
    name: 'countryName',
    value: 'DE'
  }, {
    shortName: 'ST',
    value: 'BW'
  }, {
    name: 'localityName',
    value: 'Schwäbisch Gmünd'
  }, {
    name: 'organizationName',
    value: 'HfG'
  }, {
    shortName: 'OU',
    value: 'IG1'
  }, {
    name: 'commonName',
    value: commonName
  }, {
    name: 'emailAddress',
    value: 'benno.staebler@hfg-gmuend.de'
  }]
}

function getAttrs(cA, ipAddr) {
  return [{
    name: 'extensionRequest',
    extensions: getExtensions(cA, ipAddr)
  }]
}

function getExtensions(cA, ipAddr) {
  return [{
    //   name: 'authorityKeyIdentifier',
    //   value: 'keyid,issuer'
    // }, {
    name: 'basicConstraints',
    cA: cA
  }, {
    name: 'keyUsage',
    digitalSignature: true,
    keyEncipherment: true,
  }, {
    name: 'subjectAltName',
    altNames: [{
      // 1 email, 2 is DNS type, 6: URI, 7: IP Address
      type: 2,
      value: 'progsp.hfg-gmuend.de'
    }, {
      type: 2,
      value: 'hfg.hopto.org',
    }, {
      type: 7,
      ip: ipAddr
    }]
    // }, {
    //   name: 'subjectKeyIdentifier',
    //   value: 'hash'
  }]
}

//let extensions = csr.getAttribute({ name: 'extensionRequest' }).extensions;
// optionally add more extensions
// extensions.push.apply(extensions, [{
//   name: 'basicConstraints',
//   cA: true
// }, {
//   name: 'keyUsage',
//   keyCertSign: true,
//   digitalSignature: true,
//   nonRepudiation: true,
//   keyEncipherment: true,
//   dataEncipherment: true
// }]);

function save(file, text) {
  fs.writeFile(file, text, 'utf8', (err, data) => {
    if (err) {
      console.log(err);
    } else {
      // console.log(stateFile + " updated");
    }
  });
}
