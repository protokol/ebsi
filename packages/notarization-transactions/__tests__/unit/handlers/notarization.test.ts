import "jest-extended";

import { Application, Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";
import { passphrases } from "@arkecosystem/core-test-framework";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { Builders, Enums } from "@protokol/notarization-crypto";

import { buildWallet, initApp, transactionHistoryService } from "../__support__/app";
import { FeeType } from "../../../src/enums";
import { StaticFeeMismatchError } from "../../../src/errors";
import { NotarizationApplicationEvents } from "../../../src/events";
import { INotarization } from "../../../src/interfaces";
import { deregisterTransactions } from "../utils/utils";

let app: Application;

let senderWallet: Contracts.State.Wallet;

let walletRepository: Wallets.WalletRepository;

let transactionHandlerRegistry: Handlers.Registry;

let handler: Handlers.TransactionHandler;

let actual: Interfaces.ITransaction;

let notarizationCache;

const notarizationAsset = {
    hash: "hash",
};

const buildNotarizationTx = (asset?, nonce?, fee?) =>
    new Builders.NotarizationBuilder()
        .Notarization(asset || notarizationAsset)
        .nonce(nonce || "1")
        .sign(passphrases[0])
        .fee(fee || Enums.NotarizationStaticFees.Notarization)
        .build();

beforeEach(() => {
    app = initApp();

    senderWallet = buildWallet(app, passphrases[0]);

    walletRepository = app.get<Wallets.WalletRepository>(Container.Identifiers.WalletRepository);

    transactionHandlerRegistry = app.get<Handlers.Registry>(Container.Identifiers.TransactionHandlerRegistry);

    handler = transactionHandlerRegistry.getRegisteredHandlerByType(
        Transactions.InternalTransactionType.from(
            Enums.NotarizationTransactionTypes.Notarization,
            Enums.NotarizationTransactionGroup,
        ),
        2,
    );
    walletRepository.index(senderWallet);

    actual = buildNotarizationTx();

    notarizationCache = app.get<Contracts.Kernel.CacheStore<INotarization["hash"], INotarization>>(
        Container.Identifiers.CacheService,
    );
});

afterEach(() => {
    deregisterTransactions();
});

describe("Notarization tests", () => {
    describe("bootstrap tests", () => {
        it("should test bootstrap method", async () => {
            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield actual.data;
            });

            await expect(handler.bootstrap()).toResolve();
            expect(await notarizationCache.has(notarizationAsset.hash)).toBeTrue();
            expect(await notarizationCache.get(notarizationAsset.hash)).toStrictEqual({
                ...notarizationAsset,
                timestamp: actual.timestamp,
            });
        });

        it("bootstrap should throw if no asset defined", async () => {
            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield { ...actual.data, asset: undefined };
            });

            await expect(handler.bootstrap()).toReject();
            expect(await notarizationCache.has(notarizationAsset.hash)).toBeFalse();
            expect((await notarizationCache.keys()).length).toBe(0);
        });
    });

    describe("throwIfCannotBeApplied tests", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(actual, senderWallet)).toResolve();
        });

        it("should throw if notarization is undefined", async () => {
            const undefinedTokenInTransaction = { ...actual };
            undefinedTokenInTransaction.data.asset = undefined;

            await expect(handler.throwIfCannotBeApplied(undefinedTokenInTransaction, senderWallet)).toReject();
        });

        it("should throw StaticFeeMismatchError", async () => {
            app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).set<FeeType>(
                "feeType",
                FeeType.Static,
            );

            actual = buildNotarizationTx(undefined, undefined, "1");

            await expect(handler.throwIfCannotBeApplied(actual, senderWallet)).rejects.toThrowError(
                StaticFeeMismatchError,
            );
        });

        it("should not throw if fee is the same as static fee", async () => {
            app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).set<FeeType>(
                "feeType",
                FeeType.Static,
            );

            await expect(handler.throwIfCannotBeApplied(actual, senderWallet)).toResolve();
        });
    });

    describe("emitEvents", () => {
        it("should test dispatch", async () => {
            const emitter: Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(
                Container.Identifiers.EventDispatcherService,
            );

            const spy = jest.spyOn(emitter, "dispatch");

            handler.emitEvents(actual, emitter);

            expect(spy).toHaveBeenCalledWith(NotarizationApplicationEvents.Notarization, expect.anything());
        });
    });

    describe("apply tests", () => {
        it("should test apply method", async () => {
            console.log(actual.timestamp);
            await expect(handler.apply(actual)).toResolve();
            expect(await notarizationCache.has(notarizationAsset.hash)).toBeTrue();
            expect(await notarizationCache.get(notarizationAsset.hash)).toStrictEqual({
                ...notarizationAsset,
                timestamp: actual.timestamp,
            });
            expect(await handler.isActivated()).toBeTrue();
        });
    });

    describe("revert tests", () => {
        it("should test revert method", async () => {
            await handler.apply(actual);
            transactionHistoryService.listByCriteria.mockImplementationOnce(() => ({ results: [] }));

            expect(await notarizationCache.has(notarizationAsset.hash)).toBeTrue();
            await expect(handler.revert(actual)).toResolve();
            expect(await notarizationCache.has(notarizationAsset.hash)).toBeFalse();
            expect((await notarizationCache.keys()).length).toBe(0);
        });
    });

    describe("fee tests", () => {
        it("should test dynamic fee", async () => {
            expect(
                handler.dynamicFee({
                    transaction: actual,
                    addonBytes: 150,
                    satoshiPerByte: 3,
                    height: 1,
                }),
            ).toEqual(Utils.BigNumber.make((Math.round(actual.serialized.length / 2) + 150) * 3));
        });

        it("should test static fee", async () => {
            app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).set<FeeType>(
                "feeType",
                FeeType.Static,
            );

            expect(
                handler.dynamicFee({
                    transaction: actual,
                    addonBytes: 150,
                    satoshiPerByte: 3,
                    height: 1,
                }),
            ).toEqual(Utils.BigNumber.make(handler.getConstructor().staticFee()));
        });

        it("should test none fee", async () => {
            app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).set<FeeType>(
                "feeType",
                FeeType.None,
            );
            expect(
                handler.dynamicFee({
                    transaction: actual,
                    addonBytes: 150,
                    satoshiPerByte: 3,
                    height: 1,
                }),
            ).toEqual(Utils.BigNumber.ZERO);
        });
    });
});
