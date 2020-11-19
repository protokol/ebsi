import { Contracts } from "@arkecosystem/core-kernel";
import { TransactionFactory } from "@arkecosystem/core-test-framework";
import { Builders, Interfaces } from "@protokol/notarization-crypto";

export class NotarizationTransactionFactory extends TransactionFactory {
    protected constructor(app?: Contracts.Kernel.Application) {
        super(app);
    }

    public static initialize(app?: Contracts.Kernel.Application): NotarizationTransactionFactory {
        return new NotarizationTransactionFactory(app);
    }

    public Notarization(notarization: Interfaces.INotarizationAsset): NotarizationTransactionFactory {
        this.builder = new Builders.NotarizationBuilder().Notarization(notarization);

        return this;
    }
}
