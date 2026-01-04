package com.codesharing.platform.websocket;

import com.codesharing.platform.service.CollaborationService;
import com.codesharing.platform.service.SnippetService;
import com.codesharing.platform.service.AdminDashboardService;
import com.codesharing.platform.entity.SessionHistory;
import com.codesharing.platform.dto.SnippetDTO;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

/**
 * WebSocket Message Controller
 * Handles STOMP messages for collaborative editing
 * Routes presence updates, typing indicators, and code changes
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class CollaborationController {

  private final CollaborationService collaborationService;
  private final SnippetService snippetService;
  private final AdminDashboardService adminDashboardService;
  private final SimpMessagingTemplate messagingTemplate;

  /**
   * Handle user joining a snippet session
   * Message: /app/snippet/{snippetId}/join
   */
  @MessageMapping("/snippet/{snippetId}/join")
  public void handleUserJoin(
    @DestinationVariable String snippetId,
    @Payload Map<String, String> payload
  ) {
    String userId = payload.get("userId");
    String username = payload.get("username");
    String ipAddress = payload.get("ipAddress");
    String userAgent = payload.get("userAgent");
    String browserName = payload.get("browserName");
    String browserVersion = payload.get("browserVersion");
    String osName = payload.get("osName");
    String osVersion = payload.get("osVersion");

    collaborationService.joinSession(snippetId, userId, username);

    // Set owner from snippet metadata if available, otherwise keep first user as owner
    try {
      SnippetDTO snippet = snippetService.getSnippetById(snippetId);
      if (snippet != null && snippet.getAuthorId() != null) {
        collaborationService.setSessionOwner(snippetId, snippet.getAuthorId());
        log.info("[Collaboration] Owner set from snippet: {} for snippet {}", snippet.getAuthorId(), snippetId);
      } else {
        log.warn("[Collaboration] Snippet not found or has no author for: {}", snippetId);
      }
    } catch (Exception e) {
      log.error("[Collaboration] Could not load snippet owner: {}", e.getMessage(), e);
    }

    // Track participant in admin dashboard
    try {
      log.info("[Collaboration] Tracking participant join: snippetId={}, userId={}, username={}", 
               snippetId, userId, username);
      
      // Get or create session history entry
      Optional<SessionHistory> sessionOpt = adminDashboardService.getSessionBySnippetId(snippetId);
      SessionHistory session;
      
      if (sessionOpt.isPresent()) {
        session = sessionOpt.get();
        log.info("[Collaboration] Found existing session for snippet {}", snippetId);
      } else {
        // Session wasn't created during snippet creation (shouldn't happen with our fix, but be safe)
        SnippetDTO snippet = snippetService.getSnippetById(snippetId);
        String ownerUsername = snippet != null && snippet.getAuthorId() != null ? 
                              snippet.getAuthorId() : "anonymous";
        Boolean isAnonymous = snippet != null && "anonymous".equals(snippet.getAuthorId());
        
        session = adminDashboardService.createSession(
          snippetId,
          snippet != null ? snippet.getAuthorId() : "anonymous",
          ownerUsername,
          null,
          isAnonymous,
          snippet != null ? snippet.getTitle() : "Untitled",
          snippet != null ? snippet.getLanguage() : "unknown"
        );
        log.info("[Collaboration] Created session for snippet {} (retroactive)", snippetId);
      }
      
      // Add participant to session
      Boolean isOwner = userId.equals(session.getOwnerId());
      Boolean isAnonymousUser = "anonymous".equals(userId);
      
      adminDashboardService.addParticipant(
        session,
        userId,
        username,
        isOwner,
        isAnonymousUser,
        ipAddress,
        userAgent,
        browserName,
        browserVersion,
        osName,
        osVersion
      );
      
      log.info("[Collaboration] Participant added to session: snippetId={}, userId={}, isOwner={}", 
               snippetId, userId, isOwner);
    } catch (Exception e) {
      log.error("[Collaboration] Failed to track participant join for snippet {}: {}", 
                snippetId, e.getMessage(), e);
    }

    // Broadcast updated presence to all subscribers
    List<Map<String, Object>> activeUsers = collaborationService.getActiveUsers(snippetId);
    log.info("[Collaboration] Broadcasting presence for snippet {} with {} users", snippetId, activeUsers.size());
    activeUsers.forEach(u -> {
      log.debug("[Collaboration]   - {} (owner: {})", u.get("username"), u.get("owner"));
    });
    
    // Fetch snippet title to send to joinee
    String snippetTitle = "";
    log.info("[Collaboration] Starting snippet title fetch for snippetId: '{}'", snippetId);
    try {
      SnippetDTO snippet = snippetService.getSnippetById(snippetId);
      log.info("[Collaboration] Fetched snippet: {}", snippet != null ? "FOUND" : "NULL");
      if (snippet != null) {
        String rawTitle = snippet.getTitle();
        log.debug("[Collaboration] Raw title from DTO: {}", rawTitle == null ? "NULL" : "'" + rawTitle + "'");
        snippetTitle = rawTitle != null ? rawTitle : "";
        log.debug("[Collaboration] Snippet title after processing: '{}'", snippetTitle);
      } else {
        log.warn("[Collaboration] Snippet is NULL - cannot fetch title");
      }
    } catch (Exception e) {
      log.error("[Collaboration] Exception fetching snippet title: {}", e.getMessage(), e);
    }
    
    log.info("[Collaboration] Final: Sending presence with title: '{}' (length: {})", snippetTitle, snippetTitle.length());
    PresenceMessage msg = new PresenceMessage("user_joined", userId, username, activeUsers, snippetTitle);
    log.debug("[Collaboration] PresenceMessage object created: type={}, snippetTitle={}", msg.type, msg.snippetTitle);
    messagingTemplate.convertAndSend(
      "/topic/snippet/" + snippetId + "/presence",
      msg
    );
  }

  /**
   * Handle user leaving a snippet session
   * Message: /app/snippet/{snippetId}/leave
   */
  @MessageMapping("/snippet/{snippetId}/leave")
  public void handleUserLeave(
    @DestinationVariable String snippetId,
    @Payload Map<String, String> payload
  ) {
    String userId = payload.get("userId");
    String username = payload.get("username");

    collaborationService.leaveSession(snippetId, userId);

    // Track participant departure in admin dashboard
    try {
      log.info("[Collaboration] Tracking participant departure: snippetId={}, userId={}", snippetId, userId);
      
      Optional<SessionHistory> sessionOpt = adminDashboardService.getSessionBySnippetId(snippetId);
      if (sessionOpt.isPresent()) {
        SessionHistory session = sessionOpt.get();
        adminDashboardService.markParticipantLeft(session, userId);
        log.info("[Collaboration] Participant marked as departed: snippetId={}, userId={}", snippetId, userId);
      } else {
        log.warn("[Collaboration] Session not found for departing participant: snippetId={}", snippetId);
      }
    } catch (Exception e) {
      log.error("[Collaboration] Failed to track participant departure for snippet {}: {}", 
                snippetId, e.getMessage(), e);
    }

    // Broadcast updated presence to all subscribers
    List<Map<String, Object>> activeUsers = collaborationService.getActiveUsers(snippetId);
    
    // Fetch snippet title to send to remaining users
    String snippetTitle = "";
    log.info("[Collaboration] Starting snippet title fetch for user_left on snippetId: '{}'", snippetId);
    try {
      SnippetDTO snippet = snippetService.getSnippetById(snippetId);
      log.debug("[Collaboration] Fetched snippet: {}", snippet != null ? "FOUND" : "NULL");
      if (snippet != null) {
        String rawTitle = snippet.getTitle();
        log.debug("[Collaboration] Raw title from DTO: {}", rawTitle == null ? "NULL" : "'" + rawTitle + "'");
        snippetTitle = rawTitle != null ? rawTitle : "";
        log.debug("[Collaboration] Snippet title after processing: '{}'", snippetTitle);
      } else {
        log.warn("[Collaboration] Snippet is NULL - cannot fetch title");
      }
    } catch (Exception e) {
      log.error("[Collaboration] Exception fetching snippet title: {}", e.getMessage(), e);
    }
    
    log.info("[Collaboration] Final user_left: Sending presence with title: '{}' (length: {})", 
             snippetTitle, snippetTitle.length());
    messagingTemplate.convertAndSend(
      "/topic/snippet/" + snippetId + "/presence",
      new PresenceMessage("user_left", userId, username != null ? username : "", activeUsers, snippetTitle)
    );
  }

  /**
   * Handle code changes
   * Message: /app/snippet/{snippetId}/code
   */
  @MessageMapping("/snippet/{snippetId}/code")
  public void handleCodeChange(
    @DestinationVariable String snippetId,
    @Payload CodeChangeMessage codeChange
  ) {
    System.out.println("[CodeChange] Received code change from " + codeChange.username + " for snippet " + snippetId);
    System.out.println("[CodeChange] Code length: " + (codeChange.code != null ? codeChange.code.length() : 0) + " Language: " + codeChange.language);
    
    // Broadcast code change to all subscribers (except sender if needed)
    messagingTemplate.convertAndSend(
      "/topic/snippet/" + snippetId + "/code",
      codeChange
    );
    
    System.out.println("[CodeChange] Broadcasted to /topic/snippet/" + snippetId + "/code");
  }

  /**
   * Handle typing indicator
   * Message: /app/snippet/{snippetId}/typing
   */
  @MessageMapping("/snippet/{snippetId}/typing")
  public void handleTypingIndicator(
    @DestinationVariable String snippetId,
    @Payload TypingIndicatorMessage typing
  ) {
    System.out.println("[Typing] User " + typing.userId + " is " + (typing.isTyping ? "typing" : "not typing") + " in snippet " + snippetId);
    
    collaborationService.setUserTyping(snippetId, typing.userId, typing.isTyping);

    // Broadcast typing status with usernames to all subscribers
    List<Map<String, String>> typingUsers = collaborationService.getTypingUsersWithNames(snippetId);
    messagingTemplate.convertAndSend(
      "/topic/snippet/" + snippetId + "/typing",
      new TypingStatusMessage(typingUsers)
    );
    
    System.out.println("[Typing] Broadcasting " + typingUsers.size() + " typing users to /topic/snippet/" + snippetId + "/typing");
  }

  /**
   * Get active users in snippet (on-demand query)
   * Message: /app/snippet/{snippetId}/users
   */
  @MessageMapping("/snippet/{snippetId}/users")
  public void getActiveUsers(
    @DestinationVariable String snippetId
  ) {
    List<Map<String, Object>> activeUsers = collaborationService.getActiveUsers(snippetId);
    messagingTemplate.convertAndSend(
      "/topic/snippet/" + snippetId + "/users",
      new ActiveUsersMessage(activeUsers, activeUsers.size())
    );
  }

  /**
   * Handle metadata updates (title, description, language, tags)
   * Message: /app/snippet/{snippetId}/metadata
   */
  @MessageMapping("/snippet/{snippetId}/metadata")
  public void handleMetadataUpdate(
    @DestinationVariable String snippetId,
    @Payload MetadataUpdateMessage metadata
  ) {
    System.out.println("[Metadata] Received metadata update from user " + metadata.userId + " for snippet " + snippetId);
    
    // Broadcast metadata update to all subscribers
    messagingTemplate.convertAndSend(
      "/topic/snippet/" + snippetId + "/metadata",
      metadata
    );
    
    System.out.println("[Metadata] Broadcasted to /topic/snippet/" + snippetId + "/metadata");
  }

  /**
   * Handle state sync request from joinee
   * When a joinee joins, they request the current code and metadata from owner
   * Message: /app/snippet/{snippetId}/sync-state
   */
  @MessageMapping("/snippet/{snippetId}/sync-state")
  public void handleSyncStateRequest(
    @DestinationVariable String snippetId,
    @Payload Map<String, String> payload
  ) {
    String userId = payload.get("userId");
    String username = payload.get("username");
    
    System.out.println("[Sync] User " + username + " (" + userId + ") requesting state sync for snippet " + snippetId);
    
    // In a real-time collaboration, the owner's state is in memory on the frontend.
    // We send an empty state sync response, and the frontend will handle broadcasting
    // the owner's current state when they receive this request.
    // This is a signal that says "a new user joined, send them your current state"
    
    Map<String, Object> syncMessage = new HashMap<>();
    syncMessage.put("type", "state-sync-request");
    syncMessage.put("requesterId", userId);
    syncMessage.put("requesterUsername", username);
    syncMessage.put("timestamp", System.currentTimeMillis());
    
    messagingTemplate.convertAndSend(
      "/topic/snippet/" + snippetId + "/sync",
      syncMessage
    );
    
    System.out.println("[Sync] Broadcasted sync request from " + username + " to all subscribers");
  }

  /**
   * Message types for WebSocket communication
   */
  public static class PresenceMessage {
    public String type;
    public String userId;
    public String username;
    public List<Map<String, Object>> activeUsers;
    public String snippetTitle;
    // Owner's current metadata for joinee synchronization
    public String ownerTitle;
    public String ownerDescription;
    public String ownerLanguage;
    public List<String> ownerTags;

    public PresenceMessage(String type, String userId, String username, List<Map<String, Object>> activeUsers) {
      this(type, userId, username, activeUsers, "");
    }

    public PresenceMessage(String type, String userId, String username, List<Map<String, Object>> activeUsers, String snippetTitle) {
      this.type = type;
      this.userId = userId;
      this.username = username;
      this.activeUsers = activeUsers;
      this.snippetTitle = snippetTitle;
      this.ownerTitle = "";
      this.ownerDescription = "";
      this.ownerLanguage = "";
      this.ownerTags = new ArrayList<>();
    }
  }

  public static class CodeChangeMessage {
    public String userId;
    public String username;
    public String code;
    public String language;
    public long timestamp;

    // Default constructor for deserialization
    public CodeChangeMessage() {}
  }

  public static class TypingIndicatorMessage {
    public String userId;
    public boolean isTyping;

    // Default constructor for deserialization
    public TypingIndicatorMessage() {}
  }

  public static class TypingStatusMessage {
    public List<Map<String, String>> typingUsers;

    public TypingStatusMessage(List<Map<String, String>> typingUsers) {
      this.typingUsers = typingUsers;
    }
  }

  public static class ActiveUsersMessage {
    public List<Map<String, Object>> users;
    public int count;

    public ActiveUsersMessage(List<Map<String, Object>> users, int count) {
      this.users = users;
      this.count = count;
    }
  }

  public static class MetadataUpdateMessage {
    public String userId;
    public String title;
    public String description;
    public String language;
    public List<String> tags;
    public long timestamp;

    // Default constructor for deserialization
    public MetadataUpdateMessage() {}
  }
}
