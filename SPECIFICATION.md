# **Agorapulse Parity Application Specification**

## **1\. Project Overview**

Application Name: MTSynergy  
Tagline: Schedule once. Post everywhere. Short-form video automation.  
**Project Goal:** To develop a comprehensive social media management platform that achieves full functional parity with Agorapulse, focusing on content publishing, unified inbox management, reporting, and team collaboration.

**Architecture Focus:** The application will be built using a highly scalable, decoupled architecture featuring a Micro Frontend (MFE) structure for the web, a dedicated Backend For Frontend (BFF) layer, and a cross-platform mobile application.

## **2\. Architectural Blueprint**

The system follows a three-layer architecture designed for independent deployment and technology selection flexibility.

### **2.1 Micro Frontends (MFE)**

* **Role:** The web application is split into independent, domain-specific front-end applications (e.g., "Publishing MFE," "Inbox MFE," "Reporting MFE").  
* **Benefits:** Allows different teams to own, develop, and deploy front-end features independently, accelerating development cycles.  
* **Technology:** React.js.

### **2.2 Backend For Frontend (BFF)**

* **Role:** The single entry point for the Web (MFE) and Mobile (React Native) applications. It aggregates data from various downstream Core Microservices and transforms it into a format optimized for the specific client (Web or Mobile).  
* **Benefits:** Decouples the UI from the Core Microservices, optimizes network payloads, and centralizes client-specific business logic (e.g., routing, session management, UI permissions).  
* **Technology:** Kotlin on Spring Boot 3.2.

### **2.3 Core Microservices (CMS)**

* **Role:** The stateless or stateful services that handle core business logic, data persistence, and third-party API integrations (e.g., Facebook, Instagram, X/Twitter APIs). (Implementation details are out of scope for this document but assume a polyglot approach.)

## **3\. Technology Stack and Tooling**

| Layer | Component | Technology | Version / Requirement | Notes |
| :---- | :---- | :---- | :---- | :---- |
| **Web Frontend** | MFE Shell + Children | React (TypeScript) | Latest Stable | Deployed as CloudFlare Workers; Main Worker orchestrates Child Worker fragments via service bindings. |
| **Web Frontend** | MFE Composition | CloudFlare Workers | Latest | Fragment architecture with server-side HTML composition and streaming; zero CORS complexity. |
| **Web Frontend** | Shared Assets | React + Design Tokens | Latest Stable | Bundled and deployed to CloudFlare R2 CDN; imported via import maps in Worker fragments. |
| **Mobile App** | Cross-Platform | React Native | Latest Stable | Targets iOS (App Store) and Android (Play Store); shares core TypeScript types with BFF. |
| **BFF Backend** | Runtime | Java Virtual Machine (JVM) | Java 21 (LTS) | Latest stable LTS release; deployed as container in k3s cluster. |
| **BFF Backend** | Language | Kotlin | Latest Stable | Focus on leveraging modern Kotlin features (Coroutines, Flow). |
| **BFF Backend** | Framework | Spring Boot | 3.2.x | Spring Boot 3.2 compatible with Java 21. |
| **BFF Backend** | Build Tool | Gradle | 9.2 | Mandatory use of **Kotlin DSL** (.kts) for build files. |
| **BFF Backend** | Coroutines | Kotlinx.coroutines | Latest Stable | Essential for non-blocking, asynchronous I/O aggregation in the BFF layer. |
| **BFF Backend** | Secrets Management | HashiCorp Vault | Latest | Self-hosted in k3s; encrypts OAuth tokens at rest, rotates keys every 90 days. |
| **CI/CD Pipeline** | Build & Deployment | OneDev | Latest | Self-hosted on k3s; built-in registry for npm packages and Docker images. |
| **Cloud Edge** | Security & CDN | CloudFlare | Latest | Workers for MFE composition; Zero Trust for perimeter security; R2 for asset hosting. |

## **4\. Core Feature Requirements (Agorapulse Parity)**

The application must provide the following core functional domains:

### **4.1 Social Account Management & Setup**

* **Account Connections:** Ability to securely connect and manage accounts for all major platforms (Facebook Pages/Groups, Instagram Business/Creator, X/Twitter, LinkedIn Pages/Profiles, Google Business Profile, YouTube).  
* **Access Control:** Granular permissions mapping Agorapulse's team roles (Admin, Moderator, Editor, Guest).  
* **Connection Health:** Real-time monitoring and alerting for expired/revoked platform tokens.

### **4.2 Publishing and Scheduling**

* **Unified Composer:** A single interface for creating posts across all connected platforms.  
* **Content Customization:** Platform-specific preview and customization features (e.g., cropping, link previews, first comment for Instagram).  
* **Scheduling:**  
  * Direct scheduling (set specific date/time).  
  * Queue functionality (re-queueing, category-based scheduling).  
  * Drafts and Approval Workflow (paradigmatic for MFE/BFF separation).  
* **Media Management:** Uploading, storing, and organizing images and videos (leveraging a separate CMS for storage).

### **4.3 Unified Inbox (Engagement)**

* **One-Click Management:** A single, centralized stream for all incoming messages, comments, mentions, and Ad comments (where supported).  
* **Status Management:** Ability to assign, qualify, and manage item status: **New, Assigned, Resolved, Spam.**  
* **Team Collaboration:** Internal notes and tagging to facilitate discussion around specific messages.  
* **Moderation Rules:** Automated rules for tagging, assigning, or hiding comments based on keywords.

### **4.4 Reporting and Analytics**

* **Performance Metrics:** Provide clear, comparable metrics for Reach, Engagement, Impressions, and Audience Growth across all platforms.  
* **Content Reporting:** Breakdown of top-performing posts by key metrics.  
* **Audience Data:** Demographic and activity reporting.  
* **Customization:** Ability to generate and export custom reports (PDF/CSV).

## **5\. Technical Implementation Details**

### **5.1 Micro Frontend (MFE) Implementation (CloudFlare Workers Fragment Architecture)**

1. **Composition:** Implement server-side fragment composition using CloudFlare Workers. The "Main Worker" (Shell) receives requests, fetches HTML fragments from "Child Workers" (Publishing, Inbox, Reporting MFEs) via service bindings (zero-latency internal calls), and composes them server-side using HTMLRewriter streaming. This delivers a single HTTP response with complete HTML, eliminating CORS complexity and enabling edge caching per fragment.  
2. **Fragment Pattern:** Each MFE exposes fragment endpoints (`/fragment/main`, `/fragment/sidebar`, `/fragment/head`) that return HTML/CSS for injection. The Main Worker controls composition logic and dependency injection.  
3. **Shared Dependencies:** React, ReactDOM, and the Design System are bundled and deployed to CloudFlare R2 CDN with versioned URLs (e.g., `https://cdn.mtsynergy.com/shared/react@18.3.0.js`). The Main Worker injects an import map into the HTML head, ensuring all fragments use the same versions without runtime negotiation.  
4. **Communication:** Fragments communicate via CustomEvents (bubbled to document root) or a shared KV-based state store. Direct imports between fragments are prohibited to maintain deployment independence.

### **5.2 Backend For Frontend (BFF) Implementation (Kotlin/Spring Boot)**

1. **Kotlin Coroutines (Mandatory):** The BFF must use Kotlin Coroutines for all downstream communication (to Core Microservices). This is critical for high-concurrency, non-blocking I/O operations necessary for data aggregation.  
2. **DTOs/Payload Optimization:** The BFF must define specific Data Transfer Objects (DTOs) tailored precisely for the needs of the Web and Mobile clients, ensuring minimal data over-fetching.  
3. **Security & Authentication:** The BFF acts as the security boundary, handling:
   - User session management (JWT issued by BFF, stored in httpOnly cookies)
   - OAuth token storage: All platform OAuth tokens (Facebook, TikTok, Instagram, etc.) are encrypted at rest using AES-256-GCM and stored in PostgreSQL
   - Token encryption keys managed by HashiCorp Vault (self-hosted in k3s); keys rotated every 90 days
   - Token refresh coordination with each platform's rate limits and expiration windows
   - CloudFlare Zero Trust JWT validation (if present) as defense-in-depth layer

### **5.3 Mobile App Implementation (React Native)**

1. **Shared Logic:** Maximize code sharing by importing `@mtsynergy/core` (TypeScript types, API clients, validation logic) directly from npm. The mobile app consumes the same BFF endpoints as the web app with mobile-optimized DTOs.  
2. **Offline Capability:** Implement local caching for viewing scheduled posts (7 days) and basic inbox data (last 50 items) using SQLite. Optimistic UI queues offline actions for sync on reconnect.  
3. **Notifications:** Integrate native push via APNs (iOS) and FCM (Android) for real-time inbox events and publishing failures.  
4. **App Store Distribution:** iOS builds submitted to Apple App Store; Android builds to Google Play Store. Manual submission process; CI/CD builds binaries, signing via Apple Certificates and Google Play Signing.

### **5.4 Audit Logging & Compliance (PostgreSQL)**

1. **Immutable Audit Table:** All security-relevant events (authentication, authorization, data access, modifications, administrative actions) logged to append-only PostgreSQL table with yearly partitions. The application role has no UPDATE/DELETE permissions on audit tables.  
2. **Event Fields:** Each audit log entry contains: timestamp (UTC), actor (user ID), IP address, user agent, resource type/ID, action, before/after values (JSONB), outcome (SUCCESS/FAILURE/DENIED), and metadata. Each entry includes SHA-256 checksum of the previous row for tamper detection.  
3. **Retention Policy:** Configurable per workspace (default 1 year, enterprise tier supports up to 7 years). Background jobs enforce soft delete (flagged for deletion) followed by hard delete after 90-day grace period.  
4. **Access Control:** Only workspace OWNER and ADMIN roles can view audit logs; bulk exports require step-up authentication and are themselves logged.  
5. **Encryption at Rest:** Database uses TLS 1.3 for connections; sensitive fields (PII, OAuth tokens) encrypted via Vault field-level encryption.

### **5.5 Cloud Edge & Zero Trust Security (CloudFlare)**

1. **Workers for Deployment:** All web frontends deployed as CloudFlare Workers (Main/Child architecture). Worker code is JavaScript running in V8 isolates at the edge with sub-millisecond latency.  
2. **Zero Trust Perimeter:** CloudFlare Access (optional) enforces device posture checks (requires WARP agent on managed devices). Access provides defense-in-depth without replacing app-level authentication.  
3. **WAF & DDoS:** CloudFlare WAF with OWASP Core Rule Set enabled; DDoS protection via CloudFlare's anycast network. Rate limiting per endpoint (e.g., 100 requests/minute to `/api/v1/drafts`).  
4. **Tunnel Connector:** k3s cluster connects to CloudFlare via cloudflared daemon (2 replicas for HA). Tunnel provides secure egress for internal services without exposing them to the public internet.  
5. **Asset Delivery:** Design System bundles, React, and shared dependencies hosted on CloudFlare R2 (S3-compatible object storage) with versioned URLs and CloudFlare CDN caching.