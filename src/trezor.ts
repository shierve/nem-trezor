// import Trezor = require("./vendor/connect.js");
// let TrezorConnect = Trezor.TrezorConnect();
import TrezorConnect from "trezor-connect";

import nem from 'nem-sdk';
import { NetworkTypes } from "nem-library";

// const createWallet = (network) => {
//   return TrezorConnect
//     .createAccount(network, 0, "Primary")
//     .then((account) => ({
//       "name": "TREZOR",
//       "accounts": {
//         "0": account,
//       }
//     }));
// };

const bip44 = (network: number, index: number) => {
  const coinType = network === -104
    ? 1
    : 43;

  return `m/44'/${coinType}'/${index}'/0'/0'`;
};

const createAccount = async (network: number, index: number) => {
  if (network === NetworkTypes.TEST_NET) {
    network = -104;
  }
  const hdKeypath = bip44(network, index);

  const result = await TrezorConnect.nemGetAddress({
    path: hdKeypath,
    network
  });
  if (result.success) {
    return {
      address: result.address,
      hdKeypath: hdKeypath
    };
  } else {
    throw new Error(result.error);
  }
};

// TODO: this can be done with the new trezor-connect
// review the encrypt/decrypt logic
// const getPubKey = (path) => {
//   TrezorConnect = Trezor.TrezorConnect();
//   return new Promise((resolve, reject) => {
//     TrezorConnect.getXPubKey(undefined, (pubK) => {
//       resolve(pubK);
//     });
//   });
// };

const deriveRemote = async (account, network) => {
  const key = "Export delegated harvesting key?";
  const value = "0000000000000000000000000000000000000000000000000000000000000000";

  const result = await TrezorConnect.cipherKeyValue({
    path: account.hdKeypath,
    key,
    value,
    askOnEncrypt: true,
    askOnDecrypt: true
  });

  if (result.success) {
    const privateKey = nem
      .utils
      .helpers
      .fixPrivateKey(result.value);
    const keyPair = nem
      .crypto
      .keyPair
      .create(privateKey);
    const publicKey = keyPair
      .publicKey
      .toString();
    const address = nem
      .model
      .address
      .toAddress(publicKey, network);

    return {address, privateKey, publicKey};
  } else {
    throw new Error(result.error);
  }
};

const serialize = async (transaction, hdKeypath) => {
  const result = await TrezorConnect.nemSignTransaction({
    path: hdKeypath,
    transaction,
  });
  if (result.success) {
    return result.payload;
  } else {
    console.log("error", result);
    throw new Error(result.error);
  }
};

const showAccount = async (account) => {
  const result = await TrezorConnect.nemGetAddress({
    path: account.hdKeypath,
    network: account.network,
  });
  if (result.success) {
    return result.address;
  } else {
    throw new Error(result.error);
  }
};

export {
  createAccount, deriveRemote, serialize, showAccount,
};
