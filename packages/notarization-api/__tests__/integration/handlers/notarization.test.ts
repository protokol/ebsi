import "@arkecosystem/core-test-framework/dist/matchers";

import { Container, Contracts } from "@arkecosystem/core-kernel";
import { ApiHelpers } from "@arkecosystem/core-test-framework";
import { Interfaces } from "@protokol/notarization-transactions";

import { setUp, tearDown } from "../__support__/setup";

let app: Contracts.Kernel.Application;
let api: ApiHelpers;

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

beforeAll(async () => {
	app = await setUp();
	api = new ApiHelpers(app);

	const notarizationCache = app.getTagged<
		Contracts.Kernel.CacheStore<Interfaces.INotarization["hash"], Interfaces.INotarization>
	>(Container.Identifiers.CacheService, "cache", "@protokol/notarization-transactions");

	//set mock hashes
	for (const hash of hashes) {
		await notarizationCache.put(hash.hash, hash, -1);
	}
});

afterAll(async () => await tearDown());

describe("API - Hashes", () => {
	describe("GET /timestamp/v1/hashes/{id}", () => {
		it("should GET hash by id", async () => {
			const response = await api.request("GET", `timestamp/v1/hashes/${hashes[0]!.hash}`);

			expect(response).toBeSuccessfulResponse();
			expect(response.data.data).toStrictEqual(hashes[0]!);
		});

		it("should fail to GET a hash by id if it doesn't exist", async () => {
			api.expectError(await api.request("GET", "timestamp/v1/hashes/non-existing"));
		});
	});
});
