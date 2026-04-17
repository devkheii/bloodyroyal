import React from 'react';
import { Card, createDeck, shuffle, formatCard, formatCardDisplay, Rank, Suit, RANKS, SUITS } from './poker';
import { GameState, AlphaCard, AlphaCardType } from './game';
import { MAX_PLAYER_HP_LIMIT } from '../constants';

/**
 * 알파 카드 효과 실행에 필요한 컨텍스트
 */
export interface EffectContext {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  addLog: (msg: string) => void;
  setDamageEffect: (effect: 'PLAYER' | 'OPPONENT' | null) => void;
  handleRoundEnd: (winner: 'PLAYER' | 'OPPONENT' | 'TIE', handName?: string) => void;
  setRevealedDeckCards: (cards: Card[]) => void;
}

/**
 * 알파 카드 효과 함수 타입
 * 대상 선택이 필요한 경우 'NEED_TARGET'을 반환
 */
type AlphaCardEffect = (card: AlphaCard, ctx: EffectContext) => void | 'NEED_TARGET';

/**
 * 스킬 시스템 전환:
 * 카드 소모 여부는 엔진의 usage rule(consumeOnUse)에서 일괄 처리한다.
 */
function removeIfConsumable(_card: AlphaCard, equipped: AlphaCard[]): AlphaCard[] {
  return equipped;
}

/**
 * 알파 카드 효과 전략 패턴 맵
 * 
 * 새 알파 카드를 추가할 때 이 맵에 한 줄만 추가하면 됨 (개방-폐쇄 원칙)
 */
export const ALPHA_CARD_EFFECTS: Record<AlphaCardType, AlphaCardEffect> = {
  PEEK_OPPONENT: (card, ctx) => {
    ctx.setGameState(prev => ({
      ...prev,
      revealedOpponentCards: [true, false],
      equippedAlphaCards: removeIfConsumable(card, prev.equippedAlphaCards),
    }));
    ctx.addLog(`${card.name} 사용: 상대의 패를 확인합니다!`);
  },

  RELOAD: (card, ctx) => {
    ctx.setGameState(prev => {
      const formattedHand = prev.playerHand.map(formatCard);
      const newDeck = prev.deck.filter(c => !formattedHand.includes(formatCard(c)));
      const newHand = [newDeck.pop()!, newDeck.pop()!];
      return {
        ...prev,
        deck: newDeck,
        playerHand: newHand,
        equippedAlphaCards: removeIfConsumable(card, prev.equippedAlphaCards),
      };
    });
    ctx.addLog(`${card.name} 사용: 새로운 패를 뽑았습니다!`);
  },

  GUILLOTINE: (card, ctx) => {
    ctx.addLog(`${card.name} 사용: 상대에게 40의 치명적인 데미지를 줍니다!`);
    ctx.setGameState(prev => {
      const newHp = Math.max(0, prev.opponentHp - 40);
      if (newHp <= 0) {
        setTimeout(() => ctx.handleRoundEnd('PLAYER'), 1000);
      }
      return {
        ...prev,
        opponentHp: newHp,
        equippedAlphaCards: removeIfConsumable(card, prev.equippedAlphaCards),
      };
    });
  },

  VAMPIRE: (card, ctx) => {
    ctx.setGameState(prev => {
      const drain = Math.min(15, prev.opponentHp);
      ctx.setDamageEffect('OPPONENT');
      setTimeout(() => ctx.setDamageEffect(null), 1000);
      const newHp = prev.opponentHp - drain;
      if (newHp <= 0) {
        setTimeout(() => ctx.handleRoundEnd('PLAYER'), 1000);
      }
      return {
        ...prev,
        opponentHp: newHp,
        playerHp: Math.min(MAX_PLAYER_HP_LIMIT, Math.min(prev.maxPlayerHp, prev.playerHp + drain)),
        equippedAlphaCards: removeIfConsumable(card, prev.equippedAlphaCards),
      };
    });
    ctx.addLog(`${card.name} 사용: 15 HP 흡수!`);
  },

  SWAP_HAND: (card, ctx) => {
    ctx.setGameState(prev => ({
      ...prev,
      playerHand: prev.opponentHand,
      opponentHand: prev.playerHand,
      equippedAlphaCards: removeIfConsumable(card, prev.equippedAlphaCards),
    }));
    ctx.addLog(`${card.name} 사용: 상대와 손패를 교환했습니다!`);
  },

  PEEK_DECK: (card, ctx) => {
    const nextCards = [
      ctx.gameState.deck[ctx.gameState.deck.length - 1],
      ctx.gameState.deck[ctx.gameState.deck.length - 2],
      ctx.gameState.deck[ctx.gameState.deck.length - 3]
    ].filter(Boolean);
    ctx.setRevealedDeckCards(nextCards);
    ctx.setGameState(prev => ({
      ...prev,
      equippedAlphaCards: removeIfConsumable(card, prev.equippedAlphaCards),
    }));
    ctx.addLog(`${card.name} 사용: 덱의 다음 3장을 확인합니다!`);
  },

  MAX_HP_UP: (card, ctx) => {
    ctx.setGameState(prev => ({
      ...prev,
      maxPlayerHp: Math.min(MAX_PLAYER_HP_LIMIT, prev.maxPlayerHp + 30),
      playerHp: Math.min(MAX_PLAYER_HP_LIMIT, prev.playerHp + 30),
      equippedAlphaCards: removeIfConsumable(card, prev.equippedAlphaCards),
    }));
    ctx.addLog(`${card.name} 사용: 최대 HP +30 및 회복!`);
  },

  BOSS_EYE: (card, ctx) => {
    ctx.setGameState(prev => {
      const drain = Math.min(20, prev.opponentHp);
      ctx.setDamageEffect('OPPONENT');
      setTimeout(() => ctx.setDamageEffect(null), 1000);
      const newRevealed = [...prev.revealedOpponentCards];
      newRevealed[Math.floor(Math.random() * 2)] = true;
      return {
        ...prev,
        opponentHp: prev.opponentHp - drain,
        playerHp: Math.min(MAX_PLAYER_HP_LIMIT, Math.min(prev.maxPlayerHp, prev.playerHp + drain)),
        revealedOpponentCards: newRevealed,
        equippedAlphaCards: removeIfConsumable(card, prev.equippedAlphaCards),
      };
    });
    ctx.addLog(`${card.name} 사용: 상대 체력을 흡수하고 패 1장을 공개합니다!`);
  },

  BOSS_GREED: (card, ctx) => {
    ctx.setGameState(prev => ({
      ...prev,
      maxPlayerHp: Math.min(MAX_PLAYER_HP_LIMIT, prev.maxPlayerHp + 50),
      playerHp: Math.min(MAX_PLAYER_HP_LIMIT, prev.playerHp + 50),
      equippedAlphaCards: removeIfConsumable(card, prev.equippedAlphaCards),
    }));
    ctx.addLog(`${card.name} 사용: 최대 체력이 50 증가하고 회복했습니다!`);
  },

  BOSS_DEATH: (card, ctx) => {
    ctx.setGameState(prev => {
      ctx.setDamageEffect('OPPONENT');
      setTimeout(() => ctx.setDamageEffect(null), 1000);
      const newHp = Math.max(0, prev.opponentHp - 40);
      if (newHp <= 0) {
        setTimeout(() => ctx.handleRoundEnd('PLAYER'), 1000);
      }
      return {
        ...prev,
        opponentHp: newHp,
        equippedAlphaCards: removeIfConsumable(card, prev.equippedAlphaCards),
      };
    });
    ctx.addLog(`${card.name} 사용: 상대에게 40의 피해를 주었습니다!`);
  },

  BOSS_FATE: (card, ctx) => {
    ctx.setGameState(prev => ({
      ...prev,
      playerHand: [
        { rank: 'A' as Rank, suit: 's' as Suit },
        { rank: 'A' as Rank, suit: 'h' as Suit }
      ],
      equippedAlphaCards: removeIfConsumable(card, prev.equippedAlphaCards),
    }));
    ctx.addLog(`${card.name} 사용: 내 패가 모두 A로 변경되었습니다!`);
  },

  BOSS_MIRACLE: (card, ctx) => {
    ctx.setGameState(prev => {
      let newDeck = shuffle(createDeck());
      // 버그 수정: 기존 손패 카드를 새 덱에서 제외
      const inPlay = [...prev.playerHand, ...prev.opponentHand].map(formatCard);
      newDeck = newDeck.filter(c => !inPlay.includes(formatCard(c)));

      const newCommunity: Card[] = [];
      for (let i = 0; i < prev.communityCards.length; i++) {
        newCommunity.push(newDeck.pop()!);
      }
      return {
        ...prev,
        deck: newDeck,
        communityCards: newCommunity,
        playerHp: Math.min(MAX_PLAYER_HP_LIMIT, Math.min(prev.maxPlayerHp, prev.playerHp + 30)),
        equippedAlphaCards: removeIfConsumable(card, prev.equippedAlphaCards),
      };
    });
    ctx.addLog(`${card.name} 사용: 커뮤니티 카드가 모두 바뀌고 체력을 30 회복했습니다!`);
  },

  DOUBLE_POT: (card, ctx) => {
    ctx.setGameState(prev => ({
      ...prev,
      pot: prev.pot * 2,
      equippedAlphaCards: removeIfConsumable(card, prev.equippedAlphaCards),
    }));
    ctx.addLog(`${card.name} 사용: 판돈이 두 배가 되었습니다!`);
  },

  SHIELD: (card, ctx) => {
    ctx.setGameState(prev => ({
      ...prev,
      isShieldActive: true,
      equippedAlphaCards: removeIfConsumable(card, prev.equippedAlphaCards),
    }));
    ctx.addLog(`${card.name} 사용: 이번 라운드 데미지가 절반으로 감소합니다!`);
  },

  FORCE_FOLD: (card, ctx) => {
    ctx.addLog(`${card.name} 사용: 상대방이 겁에 질려 폴드했습니다!`);
    setTimeout(() => ctx.handleRoundEnd('PLAYER'), 1000);
    ctx.setGameState(prev => ({
      ...prev,
      equippedAlphaCards: removeIfConsumable(card, prev.equippedAlphaCards),
    }));
  },

  COPY_CARD: (card, ctx) => {
    ctx.setGameState(prev => {
      const randomOpponentCard = prev.opponentHand[Math.floor(Math.random() * prev.opponentHand.length)];
      return {
        ...prev,
        playerHand: [prev.playerHand[0], randomOpponentCard],
        equippedAlphaCards: removeIfConsumable(card, prev.equippedAlphaCards),
      };
    });
    ctx.addLog(`${card.name} 사용: 상대의 패 한 장을 복사했습니다!`);
  },

  BLACKHOLE: (card, ctx) => {
    ctx.addLog(`${card.name} 사용: 바닥의 카드가 모두 빨려들어가고 새로 깔립니다!`);
    ctx.setGameState(prev => {
      const newDeck = [...prev.deck, ...prev.communityCards].sort(() => 0.5 - Math.random());
      const newCommunity: Card[] = [];
      for (let i = 0; i < prev.communityCards.length; i++) {
        newCommunity.push(newDeck.pop()!);
      }
      return {
        ...prev,
        deck: newDeck,
        communityCards: newCommunity,
        equippedAlphaCards: removeIfConsumable(card, prev.equippedAlphaCards),
      };
    });
  },

  SIXTH_SENSE: (card, ctx) => {
    ctx.addLog(`${card.name} 사용: 바닥에 6번째 카드가 나타납니다!`);
    ctx.setGameState(prev => {
      const newDeck = [...prev.deck];
      const newCommunity = [...prev.communityCards, newDeck.pop()!];
      return {
        ...prev,
        deck: newDeck,
        communityCards: newCommunity,
        equippedAlphaCards: removeIfConsumable(card, prev.equippedAlphaCards),
      };
    });
  },

  THIRD_EYE: (card, ctx) => {
    ctx.addLog(`${card.name} 사용: 내 손패에 3번째 카드가 추가됩니다!`);
    ctx.setGameState(prev => {
      const newDeck = [...prev.deck];
      const newHand = [...prev.playerHand, newDeck.pop()!];
      return {
        ...prev,
        deck: newDeck,
        playerHand: newHand,
        equippedAlphaCards: removeIfConsumable(card, prev.equippedAlphaCards),
      };
    });
  },

  // === 타겟 선택이 필요한 카드들 (handleHandCardClick에서 처리) ===
  CHANGE_SUIT: (_card, _ctx) => 'NEED_TARGET' as any,
  PLUS_ONE: (_card, _ctx) => 'NEED_TARGET' as any,
  MINUS_ONE: (_card, _ctx) => 'NEED_TARGET' as any,
  LUCKY_SEVEN: (_card, _ctx) => 'NEED_TARGET' as any,
  JOKER: (_card, _ctx) => 'NEED_TARGET' as any,
  MAKE_SPADE: (_card, _ctx) => 'NEED_TARGET' as any,
  MAKE_HEART: (_card, _ctx) => 'NEED_TARGET' as any,
  MAKE_DIAMOND: (_card, _ctx) => 'NEED_TARGET' as any,
  MAKE_CLOVER: (_card, _ctx) => 'NEED_TARGET' as any,
};

/**
 * 타겟 선택이 필요한지 확인
 */
export function needsTarget(type: AlphaCardType): boolean {
  return ['CHANGE_SUIT', 'PLUS_ONE', 'MINUS_ONE', 'LUCKY_SEVEN', 'JOKER',
    'MAKE_SPADE', 'MAKE_HEART', 'MAKE_DIAMOND', 'MAKE_CLOVER'].includes(type);
}

/**
 * 타겟 선택 카드의 효과를 적용합니다 (handleHandCardClick에서 호출)
 */
export function applyTargetedEffect(
  type: AlphaCardType,
  targetCard: Card,
  allCards: { communityCards: Card[]; playerHand: Card[]; opponentHand: Card[] },
  addLog: (msg: string) => void
): Card {
  const modified = { ...targetCard };

  switch (type) {
    case 'CHANGE_SUIT': {
      const newSuit = SUITS[(SUITS.indexOf(modified.suit) + 1) % 4];
      modified.suit = newSuit;
      addLog(`문양을 변경했습니다.`);
      break;
    }
    case 'PLUS_ONE': {
      const rankIdx = RANKS.indexOf(modified.rank);
      if (rankIdx < RANKS.length - 1) {
        modified.rank = RANKS[rankIdx + 1];
        addLog(`숫자를 올렸습니다.`);
      }
      break;
    }
    case 'MINUS_ONE': {
      const rankIdx = RANKS.indexOf(modified.rank);
      if (rankIdx > 0) {
        modified.rank = RANKS[rankIdx - 1];
        addLog(`숫자를 내렸습니다.`);
      }
      break;
    }
    case 'LUCKY_SEVEN': {
      modified.rank = '7' as Rank;
      addLog(`숫자를 7로 변경했습니다.`);
      break;
    }
    case 'JOKER': {
      const inPlayStrings = [
        ...allCards.communityCards,
        ...allCards.playerHand,
        ...allCards.opponentHand
      ].map(formatCard);
      let randomRank: Rank;
      let randomSuit: Suit;
      let newCardString: string;
      let attempts = 0;
      do {
        randomRank = RANKS[Math.floor(Math.random() * RANKS.length)];
        randomSuit = SUITS[Math.floor(Math.random() * SUITS.length)];
        newCardString = `${randomRank}${randomSuit}`;
        attempts++;
      } while (inPlayStrings.includes(newCardString) && attempts < 100);
      modified.rank = randomRank!;
      modified.suit = randomSuit!;
      addLog(`조커의 마법! 카드가 ${formatCardDisplay(modified)}로 변했습니다.`);
      break;
    }
    case 'MAKE_SPADE': {
      modified.suit = 's' as Suit;
      addLog(`문양을 스페이드로 변경했습니다.`);
      break;
    }
    case 'MAKE_HEART': {
      modified.suit = 'h' as Suit;
      addLog(`문양을 하트로 변경했습니다.`);
      break;
    }
    case 'MAKE_DIAMOND': {
      modified.suit = 'd' as Suit;
      addLog(`문양을 다이아로 변경했습니다.`);
      break;
    }
    case 'MAKE_CLOVER': {
      modified.suit = 'c' as Suit;
      addLog(`문양을 클로버로 변경했습니다.`);
      break;
    }
  }

  return modified;
}
