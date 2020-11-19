import "jest-extended";

import { passphrases } from "@arkecosystem/core-test-framework";
import { Managers, Transactions } from "@arkecosystem/crypto";

import { NotarizationBuilder } from "../../../src/builders";
import { NotarizationTransaction } from "../../../src/transactions";

const notarization = {
    hash: "hash",
};

describe("Notarization tests", () => {
    describe("Verify tests", () => {
        Managers.configManager.setFromPreset("testnet");
        Managers.configManager.setHeight(2);
        Transactions.TransactionRegistry.registerTransactionType(NotarizationTransaction);

        it("should verify correctly", () => {
            const actual = new NotarizationBuilder().Notarization(notarization).nonce("1").sign(passphrases[0]);

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("object should remain the same if asset is undefined", () => {
            const actual = new NotarizationBuilder();
            actual.data.asset = undefined;

            const result = actual.Notarization(notarization);

            expect(actual.data.asset).toBeUndefined();
            expect(actual).toBe(result);
        });
    });
});
