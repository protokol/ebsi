import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";

import { defaults } from "../defaults";
import { NotarizationTransactionGroup, NotarizationTransactionTypes } from "../enums";
import { INotarizationAsset } from "../interfaces";
import { NotarizationTransaction } from "../transactions";

export class NotarizationBuilder extends Transactions.TransactionBuilder<NotarizationBuilder> {
    public constructor() {
        super();
        this.data.version = defaults.version;
        this.data.typeGroup = NotarizationTransactionGroup;
        this.data.type = NotarizationTransactionTypes.Notarization;
        this.data.amount = Utils.BigNumber.ZERO;
        this.data.fee = NotarizationTransaction.staticFee();
        this.data.asset = { notarization: {} };
    }

    public Notarization(notarization: INotarizationAsset): NotarizationBuilder {
        if (this.data.asset) {
            this.data.asset.notarization = notarization;
        }
        return this;
    }

    public override getStruct(): Interfaces.ITransactionData {
        const struct: Interfaces.ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        struct.vendorField = this.data.vendorField;

        return struct;
    }

    protected instance(): NotarizationBuilder {
        return this;
    }
}
