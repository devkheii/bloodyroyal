import { Card, createDeck, shuffle, RANKS, SUITS, Rank, Suit } from './poker';

/**
 * 적 핸드를 생성합니다.
 * 스테이지 구간별 포켓 페어 보정 확률:
 * 1-10: 5%, 11-20: 10%, 21-30: 20%, 31-40: 30%, 41-50+: 40%
 * 
 * @param deck 현재 덱 (변경됨 — 새 덱이 반환됨)
 * @param stage 현재 스테이지
 * @param playerHand 플레이어 손패 (포켓 페어 생성 시 중복 방지)
 * @returns 적 핸드와 필터링된 나머지 덱
 */
export function dealOpponentHand(
  deck: Card[],
  stage: number,
  playerHand?: Card[]
): { opponentHand: Card[]; remainingDeck: Card[] } {
  let remainingDeck = [...deck];
  const pocketPairChance =
    stage <= 10 ? 0.05 :
    stage <= 20 ? 0.10 :
    stage <= 30 ? 0.20 :
    stage <= 40 ? 0.30 : 0.40;

  if (Math.random() < pocketPairChance) {
    // 포켓 페어 생성 — 플레이어 손패와 중복 방지
    const playerRanks = playerHand ? playerHand.map(c => c.rank) : [];
    const availableRanks = RANKS.filter(r => !playerRanks.includes(r));
    const rank: Rank = availableRanks[Math.floor(Math.random() * availableRanks.length)] || RANKS[0];

    const suit1: Suit = SUITS[0];
    const suit2: Suit = SUITS[1];
    const opponentHand: Card[] = [{ rank, suit: suit1 }, { rank, suit: suit2 }];
    remainingDeck = remainingDeck.filter(
      c => !(c.rank === rank && (c.suit === suit1 || c.suit === suit2))
    );

    return { opponentHand, remainingDeck };
  }

  const opponentHand: Card[] = [remainingDeck.pop()!, remainingDeck.pop()!];
  return { opponentHand, remainingDeck };
}

/**
 * 플레이어 핸드를 생성합니다.
 * 
 * @param deck 현재 덱 (top에서 count장을 뽑음)
 * @param count 뽑을 카드 수 (기본 4장 — 디스카드 전)
 * @returns 플레이어 핸드와 나머지 덱
 */
export function dealPlayerHand(
  deck: Card[],
  count: number = 4
): { playerHand: Card[]; remainingDeck: Card[] } {
  const remainingDeck = [...deck];
  const playerHand: Card[] = [];

  for (let i = 0; i < count; i++) {
    const card = remainingDeck.pop();
    if (card) playerHand.push(card);
  }

  return { playerHand, remainingDeck };
}

/**
 * 새 라운드용 덱 + 양측 핸드를 한번에 생성합니다.
 * startStage, handleRoundEnd, handleRevive에서 공통으로 사용합니다.
 */
export function dealNewRound(
  stage: number
): { deck: Card[]; playerHand: Card[]; opponentHand: Card[] } {
  let deck = shuffle(createDeck());

  const { playerHand, remainingDeck: deckAfterPlayer } = dealPlayerHand(deck, 4);
  deck = deckAfterPlayer;

  const { opponentHand, remainingDeck: deckAfterOpponent } = dealOpponentHand(deck, stage, playerHand);
  deck = deckAfterOpponent;

  return { deck, playerHand, opponentHand };
}
