import { Container, Providers } from "@arkecosystem/core-kernel";

import { NotarizationTransactionHandler } from "./handlers";

const pluginName = require("../package.json").name;

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.app.bind(Container.Identifiers.TransactionHandler).to(NotarizationTransactionHandler);

        const cacheFactory: any = this.app.get(Container.Identifiers.CacheFactory);
        this.app
            .bind(Container.Identifiers.CacheService)
            .toConstantValue(await cacheFactory())
            .whenTargetTagged("cache", pluginName);
    }
}
