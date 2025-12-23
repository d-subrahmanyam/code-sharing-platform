package com.codesharing.platform.websocket;

import com.codesharing.platform.service.CollaborationService;
import com.codesharing.platform.service.SnippetService;
import com.codesharing.platform.dto.SnippetDTO;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
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
@Controller
@RequiredArgsConstructor
public class CollaborationController {

  private final CollaborationService collaborationService;
  private final SnippetService snippetService;
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

    collaborationService.joinSession(snippetId, userId, username);

    // Set owner from snippet metadata if available, otherwise keep first user as owner
    try {
      SnippetDTO snippet = snippetService.getSnippetById(snippetId);
      if (snippet != null && snippet.getAuthorId() != null) {
        collaborationService.setSessionOwner(snippetId, snippet.getAuthorId());
        System.out.println("[Collaboration] Owner set from snippet: " + snippet.getAuthorId() + " for snippet " + snippetId);
      } else {
        System.out.println("[Collaboration] Snippet not found or has no author for: " + snippetId);
      }
    } catch (Exception e) {
      System.out.println("[Collaboration] Could not load snippet owner: " + e.getMessage());
    }

    // Broadcast updated presence to all subscribers
    List<Map<String, Object>> activeUsers = collaborationService.getActiveUsers(snippetId);
    System.out.println("[Collaboration] Broadcasting presence for snippet " + snippetId + " with users:");
    activeUsers.forEach(u -> {
      System.out.println("  - " + u.get("username") + " (owner: " + u.get("owner") + ")");
    });
    
    // Fetch snippet title to send to joinee
    String snippetTitle = "";
    System.out.println("[Collaboration] Starting snippet title fetch for snippetId: '" + snippetId + "'");
    try {
      SnippetDTO snippet = snippetService.getSnippetById(snippetId);
      System.out.println("[Collaboration] Fetched snippet: " + (snippet != null ? "FOUND" : "NULL"));
      if (snippet != null) {
        String rawTitle = snippet.getTitle();
        System.out.println("[Collaboration] Raw title from DTO: " + (rawTitle == null ? "NULL" : "'" + rawTitle + "'"));
        snippetTitle = rawTitle != null ? rawTitle : "";
        System.out.println("[Collaboration] Snippet title after processing: '" + snippetTitle + "'");
      } else {
        System.out.println("[Collaboration] Snippet is NULL - cannot fetch title");
      }
    } catch (Exception e) {
      System.out.println("[Collaboration] EXCEPTION fetching snippet title: " + e.getMessage());
      e.printStackTrace();
    }
    
    System.out.println("[Collaboration] FINAL: Sending presence with title: '" + snippetTitle + "' (length: " + snippetTitle.length() + ")");
    PresenceMessage msg = new PresenceMessage("user_joined", userId, username, activeUsers, snippetTitle);
    System.out.println("[Collaboration] PresenceMessage object created: type=" + msg.type + ", snippetTitle=" + msg.snippetTitle);
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

    collaborationService.leaveSession(snippetId, userId);

    // Broadcast updated presence to all subscribers
    List<Map<String, Object>> activeUsers = collaborationService.getActiveUsers(snippetId);
    
    // Fetch snippet title to send to remaining users
    String snippetTitle = "";
    System.out.println("[Collaboration] Starting snippet title fetch for user_left on snippetId: '" + snippetId + "'");
    try {
      SnippetDTO snippet = snippetService.getSnippetById(snippetId);
      System.out.println("[Collaboration] Fetched snippet: " + (snippet != null ? "FOUND" : "NULL"));
      if (snippet != null) {
        String rawTitle = snippet.getTitle();
        System.out.println("[Collaboration] Raw title from DTO: " + (rawTitle == null ? "NULL" : "'" + rawTitle + "'"));
        snippetTitle = rawTitle != null ? rawTitle : "";
        System.out.println("[Collaboration] Snippet title after processing: '" + snippetTitle + "'");
      } else {
        System.out.println("[Collaboration] Snippet is NULL - cannot fetch title");
      }
    } catch (Exception e) {
      System.out.println("[Collaboration] EXCEPTION fetching snippet title: " + e.getMessage());
      e.printStackTrace();
    }
    
    System.out.println("[Collaboration] FINAL user_left: Sending presence with title: '" + snippetTitle + "' (length: " + snippetTitle.length() + ")");
    messagingTemplate.convertAndSend(
      "/topic/snippet/" + snippetId + "/presence",
      new PresenceMessage("user_left", userId, "", activeUsers, snippetTitle)
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
   * Message types for WebSocket communication
   */
  public static class PresenceMessage {
    public String type;
    public String userId;
    public String username;
    public List<Map<String, Object>> activeUsers;
    public String snippetTitle;

    public PresenceMessage(String type, String userId, String username, List<Map<String, Object>> activeUsers) {
      this(type, userId, username, activeUsers, "");
    }

    public PresenceMessage(String type, String userId, String username, List<Map<String, Object>> activeUsers, String snippetTitle) {
      this.type = type;
      this.userId = userId;
      this.username = username;
      this.activeUsers = activeUsers;
      this.snippetTitle = snippetTitle;
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
