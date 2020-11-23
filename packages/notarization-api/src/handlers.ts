import Hapi from "@hapi/hapi";

import * as Hashes from "./routes/hashes";

export const Handler = {
	async register(server: Hapi.Server): Promise<void> {
		Hashes.register(server);
	},
	name: "Notarization Api",
	version: "1.0.0",
};
