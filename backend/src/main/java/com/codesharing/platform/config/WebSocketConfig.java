package com.codesharing.platform.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket Configuration
 * Configures STOMP (Simple Text Oriented Messaging Protocol) over WebSocket
 * Enables real-time bidirectional communication between clients and server
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

  /**
   * Configure the WebSocket endpoint and enable STOMP
   */
  @Override
  public void registerStompEndpoints(StompEndpointRegistry registry) {
    // Register STOMP endpoint for WebSocket connections
    // Clients will connect to: ws://localhost:8080/ws
    registry
      .addEndpoint("/ws")
      .setAllowedOriginPatterns("https://localhost", "http://localhost", "http://localhost:*", "https://localhost:*", "*")  // Allow local connections and any origin pattern
      .withSockJS();  // Fallback to SockJS for browsers that don't support WebSocket
  }

  /**
   * Configure message broker for routing messages between clients
   */
  @Override
  public void configureMessageBroker(MessageBrokerRegistry config) {
    // Create and configure the task scheduler
    ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
    scheduler.setPoolSize(Runtime.getRuntime().availableProcessors());
    scheduler.setThreadNamePrefix("ws-heartbeat-");
    scheduler.setWaitForTasksToCompleteOnShutdown(true);
    scheduler.setAwaitTerminationSeconds(60);
    scheduler.initialize();

    // Enable a simple in-memory message broker
    // Messages to destinations starting with /topic will be broadcast to subscribers
    // For production, consider using RabbitMQ or ActiveMQ
    config
      .enableSimpleBroker("/topic", "/queue")
      .setHeartbeatValue(new long[]{25000, 25000})
      .setTaskScheduler(scheduler);

    // Set the prefix for messages sent from clients
    // Clients send to: /app/snippet/{id}/presence, /app/snippet/{id}/code, etc.
    // These are handled by @MessageMapping methods in controllers
    config.setApplicationDestinationPrefixes("/app");

    // Set the prefix for user-specific queues
    // Each user gets a private queue: /user/queue/...
    config.setUserDestinationPrefix("/user");
  }
}

