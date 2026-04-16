import { Hand } from 'pokersolver';

export type Suit = 's' | 'h' | 'd' | 'c';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
  isJoker?: boolean;
}

export const SUITS: Suit[] = ['s', 'h', 'd', 'c'];
export const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

export function shuffle(deck: Card[]): Card[] {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
}

export function formatCard(card: Card): string {
  return `${card.rank}${card.suit}`;
}

export function formatCardDisplay(card: Card): string {
  const rankDisplay = card.rank === 'T' ? '10' : card.rank;
  const suitSymbol = { s: '♠', h: '♥', d: '♦', c: '♣' }[card.suit];
  return `${rankDisplay}${suitSymbol}`;
}

export const HAND_NAMES_KO: Record<string, string> = {
  'Royal Flush': '로열 플러시',
  'Straight Flush': '스트레이트 플러시',
  'Four of a Kind': '포카드',
  'Full House': '풀하우스',
  'Flush': '플러시',
  'Straight': '스트레이트',
  'Three of a Kind': '트리플',
  'Two Pair': '투페어',
  'Pair': '원페어',
  'High Card': '하이카드'
};

export function evaluateHand(holeCards: Card[], communityCards: Card[]) {
  const cardStrings = [...holeCards, ...communityCards].map(formatCard);
  
  // 1. Rank-preserving variation (for Pairs, Trips, Quads, Full House, Straight)
  const rankPreserving: string[] = [];
  const usedCards = new Set<string>();
  const suits = ['s', 'h', 'd', 'c'];
  
  for (const card of cardStrings) {
    let newCard = card;
    if (usedCards.has(newCard)) {
      const rank = card[0];
      let found = false;
      for (const s of suits) {
        const candidate = rank + s;
        if (!usedCards.has(candidate)) {
          newCard = candidate;
          found = true;
          break;
        }
      }
      if (!found) continue; // Skip if we have more than 4 of a kind
    }
    usedCards.add(newCard);
    rankPreserving.push(newCard);
  }
  
  const hand1 = Hand.solve(rankPreserving);
  
  // 2. Suit-preserving variation (for Flushes)
  const suitCounts: Record<string, number> = {};
  for (const card of cardStrings) {
    const suit = card[1];
    suitCounts[suit] = (suitCounts[suit] || 0) + 1;
  }
  
  let hand2: any = null;
  for (const suit in suitCounts) {
    if (suitCounts[suit] >= 5) {
      const flushCards = cardStrings.filter(c => c[1] === suit);
      const uniqueFlushCards: string[] = [];
      const usedRanks = new Set<string>();
      const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
      
      for (const card of flushCards) {
        let rank = card[0];
        if (usedRanks.has(rank)) {
          for (const r of ranks) {
            if (!usedRanks.has(r)) {
              rank = r;
              break;
            }
          }
        }
        usedRanks.add(rank);
        uniqueFlushCards.push(rank + suit);
      }
      
      hand2 = Hand.solve(uniqueFlushCards);
      if (hand2.rank >= 9) {
        // Downgrade accidental Straight Flushes to Flush
        hand2.name = 'Flush';
        hand2.rank = 6;
      }
      break;
    }
  }
  
  if (hand2 && hand2.rank > hand1.rank) {
    return hand2;
  }
  return hand1;
}

export function getBestHandCards(holeCards: Card[], communityCards: Card[]): string[] {
  const solved = evaluateHand(holeCards, communityCards);
  if (solved.name === 'High Card') return [];
  
  const allCards = solved.cards;
  
  // For hands where only some cards form the rank (Pair, Two Pair, etc.), filter out kickers.
  if (['Pair', 'Two Pair', 'Three of a Kind', 'Four of a Kind'].includes(solved.name)) {
    const rankCounts: Record<string, number> = {};
    allCards.forEach((c: any) => {
      rankCounts[c.value] = (rankCounts[c.value] || 0) + 1;
    });
    
    return allCards
      .filter((c: any) => rankCounts[c.value] > 1)
      .map((c: any) => `${c.value}${c.suit}`);
  }
  
  // For Straight, Flush, Full House, etc., all 5 cards are part of the scoring hand.
  return allCards.map((c: any) => `${c.value}${c.suit}`);
}

export function compareHands(hand1: any, hand2: any): number {
  const winners = Hand.winners([hand1, hand2]);
  if (winners.length === 2) return 0; // Tie
  return winners[0] === hand1 ? 1 : -1;
}
