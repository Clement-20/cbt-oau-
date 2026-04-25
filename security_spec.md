# Security Spec - Digital Nexus

## Data Invariants
1. **Resources:** Must have a valid title, course, and department. `userId` must match the authenticated user.
2. **Users:** Only the owner can modify their profile (except for verification/role which are admin-only).
3. **Reviews:** Must be linked to a valid user.
4. **Community (Whispers):** Authenticated users only.

## The Dirty Dozen Payloads (Deny Test Cases)
1. **Spoofed Owner:** `create` resource with `userId` of another student.
2. **Shadow Field:** `update` user profile with `{ "role": "admin" }`.
3. **Ghost State:** `update` resource validated status to `true` (non-admin).
4. **Large Payload:** `create` whisper with 1MB text.
5. **ID Poisoning:** `get` a document with an ID that is 1KB of junk characters.
6. **Relational Sync Bypass:** `create` a sub-resource without the parent existing.
7. **Banned User Bypass:** Banned user attempting any write.
8. **PII Leak:** Requesting another user's email via a list query.
9. **Mutation Gap:** `update` a resource and changing the `createdAt` timestamp.
10. **Admin Claim Spoof:** Setting a custom claim `admin: true` in token (not checked by rules, should be DB-backed).
11. **Negative Score:** `update` resource likes with a negative number.
12. **Orphaned Writes:** `create` resource in a non-existent department (if validated against a list).

## Test Runner (Logic Check)
- `users`: `allow read: if isSignedIn(); allow write: if isOwner(userId) && !incoming().role`
- `resources`: `allow create: if isValidResource(incoming()); allow update: if isOwner() && affectedKeys().hasOnly(['likes', 'dislikes', 'qualityScore'])`
- `admins`: `exists(/databases/$(database)/documents/admins/$(request.auth.uid))`
