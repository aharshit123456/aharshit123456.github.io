# Architecting for the Hyper-Local Economy: Building the FamCARE Distributed Marketplace

*By Harshit Agarwal, System Architect & Lead*

Building a service marketplace isn't just about matching supply and demand; it’s about managing a high-fidelity "Physical World State" in digital real-time. At **FamCARE**, we faced a classic distributed systems challenge: how to coordinate users, caretakers, and administrators across a modular ecosystem while maintaining strict transactional integrity and sub-second latency.

In this post, I’ll dive into the architectural decisions and engineering patterns I implemented to scale FamCARE from a prototype to a production-ready engine handling thousands of requests.

---

## 1. The Modular Monolith: Designing for the Strangler Pattern

Early-stage startups often fall into the "Microservices Trap" too soon. For FamCARE, I opted for a **Modular Monolith** architecture using **FastAPI** and **PostgreSQL**. However, the system is architected with future scale in mind:

*   **Service Isolation:** I engineered **15+ decoupled services** (modules) within the monolith (e.g., `payments`, `riders`, `notifications`, `assignments`).
*   **The Strangler Pattern:** Each module is strictly isolated with its own domain logic and data access patterns, allowing any individual service to be "strangled" out into a standalone microservice with minimal friction as traffic scales.
*   **Benefit:** This approach combines the deployment simplicity of a monolith with the architectural flexibility of microservices.

## 2. Solving the Distributed State Problem: The Request Lifecycle

The core of FamCARE is the **Service Request Engine**. The complexity lies in the state machine: a request isn't just "Created"; it is a living entity that transitions through `proposing`, `accepting`, `ongoing`, and `settling`.

### The "Ghost Assignment" Challenge

A common failure mode in marketplaces is the "Ghost Assignment"—where a rider is proposed a task but remains "available" to other systems. I implemented a **locking and timeout reservation pattern**:

*   **Atomic Proposals:** When a rider is proposed, they are marked as `busy` in a Redis-backed cache layer.
*   **Background Schedulers:** Using `APScheduler`, I built a reaper service that monitors pending proposals and automatically expires them after 180 seconds, re-injecting the request into the assignment queue.

## 3. Real-Time Synchronization via Redis Pub/Sub

To achieve a "live" feel, we couldn't rely on polling. We needed a unified broadcasting system.

We used **WebSockets** for the frontends, but scaling WebSockets across multiple server instances requires a shared backplane. I architected a **Redis Pub/Sub relay**:

*   When a state change occurs (e.g., Rider accepts a job), the backend publishes a message to a Redis channel.
*   Every active FastAPI worker listens to this channel and broadcasts the update only to the relevant connected clients (User, Caretaker, or Admin).
*   **Result:** We achieved sub-300ms propagation of status updates across the entire ecosystem.

## 4. Engineering the Dynamic Operational Slot Engine

Perhaps the most mathematically complex piece was the **Hub-Aware Slot Engine**. Unlike a standard calendar, our "slots" are dynamic functions of:

*   **Operational Windows:** Hub-specific start/end times.
*   **Rider Density:** Real-time count of active vs. assigned riders in a specific geofence.
*   **Service Duration:** A 4-hour dog-walking service cannot be booked 2 hours before a hub closes.

I implemented this using a **Duration-Aware Lookahead Algorithm** that calculates availability by intersecting the requested service duration with the remaining operational window and the concurrent booking capacity of the local hub.

## 5. Stress Testing: Proving the Architecture

An architecture is only as good as its breaking point. I developed a custom asynchronous benchmarking suite to simulate high-load scenarios.

**The Findings:**

*   **Concurrency:** The system maintained a **100% success rate** at 50 concurrent users.
*   **Throughput:** Handled **2,000+ requests/minute** with an average latency of ~950ms.
*   **Bottleneck Identification:** Under extreme load (100+ concurrent users), the P95 latency shifted to 8s, identifying the database connection pool as the primary scaling target. This data-driven approach allowed us to pre-emptively optimize our RDS instance sizing.

## 6. Multi-Channel Notifications & External Integrations

A reliable marketplace requires constant communication. I engineered a unified notification engine that abstracts over multiple providers:

*   **Real-Time:** **FCM (Firebase Cloud Messaging)** for instant push notifications on order status changes.
*   **Fallback & Auth:** Integrated **Fast2SMS** and **MSG91** for transactional SMS and OTP verification.
*   **Service Decoupling:** The notification service is entirely decoupled; it consumes events from the order system, ensuring that adding a new provider (e.g., WhatsApp or Email) requires zero changes to the core business logic.

## 7. Deployment & The Developer Experience

Speed of delivery is a feature. I automated the entire mobile deployment pipeline using **Fastlane and GitHub Actions**.

*   **CI/CD:** Automated builds for three different Flutter apps (User, Caretaker, Admin) are triggered on merge to `staging`, reducing deployment overhead by **70%**.
*   **Observability:** Integrated **Sentry** with custom breadcrumbs to track distributed traces—allowing us to debug a failed payment in the User app by tracing it back to a specific async task in the backend.

---

*If you’re interested in the code behind these patterns, reach out to discuss distributed systems.*
