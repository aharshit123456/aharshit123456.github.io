# Technical Blog: Architecting a Multi-Tiered Promotional Engine & Reactive Session Extensions

*By Harshit Agarwal*

In the latest evolution of the **FamCare** platform, we moved beyond standard CRUD operations to implement two complex, high-impact features: a **Hierarchical Introductory Pricing Engine** and a **Parent-Child Reactive Extension Flow**.

Here is the "deep tech" breakdown of how these systems were engineered to handle scale, edge cases, and real-time state synchronization.

---

## 1. The Hierarchical Promotional Engine (The "Try at" System)

### The Challenge

Standard discount systems are usually flat. For a service marketplace, this is insufficient. Different services have different margins, and a 1-hour session has a different value proposition than a 4-hour session. We needed a way to offer "Entry-Level" pricing that could be overridden at any level of the service hierarchy.

### The Solution: A Resolution-Priority Fallback Engine

We engineered a **Resolution-Priority Strategy** across the entire stack. Instead of a hardcoded "First Order Price," the system now performs a recursive lookup to find the most specific price defined by the admin.

*   **The Hierarchy:** Pricing Tier (Most Specific) → Sub-Service → Service Category → Original Price (Fallback).
*   **Implementation Details:**
    *   **Database Schema:** Extended the `services` and `pricing_tiers` tables via **Alembic** migrations to support nullable promotional fields.
    *   **Frontend Resolution Logic:** In Flutter, we implemented a memoized resolution helper `_getTrialPrice(sub, tier)` that calculates the "Best Available Promotion" in *O(1)* time during the build cycle, ensuring zero UI lag.
    *   **Eligibility Guard:** A reactive `_isTrialEligible` state that synchronizes guest-mode heuristics with authenticated `booking_count` checks.

## 2. Parent-Child Reactive Service Extensions

### The Challenge

In-home services are unpredictable. A 2-hour babysitting session often needs a 1-hour extension. Re-booking from scratch creates friction and breaks the "Live Tracking" experience.

### The Solution: Atomic Linked Request Mapping

Instead of modifying the original request, we implemented a **Linked-Node Architecture**.

*   **Relational Logic:** When an extension is requested, the system spawns a new `Request` object with a `parent_request_id` pointer. This creates an "Extension Chain."
*   **State Merging:** Once the extension (the child) is paid, a background trigger adds those hours back to the Parent task. The user's live tracker "absorbs" the new time seamlessly.
*   **UI Synchronization:** The `LiveTrackingScreen` was refactored into a state-aware consumer. It listens for child-requests and dynamically shifts the UI from a "Tracking State" to a "Payment-Gated Extension State" without a page reload.

## 3. The "Genius" in the Full-Stack Connection

1.  **Admin Panel (Next.js):** Built a dynamic form system that allows admins to set these prices at any level.
2.  **Sutram (FastAPI/PostgreSQL):** The backend serves as the "Source of Truth," preventing any frontend price manipulation.
3.  **Praja (Flutter):** Implemented a "Premium Aesthetics" UI overhaul with **Vertical Intrinsic Dividers**, **Slashed-Price Visuals**, and **Micro-animations** for the "Try at" badge.

### Summary of Impact

*   **Conversion:** Lowered the entry barrier for the most popular services.
*   **Revenue Continuity:** Ensuring caregivers are paid for every extra minute while providing a seamless one-tap payment experience.
