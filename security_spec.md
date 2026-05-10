# Security Specification: Anti-Gravity Marketplace Nexus

## Data Invariants
1. **Profiles**: Users can only create and manage their own profiles. Roles are locked after creation for security.
2. **Products**: Anyone can read listed products. Only owners or admins can modify/delete. Metadata is server-calculated (size) or strictly validated.
3. **Orders**: Relational integrity is mandatory. An order cannot exist without a valid product reference. Status transitions are one-way (released -> completed).
4. **Tickets**: Only the ticket owner or an admin can read/respond. Replies are append-only.
5. **Jobs & Applications**: Private workspaces between client and developer. Access to applications is restricted to the two parties involved.
6. **Notifications**: Private to the target user. Read-only once read by user.

## The "Dirty Dozen" Payload Test Set
1. **Identity Spoofing**: Attempt to create a product with `creator_id` of another user.
2. **Shadow Field Injection**: Attempt to inject `isVerified: true` into a Product.
3. **State Shortcutting**: Attempt to update an order status from `pending` directly to `completed` bypassing `released`.
4. **Role Escalation**: Attempt to change a profile role from `buyer` to `admin` (if admin role existed) or `merchant` after initial setup.
5. **Resource Poisoning**: Use a 1.5KB string as a `productId`.
6. **Relational Orphan**: Create an order for a non-existent `productId`.
7. **PII Leak**: Attempt to list all user profiles as a non-admin.
8. **Immutability Breach**: Change the `created_at` timestamp on a product.
9. **Update Gap**: Update a product price without specifying the `updated_at` server timestamp (if required).
10. **Signal Hijacking**: Read another user's support ticket.
11. **Workspace Eavesdropping**: Read messages for a `job_application` the user is not part of.
12. **Denial of Wallet**: Submit 1000 reviews for a single product in a burst (not fully preventable by rules but limited by validation).

## Test Runner (Internal Logic)
Rules will be validated against these payloads using the Firestore emulator or logic-equivalent verification.
