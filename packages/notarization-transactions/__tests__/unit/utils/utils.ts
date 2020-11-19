import "jest-extended";

import { Transactions } from "@arkecosystem/crypto";
import { Transactions as NotarizationTransactions } from "@protokol/notarization-crypto";

export const deregisterTransactions = () => {
    Transactions.TransactionRegistry.deregisterTransactionType(NotarizationTransactions.NotarizationTransaction);
};
