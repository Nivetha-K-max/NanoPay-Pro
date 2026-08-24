package com.nanopay.infrastructure.kafka.config;

import com.nanopay.common.event.NotificationEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;

/**
 * Separate producer factory for NotificationEvent messages.
 * Uses a different transactional ID to prevent interference with
 * the transaction event producer's EOS state.
 * Producer config is delegated to KafkaConfig.buildProducerConfig.
 */
@Configuration
@RequiredArgsConstructor
public class NotificationKafkaConfig {

    private final KafkaConfig kafkaConfig;

    @Bean
    public ProducerFactory<String, NotificationEvent> notificationProducerFactory() {
        return new DefaultKafkaProducerFactory<>(
            kafkaConfig.buildProducerConfig("nanopay-notification-producer"));
    }

    @Bean
    public KafkaTemplate<String, NotificationEvent> notificationKafkaTemplate() {
        return new KafkaTemplate<>(notificationProducerFactory());
    }
}
