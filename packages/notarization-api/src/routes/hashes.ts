import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";

import { HashesController } from "../controllers/hash";

export const register = (server: Hapi.Server): void => {
	const controller = server.app.app.resolve(HashesController);
	server.bind(controller);

	server.route({
		method: "GET",
		path: "/hashes/{id}",
		handler: controller.show,
		options: {
			validate: {
				params: Joi.object({
					id: Joi.string(),
				}),
			},
		},
	});
};
