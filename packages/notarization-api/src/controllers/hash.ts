import { Controller } from "@arkecosystem/core-api";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import { Interfaces } from "@protokol/notarization-transactions";

@Container.injectable()
export class HashesController extends Controller {
	@Container.inject(Container.Identifiers.CacheService)
	@Container.tagged("cache", "@protokol/notarization-transactions")
	private readonly notarizationCache!: Contracts.Kernel.CacheStore<
		Interfaces.INotarization["hash"],
		Interfaces.INotarization
	>;

	public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
		const hash = await this.notarizationCache.get(request.params.id);
		if (!hash) {
			return Boom.notFound("Hash not found");
		}

		return hash;
	}
}
