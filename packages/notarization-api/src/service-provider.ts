import { Identifiers, Server } from "@arkecosystem/core-api";
import { Providers } from "@arkecosystem/core-kernel";

import { Handler } from "./handlers";

export class ServiceProvider extends Providers.ServiceProvider {
	public async register(): Promise<void> {
		for (const identifier of [Identifiers.HTTP, Identifiers.HTTPS]) {
			if (this.app.isBound<Server>(identifier)) {
				const server = this.app.get<Server>(identifier);
				await server.register({
					plugin: Handler,
					routes: { prefix: "/api/timestamp/v1" },
				});
			}
		}
	}
}
