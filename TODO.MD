# TODO - Level Design / All-in / Reward System

## Goals
- Fix excessive opponent folds when player chooses all-in.
- Remove forced reward-card deletion and preserve player progression.
- Rebalance the mid/late game after the above changes.

## Phase 1 - Immediate Fixes (Hotfix)
- [x] Replace all-in strength source from `opponentEval.value` to `opponentEval.rank`.
- [x] Rework all-in call chance so it is not effectively fixed at very low call rate.
- [x] Add stage-based minimum call floor to prevent repetitive fold behavior.
- [x] Remove forced inventory deletion (`nextInv.shift()`) when reward card count exceeds 3.
- [x] Keep equip-slot limits as-is (1/2/3) to control power while allowing collection.

## Phase 2 - Balance Patch (Short Term)
- [x] Implement a dedicated all-in decision helper (`getAllInCallChance(...)`).
- [x] Calculate all-in response with combined factors:
- hand strength (rank)
- stage temperament
- pot odds / call cost pressure
- opponent HP risk
- [x] Tune call/fold profile by stage bracket:
- Stage 1-10: still fold-prone, but not dominant
- Stage 11-20: noticeably higher call rate
- Stage 21-30: conditional/tight behavior
- Stage 31-40: more EV-driven response
- Stage 41-50: high call bias with limited folds
- [x] Add deterministic clamp for call chance range (e.g. min/max bounds).

## Phase 3 - Reward/Progression Redesign (Mid Term)
- [x] Split progression concepts:
- Inventory = collection (no forced deletion)
- Loadout = equipped cards only (slot-limited)
- [x] Add card management UX requirements:
- sorting/filtering by type, cost, consumable, boss
- duplicate handling policy (keep, convert, or upgrade)
- [x] Decide duplicate policy:
- Option A: Keep duplicates (implemented)
- Option B: Convert duplicates to upgrade currency
- Option C: Merge duplicates into upgraded variant

## Phase 3.5 - Alpha Skill Runtime (Stage Charges + Round Cooldown)
- [x] Replace per-round single-use flag with per-card runtime (`remainingCharges`, `cooldown`).
- [x] Initialize charges at stage start based on card type usage rules.
- [x] Consume 1 charge and apply round cooldown on card use.
- [x] Tick cooldown by round end progression (`FLOP`+ ended rounds only).
- [x] Add in-fight UI indicators for charge (`xN`) and cooldown (`CD N`).

## Phase 4 - Verification
- [x] Run targeted simulation/checks for all-in response per stage bracket.
- [x] Verify reward-card acquisition no longer deletes existing cards automatically.
- [x] Verify deckbuilding/equip flow still works with larger inventory.
- [ ] Playtest checkpoints:
- early (1-10), mid (11-30), late (31-50)
- post-revive runs (difficultyMultiplier impact)

## Acceptance Criteria
- [ ] All-in no longer feels "auto-fold" from enemy perspective.
- [x] Reward card collection preserves previously earned cards.
- [ ] Difficulty curve remains challenging without relying on unfair fold patterns.
- [ ] No regression in stage transitions, reward flow, or revive flow.

## Verification Notes
- All-in call chance simulation executed with Node for stage brackets (1/10/15/25/35/45) and multiple hand ranks:
- medium risk sample (callCost=35, oppHp=120, pot=70): Stage 1/10 calls range 45%~81%.
- high risk sample (callCost=90, oppHp=95, pot=80): Stage 1/10 calls range 45%~65%.
- Confirmed reward flow no longer contains forced deletion (`nextInv.shift()` removed).
- Confirmed deckbuilding selects from full inventory and applies slot-limited equip on stage start.
- Duplicate policy fixed to Option A (keep duplicates):
- normal reward generation no longer excludes already owned types
- reward UI now displays `기보유 N장` indicator for offered duplicate cards
