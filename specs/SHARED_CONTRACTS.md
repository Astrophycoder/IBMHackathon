# Shared Contracts — integration boundaries

Adapt these conceptual contracts to the existing repository. Do not force a new stack.

## Core entities
- User: identity/auth reference, roles, status.
- Profile: user_id, biography, location/remote preference, availability, optional education/informal experience, language and accessibility preferences, visibility.
- Skill: canonical name/category and aliases.
- UserSkill: user_id, skill_id, proficiency/experience description, optional evidence, direction (offer/need).
- Opportunity: owner, title, description, type, paid/unpaid, amount/range, currency, location/remote mode, required skills, availability, accessibility notes, deadline, status.
- Application: opportunity_id, applicant_id, message, status, timestamps.
- TalentListing: user, skills offered/needed, availability, visibility.
- ProductOrService: owner, type, description, price/range, availability, fulfilment, status.
- Collaboration: participants, complementary offers/needs, scope, status.
- CommunityInitiative: owner, type, description, location/remote, participation requirements, status.
- Contribution: contributor, activity, verifier/method, status, timestamps.
- PointsLedgerEntry: user_id, signed points amount, reason, reference, created_at; append-only.
- PaymentRecord: reference, payer_id, receiver_id, amount, currency, method, status, payer_marked_paid_at, receiver_confirmed_at, created_at.
- Conversation/Message/Notification: access-controlled, user-scoped.

## Module API boundaries
- Member 1: opportunity/application APIs and payment records.
- Member 2: talent listings, products/services, collaborations.
- Member 3: community initiatives, campaigns, donations, volunteering, events, human-led learning.
- Member 4: search/matching/recommendation endpoints; returns IDs, scores and reasons only. Does not bypass domain APIs or permissions.
- Member 5: profile/preferences, Home aggregation, Exchange/points views, My Activity aggregation, messages, notifications, settings and shared shell.

Each module exposes documented service/API methods and avoids direct imports of another module's internal database implementation. Use the project's established API style.

## Matching result contract
Each result includes entity_id, match_score (0–100), component_scores, matched_skills, missing_requirements, explanation/reasons and eligibility status. Never call a score “accuracy”. A match is not a guarantee of selection. Do not reveal private profiles.

## Security
All writes authenticated and authorised server-side. Validate on server. Paginate lists. Do not expose private contact details. Never store UPI PIN/OTP/bank passwords. No wallet or escrow. Points are not money. AI output cannot approve applications, award points, confirm payments or change permissions. Sanitise user content and validate uploads.
