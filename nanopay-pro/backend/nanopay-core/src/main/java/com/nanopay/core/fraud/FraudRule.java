package com.nanopay.core.fraud;

import com.nanopay.core.domain.entity.Transaction;
import com.nanopay.core.domain.entity.Wallet;

public interface FraudRule {
    RuleResult evaluate(Transaction transaction, Wallet senderWallet);
    String getRuleName();
    int getPriority();
}
