package com.nanopay.core.mapper;

import com.nanopay.common.dto.transaction.TransactionResponse;
import com.nanopay.common.dto.wallet.WalletResponse;
import com.nanopay.core.domain.entity.Transaction;
import com.nanopay.core.domain.entity.TransactionLog;
import com.nanopay.core.domain.entity.Wallet;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.math.BigDecimal;

@Mapper(componentModel = "spring")
public interface TransactionMapper {

    @Mapping(target = "type", expression = "java(tx.getType().name())")
    @Mapping(target = "status", expression = "java(tx.getStatus().name())")
    @Mapping(target = "senderWallet", qualifiedByName = "toSenderSummary")
    @Mapping(target = "receiverWallet", qualifiedByName = "toReceiverSummary")
    @Mapping(target = "logs", source = "logs")
    TransactionResponse toResponse(Transaction tx);

    @Mapping(target = "fromStatus", expression = "java(log.getFromStatus() != null ? log.getFromStatus().name() : null)")
    @Mapping(target = "toStatus", expression = "java(log.getToStatus().name())")
    @Mapping(target = "reason", source = "reason")
    @Mapping(target = "timestamp", source = "createdAt")
    TransactionResponse.LogEntry toLogEntry(TransactionLog log);

    @Named("toSenderSummary")
    default TransactionResponse.WalletSummary toSenderSummary(Wallet wallet) {
        if (wallet == null) return null;
        return TransactionResponse.WalletSummary.builder()
                .walletId(wallet.getId())
                .ownerName(wallet.getUser().getFullName())
                .build();
    }

    @Named("toReceiverSummary")
    default TransactionResponse.WalletSummary toReceiverSummary(Wallet wallet) {
        if (wallet == null) return null;
        return TransactionResponse.WalletSummary.builder()
                .walletId(wallet.getId())
                .ownerName(wallet.getUser().getFullName())
                .build();
    }


    default WalletResponse toWalletResponse(Wallet wallet) {
        BigDecimal remaining = wallet.getDailyLimit().subtract(wallet.getDailySpent());
        return WalletResponse.builder()
                .id(wallet.getId())
                .balance(wallet.getBalance())
                .currency(wallet.getCurrency())
                .status(wallet.getStatus().name())
                .dailySpent(wallet.getDailySpent())
                .dailyLimit(wallet.getDailyLimit())
                .dailyRemaining(remaining.max(BigDecimal.ZERO))
                .updatedAt(wallet.getUpdatedAt())
                .build();
    }
}

