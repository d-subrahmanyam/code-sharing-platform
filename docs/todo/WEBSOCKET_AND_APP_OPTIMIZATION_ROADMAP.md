# WebSocket and Application Optimization Roadmap

**Created:** December 29, 2025  
**Status:** Pending  
**Priority:** Medium-High  
**Estimated Effort:** 2-3 sprints

---

## Overview

This document outlines optimization opportunities for the Code Sharing Platform, focusing on WebSocket performance, application efficiency, and user experience improvements. These enhancements should be implemented after core features are stable.

---

## 🚀 WebSocket Optimization Todos

### Phase 1: Message Efficiency (High Impact, Medium Effort)

#### 1.1 Delta Updates (Code Change Diffing)
**Goal:** Send only code changes, not full content  
**Current Behavior:** Entire code snippet sent on every keystroke  
**Optimization:**
```typescript
// Send only the difference
{
  type: 'CODE_DELTA',
  snippetId: '123',
  changes: [
    { start: 45, end: 45, text: 'const' },
    { start: 50, end: 60, text: '' }
  ],
  version: 15
}
```

**Benefits:**
- Reduce message payload by 90%+ for large snippets
- Lower bandwidth usage
- Faster message transmission
- Better mobile performance

**Files to Modify:**
- `frontend/src/hooks/useWebSocketCollaboration.ts` - Add delta computation
- `frontend/src/services/webSocketService.ts` - Handle delta serialization
- `backend/src/main/java/com/codesharing/platform/websocket/CollaborationController.java` - Apply delta updates

**Dependencies:** Diff library (e.g., `diff-match-patch` or `jsondiffpatch`)

**Acceptance Criteria:**
- [ ] Delta updates sent instead of full code
- [ ] Bandwidth reduced by 80%+
- [ ] No visual differences in editor
- [ ] Backward compatible with full updates as fallback

---

#### 1.2 Message Compression
**Goal:** Compress JSON messages before transmission  
**Current Behavior:** Raw JSON sent over wire  
**Optimization:**
```typescript
// Compress large messages
if (message.length > 1024) {
  const compressed = LZ4.compress(message)
  ws.send({ compressed: true, data: compressed })
} else {
  ws.send(message)
}
```

**Benefits:**
- 40-60% size reduction for code messages
- Faster transmission over slow connections
- Reduced server bandwidth costs

**Implementation Options:**
- LZ4 (fast, good compression)
- Brotli (better compression, slower)
- DEFLATE (standard, good balance)

**Files to Modify:**
- `frontend/src/services/webSocketService.ts` - Add compression/decompression
- `backend/src/main/java/com/codesharing/platform/websocket/MessageHandler.java` - Handle compression

**Acceptance Criteria:**
- [ ] Messages > 1KB compressed automatically
- [ ] Decompression transparent to application
- [ ] Network tab shows 40%+ size reduction
- [ ] No CPU impact on mobile devices

---

### Phase 2: Message Rate Control (High Impact, Low Effort)

#### 2.1 Debouncing & Throttling
**Goal:** Reduce message frequency from rapid keystrokes  
**Current Behavior:** Every keystroke sends update immediately  
**Optimization:**
```typescript
// Group rapid updates
const handleCodeChange = debounce((code) => {
  sendCodeUpdate(code)
}, 300) // Wait 300ms before sending

// OR throttle to max frequency
const throttledUpdate = throttle((code) => {
  sendCodeUpdate(code)
}, 100) // Max 10 messages/second
```

**Benefits:**
- Reduce messages by 70-80% during typing
- Lower server load
- Better battery life on mobile
- More responsive UI (less competing updates)

**Current State:**
- Already partially implemented in `EditorPage.tsx`
- Can be optimized further

**Files to Modify:**
- `frontend/src/pages/EditorPage.tsx` - Fine-tune debounce timing
- `frontend/src/hooks/useWebSocketCollaboration.ts` - Add throttling for other message types

**Acceptance Criteria:**
- [ ] Messages reduced by 70%+ during normal typing
- [ ] Visual lag < 100ms (user perception)
- [ ] No message loss during rapid typing
- [ ] Configurable per message type

---

#### 2.2 Presence/Cursor Updates Batching
**Goal:** Batch presence and cursor movement messages  
**Current Behavior:** Each presence change is individual message  
**Optimization:**
```typescript
// Batch presence updates every 500ms
const presenceBatch = {
  type: 'BATCH',
  messages: [
    { type: 'PRESENCE', userId: '123', status: 'active' },
    { type: 'CURSOR', userId: '123', line: 45, col: 10 },
    { type: 'TYPING', userId: '456', status: true }
  ]
}
```

**Benefits:**
- Multiple updates in single message
- Reduce overhead by 60-70%
- Atomic state updates on receiver

**Files to Modify:**
- `frontend/src/services/webSocketService.ts` - Add message batching logic
- `backend/src/main/java/com/codesharing/platform/websocket/CollaborationController.java` - Handle batch messages

**Acceptance Criteria:**
- [ ] Messages batched every 500ms
- [ ] No visibility lag for presence/cursors
- [ ] Message count reduced by 60%+
- [ ] Atomic updates (all or nothing)

---

### Phase 3: Connection Management (Medium Impact, Medium Effort)

#### 3.1 Connection Pooling & Multiplexing
**Goal:** Reuse connections for multiple message types  
**Current Behavior:** Single WebSocket for all message types  
**Opportunity:**
```typescript
// Already using single connection well
// Could optimize further with:
// - Separate channels for different message priorities
// - High-priority (code): Channel 1
// - Medium-priority (presence): Channel 2
// - Low-priority (logging): Channel 3
```

**Benefits:**
- Better priority management
- Easier to implement QoS (Quality of Service)
- Prevent slow operations from blocking critical updates

**Implementation Note:** Low priority for now - single connection works well

---

#### 3.2 Intelligent Reconnection Strategy
**Goal:** Smarter handling of disconnections  
**Current Behavior:** Simple exponential backoff  
**Optimization:**
```typescript
class ReconnectionStrategy {
  - Start: 1 second
  - Max: 30 seconds
  - Backoff: Exponential with jitter
  - Max attempts: Unlimited
  - Detect network change: Add data saver mode detection
}
```

**Benefits:**
- Faster recovery on temporary network issues
- Better behavior on slow connections
- Mobile data saver detection
- Graceful degradation

**Files to Modify:**
- `frontend/src/services/webSocketService.ts` - Enhanced reconnection logic
- `frontend/src/hooks/useWebSocketCollaboration.ts` - Network state detection

**Acceptance Criteria:**
- [ ] Reconnect within 3-5 seconds on network recovery
- [ ] Exponential backoff with jitter (prevent thundering herd)
- [ ] Detect mobile data saver mode
- [ ] Show user-friendly connection status messages

---

## 🎯 General Application Optimization Todos

### Phase 1: Frontend Performance

#### 1.1 Code Splitting & Lazy Loading
**Goal:** Reduce initial bundle size  
**Current State:** Entire app loads upfront  
**Opportunity:**
```typescript
// Lazy load routes
const OwnerEditorPage = lazy(() => import('./pages/OwnerEditorPage'))
const JoineeEditorPage = lazy(() => import('./pages/JoineeEditorPage'))
const AdminPanel = lazy(() => import('./pages/AdminPanel')) // Future
```

**Benefits:**
- Reduce initial JS by 40-50%
- Faster time to interactive
- Better mobile performance
- Smaller app download

**Target:** < 200KB initial bundle

---

#### 1.2 Editor Component Optimization
**Goal:** Reduce re-renders in editor  
**Current State:** Full editor re-renders on code changes  
**Opportunities:**
```typescript
// Memoize editor component
const Editor = memo(EditorComponent, (prev, next) => {
  return prev.code === next.code && prev.language === next.language
})

// Virtual scrolling for large files
<VirtualList
  items={lines}
  itemHeight={20}
  height={containerHeight}
/>
```

**Benefits:**
- 60-70% fewer re-renders
- Smoother typing experience
- Better handling of large snippets (10k+ lines)

---

#### 1.3 Image & Asset Optimization
**Goal:** Optimize media delivery  
**Opportunities:**
- [ ] Compress SVGs (Logo, Icons)
- [ ] Lazy load images
- [ ] WebP format for images
- [ ] Optimize font loading
- [ ] Remove unused CSS

**Target:** 30KB initial CSS/Images

---

### Phase 2: Backend Performance

#### 2.1 Database Query Optimization
**Goal:** Faster snippet retrieval  
**Opportunities:**
```java
// Add database indexes
@Index(columnList = "tinyCode")
private String tinyCode;

@Index(columnList = "ownerId, createdAt")
private String ownerId;

// Pagination for snippet lists
@Query("SELECT s FROM Snippet s WHERE ownerId = ?1 ORDER BY createdAt DESC LIMIT 20")
List<Snippet> findUserSnippets(String ownerId, Pageable page);
```

**Benefits:**
- Reduce query time from 500ms to 50ms
- Better handling of large datasets
- Faster snippet list loading

---

#### 2.2 Caching Strategy
**Goal:** Reduce database hits  
**Opportunities:**
```java
// Cache frequently accessed snippets
@Cacheable(value = "snippets", key = "#tinyCode")
public Snippet getSnippetByTinyCode(String tinyCode) {
  return snippetRepository.findByTinyCode(tinyCode);
}

// TTL: 1 hour for shared snippets
```

**Benefits:**
- 90% reduction in database hits for popular snippets
- Faster response times
- Lower server load

---

#### 2.3 API Response Compression
**Goal:** Compress API responses  
**Current State:** Uncompressed JSON  
**Implementation:**
```java
// Enable Gzip compression in Spring Boot
server.compression.enabled=true
server.compression.min-response-size=1024
```

**Benefits:**
- 60-70% response size reduction
- Faster API calls
- Lower bandwidth usage

---

### Phase 3: Real-time Features

#### 3.1 Presence Optimization
**Goal:** More efficient user presence tracking  
**Current State:** Full presence list on every update  
**Optimization:**
```typescript
// Only send presence diffs
{
  type: 'PRESENCE_UPDATE',
  added: [{ id: '123', username: 'john' }],
  removed: ['456'],
  modified: [{ id: '789', status: 'idle' }]
}
```

**Benefits:**
- Reduce presence message size by 80%
- Faster user list updates
- Better scalability with many users

---

#### 3.2 Collaborative Features Enhancement
**Goal:** Improve collaboration experience  
**Future Features:**
- [ ] Cursor position tracking (show where others are typing)
- [ ] Highlight collaborator changes (color-coded)
- [ ] User activity timeline (who changed what when)
- [ ] Session recording & playback
- [ ] Code review mode (comments on lines)

---

## 📊 Performance Metrics to Track

### Frontend Metrics
- [ ] First Contentful Paint (FCP) - Target: < 1.5s
- [ ] Largest Contentful Paint (LCP) - Target: < 2.5s
- [ ] Cumulative Layout Shift (CLS) - Target: < 0.1
- [ ] Time to Interactive (TTI) - Target: < 3.5s
- [ ] Bundle size - Target: < 300KB (gzipped)

### WebSocket Metrics
- [ ] Message latency (p95) - Target: < 100ms
- [ ] Message throughput - Target: 100+ msg/sec per client
- [ ] Connection establishment time - Target: < 2s
- [ ] Reconnection time - Target: < 5s
- [ ] Message loss rate - Target: < 0.1%

### Backend Metrics
- [ ] API response time (p95) - Target: < 100ms
- [ ] WebSocket message processing - Target: < 50ms
- [ ] Database query time - Target: < 50ms
- [ ] Server CPU usage - Target: < 70% at peak
- [ ] Memory usage - Target: < 2GB

---

## 🔧 Implementation Priority

### High Priority (Do First)
1. Delta updates for code
2. Message debouncing optimization
3. Lazy loading for routes
4. Database indexes

**Estimated Impact:** 3-5x performance improvement  
**Effort:** 1-2 weeks

### Medium Priority (Do Next)
1. Message compression
2. Presence batching
3. Connection pooling
4. Database caching

**Estimated Impact:** 2-3x additional improvement  
**Effort:** 2-3 weeks

### Low Priority (Nice to Have)
1. Virtual scrolling for large files
2. Cursor position tracking
3. Code review features
4. Session recording

**Estimated Impact:** Better UX  
**Effort:** 3-4 weeks

---

## 📝 Checklist for Implementation

- [ ] Set up performance monitoring (e.g., Sentry, DataDog)
- [ ] Establish baseline metrics before optimization
- [ ] Profile application to identify bottlenecks
- [ ] Implement optimizations one at a time
- [ ] Measure improvement after each change
- [ ] Document performance gains
- [ ] Update performance budgets
- [ ] Set up continuous performance testing
- [ ] Create load testing scenarios
- [ ] Test on mobile devices (3G, 4G networks)
- [ ] Benchmark against competitors

---

## 📚 Tools & Libraries Recommended

**Frontend:**
- `diff-match-patch` - Delta computation
- `lz4-wasm` - Fast compression
- `react-virtual` - Virtual scrolling
- `web-vitals` - Performance metrics

**Backend:**
- Spring Boot Actuator - Monitoring
- Micrometer - Metrics collection
- JProfiler or YourKit - Performance profiling
- Apache JMeter - Load testing

**DevOps:**
- Grafana - Metrics visualization
- Prometheus - Time-series metrics
- New Relic or DataDog - APM

---

## 🎓 Learning Resources

- [Web Performance Working Group](https://www.w3.org/webperf/)
- [WebSocket Best Practices](https://www.html5rocks.com/en/tutorials/websockets/basics/)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Spring Boot Performance Tuning](https://spring.io/blog/2015/12/21/spring-framework-5-0-webflux-and-netty-by-example)

---

## 📞 Notes & Assumptions

- WebSocket library: STOMP/SockJS (already in use)
- Database: PostgreSQL + MongoDB (already in use)
- Frontend Framework: React 18 (supports concurrent rendering)
- Target browsers: Chrome, Firefox, Safari (last 2 versions)
- Mobile target: iOS Safari, Chrome Mobile (3G+ speeds)

**Next Review Date:** After initial feature set is stable (Q1 2026)

---

**Document Version:** 1.0  
**Last Updated:** December 29, 2025  
**Author:** Development Team  
**Status:** For Future Reference
