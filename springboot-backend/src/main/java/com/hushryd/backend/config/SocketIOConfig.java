package com.hushryd.backend.config;

import com.corundumstudio.socketio.SocketIOServer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PreDestroy;
import java.util.Map;

@Configuration
public class SocketIOConfig {

    @Value("${socket-server.host}")
    private String host;

    @Value("${socket-server.port}")
    private int port;

    private SocketIOServer server;

    @Bean
    public com.fasterxml.jackson.databind.ObjectMapper objectMapper() {
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        mapper.findAndRegisterModules();
        return mapper;
    }

    @Bean
    public SocketIOServer socketIOServer() {
        com.corundumstudio.socketio.Configuration config = new com.corundumstudio.socketio.Configuration();
        config.setHostname(host);
        config.setPort(port);
        // Allow CORS from web frontend origins
        config.setOrigin("*");

        server = new SocketIOServer(config);
        
        // Register events
        registerListeners(server);

        server.start();
        System.out.println("🚀 Netty-Socket.io server running on port " + port);
        return server;
    }

    private void registerListeners(SocketIOServer server) {
        // Join booking room (Web Client uses booking:join, Mobile uses join-booking)
        server.addEventListener("booking:join", String.class, (client, bookingId, ackSender) -> {
            client.joinRoom(bookingId);
            System.out.println("Client " + client.getSessionId() + " joined booking room: " + bookingId);
        });

        server.addEventListener("join-booking", String.class, (client, bookingId, ackSender) -> {
            client.joinRoom(bookingId);
            System.out.println("Client " + client.getSessionId() + " joined booking room (mobile): " + bookingId);
        });

        // Leave booking room (Web Client uses booking:leave)
        server.addEventListener("booking:leave", String.class, (client, bookingId, ackSender) -> {
            client.leaveRoom(bookingId);
            System.out.println("Client " + client.getSessionId() + " left booking room: " + bookingId);
        });

        // Driver Location Update (Web Client listens to location:update, Mobile listens to driver-location-update)
        server.addEventListener("location:update", Map.class, (client, data, ackSender) -> {
            String bookingId = (String) data.get("bookingId");
            if (bookingId != null) {
                server.getRoomOperations(bookingId).sendEvent("location:update", data);
                server.getRoomOperations(bookingId).sendEvent("driver-location-update", data);
                System.out.println("Broadcasted location:update to booking: " + bookingId);
            }
        });

        server.addEventListener("driver-location-update", Map.class, (client, data, ackSender) -> {
            String bookingId = (String) data.get("bookingId");
            if (bookingId != null) {
                server.getRoomOperations(bookingId).sendEvent("location:update", data);
                server.getRoomOperations(bookingId).sendEvent("driver-location-update", data);
                System.out.println("Broadcasted driver-location-update to booking: " + bookingId);
            }
        });

        // Chat Message Session Room
        server.addEventListener("chat:join", String.class, (client, sessionId, ackSender) -> {
            client.joinRoom(sessionId);
            System.out.println("Client " + client.getSessionId() + " joined chat session: " + sessionId);
        });

        // Send Chat Message
        server.addEventListener("chat:message", Map.class, (client, messageData, ackSender) -> {
            String sessionId = (String) messageData.get("sessionId");
            if (sessionId != null) {
                server.getRoomOperations(sessionId).sendEvent("chat:message", messageData);
                System.out.println("Broadcasted chat:message to session: " + sessionId);
            }
        });
    }

    @PreDestroy
    public void stopSocketIOServer() {
        if (server != null) {
            server.stop();
            System.out.println("🛑 Netty-Socket.io server stopped");
        }
    }
}
