import { Container, Contracts, Providers, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import {
    Interfaces as NotarizationInterfaces,
    Transactions as NotarizationTransactions,
} from "@protokol/notarization-crypto";

import { FeeType } from "../enums";
import { StaticFeeMismatchError } from "../errors";
import { NotarizationApplicationEvents } from "../events";
import { INotarization } from "../interfaces";

const pluginName = require("../../package.json").name;

export class NotarizationTransactionHandler extends Handlers.TransactionHandler {
    @Container.inject(Container.Identifiers.TransactionHistoryService)
    protected readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

    @Container.inject(Container.Identifiers.TransactionPoolQuery)
    protected readonly poolQuery!: Contracts.TransactionPool.Query;

    @Container.inject(Container.Identifiers.CacheService)
    @Container.tagged("cache", pluginName)
    protected readonly notarizationCache!: Contracts.Kernel.CacheStore<INotarization["hash"], INotarization>;

    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", pluginName)
    protected readonly configuration!: Providers.PluginConfiguration;

    public async isActivated(): Promise<boolean> {
        return Managers.configManager.getMilestone().aip11 === true;
    }

    public getConstructor(): Transactions.TransactionConstructor {
        return NotarizationTransactions.NotarizationTransaction;
    }

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return [];
    }

    public dynamicFee({
        addonBytes,
        satoshiPerByte,
        transaction,
        height,
    }: Contracts.Shared.DynamicFeeContext): Utils.BigNumber {
        const feeType = this.configuration.get<FeeType>("feeType");

        if (feeType === FeeType.Static) {
            return this.getConstructor().staticFee({ height });
        }
        if (feeType === FeeType.None) {
            return Utils.BigNumber.ZERO;
        }

        return super.dynamicFee({ addonBytes, satoshiPerByte, transaction, height });
    }

    public async bootstrap(): Promise<void> {
        for await (const transaction of this.transactionHistoryService.streamByCriteria(this.getDefaultCriteria())) {
            AppUtils.assert.defined<NotarizationInterfaces.INotarizationAsset>(transaction.asset?.notarization);

            const { hash }: NotarizationInterfaces.INotarizationAsset = transaction.asset.notarization;
            this.notarizationCache.put(hash, this.buildNotarization(hash, transaction.timestamp), -1);
        }
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.EventDispatcher): void {
        emitter.dispatch(NotarizationApplicationEvents.Notarization, transaction.data);
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Contracts.State.Wallet,
    ): Promise<void> {
        const feeType = this.configuration.get<FeeType>("feeType");

        if (feeType === FeeType.Static) {
            const staticFee = this.getConstructor().staticFee();

            if (!transaction.data.fee.isEqualTo(staticFee)) {
                throw new StaticFeeMismatchError(staticFee.toFixed());
            }
        }

        AppUtils.assert.defined<NotarizationInterfaces.INotarizationAsset>(transaction.data.asset?.notarization);

        return super.throwIfCannotBeApplied(transaction, wallet);
    }

    public async apply(transaction: Interfaces.ITransaction): Promise<void> {
        await super.apply(transaction);

        // Line is already checked inside throwIfCannotBeApplied run by super.apply method
        // AppUtils.assert.defined<NotarizationInterfaces.INotarizationAsset>(transaction.data.asset?.notarization);

        const { hash }: NotarizationInterfaces.INotarizationAsset = transaction.data.asset!.notarization;
        this.notarizationCache.put(hash, this.buildNotarization(hash, transaction.timestamp), -1);
    }

    public async revert(transaction: Interfaces.ITransaction): Promise<void> {
        await super.revert(transaction);

        const notarizationAsset: NotarizationInterfaces.INotarizationAsset = transaction.data.asset!.notarization;
        this.notarizationCache.forget(notarizationAsset.hash);
    }

    public async applyToRecipient(transaction: Interfaces.ITransaction): Promise<void> {}

    public async revertForRecipient(transaction: Interfaces.ITransaction): Promise<void> {}

    protected getDefaultCriteria() {
        return {
            typeGroup: this.getConstructor().typeGroup,
            type: this.getConstructor().type,
        };
    }

    private buildNotarization(hash: string, timestamp: number): INotarization {
        return { hash, timestamp };
    }
}
