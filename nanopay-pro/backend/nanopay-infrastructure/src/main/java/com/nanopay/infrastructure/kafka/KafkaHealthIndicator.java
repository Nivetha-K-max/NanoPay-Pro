package com.nanopay.infrastructure.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.AdminClientConfig;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Exposes Kafka connectivity via /actuator/health.
 * Prometheus scrapes this — Grafana alerts if Kafka is down.
 */
@Slf4j
@Component("kafka")
@RequiredArgsConstructor
public class KafkaHealthIndicator implements HealthIndicator {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Override
    public Health health() {
        try (AdminClient client = AdminClient.create(
                Map.of(AdminClientConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers))) {

            // List topics with 3-second timeout
            client.listTopics().names().get(3, TimeUnit.SECONDS);
            return Health.up()
                .withDetail("bootstrap-servers", bootstrapServers)
                .build();

        } catch (Exception e) {
            log.warn("Kafka health check failed", e);
            return Health.down()
                .withDetail("bootstrap-servers", bootstrapServers)
                .withException(e)
                .build();
        }
    }
}
