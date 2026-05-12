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

## Phase 2.5 - Early Stage Fairness Tuning
- [x] Reduce opponent pocket-pair bias for early game:
- Stage 1-10: 2%, 11-20: 10%, 21-30: 20%, 31-40: 30%, 41-50+: 40%
- [x] Limit early forced pocket-pair ranks to `2~9` to reduce high-pair spikes.
- [x] Add early-stage community smoothing:
- avoid creating board-only `Straight+` on river in Stage 1-10.

## Phase 3 - Reward/Progression Redesign (Mid Term)
- [x] Split progression concepts:
- Inventory = collection (no forced deletion)
- Loadout = equipped cards only (slot-limited)
- [x] Add card management UX requirements:
- sorting/filtering by type, cost, consumable, boss
- duplicate handling policy (keep, convert, or upgrade)
- [x] Decide duplicate policy:
- Option A: Keep duplicates
- Option B: Convert duplicates to upgrade currency
- Option C: Merge duplicates into upgraded variant (implemented)
- [x] Show card upgrade visibility in UI:
- Alpha card displays `Lv.N` on card face and tooltip.

## Phase 3.5 - Alpha Skill Runtime (Stage Charges + Round Cooldown)
- [x] Replace per-round single-use flag with per-card runtime (`remainingCharges`, `cooldown`).
- [x] Initialize charges at stage start based on card type usage rules.
- [x] Consume 1 charge and apply round cooldown on card use.
- [x] Tick cooldown by round end progression (`FLOP`+ ended rounds only).
- [x] Add in-fight UI indicators for charge (`xN`) and cooldown (`CD N`).

## Phase 3.6 - Fairness Telegraph (Immediate UX)
- [x] Add fuzzy all-in reaction hint UI (`올인 예상: 강공/균형/신중`).
- [x] Add explicit cheat warning banner before/with cheat resolution.
- [x] Limit enemy cheat trigger to at most once per round.

## Phase 3.7 - New Item/Alpha Runtime Rules
- [x] Add new shop items:
- `DOMINANCE_RADAR` (100 HP, 히든 포함 족보 우위 경고)
- `PAIR_SCANNER` (40 HP, 원페어 이상 경고)
- `NULL_BARRIER` (50 HP, 스테이지당 2회 공격 무력화 + 10 회복)
- `ALPHA_STRIKE_TUNER` (35 HP, 구매 시 공격형 알파 성공률 +5%, 최대 +40%)
- [x] Implement warning item cooldown runtime:
- dominance radar cooldown tick
- pair scanner cooldown tick
- [x] Apply dominance warning using full hidden information (`opponentHand + board` equivalent in current phase).
- [x] Add tuner stack purchase logic:
- allow repeated purchase until +40%
- disable purchase when maxed
- [x] Add per-round control flags:
- `NO_FOLD`, `NO_RAISE` status reset on new round

## Phase 3.8 - New Alpha Cards + Counterplay
- [x] Add opponent-target alpha cards:
- `RANDOMIZE_OPP_SUIT`
- `OPP_TO_SEVEN`
- `OPP_RELOAD`
- `NO_FOLD`
- `NO_RAISE`
- [x] Connect all new alpha cards in `ALPHA_CARD_EFFECTS`.
- [x] Fix all-in/no-fold interaction:
- remove paradoxical early return branch
- force call while preserving normal showdown flow
- [x] Add stage-based anti-alpha rules:
- Stage 1-10: attack-type alpha guaranteed hit
- Stage 11+: attack-type alpha hit chance = `75% + tuner bonus`
- Stage 11+: non-attack alpha has 25% nullify chance (`작두대령`, round-limited)

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
- Duplicate policy switched to merge-upgrade (Option C):
- reward generation can still offer duplicates, but selection upgrades owned card level
- level-up fallback at max level grants HP recovery instead of adding redundant duplicates
- Early-stage fairness tuning applied:
- opponent pocket-pair chance is now 2/10/20/30/40 by stage brackets
- early forced pair rank pool constrained to `2~9`
- Stage 1-10 river draw smooths out board-only `Straight+` outcomes when possible
