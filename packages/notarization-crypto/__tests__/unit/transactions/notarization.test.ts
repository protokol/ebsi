import "jest-extended";

import { passphrases } from "@arkecosystem/core-test-framework";
import { Managers, Transactions } from "@arkecosystem/crypto";

import { NotarizationBuilder } from "../../../src/builders";
import { INotarizationAsset } from "../../../src/interfaces";
import { NotarizationTransaction } from "../../../src/transactions";

const notarization = {
    hash: "hash",
};

describe("Notarization tests", () => {
    Managers.configManager.setFromPreset("testnet");
    Managers.configManager.setHeight(2);
    Transactions.TransactionRegistry.registerTransactionType(NotarizationTransaction);

    describe("Ser/deser tests", () => {
        it("should ser/deser correctly notarization asset", () => {
            const actual = new NotarizationBuilder()
                .Notarization(notarization)
                .nonce("1")
                .sign(passphrases[0])
                .getStruct();

            const serialized = Transactions.TransactionFactory.fromData(actual).serialized.toString("hex");
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            expect(deserialized.data.asset!.notarization).toStrictEqual(notarization);
        });

        it("should throw if asset is undefined", () => {
            const actual = new NotarizationBuilder().Notarization(notarization).nonce("3");

            actual.data.asset = undefined;
            expect(() => actual.sign(passphrases[0])).toThrow();
        });
    });
});
