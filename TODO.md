# NanoPay - TODO

## Phase 8 Follow-through: Notification Preferences + Quiet Hours

### Step 1 — Update NotificationService to enforce preferences
- [ ] Inject `NotificationPreferenceRepository`
- [ ] Add defaulting to `NotificationPreference.defaultsFor(user)` when missing
- [ ] Gate in-app persistence/websocket and email sending based on `shouldDeliver`

### Step 2 — Implement quiet hours suppression
- [ ] Extend `NotificationPreference.shouldDeliver(...)` to return false when quiet hours enabled and current time is inside quiet-hours window
- [ ] Ensure security events still return true even during quiet hours
- [ ] Handle windows that wrap midnight (e.g., 22 -> 8)

### Step 3 — Build/verify
- [ ] Run Maven tests/build for affected modules (`nanopay-core`, `nanopay-infrastructure`)
- [ ] Smoke-check compilation

