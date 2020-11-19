import "@arkecosystem/core-test-framework/dist/matchers";

import { Contracts } from "@arkecosystem/core-kernel";
import { passphrases, snoozeForBlock } from "@arkecosystem/core-test-framework";

import * as support from "../__support__";
import { NotarizationTransactionFactory } from "../__support__/transaction-factory";

const notarizationAsset = {
    hash: "hash",
};

let app: Contracts.Kernel.Application;
beforeAll(async () => (app = await support.setUp()));
afterAll(async () => await support.tearDown());

describe("Notarization functional tests - Signed with one Passphrase", () => {
    it("should broadcast, accept and forge it [Signed with 1 Passphrase]", async () => {
        // Save notarization
        const notarization = NotarizationTransactionFactory.initialize(app)
            .Notarization(notarizationAsset)
            .withPassphrase(passphrases[0])
            .createOne();

        await expect(notarization).toBeAccepted();
        await snoozeForBlock(1);
        await expect(notarization.id).toBeForged();
    });
});
