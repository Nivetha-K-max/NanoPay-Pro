package com.nanopay.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = "com.nanopay")
@EntityScan(basePackages = "com.nanopay.core.domain")
@EnableJpaRepositories(basePackages = {
    "com.nanopay.core.repository",
    "com.nanopay.infrastructure.repository"
})
@EnableJpaAuditing
@EnableAsync
@EnableScheduling
public class NanoPayApplication {

    public static void main(String[] args) {
        SpringApplication.run(NanoPayApplication.class, args);
    }
}
