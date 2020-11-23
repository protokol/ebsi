import "jest-extended";

import { Application, Container, Contracts } from "@arkecosystem/core-kernel";
import { Generators } from "@arkecosystem/core-test-framework";
import { Managers, Transactions } from "@arkecosystem/crypto";
import { Transactions as NotarizationTransactions } from "@protokol/notarization-crypto";
import { Interfaces } from "@protokol/notarization-transactions";

import { HashesController } from "../../../src/controllers/hash";
import { ErrorResponse, initApp, ItemResponse } from "../__support__";

let app: Application;

let hashesController: HashesController;

const hashes = [
	{
		hash: "hash1",
		timestamp: 500,
	},
	{
		hash: "hash2",
		timestamp: 600,
	},
];

beforeEach(async () => {
	const config = Generators.generateCryptoConfigRaw();
	Managers.configManager.setConfig(config);

	app = initApp();

	hashesController = app.resolve<HashesController>(HashesController);

	const notarizationCache = app.get<
		Contracts.Kernel.CacheStore<Interfaces.INotarization["hash"], Interfaces.INotarization>
	>(Container.Identifiers.CacheService);

	//set mock hashes
	for (const hash of hashes) {
		await notarizationCache.put(hash.hash, hash, -1);
	}
});

afterEach(() => {
	Transactions.TransactionRegistry.deregisterTransactionType(NotarizationTransactions.NotarizationTransaction);
});

describe("Test hash controller", () => {
	it("show - return group by id", async () => {
		const request = {
			params: {
				id: hashes[0]!.hash,
			},
		};

		const response = (await hashesController.show(request, undefined)) as ItemResponse;

		expect(response).toStrictEqual(hashes[0]!);
	});

	it("show - should return 404 if group does not exist", async () => {
		const request = {
			params: {
				id: "non-existing",
			},
		};

		const response = (await hashesController.show(request, undefined)) as ErrorResponse;

		expect(response.output.statusCode).toBe(404);
	});
});
