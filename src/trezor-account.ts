import * as nemSdk from "nem-sdk";
import * as Trezor from "./trezor";
import { Observable } from "rxjs";
import {
  PublicAccount, Address, Transaction, SignedTransaction,
  NEMLibrary, NetworkTypes, EncryptedMessage, Environment,
} from "nem-library";

/**
 * TrezorAccount model
 */
export class TrezorAccount {
  public readonly address: Address;
  public readonly hdKeyPath: string;

  /**
   * Constructor
   * @param address
   */
  constructor(address: Address, hdKeyPath: string) {
    this.address = address;
    this.hdKeyPath = hdKeyPath;
  }

  /**
   * Sign a transaction
   * @param transaction
   * @param receiverPublicKey (optional): if given, the message will be encrypted
   * @returns {{data: any, signature: string}}
   */
  public signTransaction(transaction: Transaction, receiverPublicKey?: string): Observable<SignedTransaction> {
    transaction.signer = PublicAccount.createWithPublicKey("462ee976890916e54fa825d26bdd0235f5eb5b6a143c199ab0ae5ee9328e08ce");
    transaction.setNetworkType(NEMLibrary.getNetworkType());
    const dto: any = transaction.toDTO();
    if (receiverPublicKey !== undefined) {
      dto.message.type = 2;
      dto.message.publicKey = receiverPublicKey;

      const encPayload =
        nemSdk.default.crypto.helpers.encode(receiverPublicKey, receiverPublicKey, dto.message.payload);

      let min = Math.floor(Math.max(1, (dto.amount / 1000000) / 10000));
      min = min > 25 ? 25 : min;
      let fee = Math.floor(0.05 * min * 1000000);
      if (dto.message.payload && encPayload.length != 0) {
        fee += 0.05 * (Math.floor((encPayload.length / 2) / 32) + 1) * 1000000;
      }
      dto.fee = fee;
    }
    const serialized = Observable.fromPromise(Trezor.serialize(dto, this.hdKeyPath));
    return serialized.map((serializedTransaction) => {
      return (serializedTransaction as SignedTransaction);
    });
  }

  private async signSerialTransactionsPromise(transactions: Transaction[]): Promise<SignedTransaction[]> {
    const dtos = transactions.map(t => {
      t.signer = PublicAccount.createWithPublicKey("462ee976890916e54fa825d26bdd0235f5eb5b6a143c199ab0ae5ee9328e08ce");
      t.setNetworkType(NEMLibrary.getNetworkType());
      return t.toDTO();
    });
    const signedTransactions: SignedTransaction[] = [];
    for (let i = 0; i < transactions.length; i++) {
      const keepSession = (i < transactions.length - 1);
      const serialized = await Trezor.serialize(dtos[i], this.hdKeyPath, keepSession);
      signedTransactions.push(serialized as SignedTransaction);
    }
    return signedTransactions;
  }

  public signSerialTransactions(transactions: Transaction[]): Observable<SignedTransaction[]> {
    return Observable.fromPromise(this.signSerialTransactionsPromise(transactions));
  }

  /**
   * generate new account
   * @param walletName
   * @param passphrase
   * @param networkType
   * @returns {Account}
   */
  public static getAccount(index: number): Observable<TrezorAccount> {
    // Check if running in a browser environment
    const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
    if (!isBrowser) {
      throw new Error("Trezor Accounts can only be created in a browser environment");
    }
    return Observable.fromPromise(Trezor.createAccount(NEMLibrary.getNetworkType(), index))
      .map((account: any) => {
        return new TrezorAccount(new Address(account.address), account.hdKeypath);
      });
  }

  /**
   * Decrypts an encrypted message
   * @param encryptedMessage
   * @param recipientPublicAccount
   * @returns {PlainMessage}
   */
  // public decryptMessage(encryptedMessage: EncryptedMessage, recipientPublicAccount: PublicAccount): PlainMessage {
  //   return EncryptedMessage.decrypt(encryptedMessage, this.privateKey, recipientPublicAccount);
  // }
}
