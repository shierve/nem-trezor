import Trezor = require("./vendor/connect.js");
let TrezorConnect = Trezor.TrezorConnect();

import nem from 'nem-sdk';
import { NetworkTypes } from "nem-library";

const createWallet = (network) => {
  TrezorConnect = Trezor.TrezorConnect();
  return TrezorConnect
    .createAccount(network, 0, "Primary")
    .then((account) => ({
      "name": "TREZOR",
      "accounts": {
        "0": account,
      }
    }));
};

const bip44 = (network: number, index: number) => {
  const coinType = network === -104
    ? 1
    : 43;

  return `m/44'/${coinType}'/${index}'/0'/0'`;
};

const createAccount = (network: number, index: number) => {
  TrezorConnect = Trezor.TrezorConnect();
  if (network === NetworkTypes.TEST_NET) {
    network = -104;
  }
  return new Promise((resolve, reject) => {
    const hdKeypath = bip44(network, index);

    TrezorConnect.nemGetAddress(hdKeypath, network, (result) => {
      if (result.success) {
        resolve({
          address: result.address,
          hdKeypath: hdKeypath
        });
      } else {
        reject(result.error);
      }
    });
  });
};

// const getPubKey = (path) => {
//   TrezorConnect = Trezor.TrezorConnect();
//   return new Promise((resolve, reject) => {
//     TrezorConnect.getXPubKey(undefined, (pubK) => {
//       resolve(pubK);
//     });
//   });
// };

const deriveRemote = (account, network) => {
  TrezorConnect = Trezor.TrezorConnect();
  const key = "Export delegated harvesting key?";
  const value = "0000000000000000000000000000000000000000000000000000000000000000";

  return new Promise((resolve, reject) => {
    TrezorConnect.cipherKeyValue(account.hdKeypath, key, value, true, true, true, (result) => {
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

        resolve({address, privateKey, publicKey});
      } else {
        reject(result.error);
      }
    });
  });
};

const serialize = (transaction, hdKeypath) => {
  TrezorConnect = Trezor.TrezorConnect();
  return new Promise((resolve, reject) => {
    TrezorConnect.nemSignTx(hdKeypath, transaction, (result) => {
      if (result.success) {
        resolve(result.message);
      } else {
        reject({
          "code": 0,
          "data": {
            "message": result.error
          }
        });
      }
    });
  });
};

const showAccount = (account) => {
  TrezorConnect = Trezor.TrezorConnect();
  return new Promise((resolve, reject) => {
    TrezorConnect.nemGetAddress(account.hdKeypath, account.network, (result) => {
      if (result.success) {
        resolve(result.address);
      } else {
        reject(result.error);
      }
    });
  });
};

export {
  createWallet, createAccount, deriveRemote, serialize, showAccount,
};
