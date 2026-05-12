import { Card, RANKS, evaluateHand } from './poker';
import { INITIAL_HP, MAX_PLAYER_HP_LIMIT } from '../constants';
export type AlphaCardType =
  | 'PEEK_OPPONENT' // 상대 패 1장 보기
  | 'CHANGE_SUIT'   // 내 패 1장 문양 변경
  | 'PLUS_ONE'      // 내 패 1장 숫자 +1
  | 'MINUS_ONE'     // 내 패 1장 숫자 -1
  | 'RELOAD'        // 내 패 버리고 새로 드로우
  | 'GUILLOTINE'    // 작두: 상대에게 40 데미지
  | 'VAMPIRE'       // 뱀파이어: 상대 HP 15 흡수
  | 'SWAP_HAND'     // 손패 교환: 상대와 내 패를 바꿈
  | 'PEEK_DECK'     // 미래 예지: 덱의 다음 3장 확인
  | 'MAX_HP_UP'     // 최대 체력 증가: 최대 HP +30 및 회복
  | 'BOSS_EYE'      // 보스(10): 마안 - 상대 체력 20 흡수 + 패 2장 공개
  | 'BOSS_GREED'    // 보스(20): 탐욕 - 최대 체력 50 증가 + 50 회복
  | 'BOSS_DEATH'    // 보스(30): 사신 - 상대 체력 40 피해
  | 'BOSS_FATE'     // 보스(40): 운명 - 내 패 2장을 모두 A로 변경
  | 'BOSS_MIRACLE'  // 보스(50): 기적 - 커뮤니티 카드 전체 새로 뽑기 + 체력 30 회복
  | 'DOUBLE_POT'    // 판돈 두 배
  | 'SHIELD'        // 이번 라운드 데미지 절반
  | 'COPY_CARD'     // 상대 패 복사
  | 'LUCKY_SEVEN'   // 내 패 하나를 7로 변경
  | 'FORCE_FOLD'    // 상대 강제 폴드 (보스)
  | 'MAKE_SPADE'    // 스페이드로 변경
  | 'MAKE_HEART'    // 하트로 변경
  | 'MAKE_DIAMOND'  // 다이아로 변경
  | 'MAKE_CLOVER'   // 클로버로 변경
  | 'JOKER'         // 조커로 변경
  | 'BLACKHOLE'     // 블랙홀: 바닥의 카드를 모두 덱으로 되돌리고 새로 깜
  | 'SIXTH_SENSE'   // 제 6의 감각: 바닥에 6번째 카드를 추가
  | 'THIRD_EYE'     // 제 3의 눈: 내 손패에 3번째 카드를 추가
  | 'RANDOMIZE_OPP_SUIT' // 상대 패 문양 무작위 변경
  | 'OPP_TO_SEVEN'       // 상대 패 1장을 7로 변경
  | 'OPP_RELOAD'         // 상대 패 2장 교체
  | 'NO_FOLD'            // 상대 폴드 봉인
  | 'NO_RAISE';          // 상대 레이즈 봉인

export interface AlphaCard {
  id: string;
  level: number;
  type: AlphaCardType;
  name: string;
  description: string;
  hpCost?: number;
  isBossCard?: boolean;
  isConsumable?: boolean;
}

export interface AlphaCardUsageRule {
  chargesPerStage: number;
  roundCooldown: number;
  consumeOnUse?: boolean;
}

export const ALPHA_CARDS: Record<AlphaCardType, Omit<AlphaCard, 'id' | 'level'>> = {
  PEEK_OPPONENT: { type: 'PEEK_OPPONENT', name: '천리안', description: '상대의 패 1장을 확인합니다. (10 HP 소모)', hpCost: 10, isConsumable: true },
  CHANGE_SUIT: { type: 'CHANGE_SUIT', name: '환영술', description: '내 패 1장의 문양을 바꿉니다. (5 HP 소모)', hpCost: 5 },
  PLUS_ONE: { type: 'PLUS_ONE', name: '조작 (+1)', description: '내 패 1장의 숫자를 1 올립니다. (10 HP 소모)', hpCost: 10 },
  MINUS_ONE: { type: 'MINUS_ONE', name: '조작 (-1)', description: '내 패 1장의 숫자를 1 내립니다. (10 HP 소모)', hpCost: 10 },
  RELOAD: { type: 'RELOAD', name: '재장전', description: '내 패를 모두 버리고 새로 2장을 뽑습니다. (15 HP 소모)', hpCost: 15, isConsumable: true },
  GUILLOTINE: { type: 'GUILLOTINE', name: '단두대', description: '상대에게 즉시 40의 데미지를 줍니다. (30 HP 소모, 35% 확률로 상대 패 1장 추가 공개)', hpCost: 30, isConsumable: true },
  VAMPIRE: { type: 'VAMPIRE', name: '흡혈귀', description: '상대의 체력을 15 흡수합니다. (10 HP 소모, 35% 확률로 상대 패 1장 추가 공개)', hpCost: 10, isConsumable: true },
  SWAP_HAND: { type: 'SWAP_HAND', name: '운명 교환', description: '상대와 내 손패를 맞바꿉니다. (25 HP 소모, 35% 확률로 상대 패 1장 추가 공개)', hpCost: 25, isConsumable: true },
  PEEK_DECK: { type: 'PEEK_DECK', name: '미래 예지', description: '덱의 다음 3장을 미리 확인합니다. (10 HP 소모)', hpCost: 10, isConsumable: true },
  MAX_HP_UP: { type: 'MAX_HP_UP', name: '생명의 그릇', description: '[1회용] 최대 체력이 30 증가하고 회복합니다.', hpCost: 0, isConsumable: true },
  BOSS_EYE: { type: 'BOSS_EYE', name: '마안', description: '[보스 전리품] 상대 체력 20 흡수 및 패 2장 모두 공개.', isBossCard: true, isConsumable: true },
  BOSS_GREED: { type: 'BOSS_GREED', name: '탐욕', description: '[보스 전리품/1회용] 최대 체력 50 증가 및 50 회복.', isBossCard: true, isConsumable: true },
  BOSS_DEATH: { type: 'BOSS_DEATH', name: '사신', description: '[보스 전리품] 상대에게 40의 피해를 줍니다. (35% 확률로 상대 패 1장 추가 공개)', isBossCard: true, isConsumable: true },
  BOSS_FATE: { type: 'BOSS_FATE', name: '운명', description: '[보스 전리품] 내 패 2장을 모두 A로 변경합니다.', isBossCard: true, isConsumable: true },
  BOSS_MIRACLE: { type: 'BOSS_MIRACLE', name: '기적', description: '[보스 전리품] 커뮤니티 카드를 모두 새로 뽑고 체력을 30 회복합니다.', isBossCard: true, isConsumable: true },
  DOUBLE_POT: { type: 'DOUBLE_POT', name: '광기의 도박', description: '현재 팟(판돈)을 두 배로 늘립니다. (15 HP 소모)', hpCost: 15, isConsumable: true },
  SHIELD: { type: 'SHIELD', name: '성기사의 방패', description: '이번 라운드 패배 시 받는 데미지가 절반이 됩니다. (10 HP 소모)', hpCost: 10, isConsumable: true },
  COPY_CARD: { type: 'COPY_CARD', name: '거울상', description: '상대의 패 1장을 복사하여 내 패로 만듭니다. (20 HP 소모, 35% 확률로 상대 패 1장 추가 공개)', hpCost: 20, isConsumable: true },
  LUCKY_SEVEN: { type: 'LUCKY_SEVEN', name: '행운의 7', description: '내 패 1장의 숫자를 7로 바꿉니다. (15 HP 소모)', hpCost: 15 },
  FORCE_FOLD: { type: 'FORCE_FOLD', name: '강제 폴드', description: '[보스 전리품] 상대방을 강제로 폴드하게 만듭니다. (35% 확률로 상대 패 1장 추가 공개)', isBossCard: true, isConsumable: true },
  MAKE_SPADE: { type: 'MAKE_SPADE', name: '스페이드의 저주', description: '내 패 1장의 문양을 스페이드로 바꿉니다. (10 HP 소모)', hpCost: 10 },
  MAKE_HEART: { type: 'MAKE_HEART', name: '하트의 축복', description: '내 패 1장의 문양을 하트로 바꿉니다. (10 HP 소모)', hpCost: 10 },
  MAKE_DIAMOND: { type: 'MAKE_DIAMOND', name: '다이아의 탐욕', description: '내 패 1장의 문양을 다이아로 바꿉니다. (10 HP 소모)', hpCost: 10 },
  MAKE_CLOVER: { type: 'MAKE_CLOVER', name: '클로버의 행운', description: '내 패 1장의 문양을 클로버로 바꿉니다. (10 HP 소모)', hpCost: 10 },
  JOKER: { type: 'JOKER', name: '조커', description: '내 패 1장을 무작위 카드로 바꿉니다. (10 HP 소모)', hpCost: 10 },
  BLACKHOLE: { type: 'BLACKHOLE', name: '블랙홀', description: '바닥에 깔린 카드를 모두 덱으로 되돌리고 새로 깝니다. (25 HP 소모)', hpCost: 25, isConsumable: true },
  SIXTH_SENSE: { type: 'SIXTH_SENSE', name: '제 6의 감각', description: '바닥에 6번째 커뮤니티 카드를 추가합니다. (30 HP 소모)', hpCost: 30, isConsumable: true },
  THIRD_EYE: { type: 'THIRD_EYE', name: '제 3의 눈', description: '내 손패에 3번째 카드를 추가합니다. (35 HP 소모)', hpCost: 35, isConsumable: true },
  RANDOMIZE_OPP_SUIT: { type: 'RANDOMIZE_OPP_SUIT', name: '혼돈 문양', description: '상대 패 1장의 문양을 무작위로 변경합니다. (15 HP 소모, 35% 확률로 상대 패 1장 추가 공개)', hpCost: 15, isConsumable: true },
  OPP_TO_SEVEN: { type: 'OPP_TO_SEVEN', name: '칠흑 각인', description: '상대 패 1장의 숫자를 7로 고정합니다. (20 HP 소모, 35% 확률로 상대 패 1장 추가 공개)', hpCost: 20, isConsumable: true },
  OPP_RELOAD: { type: 'OPP_RELOAD', name: '기억 소거', description: '상대 패 2장을 모두 버리고 새로 뽑게 합니다. (25 HP 소모, 35% 확률로 상대 패 1장 추가 공개)', hpCost: 25, isConsumable: true },
  NO_FOLD: { type: 'NO_FOLD', name: '도주 봉인', description: '이번 라운드 동안 상대는 폴드할 수 없습니다. (20 HP 소모, 35% 확률로 상대 패 1장 추가 공개)', hpCost: 20, isConsumable: true },
  NO_RAISE: { type: 'NO_RAISE', name: '광기 억제', description: '이번 라운드 동안 상대는 레이즈할 수 없습니다. (15 HP 소모, 35% 확률로 상대 패 1장 추가 공개)', hpCost: 15, isConsumable: true },
};

const DEFAULT_ALPHA_CARD_USAGE_RULE: AlphaCardUsageRule = {
  chargesPerStage: 2,
  roundCooldown: 1,
};

const ALPHA_CARD_USAGE_OVERRIDES: Partial<Record<AlphaCardType, AlphaCardUsageRule>> = {
  CHANGE_SUIT: { chargesPerStage: 3, roundCooldown: 1 },
  PLUS_ONE: { chargesPerStage: 2, roundCooldown: 1 },
  MINUS_ONE: { chargesPerStage: 2, roundCooldown: 1 },
  MAKE_SPADE: { chargesPerStage: 2, roundCooldown: 1 },
  MAKE_HEART: { chargesPerStage: 2, roundCooldown: 1 },
  MAKE_DIAMOND: { chargesPerStage: 2, roundCooldown: 1 },
  MAKE_CLOVER: { chargesPerStage: 2, roundCooldown: 1 },
  LUCKY_SEVEN: { chargesPerStage: 2, roundCooldown: 1 },
  JOKER: { chargesPerStage: 2, roundCooldown: 1 },
  PEEK_OPPONENT: { chargesPerStage: 2, roundCooldown: 1 },
  PEEK_DECK: { chargesPerStage: 2, roundCooldown: 1 },
  RELOAD: { chargesPerStage: 2, roundCooldown: 1 },
  VAMPIRE: { chargesPerStage: 2, roundCooldown: 1 },
  SWAP_HAND: { chargesPerStage: 1, roundCooldown: 2 },
  GUILLOTINE: { chargesPerStage: 1, roundCooldown: 2 },
  DOUBLE_POT: { chargesPerStage: 1, roundCooldown: 2 },
  SHIELD: { chargesPerStage: 1, roundCooldown: 2 },
  COPY_CARD: { chargesPerStage: 1, roundCooldown: 2 },
  BLACKHOLE: { chargesPerStage: 1, roundCooldown: 2 },
  SIXTH_SENSE: { chargesPerStage: 1, roundCooldown: 2 },
  THIRD_EYE: { chargesPerStage: 1, roundCooldown: 2 },
  RANDOMIZE_OPP_SUIT: { chargesPerStage: 1, roundCooldown: 2 },
  OPP_TO_SEVEN: { chargesPerStage: 1, roundCooldown: 2 },
  OPP_RELOAD: { chargesPerStage: 1, roundCooldown: 2 },
  NO_FOLD: { chargesPerStage: 1, roundCooldown: 2 },
  NO_RAISE: { chargesPerStage: 1, roundCooldown: 2 },
  BOSS_EYE: { chargesPerStage: 1, roundCooldown: 2 },
  BOSS_DEATH: { chargesPerStage: 1, roundCooldown: 2 },
  BOSS_FATE: { chargesPerStage: 1, roundCooldown: 2 },
  BOSS_MIRACLE: { chargesPerStage: 1, roundCooldown: 3 },
  FORCE_FOLD: { chargesPerStage: 1, roundCooldown: 3 },
  MAX_HP_UP: { chargesPerStage: 1, roundCooldown: 3, consumeOnUse: true },
  BOSS_GREED: { chargesPerStage: 1, roundCooldown: 3, consumeOnUse: true },
};

export function getAlphaCardUsageRule(type: AlphaCardType): AlphaCardUsageRule {
  const override = ALPHA_CARD_USAGE_OVERRIDES[type];
  if (!override) return { ...DEFAULT_ALPHA_CARD_USAGE_RULE };
  return { ...override };
}

export function getAlphaCardMaxLevel(type: AlphaCardType): number {
  if (type === 'MAX_HP_UP' || type === 'BOSS_GREED') return 1;
  if (ALPHA_CARDS[type].isBossCard) return 2;
  return 3;
}

export function getAlphaCardUsageRuleByLevel(type: AlphaCardType, level: number = 1): AlphaCardUsageRule {
  const base = getAlphaCardUsageRule(type);
  const maxLevel = getAlphaCardMaxLevel(type);
  const clampedLevel = Math.max(1, Math.min(maxLevel, Math.floor(level)));

  if (base.consumeOnUse) {
    return { ...base };
  }

  const chargeBonus = clampedLevel - 1;
  const cooldownReduction = clampedLevel >= 3 ? 1 : 0;

  return {
    ...base,
    chargesPerStage: base.chargesPerStage + chargeBonus,
    roundCooldown: Math.max(1, base.roundCooldown - cooldownReduction),
  };
}

export type AlphaCardExclusiveGroup = 'VISION';

export function getAlphaCardExclusiveGroup(type: AlphaCardType): AlphaCardExclusiveGroup | null {
  if (type === 'PEEK_OPPONENT' || type === 'BOSS_EYE') return 'VISION';
  return null;
}

function getExclusiveCardScore(card: AlphaCard): number {
  let score = 0;
  if (card.type === 'BOSS_EYE') score += 100;
  if (card.isBossCard) score += 50;
  score += (card.level ?? 1) * 10;
  score += card.hpCost ?? 0;
  return score;
}

export function enforceAlphaCardExclusivity(cards: AlphaCard[]): AlphaCard[] {
  const bestByGroup = new Map<AlphaCardExclusiveGroup, AlphaCard>();

  for (const card of cards) {
    const group = getAlphaCardExclusiveGroup(card.type);
    if (!group) continue;
    const current = bestByGroup.get(group);
    if (!current || getExclusiveCardScore(card) > getExclusiveCardScore(current)) {
      bestByGroup.set(group, card);
    }
  }

  return cards.filter(card => {
    const group = getAlphaCardExclusiveGroup(card.type);
    if (!group) return true;
    return bestByGroup.get(group)?.id === card.id;
  });
}

export function generateAlphaCard(type: AlphaCardType): AlphaCard {
  return {
    id: Math.random().toString(36).substring(7),
    level: 1,
    ...ALPHA_CARDS[type],
  };
}

export function getRandomAlphaCard(excludeTypes: AlphaCardType[] = []): AlphaCard {
  const types = (Object.keys(ALPHA_CARDS) as AlphaCardType[]).filter(k => {
    const card = ALPHA_CARDS[k];
    return !card.isBossCard && !excludeTypes.includes(k);
  });
  
  // If all cards are owned, just return a random one (or we could return a specific fallback)
  const availableTypes = types.length > 0 ? types : (Object.keys(ALPHA_CARDS).filter(k => !ALPHA_CARDS[k as AlphaCardType].isBossCard) as AlphaCardType[]);
  
  const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
  return generateAlphaCard(randomType);
}

export function getRandomAlphaCards(count: number, excludeTypes: AlphaCardType[] = []): AlphaCard[] {
  const cards: AlphaCard[] = [];
  const currentExclude = [...excludeTypes];
  
  for (let i = 0; i < count; i++) {
    const card = getRandomAlphaCard(currentExclude);
    cards.push(card);
    // Only exclude the type if we haven't exhausted all non-boss types
    const nonBossTypes = (Object.keys(ALPHA_CARDS) as AlphaCardType[]).filter(k => !ALPHA_CARDS[k].isBossCard);
    if (currentExclude.length < nonBossTypes.length) {
      currentExclude.push(card.type);
    }
  }
  
  return cards;
}

export function getBossCardForStage(stage: number): AlphaCard {
  if (stage === 10) return generateAlphaCard('BOSS_EYE');
  if (stage === 20) return generateAlphaCard('BOSS_GREED');
  if (stage === 30) return generateAlphaCard('BOSS_DEATH');
  if (stage === 40) return generateAlphaCard('BOSS_FATE');
  if (stage === 50) return generateAlphaCard('BOSS_MIRACLE');
  return generateAlphaCard('BOSS_EYE'); // Fallback
}

export type ItemType = 
  | 'REGEN_RING'   // 매 스테이지 시작 시 2 HP 회복
  | 'THORN_ARMOR'  // 쇼다운 패배 시 상대에게 3 피해
  | 'LUCKY_COIN'   // 10% 확률로 기본 판돈(Ante) 면제
  | 'BLOOD_AMULET' // 쇼다운 승리 시 3 HP 회복
  | 'HAWK_EYE'     // 10% 확률로 프리플랍에서 상대 패 1장 공개
  | 'DOMINANCE_RADAR'    // 상대 족보 우위 경고(히든 포함)
  | 'PAIR_SCANNER'       // 상대 페어 이상 경고
  | 'NULL_BARRIER'       // 상대 공격 무력화 + 체력 회복
  | 'ALPHA_STRIKE_TUNER'; // 알파 공격 성공률 +5%

export interface Item {
  id: string;
  type: ItemType;
  name: string;
  description: string;
  price: number;
}

export const ITEMS: Record<ItemType, Omit<Item, 'id'>> = {
  REGEN_RING: { type: 'REGEN_RING', name: '재생의 반지', description: '매 스테이지 시작 시 10 HP를 회복합니다.', price: 20 },
  THORN_ARMOR: { type: 'THORN_ARMOR', name: '가시 갑옷', description: '쇼다운에서 패배 시 상대에게 20의 피해를 줍니다.', price: 25 },
  LUCKY_COIN: { type: 'LUCKY_COIN', name: '행운의 동전', description: '40% 확률로 기본 판돈(5 HP)을 내지 않습니다.', price: 30 },
  BLOOD_AMULET: { type: 'BLOOD_AMULET', name: '피의 부적', description: '쇼다운에서 승리 시 15 HP를 회복합니다.', price: 25 },
  HAWK_EYE: { type: 'HAWK_EYE', name: '매의 눈', description: '스테이지 시작 시 40% 확률로 상대 패 1장을 봅니다.', price: 35 },
  DOMINANCE_RADAR: { type: 'DOMINANCE_RADAR', name: '지배자 레이더', description: '[쿨타임] 상대 족보가 내 족보보다 높을 때 경고합니다. (히든 포함)', price: 100 },
  PAIR_SCANNER: { type: 'PAIR_SCANNER', name: '페어 스캐너', description: '[쿨타임] 상대 족보가 원페어 이상이면 경고합니다.', price: 40 },
  NULL_BARRIER: { type: 'NULL_BARRIER', name: '널 배리어', description: '[스테이지당 2회] 상대 공격을 무력화하고 체력 10 회복.', price: 50 },
  ALPHA_STRIKE_TUNER: { type: 'ALPHA_STRIKE_TUNER', name: '알파 타격 튜너', description: '구매 시 알파 공격 성공률 +5% (최대 +40%).', price: 35 },
};

export function generateItem(type: ItemType): Item {
  return {
    id: Math.random().toString(36).substring(7),
    ...ITEMS[type],
  };
}

export function getRandomItems(count: number, excludeTypes: ItemType[] = []): Item[] {
  const types = (Object.keys(ITEMS) as ItemType[]).filter(t => !excludeTypes.includes(t));
  const shuffled = [...types].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map(generateItem);
}

export function getMaxItemSlots(stage: number): number {
  return stage > 30 ? 2 : 1;
}

export type GamePhase = 'MENU' | 'SCOREBOARD' | 'CARD_REWARD' | 'SHOP' | 'DECKBUILDING' | 'DISCARD' | 'PREFLOP' | 'FLOP' | 'TURN' | 'RIVER' | 'SHOWDOWN' | 'GAMEOVER' | 'SCORE_PROMPT' | 'VICTORY' | 'REVIVE_PROMPT';

export interface GameState {
  phase: GamePhase;
  stage: number;
  playerHp: number;
  opponentHp: number;
  maxPlayerHp: number;
  maxOpponentHp: number;
  
  deck: Card[];
  playerHand: Card[];
  opponentHand: Card[];
  communityCards: Card[];
  
  playerInvested: number;
  callAmount: number;
  pot: number;
  
  inventoryAlphaCards: AlphaCard[];
  equippedAlphaCards: AlphaCard[];
  
  inventoryItems: Item[];
  equippedItems: Item[];
  shopItems: Item[];
  
  logs: string[];
  
  // State for Alpha Card effects
  revealedOpponentCards: boolean[];
  isShieldActive: boolean;

  // AI Adaptation & Difficulty
  playerAggression: number;
  reviveCount: number;
  difficultyMultiplier: number;

  // Item/Skill Runtime
  opponentStrongerWarnCooldown: number;
  opponentPairWarnCooldown: number;
  attackNullifyCharges: number;
  alphaAttackSuccessBonus: number; // 0~40 (%p)
  opponentNoFoldActive: boolean;
  opponentNoRaiseActive: boolean;
}

export function getOpponentMaxHp(stage: number, multiplier: number = 1): number {
  let baseHp: number;
  
  if (stage <= 10) {
    baseHp = 40 + stage * 6;        // 46 ~ 100
  } else if (stage <= 20) {
    baseHp = 80 + stage * 8;        // 168 ~ 240
  } else if (stage <= 30) {
    baseHp = 100 + stage * 10;      // 310 ~ 400
  } else if (stage <= 40) {
    baseHp = 120 + stage * 12;      // 492 ~ 600
  } else {
    baseHp = 150 + stage * 14;      // 724 ~ 850
  }
  
  // 보스는 1.5배
  if (stage % 10 === 0) {
    baseHp = Math.floor(baseHp * 1.5);
  }
  
  return Math.floor(baseHp * multiplier);
}

// --- AI 성향별 Helper 함수 ---
function cowardAI(strength: number, playerInvested: number, opponentHp: number, callCost: number, stage: number, difficultyMultiplier: number): number | 'FOLD' {
  // 1~10: 큰 배팅에 쉽게 폴드, 블러핑 잘 통함
  const betRatioToHp = playerInvested / Math.max(1, opponentHp);
  
  if (strength === -1) {
    if (betRatioToHp > 0.4 || playerInvested > 15) {
      // 무지성 올인/고액 배팅 시 무조건 폴드하지 않음. 60% 확률로만 폴드하여 리스크를 줌.
      if (Math.random() < 0.6 && opponentHp > callCost) return 'FOLD';
    }
  } else if (strength === 0) {
    if (betRatioToHp > 0.6 || playerInvested > 20) {
      // 원페어 정도면 가끔은 버팀 (30% 확률로만 쫄아서 폴드)
      if (Math.random() < 0.3 && opponentHp > callCost) return 'FOLD';
    }
  }
  
  let bet = 0;
  if (strength === -1) bet = 0;
  else if (strength === 0) bet = Math.random() < 0.7 ? 0 : 5;
  else if (strength === 1) bet = 10 + Math.floor(stage / 5) * 5;
  else bet = 20;

  return Math.floor(bet * difficultyMultiplier);
}

function hotheadAI(strength: number, playerInvested: number, opponentHp: number, callCost: number, stage: number, difficultyMultiplier: number): number | 'FOLD' {
  // 11~20: 웬만하면 콜, 올인급만 폴드, 레이즈 경향 강함
  const betRatioToHp = playerInvested / Math.max(1, opponentHp);
  
  if (strength <= 0 && betRatioToHp >= 1.0) { // 거의 올인급일 때만 가끔 폴드
    if (Math.random() < 0.1 && opponentHp > callCost) return 'FOLD';
  }
  
  let bet = 0;
  if (strength === -1) bet = Math.random() < 0.5 ? 5 : 0; // 하이카드라도 블러핑(배팅)
  else if (strength === 0) bet = 10;
  else if (strength === 1) bet = 20;
  else bet = 40;

  // 기본 배팅액에 추가 배팅 (다혈질 특성)
  bet += 10;

  return Math.floor(bet * difficultyMultiplier);
}

function cautiousAI(strength: number, playerInvested: number, opponentHp: number, callCost: number, stage: number, difficultyMultiplier: number): number | 'FOLD' {
  // 21~30: 강한 패가 아니면 쉽게 폴드. 약한 배팅에도 자주 폴드. 레이즈 거의 안함.
  if (strength === -1) {
    if (playerInvested >= 5) {
      if (Math.random() < 0.6 && opponentHp > callCost) return 'FOLD'; // 소액에도 폴드
    }
  } else if (strength === 0) {
    if (playerInvested >= 20) {
      if (Math.random() < 0.5 && opponentHp > callCost) return 'FOLD';
    }
  }
  
  let bet = 0;
  if (strength <= 0) bet = 0; // 콜만 함 (체크)
  else if (strength === 1) bet = 10;
  else bet = 30;

  return Math.floor(bet * difficultyMultiplier);
}

function rationalAI(strength: number, playerInvested: number, opponentHp: number, callCost: number, stage: number, difficultyMultiplier: number): number | 'FOLD' {
  // 31~40: 기대값 계산 기반
  const betRatioToHp = playerInvested / Math.max(1, opponentHp);
  
  if (strength === -1) {
    // 상대가 조금이라도 공격적이면 폴드
    if (playerInvested > 10 && opponentHp > callCost) return 'FOLD';
  } else if (strength === 0) {
    // 내 패가 원페어인데, 상대 배팅이 내 HP의 50%를 넘으면 60% 확률 폴드
    if (betRatioToHp > 0.5 && Math.random() < 0.6 && opponentHp > callCost) return 'FOLD';
  }
  
  const base = Math.floor(stage / 5) * 5;
  let bet = 0;
  if (strength === -1) bet = 0;
  else if (strength === 0) bet = Math.random() < 0.4 ? 0 : 5 + base;
  else if (strength === 1) bet = 15 + base;
  else bet = 30 + base * 2;
  
  return Math.floor(bet * difficultyMultiplier);
}

function bossAI(strength: number, playerInvested: number, opponentHp: number, callCost: number, stage: number, difficultyMultiplier: number): number | 'FOLD' {
  // 41~50: 높은 콜 확률, 절대적인 레이즈
  const betRatioToHp = playerInvested / Math.max(1, opponentHp);
  
  if (strength === -1) {
    if (betRatioToHp > 0.8) {
      if (Math.random() < 0.15 && opponentHp > callCost) return 'FOLD'; // 15% 폴드
    }
  }
  
  const base = Math.floor(stage / 5) * 5;
  let bet = 0;
  if (strength === -1) bet = Math.random() < 0.3 ? 10 : 0;
  else if (strength === 0) bet = 20 + base;
  else if (strength === 1) bet = 40 + base;
  else bet = 80 + base * 2;
  
  return Math.floor(bet * difficultyMultiplier);
}

// --- Main AI Router ---
export const getOpponentAction = (
  opponentHand: Card[], 
  communityCards: Card[], 
  stage: number, 
  currentPot: number, 
  playerInvested: number,
  opponentHp: number,
  difficultyMultiplier: number = 1
): number | 'FOLD' => {
  const isPreflop = communityCards.length === 0;
  let strength = 0;
  if (isPreflop) {
    const rank1 = RANKS.indexOf(opponentHand[0].rank);
    const rank2 = RANKS.indexOf(opponentHand[1].rank);
    if (rank1 === rank2) strength = 2; // Pocket Pair
    else if (rank1 >= 9 || rank2 >= 9) strength = 1; // High Card (J+)
    else if (rank1 < 5 && rank2 < 5) strength = -1; // Very weak
  } else {
    const evalResult = evaluateHand(opponentHand, communityCards);
    const rankValue = ['High Card', 'Pair', 'Two Pair', 'Three of a Kind', 'Straight', 'Flush', 'Full House', 'Four of a Kind', 'Straight Flush', 'Royal Flush'].indexOf(evalResult.name);
    if (rankValue >= 3) strength = 2; // Three of a Kind+
    else if (rankValue >= 1) strength = 1; // Pair/Two Pair
    else strength = -1; // High card only
  }

  // Bluffs and mistakes
  if (Math.random() < 0.1) strength = Math.min(2, strength + 1);
  if (Math.random() < 0.05) strength = -1;

  const callCost = playerInvested - (currentPot - playerInvested);
  
  let action: number | 'FOLD' = 0;

  if (stage % 10 === 0 || stage >= 41) {
    action = bossAI(strength, playerInvested, opponentHp, callCost, stage, difficultyMultiplier);
  } else if (stage <= 10) {
    action = cowardAI(strength, playerInvested, opponentHp, callCost, stage, difficultyMultiplier);
  } else if (stage <= 20) {
    action = hotheadAI(strength, playerInvested, opponentHp, callCost, stage, difficultyMultiplier);
  } else if (stage <= 30) {
    action = cautiousAI(strength, playerInvested, opponentHp, callCost, stage, difficultyMultiplier);
  } else {
    action = rationalAI(strength, playerInvested, opponentHp, callCost, stage, difficultyMultiplier);
  }

  if (action !== 'FOLD') {
    // 상대방 배팅 한도 적용 (너무 과도한 데미지 방지)
    const maxBet = (40 + (stage * 2)) * difficultyMultiplier; 
    action = Math.floor(Math.min(action, maxBet));
  }

  return action;
};
