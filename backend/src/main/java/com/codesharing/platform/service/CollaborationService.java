package com.codesharing.platform.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

/**
 * Collaboration Service
 * Manages active user sessions, presence tracking, and typing indicators
 * Uses in-memory storage (can be upgraded to Redis for horizontal scaling)
 */
@Service
public class CollaborationService {

  /**
   * Structure: snippetId -> (userId -> UserPresence)
   */
  private final Map<String, Map<String, UserPresence>> activePresence = new ConcurrentHashMap<>();

  /**
   * Structure: snippetId -> (userId -> typing status)
   */
  private final Map<String, Map<String, Boolean>> typingIndicators = new ConcurrentHashMap<>();

  /**
   * Structure: snippetId -> owner userId
   * Tracks the first user who joined (the session owner)
   */
  private final Map<String, String> sessionOwners = new ConcurrentHashMap<>();

  /**
   * User presence information
   */
  public static class UserPresence {
    public String userId;
    public String username;
    public LocalDateTime joinedAt;
    public LocalDateTime lastActivity;

    public UserPresence(String userId, String username) {
      this.userId = userId;
      this.username = username;
      this.joinedAt = LocalDateTime.now();
      this.lastActivity = LocalDateTime.now();
    }
  }

  /**
   * Add user to snippet session
   * First user to join becomes the owner (if not already set)
   */
  public void joinSession(String snippetId, String userId, String username) {
    activePresence
      .computeIfAbsent(snippetId, k -> new ConcurrentHashMap<>())
      .put(userId, new UserPresence(userId, username));
    
    // Mark first user as owner (if owner not already set)
    sessionOwners.computeIfAbsent(snippetId, k -> userId);
  }

  /**
   * Set the owner for a snippet session
   * Used when loading snippet from database to restore owner info
   */
  public void setSessionOwner(String snippetId, String ownerId) {
    sessionOwners.put(snippetId, ownerId);
  }

  /**
   * Remove user from snippet session
   */
  public void leaveSession(String snippetId, String userId) {
    if (activePresence.containsKey(snippetId)) {
      activePresence.get(snippetId).remove(userId);
      if (activePresence.get(snippetId).isEmpty()) {
        activePresence.remove(snippetId);
        typingIndicators.remove(snippetId);
      }
    }
  }

  /**
   * Get all active users in a snippet session
   * Includes owner flag for each user
   */
  public List<Map<String, Object>> getActiveUsers(String snippetId) {
    List<Map<String, Object>> users = new ArrayList<>();
    String ownerId = sessionOwners.get(snippetId);
    
    if (activePresence.containsKey(snippetId)) {
      for (UserPresence presence : activePresence.get(snippetId).values()) {
        Map<String, Object> userData = new HashMap<>();
        userData.put("userId", presence.userId);
        userData.put("username", presence.username);
        userData.put("joinedAt", presence.joinedAt);
        userData.put("isTyping", typingIndicators
          .getOrDefault(snippetId, new HashMap<>())
          .getOrDefault(presence.userId, false));
        userData.put("owner", presence.userId.equals(ownerId));
        users.add(userData);
      }
    }
    return users;
  }

  /**
   * Update user typing status
   */
  public void setUserTyping(String snippetId, String userId, boolean isTyping) {
    if (isTyping) {
      typingIndicators
        .computeIfAbsent(snippetId, k -> new ConcurrentHashMap<>())
        .put(userId, true);
    } else {
      if (typingIndicators.containsKey(snippetId)) {
        typingIndicators.get(snippetId).remove(userId);
        if (typingIndicators.get(snippetId).isEmpty()) {
          typingIndicators.remove(snippetId);
        }
      }
    }
  }

  /**
   * Get typing users for a snippet (user IDs only)
   */
  public List<String> getTypingUsers(String snippetId) {
    List<String> typingUsers = new ArrayList<>();
    if (typingIndicators.containsKey(snippetId)) {
      typingIndicators.get(snippetId).forEach((userId, isTyping) -> {
        if (isTyping && activePresence.containsKey(snippetId) && activePresence.get(snippetId).containsKey(userId)) {
          typingUsers.add(userId);
        }
      });
    }
    return typingUsers;
  }

  /**
   * Get typing users with their usernames for a snippet
   */
  public List<Map<String, String>> getTypingUsersWithNames(String snippetId) {
    List<Map<String, String>> typingUsers = new ArrayList<>();
    if (typingIndicators.containsKey(snippetId) && activePresence.containsKey(snippetId)) {
      Map<String, UserPresence> presences = activePresence.get(snippetId);
      typingIndicators.get(snippetId).forEach((userId, isTyping) -> {
        if (isTyping && presences.containsKey(userId)) {
          Map<String, String> userMap = new HashMap<>();
          userMap.put("userId", userId);
          userMap.put("username", presences.get(userId).username);
          typingUsers.add(userMap);
        }
      });
    }
    return typingUsers;
  }

  /**
   * Check if user is in session
   */
  public boolean isUserInSession(String snippetId, String userId) {
    return activePresence.containsKey(snippetId) && activePresence.get(snippetId).containsKey(userId);
  }

  /**
   * Get count of active users
   */
  public int getActiveUserCount(String snippetId) {
    return activePresence.getOrDefault(snippetId, new HashMap<>()).size();
  }

  /**
   * Get the owner userId for a snippet
   */
  public String getSessionOwner(String snippetId) {
    return sessionOwners.get(snippetId);
  }
}
