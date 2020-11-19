import { Errors } from "@arkecosystem/core-transactions";

// Fee errors
export class StaticFeeMismatchError extends Errors.TransactionError {
    public constructor(staticFee: string) {
        super(`Failed to apply transaction, because fee doesn't match static fee ${staticFee}.`);
    }
}
