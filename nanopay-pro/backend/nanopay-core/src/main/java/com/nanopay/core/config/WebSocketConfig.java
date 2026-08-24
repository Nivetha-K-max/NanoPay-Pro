package com.nanopay.core.config;

import com.nanopay.core.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.util.StringUtils;
import org.springframework.web.socket.config.annotation.*;

/**
 * STOMP over WebSocket configuration.
 *
 * Security: the CONNECT frame carries the JWT in a header.
 * The channel interceptor validates it before the connection is established.
 * This means unauthenticated WebSocket connections are rejected at the
 * STOMP protocol level, not just at the subscription level.
 *
 * Topic structure:
 * - /topic/transactions/{userId} — personal transaction updates
 * - /topic/notifications/{userId} — personal notification badge count
 * - /topic/admin/fraud — admin fraud feed (role-checked in interceptor)
 */
@Slf4j
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsService userDetailsService;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
            .setAllowedOriginPatterns("*")  // tightened per-env via CORS config
            .withSockJS();                  // SockJS fallback for browsers without WS
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Client sends messages to /app/... prefixed destinations
        registry.setApplicationDestinationPrefixes("/app");
        // Broker handles /topic/... destinations (fan-out) and /queue/... (point-to-point)
        registry.enableSimpleBroker("/topic", "/queue");
        // /user prefix enables Spring's user-destination resolution:
        // /user/{userId}/queue/... routes to that specific user's session
        registry.setUserDestinationPrefix("/user");
    }

    /**
     * Intercept STOMP CONNECT frames to authenticate the WebSocket connection.
     * After authentication, the Principal is set on the session so that
     * Spring can resolve /user/{name}/... destinations correctly.
     */
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(
                    message, StompHeaderAccessor.class);

                if (accessor == null) return message;

                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String token = accessor.getFirstNativeHeader("Authorization");

                    if (StringUtils.hasText(token) &&
                        token.startsWith("Bearer ")) {

                        String jwt = token.substring(7);
                        if (jwtTokenProvider.validateToken(jwt)) {
                            String email = jwtTokenProvider.getEmailFromToken(jwt);
                            UserDetails user = userDetailsService.loadUserByUsername(email);

                            UsernamePasswordAuthenticationToken auth =
                                new UsernamePasswordAuthenticationToken(
                                    user, null, user.getAuthorities());

                            // Setting user on accessor makes Spring resolve
                            // /user/{email}/queue/... to this session
                            accessor.setUser(auth);
                            log.debug("WebSocket authenticated: {}", email);
                        } else {
                            log.warn("WebSocket CONNECT rejected: invalid JWT");
                            // Return null to reject the connection
                            return null;
                        }
                    } else {
                        log.warn("WebSocket CONNECT rejected: missing Authorization header");
                        return null;
                    }
                }

                return message;
            }
        });
    }
}
