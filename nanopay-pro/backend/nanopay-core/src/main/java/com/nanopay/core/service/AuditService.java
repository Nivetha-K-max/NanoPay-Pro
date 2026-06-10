package com.nanopay.core.service;

import com.nanopay.core.domain.entity.AuditLog;
import com.nanopay.core.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * Writes audit records asynchronously so they don't slow down the main transaction.
 * REQUIRES_NEW: audit log is written even if the outer transaction rolls back —
 * a failed transaction attempt is still a security-relevant event.
 */
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(Long userId,
                    String action,
                    String entityType,
                    Long entityId,
                    String ipAddress,
                    String userAgent,
                    AuditLog.Outcome outcome,
                    Map<String, Object> details) {

        AuditLog entry = new AuditLog();
        entry.setUserId(userId);
        entry.setAction(action);
        entry.setEntityType(entityType);
        entry.setEntityId(entityId);
        entry.setIpAddress(ipAddress);
        entry.setUserAgent(userAgent);
        entry.setOutcome(outcome);
        entry.setDetails(details);
        auditLogRepository.save(entry);
    }
}
