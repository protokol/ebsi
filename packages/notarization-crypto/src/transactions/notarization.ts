import { Transactions, Utils } from "@arkecosystem/crypto";
import { Asserts } from "@protokol/utils";
import ByteBuffer from "bytebuffer";

import { defaults } from "../defaults";
import { NotarizationStaticFees, NotarizationTransactionGroup, NotarizationTransactionTypes } from "../enums";
import { INotarizationAsset } from "../interfaces";
import { amountSchema, notarizationSchema, vendorFieldSchema } from "./utils/notarization-schemas";

const { schemas } = Transactions;

export class NotarizationTransaction extends Transactions.Transaction {
    public static typeGroup: number = NotarizationTransactionGroup;
    public static type = NotarizationTransactionTypes.Notarization;
    public static key = "Notarization";
    public static version: number = defaults.version;

    protected static defaultStaticFee = Utils.BigNumber.make(NotarizationStaticFees.Notarization);

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: this.key,
            required: ["asset", "typeGroup"],
            properties: {
                type: { transactionType: this.type },
                typeGroup: { const: this.typeGroup },
                amount: amountSchema,
                vendorField: vendorFieldSchema,
                asset: {
                    type: "object",
                    required: ["notarization"],
                    properties: {
                        notarization: notarizationSchema,
                    },
                },
            },
        });
    }

    public serialize(): ByteBuffer {
        const { data } = this;

        Asserts.assert.defined<INotarizationAsset>(data.asset?.notarization);
        const notarizationAsset: INotarizationAsset = data.asset.notarization;

        const hashBuffer: Buffer = Buffer.from(notarizationAsset.hash);
        const buffer: ByteBuffer = new ByteBuffer(1 + hashBuffer.length, true);

        // hash
        buffer.writeByte(hashBuffer.length);
        buffer.append(hashBuffer, "hex");

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        //hash
        const hashLength: number = buf.readUint8();
        const hash: string = buf.readString(hashLength);

        const notarization: INotarizationAsset = { hash };

        data.asset = {
            notarization,
        };
    }

    public hasVendorField(): boolean {
        return true;
    }
}
