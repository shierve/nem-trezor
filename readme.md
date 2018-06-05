# Nem Trezor

[![npm version](https://badge.fury.io/js/nem-voting.svg)](https://badge.fury.io/js/nem-voting)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

nem-trezor is a typescript / node.js npm module that adds trezor functionalities to nem-library.

For the module to work you will need a trezor device connected to the system and trezor trezor-bridge should be running (or the chrome extension).

The library only works in a browser environment because of the way trezor is implemented, if executed in a node script environment it will throw an exception.

1. [Installation](#installation)
2. [Usage](#examples)

## Installation <a name="installation"></a>

to install the npm module on your typescript or node project run:

`npm install nem-trezor --save`

the module is made to work together with nem-library, so you should install that too:

`npm install nem-library --save`

## Usage <a name="examples"></a>

The module exports a class TrezorAccount, that is made to be as similar to the Account class in nem-library as possible. It allows to use trezor accounts to sign transactions. Unencrypting messages is not possible right now but may be in the future. Also the way that encrypted messages are sent is different from the way it is done in nem-library, since trezor encrypts messages at the same time that it signs and serializes the transaction.

Here are some examples of the basic usage of the module:

### Sending a Transfer Transaction

```typescript
import { NEMLibrary, NetworkTypes, Transaction, TransferTransaction,
    TimeWindow, XEM, Address, TransactionHttp, PlainMessage} from 'nem-library';
import { TrezorAccount } from 'nem-trezor';

NEMLibrary.bootstrap(NetworkTypes.TEST_NET);

// 1. Get the first account of the trezor device. Change the number for different accounts. This will prompt a confirmation on the device.
TrezorAccount.getAccount(0)
  .subscribe((account) => {
    console.log(account);
    // 2. Create Transaction object
    // For more information on Transaction types and their usage check out the nem-library documentation
    const trans: Transaction = TransferTransaction.create(
      TimeWindow.createWithDeadline(),
      new Address("TBEJ3L4MKNRZRY7PR5CO35746QRCR32AHE6UMTQN"),
      new XEM(10),
      PlainMessage.create("hello from trezor"),
    );
    // 3. Sign and serialize the transaction from the trezor device. This will prompt for confirmation on the device.
    account.signTransaction(trans)
    .subscribe((signedTransaction) => {
      console.log(signedTransaction);
      // 4. Broadcast the transaction with nem-library
      const transactionHttp = new TransactionHttp();
      transactionHttp.announceTransaction(signedTransaction).subscribe((x) => {
        console.log(x);
      })
    });
  });
```

### Sending an encrypted message

For sending an encrypted message (only valid for transfer transactions), we will pass the public key of the receiver to the signTransaction function:

```typescript
// 3. Sign, serialize, and encrypt the transaction from the trezor device. This will prompt for confirmation on the device.
account.signTransaction(trans, "<receiver_public_key>")
  .subscribe((signedTransaction) => {
    console.log(signedTransaction);
    // 4. Broadcast the transaction with nem-library
    const transactionHttp = new TransactionHttp();
    transactionHttp.announceTransaction(signedTransaction).subscribe((x) => {
      console.log(x);
    })
  });
```
