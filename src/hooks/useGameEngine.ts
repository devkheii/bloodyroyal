import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, createDeck, shuffle, evaluateHand, compareHands, formatCard, formatCardDisplay, Rank, Suit, RANKS, SUITS } from '../lib/poker';
import { GameState, GamePhase, getOpponentMaxHp, getRandomAlphaCard, getRandomAlphaCards, getBossCardForStage, AlphaCard, AlphaCardType, Item, getRandomItems, getMaxItemSlots, getOpponentAction, getAlphaCardUsageRuleByLevel, getAlphaCardMaxLevel } from '../lib/game';
import { saveScore, getScores, ScoreEntry } from '../lib/api';
import { HAND_NAMES_KO, INITIAL_HP, MAX_PLAYER_HP_LIMIT, HP_PER_STAGE } from '../constants';
import { getEnemyForStage } from '../lib/enemies';
import { dealNewRound } from '../lib/dealHands';
import { ALPHA_CARD_EFFECTS, applyTargetedEffect, EffectContext } from '../lib/alphaCardEffects';

export interface UseGameEngine {
  // State
  gameState: GameState;
  rewardCards: AlphaCard[];
  selectedInventoryCards: string[];
  selectedInventoryItems: string[];
  activeAlphaCard: AlphaCard | null;
  revealedDeckCards: Card[];
  roundResultText: string | null;
  damageEffect: 'PLAYER' | 'OPPONENT' | null;
  alphaCardRuntimeById: Record<string, { remainingCharges: number; cooldown: number }>;
  allInReadHint: string | null;
  opponentCheatWarning: string | null;
  isRoundEnding: boolean;
  opponentDialogue: string | null;
  playerName: string;
  leaderboard: ScoreEntry[];
  isSubmitting: boolean;

  // Actions
  startGame: () => void;
  startStage: () => void;
  handleConfirmDiscard: (indices: number[]) => void;
  handlePlayerAction: (action: 'FOLD' | 'CALL' | 'RAISE' | 'ALL_IN') => void;
  handleNextStage: () => void;
  handleRevive: () => void;
  handleGiveUp: () => void;
  handleGameOverKeepCard: (cardId: string) => void;
  handleSaveScore: () => void;
  handleSkipScore: () => void;
  useAlphaCard: (card: AlphaCard) => void;
  handleHandCardClick: (index: number) => void;
  loadScoreboard: () => void;
  handleCardRewardSelect: (card: AlphaCard) => void;
  handleBuyItem: (item: Item) => void;
  handleExitShop: () => void;
  handleStartStageFromDeckbuilding: (toEquipCards: AlphaCard[], toEquipItems: Item[]) => void;
  handleBackToMenu: () => void;

  // Setters
  setSelectedInventoryCards: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedInventoryItems: React.Dispatch<React.SetStateAction<string[]>>;
  setPlayerName: (name: string) => void;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;

  // Helpers
  getMaxEquipSlots: (stage: number) => number;
  getBgUrl: (stage: number) => string;
}

function clampChance(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getAllInCallChance(
  stage: number,
  opponentRank: number,
  opponentHp: number,
  callCost: number,
  potBeforeOpponentCall: number
): number {
  const stageBase =
    stage <= 10 ? 0.52 :
    stage <= 20 ? 0.50 :
    stage <= 30 ? 0.42 :
    stage <= 40 ? 0.56 : 0.72;

  // pokersolver rank: High Card=1 ... Royal Flush=10
  const handBonus =
    opponentRank <= 1 ? -0.20 :
    opponentRank === 2 ? -0.06 :
    opponentRank === 3 ? 0.02 :
    opponentRank === 4 ? 0.10 :
    opponentRank === 5 ? 0.16 :
    opponentRank === 6 ? 0.20 :
    0.24;

  const riskRatio = callCost / Math.max(1, opponentHp);
  // Early stages should not over-fold all-ins even when chip/HP pressure is high.
  const hpRiskPenalty =
    stage <= 10
      ? (riskRatio >= 1 ? 0.16 : riskRatio * 0.10)
      : (riskRatio >= 1 ? 0.35 : riskRatio * 0.25);

  // Lower required equity (pot odds) should increase call tendency.
  const callOdds = callCost / Math.max(1, potBeforeOpponentCall + callCost);
  const potOddsBonus = (0.5 - callOdds) * 0.5;

  const stageFloor =
    stage <= 10 ? 0.45 :
    stage <= 20 ? 0.35 :
    stage <= 30 ? 0.30 :
    stage <= 40 ? 0.45 : 0.58;

  const rawChance = stageBase + handBonus + potOddsBonus - hpRiskPenalty;
  return clampChance(rawChance, stageFloor, 0.98);
}

function getAllInReadHint(callChance: number): string {
  if (callChance >= 0.75) return '강공 성향 (콜 가능성 높음)';
  if (callChance >= 0.55) return '균형 성향 (콜/폴드 혼합)';
  return '신중 성향 (폴드 경향)';
}

function drawCommunityCardWithStageBias(
  deck: Card[],
  communityCards: Card[],
  stage: number
): { nextDeck: Card[]; card: Card | null } {
  const nextDeck = [...deck];
  if (nextDeck.length === 0) return { nextDeck, card: null };

  // Early-stage smoothing: avoid creating a board-only Straight+ on river.
  const isEarlyStageRiverDraw = stage <= 10 && communityCards.length + 1 === 5;
  if (!isEarlyStageRiverDraw) {
    return { nextDeck, card: nextDeck.pop()! };
  }

  const safeIndices: number[] = [];
  for (let i = 0; i < nextDeck.length; i++) {
    const candidate = nextDeck[i];
    try {
      const boardEval = evaluateHand([], [...communityCards, candidate]);
      const boardRank = boardEval.rank ?? 1;
      if (boardRank < 5) {
        safeIndices.push(i);
      }
    } catch (e) {
      console.error('Community board smoothing evaluation error:', e);
    }
  }

  if (safeIndices.length > 0) {
    const pickedIndex = safeIndices[Math.floor(Math.random() * safeIndices.length)];
    const [pickedCard] = nextDeck.splice(pickedIndex, 1);
    return { nextDeck, card: pickedCard ?? null };
  }

  return { nextDeck, card: nextDeck.pop()! };
}

interface AlphaCardRuntime {
  remainingCharges: number;
  cooldown: number;
}

function createAlphaCardRuntime(cards: AlphaCard[]): Record<string, AlphaCardRuntime> {
  const runtime: Record<string, AlphaCardRuntime> = {};
  cards.forEach(card => {
    const rule = getAlphaCardUsageRuleByLevel(card.type, card.level ?? 1);
    runtime[card.id] = {
      remainingCharges: rule.chargesPerStage,
      cooldown: 0,
    };
  });
  return runtime;
}

export function useGameEngine(): UseGameEngine {
  const [gameState, setGameState] = useState<GameState>({
    phase: 'MENU',
    stage: 1,
    playerHp: INITIAL_HP,
    opponentHp: getOpponentMaxHp(1),
    maxPlayerHp: INITIAL_HP,
    maxOpponentHp: getOpponentMaxHp(1),
    deck: [],
    playerHand: [],
    opponentHand: [],
    communityCards: [],
    playerInvested: 0,
    callAmount: 0,
    pot: 0,
    inventoryAlphaCards: [],
    equippedAlphaCards: [],
    inventoryItems: [],
    equippedItems: [],
    shopItems: [],
    logs: ['치트 포커에 오신 것을 환영합니다!'],
    revealedOpponentCards: [false, false],
    isShieldActive: false,
    playerAggression: 0,
    reviveCount: 3,
    difficultyMultiplier: 1,
  });

  const [selectedInventoryCards, setSelectedInventoryCards] = useState<string[]>([]);
  const [selectedInventoryItems, setSelectedInventoryItems] = useState<string[]>([]);
  const [activeAlphaCard, setActiveAlphaCard] = useState<AlphaCard | null>(null);
  const [rewardCards, setRewardCards] = useState<AlphaCard[]>([]);
  const [damageEffect, setDamageEffect] = useState<'PLAYER' | 'OPPONENT' | null>(null);
  const [revealedDeckCards, setRevealedDeckCards] = useState<Card[]>([]);
  const [roundResultText, setRoundResultText] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>('');
  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alphaCardRuntimeById, setAlphaCardRuntimeById] = useState<Record<string, AlphaCardRuntime>>({});
  const [allInReadHint, setAllInReadHint] = useState<string | null>(null);
  const [opponentCheatWarning, setOpponentCheatWarning] = useState<string | null>(null);
  const [isRoundEnding, setIsRoundEnding] = useState(false);
  const [opponentDialogue, setOpponentDialogue] = useState<string | null>(null);
  const hasOpponentCheatedThisRoundRef = useRef(false);

  // Stale closure 방지를 위한 ref
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const setOpponentCheatUsed = useCallback((value: boolean) => {
    hasOpponentCheatedThisRoundRef.current = value;
  }, []);

  const addLog = useCallback((msg: string) => {
    setGameState(prev => ({ ...prev, logs: [...prev.logs, msg].slice(-5) }));
  }, []);

  useEffect(() => {
    const current = gameStateRef.current;
    if (!['PREFLOP', 'FLOP', 'TURN', 'RIVER'].includes(current.phase) || current.playerHp <= 0) {
      setAllInReadHint(null);
      return;
    }

    try {
      const opponentEval = evaluateHand(current.opponentHand, current.communityCards);
      const opponentRank = opponentEval.rank ?? 1;
      const previewCost = current.playerHp;
      const previewPot = current.pot + previewCost;
      const previewChance = getAllInCallChance(
        current.stage,
        opponentRank,
        current.opponentHp,
        previewCost,
        previewPot
      );
      setAllInReadHint(`올인 예상: ${getAllInReadHint(previewChance)}`);
    } catch (e) {
      console.error('ALL_IN hint evaluation error:', e);
      setAllInReadHint(null);
    }
  }, [
    gameState.phase,
    gameState.playerHp,
    gameState.opponentHp,
    gameState.pot,
    gameState.stage,
    gameState.communityCards,
    gameState.opponentHand,
  ]);

  const getBgUrl = useCallback((stage: number) => {
    // 1-10: 숲1, 11-20: 숲2, 21-30: 성곽 외부, 31-40: 성곽 내부, 41-49: 하늘, 50: 제단
    if (stage <= 10) return '/forest_1.png';
    if (stage <= 20) return '/forest_2.png';
    if (stage <= 30) return '/castle_1.png';
    if (stage <= 40) return '/castle_2.png';
    if (stage < 50) return '/dungeon_1.png'; // 41-49
    return '/sky.png'; // 50+
  }, []);

  const getMaxEquipSlots = useCallback((stage: number) => {
    if (stage >= 20) return 3;
    if (stage >= 11) return 2;
    return 1;
  }, []);

  // ========== handleRoundEnd ==========
  const handleRoundEnd = useCallback((winner: 'PLAYER' | 'OPPONENT' | 'TIE', handName?: string) => {
    if (isRoundEnding) return;
    setIsRoundEnding(true);
    setActiveAlphaCard(null);

    const current = gameStateRef.current;
    const shouldTickCooldown = ['FLOP', 'TURN', 'RIVER', 'SHOWDOWN'].includes(current.phase);
    const enemy = getEnemyForStage(current.stage);
    if (winner === 'PLAYER') {
      setOpponentDialogue(enemy.dialogues.lose);
    } else if (winner === 'OPPONENT') {
      setOpponentDialogue(enemy.dialogues.win);
    }

    setDamageEffect(winner === 'PLAYER' ? 'OPPONENT' : winner === 'OPPONENT' ? 'PLAYER' : null);

    let resultText = '';
    if (winner === 'PLAYER') resultText = `승리! ${handName ? `(${handName})` : '(상대 다이)'}`;
    else if (winner === 'OPPONENT') resultText = `패배... ${handName ? `(${handName})` : '(내 다이)'}`;
    else resultText = `무승부! ${handName ? `(${handName})` : ''}`;
    
    setRoundResultText(resultText);

    setTimeout(() => {
      setDamageEffect(null);
      setRoundResultText(null);
      setRevealedDeckCards([]);
      setOpponentDialogue(getEnemyForStage(gameStateRef.current.stage).dialogues.intro);
      setOpponentCheatWarning(null);
      setOpponentCheatUsed(false);
      if (shouldTickCooldown) {
        setAlphaCardRuntimeById(prev => {
          const next: Record<string, AlphaCardRuntime> = {};
          (Object.entries(prev) as [string, AlphaCardRuntime][]).forEach(([id, state]) => {
            next[id] = {
              ...state,
              cooldown: Math.max(0, state.cooldown - 1),
            };
          });
          return next;
        });
      }

      setGameState(prev => {
        let nextPlayerHp = prev.playerHp;
        let nextOpponentHp = prev.opponentHp;
        let newLogs: string[] = [];

        if (winner === 'PLAYER') {
          const opponentContribution = prev.pot - prev.playerInvested;
          const isFold = !handName;
          const damageDealt = isFold ? opponentContribution : prev.pot;
          
          nextPlayerHp = Math.min(MAX_PLAYER_HP_LIMIT, Math.min(prev.maxPlayerHp, nextPlayerHp + prev.pot));
          nextOpponentHp -= damageDealt;
          
          const healAmount = prev.pot - prev.playerInvested;
          newLogs.push(`공격 성공! 상대에게 ${damageDealt} 데미지를 주고, ${healAmount > 0 ? `${healAmount} HP를 흡수했습니다!` : '체력을 돌려받았습니다.'}`);
          
          if (prev.equippedItems.some(i => i.type === 'BLOOD_AMULET')) {
            nextPlayerHp = Math.min(MAX_PLAYER_HP_LIMIT, Math.min(prev.maxPlayerHp, nextPlayerHp + 15));
            newLogs.push(`[피의 부적] 승리하여 15 HP를 회복했습니다.`);
          }
        } else if (winner === 'OPPONENT') {
          let damage = prev.playerInvested;
          if (prev.isShieldActive) {
            const reducedDamage = Math.floor(damage / 2);
            const refund = damage - reducedDamage;
            nextPlayerHp = Math.min(MAX_PLAYER_HP_LIMIT, Math.min(prev.maxPlayerHp, nextPlayerHp + refund));
            damage = reducedDamage;
            newLogs.push(`[방패] 데미지가 절반으로 감소했습니다! (${refund} HP 회복)`);
          }
          newLogs.push(`방어 실패... 총 ${damage} HP의 피해를 입었습니다.`);
          if (prev.equippedItems.some(i => i.type === 'THORN_ARMOR')) {
            nextOpponentHp -= 20;
            newLogs.push(`[가시 갑옷] 패배했지만 상대에게 20의 피해를 주었습니다.`);
          }
        } else {
          nextPlayerHp = Math.min(MAX_PLAYER_HP_LIMIT, Math.min(prev.maxPlayerHp, nextPlayerHp + prev.playerInvested));
          newLogs.push(`무승부! 지불한 체력을 돌려받습니다.`);
        }

        const nextMaxPlayerHp = Math.max(prev.maxPlayerHp, nextPlayerHp);
        const nextMaxOpponentHp = Math.max(prev.maxOpponentHp, nextOpponentHp);

        if (nextOpponentHp <= 0) {
          return { 
            ...prev, 
            phase: 'VICTORY' as GamePhase, 
            playerHp: nextPlayerHp, 
            opponentHp: 0, 
            maxPlayerHp: nextMaxPlayerHp, 
            pot: 0,
            playerInvested: 0,
            callAmount: 0,
            logs: [...prev.logs, ...newLogs].slice(-5) 
          };
        } else if (nextPlayerHp <= 0) {
          if (prev.reviveCount > 0) {
            return { 
              ...prev, 
              phase: 'REVIVE_PROMPT' as GamePhase, 
              playerHp: 0, 
              opponentHp: nextOpponentHp, 
              maxOpponentHp: nextMaxOpponentHp, 
              pot: 0,
              playerInvested: 0,
              callAmount: 0,
              logs: [...prev.logs, ...newLogs].slice(-5) 
            };
          }
          return { 
            ...prev, 
            phase: 'GAMEOVER' as GamePhase, 
            playerHp: 0, 
            opponentHp: nextOpponentHp, 
            maxOpponentHp: nextMaxOpponentHp, 
            pot: 0,
            playerInvested: 0,
            callAmount: 0,
            logs: [...prev.logs, ...newLogs].slice(-5) 
          };
        }

        // 다음 핸드 시작 — dealNewRound 사용
        const { deck, playerHand, opponentHand } = dealNewRound(prev.stage);

        return {
          ...prev,
          phase: 'DISCARD' as GamePhase,
          playerHp: nextPlayerHp,
          opponentHp: nextOpponentHp,
          maxPlayerHp: nextMaxPlayerHp,
          maxOpponentHp: nextMaxOpponentHp,
          deck,
          playerHand,
          opponentHand,
          communityCards: [],
          playerInvested: 0,
          callAmount: 0,
          pot: 0,
          revealedOpponentCards: [false, false],
          isShieldActive: false,
          logs: [...prev.logs, ...newLogs, "4장의 카드를 받았습니다. 버릴 카드 2장을 선택하세요."].slice(-5),
        };
      });
      setIsRoundEnding(false);
    }, 1500);
  }, [isRoundEnding, addLog]);

  // ========== Showdown useEffect (stale closure 수정) ==========
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (gameState.phase === 'SHOWDOWN') {
      timeoutId = setTimeout(() => {
        const current = gameStateRef.current;
        
        // Transform Jokers
        const transformJoker = (card: Card, otherCards: Card[]): Card => {
          if (!card.isJoker) return card;
          
          const inPlayStrings = otherCards.map(formatCard);
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
          
          return { rank: randomRank!, suit: randomSuit! };
        };

        const currentCommunity = current.communityCards;
        const playerHand = current.playerHand.map((c, i) => 
          transformJoker(c, [...currentCommunity, ...current.opponentHand, ...current.playerHand.slice(0, i), ...current.playerHand.slice(i + 1)])
        );
        const opponentHand = current.opponentHand.map((c, i) => 
          transformJoker(c, [...currentCommunity, ...playerHand, ...current.opponentHand.slice(0, i), ...current.opponentHand.slice(i + 1)])
        );

        const playerEval = evaluateHand(playerHand, current.communityCards);
        const opponentEval = evaluateHand(opponentHand, current.communityCards);
        
        const result = compareHands(playerEval, opponentEval);
        
        const playerHandName = HAND_NAMES_KO[playerEval.name] || playerEval.name;
        const opponentHandName = HAND_NAMES_KO[opponentEval.name] || opponentEval.name;
        
        addLog(`나: ${playerHandName}. 상대: ${opponentHandName}.`);
        
        if (result === 1) {
          addLog('쇼다운 승리!');
          handleRoundEnd('PLAYER', playerHandName);
        } else if (result === -1) {
          addLog('쇼다운 패배...');
          handleRoundEnd('OPPONENT', opponentHandName);
        } else {
          addLog('무승부! 팟을 나눕니다.');
          handleRoundEnd('TIE', playerHandName);
        }
      }, 2000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [gameState.phase, handleRoundEnd, addLog]);

  // ========== startGame ==========
  const startGame = useCallback(() => {
    const cards = getRandomAlphaCards(3);
    setRewardCards(cards);
    setGameState(prev => ({
      ...prev,
      phase: 'CARD_REWARD' as GamePhase,
      stage: 1,
      playerHp: INITIAL_HP,
      opponentHp: getOpponentMaxHp(1),
      maxPlayerHp: INITIAL_HP,
      maxOpponentHp: getOpponentMaxHp(1),
      equippedAlphaCards: [],
      inventoryItems: [],
      equippedItems: [],
      shopItems: [],
      reviveCount: 3,
      difficultyMultiplier: 1,
      logs: ['스테이지 1 시작. 보상을 선택하세요.'],
    }));
    setSelectedInventoryCards([]);
    setSelectedInventoryItems([]);
    setAlphaCardRuntimeById({});
    setOpponentCheatWarning(null);
    setOpponentCheatUsed(false);
  }, []);

  // ========== startStage ==========
  const startStage = useCallback(() => {
    const { deck, playerHand, opponentHand } = dealNewRound(gameStateRef.current.stage);
    setOpponentCheatWarning(null);
    setOpponentCheatUsed(false);
    
    const enemy = getEnemyForStage(gameStateRef.current.stage);
    setOpponentDialogue(enemy.dialogues.intro);

    setGameState(prev => {
      let newPlayerHp = prev.playerHp;
      let newOpponentHp = prev.opponentHp;
      let newMaxOpponentHp = prev.maxOpponentHp;
      let newLogs: string[] = [];
      let newOpponentHand = [...opponentHand];

      // 보스 스테이지 시작 효과
      if (prev.stage % 10 === 0) {
        const bossCard = getBossCardForStage(prev.stage);
        newLogs.push(`[보스 출현] 보스가 특수 조커 '${bossCard.name}'을(를) 사용했습니다!`);
        
        if (bossCard.type === 'BOSS_EYE') {
          newPlayerHp = Math.max(1, newPlayerHp - 10);
          newLogs.push(`보스의 마안! 체력을 10 빼앗기고 패가 노출되었습니다.`);
        } else if (bossCard.type === 'BOSS_GREED') {
          newMaxOpponentHp += 50;
          newOpponentHp += 50;
          newLogs.push(`보스의 탐욕! 보스의 최대 체력이 50 증가하고 회복했습니다.`);
        } else if (bossCard.type === 'BOSS_DEATH') {
          newPlayerHp = Math.max(1, newPlayerHp - 30);
          newLogs.push(`보스의 사신! 30의 피해를 입었습니다.`);
        } else if (bossCard.type === 'BOSS_FATE') {
          newOpponentHand = [
            { rank: 'A' as Rank, suit: 's' as Suit },
            { rank: 'A' as Rank, suit: 'h' as Suit }
          ];
          newLogs.push(`보스의 운명! 보스의 패가 무언가로 고정된 것 같습니다.`);
        } else if (bossCard.type === 'BOSS_MIRACLE') {
          newOpponentHp += 100;
          newLogs.push(`보스의 기적! 보스가 체력을 100 회복했습니다.`);
        }
      }

      // 아이템 패시브 효과 적용 (시작 시)
      let revealedCards: boolean[] = [false, false];
      prev.equippedItems.forEach(item => {
        if (item.type === 'REGEN_RING') {
          newPlayerHp = Math.min(MAX_PLAYER_HP_LIMIT, Math.min(prev.maxPlayerHp, newPlayerHp + 10));
          newLogs.push(`[재생의 반지] 체력을 10 회복했습니다.`);
        } else if (item.type === 'LUCKY_COIN') {
          if (Math.random() < 0.4) {
            newLogs.push(`[행운의 동전] 이번 라운드 기본 판돈이 면제되었습니다!`);
          }
        } else if (item.type === 'HAWK_EYE') {
          if (Math.random() < 0.4) {
            revealedCards[0] = true;
            newLogs.push(`[매의 눈] 상대의 패 1장을 꿰뚫어봅니다!`);
          }
        }
      });

      return {
        ...prev,
        phase: 'DISCARD' as GamePhase,
        playerHp: newPlayerHp,
        opponentHp: newOpponentHp,
        maxOpponentHp: newMaxOpponentHp,
        deck,
        playerHand,
        opponentHand: newOpponentHand,
        communityCards: [],
        playerInvested: 0,
        callAmount: 0,
        pot: 0,
        revealedOpponentCards: revealedCards,
        logs: [...newLogs, "4장의 카드를 받았습니다. 버릴 카드 2장을 선택하세요."].slice(-5),
      };
    });
  }, []);

  // ========== handleConfirmDiscard ==========
  const handleConfirmDiscard = useCallback((discardIndices: number[]) => {
    setOpponentCheatWarning(null);
    setOpponentCheatUsed(false);
    setGameState(prev => {
      const newHand = prev.playerHand.filter((_, i) => !discardIndices.includes(i));
      
      let nextPlayerHp = prev.playerHp;
      let isAnteFree = false;
      prev.equippedItems.forEach(item => {
        if (item.type === 'LUCKY_COIN' && Math.random() < 0.4) {
          isAnteFree = true;
        }
      });

      const antePlayer = isAnteFree ? 0 : Math.min(5, nextPlayerHp);
      const anteOpponent = 5;
      nextPlayerHp -= antePlayer;
      
      const oppAction = getOpponentAction(prev.opponentHand, [], prev.stage, antePlayer + anteOpponent, antePlayer, prev.opponentHp, prev.difficultyMultiplier);
      let oppBet = 0;
      if (oppAction !== 'FOLD') {
        oppBet = oppAction;
      }

      const newLogs = [...prev.logs, `스테이지 ${prev.stage} 시작. 기본 판돈 ${antePlayer} HP를 냈습니다.`];
      if (oppBet > 0) {
        newLogs.push(`[적의 턴] 상대가 ${oppBet} 데미지 공격을 예고했습니다!`);
      } else {
        newLogs.push(`[적의 턴] 상대가 관망(체크)합니다.`);
      }

      return {
        ...prev,
        phase: 'PREFLOP' as GamePhase,
        playerHand: newHand,
        playerHp: nextPlayerHp,
        playerInvested: antePlayer,
        callAmount: oppBet,
        pot: antePlayer + anteOpponent + oppBet,
        logs: newLogs.slice(-5)
      };
    });
  }, [setOpponentCheatUsed]);

  // ========== handlePlayerAction ==========
  const handlePlayerAction = useCallback((action: 'FOLD' | 'CALL' | 'RAISE' | 'ALL_IN') => {
    const current = gameStateRef.current;
    if (isRoundEnding || !['PREFLOP', 'FLOP', 'TURN', 'RIVER'].includes(current.phase)) return;
    if (activeAlphaCard) return;

    if (action === 'FOLD') {
      addLog('다이(Fold)했습니다. 이번 라운드를 포기합니다.');
      handleRoundEnd('OPPONENT');
      return;
    }

    setGameState(prev => {
      if (!['PREFLOP', 'FLOP', 'TURN', 'RIVER'].includes(prev.phase)) return prev;
      
      let nextPlayerHp = prev.playerHp;
      let nextPlayerInvested = prev.playerInvested;
      let nextPot = prev.pot;
      let newLogs = [...prev.logs];
      let forceShowdown = false;

      if (action === 'CALL') {
        const cost = Math.min(nextPlayerHp, prev.callAmount);
        nextPlayerHp -= cost;
        nextPlayerInvested += cost;
        nextPot += cost;
        newLogs.push(cost > 0 ? `콜! (${cost} HP 지불)` : `체크!`);
      } else if (action === 'RAISE') {
        const raiseAmount = 10;
        const cost = Math.min(nextPlayerHp, prev.callAmount + raiseAmount);
        nextPlayerHp -= cost;
        nextPlayerInvested += cost;
        nextPot += cost;
        const opponentCall = cost - prev.callAmount;
        nextPot += opponentCall;
        newLogs.push(`레이즈! (${cost} HP 지불, 상대가 ${opponentCall} 데미지를 추가로 받아들입니다.)`);
      } else if (action === 'ALL_IN') {
        const cost = nextPlayerHp;
        nextPlayerHp = 0;
        nextPlayerInvested += cost;
        nextPot += cost;
        newLogs.push(`올인!! 남은 모든 체력(${cost} HP)을 걸었습니다!`);

        const opponentEval = evaluateHand(prev.opponentHand, prev.communityCards);
        const opponentRank = opponentEval.rank ?? 1;
        const callChance = getAllInCallChance(
          prev.stage,
          opponentRank,
          prev.opponentHp,
          cost,
          nextPot
        );

        let willCallAllIn = Math.random() < callChance;
        const isBoardComplete = prev.communityCards.length >= 5;

        // If all community cards are already revealed, prevent paradoxical folds:
        // when opponent is tie/win on known board, they must call.
        if (isBoardComplete) {
          try {
            const playerKnownEval = evaluateHand(prev.playerHand, prev.communityCards);
            const opponentKnownEval = evaluateHand(prev.opponentHand, prev.communityCards);
            const knownResult = compareHands(playerKnownEval, opponentKnownEval);
            if (knownResult <= 0) {
              willCallAllIn = true;
            }
          } catch (e) {
            // Fail-safe: avoid impossible-looking fold outcomes when evaluation fails.
            willCallAllIn = true;
            console.error('ALL_IN known-board evaluation error:', e);
          }
        } else if (!willCallAllIn) {
          // Guard against paradoxical folds: if the deterministic final board would
          // make opponent tie/win, force a call instead of folding.
          const simDeck = [...prev.deck];
          const simCommunity = [...prev.communityCards];
          while (simCommunity.length < 5 && simDeck.length > 0) {
            simCommunity.push(simDeck.pop()!);
          }

          try {
            const playerSimEval = evaluateHand(prev.playerHand, simCommunity);
            const opponentSimEval = evaluateHand(prev.opponentHand, simCommunity);
            const simResult = compareHands(playerSimEval, opponentSimEval);
            if (simResult <= 0) {
              willCallAllIn = true;
            }
          } catch (e) {
            // Fail-safe: if forecast is broken, choose call over contradictory fold.
            willCallAllIn = true;
            console.error('ALL_IN forecast simulation error:', e);
          }
        }

        if (willCallAllIn) {
          nextPot += cost;
          newLogs.push(`상대가 올인을 받아들였습니다! (쇼다운 진행)`);
          forceShowdown = true;
          setOpponentDialogue(getEnemyForStage(prev.stage).dialogues.bet);
        } else {
          newLogs.push(`상대가 올인에 겁을 먹고 다이했습니다!`);
          setOpponentDialogue(getEnemyForStage(prev.stage).dialogues.fold);
          setIsRoundEnding(true);
          setTimeout(() => handleRoundEnd('PLAYER'), 1000);
          return {
            ...prev,
            playerHp: nextPlayerHp,
            playerInvested: nextPlayerInvested,
            pot: nextPot,
            logs: newLogs.slice(-5)
          };
        }
      }

      let nextPhase: GamePhase = forceShowdown ? 'SHOWDOWN' : prev.phase;
      let nextCommunity = [...prev.communityCards];
      let nextDeck = [...prev.deck];
      let nextPlayerHand = [...prev.playerHand];

      if (!forceShowdown) {
        if (prev.phase === 'PREFLOP') {
          nextPhase = 'FLOP';
          for (let i = 0; i < 3; i++) {
            const draw = drawCommunityCardWithStageBias(nextDeck, nextCommunity, prev.stage);
            nextDeck = draw.nextDeck;
            if (draw.card) nextCommunity.push(draw.card);
          }
          newLogs.push('플랍(Flop) 카드가 깔렸습니다.');
        } else if (prev.phase === 'FLOP') {
          nextPhase = 'TURN';
          const draw = drawCommunityCardWithStageBias(nextDeck, nextCommunity, prev.stage);
          nextDeck = draw.nextDeck;
          if (draw.card) nextCommunity.push(draw.card);
          newLogs.push('턴(Turn) 카드가 깔렸습니다.');
        } else if (prev.phase === 'TURN') {
          nextPhase = 'RIVER';
          const draw = drawCommunityCardWithStageBias(nextDeck, nextCommunity, prev.stage);
          nextDeck = draw.nextDeck;
          if (draw.card) nextCommunity.push(draw.card);
          newLogs.push('리버(River) 카드가 깔렸습니다.');
        } else if (prev.phase === 'RIVER') {
          nextPhase = 'SHOWDOWN';
        }
        
        // Enemy Cheat Logic
        if (
          prev.stage >= 11 &&
          ['FLOP', 'TURN', 'RIVER'].includes(nextPhase) &&
          !hasOpponentCheatedThisRoundRef.current
        ) {
          let cheatChance = 0;
          let canSabotageHand = false;
          let canAlterSuit = false;
          let canExtraDraw = false;

          // 구간별 사기 확률과 유형
          if (prev.stage <= 20) {
            cheatChance = 0.05 + ((prev.stage - 10) * 0.01); // 11~20: 5~15%
          } else if (prev.stage <= 30) {
            cheatChance = 0.10 + ((prev.stage - 20) * 0.01); // 21~30: 10~20%
            canSabotageHand = true;
          } else if (prev.stage <= 40) {
            cheatChance = 0.15 + ((prev.stage - 30) * 0.01); // 31~40: 15~25%
            canSabotageHand = true;
            canAlterSuit = true;
          } else {
            cheatChance = 0.20 + ((prev.stage - 40) * 0.01); // 41~50: 20~30%
            canSabotageHand = true;
            canAlterSuit = true;
            canExtraDraw = true;
          }

          if (Math.random() < cheatChance) {
            setOpponentCheatUsed(true);
            const warningText = '⚠️ 상대가 수상한 움직임을 보입니다.';
            setOpponentCheatWarning(warningText);
            setTimeout(() => setOpponentCheatWarning(null), 1800);
            newLogs.push(warningText);

            const types = ['BURN_CARD'];
            if (canSabotageHand) types.push('SABOTAGE_HAND');
            if (canAlterSuit) types.push('ALTER_SUIT');
            if (canExtraDraw) types.push('EXTRA_DRAW');

            const cheatType = types[Math.floor(Math.random() * types.length)];
            
            if (cheatType === 'BURN_CARD' && nextCommunity.length > 0) {
              nextCommunity.pop();
              newLogs.push(`[적의 사기!] 상대가 바닥의 카드를 불태웠습니다!`);
            } else if (cheatType === 'SABOTAGE_HAND' && nextPlayerHand.length > 0) {
              const badCard = nextDeck.find(c => ['2', '3', '4'].includes(c.rank));
              if (badCard) {
                nextDeck = nextDeck.filter(c => c !== badCard);
                nextPlayerHand[0] = badCard;
                newLogs.push(`[적의 사기!] 상대가 내 손패를 찢고 쓰레기 카드로 바꿨습니다!`);
              }
            } else if (cheatType === 'ALTER_SUIT' && nextPlayerHand.length > 0) {
               // 무작위로 문양을 변경하여 플러시 파훼
               const randomSuit = SUITS[Math.floor(Math.random() * SUITS.length)];
               nextPlayerHand[0] = { ...nextPlayerHand[0], suit: randomSuit };
               newLogs.push(`[적의 사기!] 상대가 내 손패의 문양을 조작했습니다!`);
            } else if (cheatType === 'EXTRA_DRAW') {
               // 적이 손패를 새로 하나 뽑음 (기존 카드는 그대로) - 실제 로직은 복잡하니 커뮤니티 추가로 대체
               if (nextCommunity.length < 5) {
                  nextCommunity.push(nextDeck.pop()!);
                  newLogs.push(`[적의 사기!] 상대가 몰래 바닥에 카드를 하나 더 깔았습니다!`);
               }
            }
          }
        }
      } else {
        // If forced showdown, deal remaining community cards
        while (nextCommunity.length < 5 && nextDeck.length > 0) {
          const draw = drawCommunityCardWithStageBias(nextDeck, nextCommunity, prev.stage);
          nextDeck = draw.nextDeck;
          if (draw.card) nextCommunity.push(draw.card);
          else break;
        }
      }

      let nextCallAmount = 0;
      if (nextPhase !== 'SHOWDOWN') {
        const oppAction = getOpponentAction(prev.opponentHand, nextCommunity, prev.stage, nextPot, nextPlayerInvested, prev.opponentHp, prev.difficultyMultiplier);
        
        if (oppAction === 'FOLD') {
          newLogs.push(`[적의 턴] 상대가 겁을 먹고 폴드했습니다!`);
          setIsRoundEnding(true);
          setTimeout(() => handleRoundEnd('PLAYER'), 1000);
          return {
            ...prev,
            phase: nextPhase,
            playerHp: nextPlayerHp,
            playerInvested: nextPlayerInvested,
            pot: nextPot,
            communityCards: nextCommunity,
            deck: nextDeck,
            callAmount: 0,
            logs: newLogs.slice(-5)
          };
        }

        nextCallAmount = oppAction;
        nextPot += oppAction;
        if (oppAction > 0) {
          newLogs.push(`[적의 턴] 상대가 ${oppAction} 데미지 공격을 예고했습니다!`);
        } else {
          newLogs.push(`[적의 턴] 상대가 관망(체크)합니다.`);
        }
      }

      return {
        ...prev,
        phase: nextPhase,
        playerHp: nextPlayerHp,
        playerInvested: nextPlayerInvested,
        pot: nextPot,
        communityCards: nextCommunity,
        deck: nextDeck,
        playerHand: nextPlayerHand,
        callAmount: nextCallAmount,
        logs: newLogs.slice(-5)
      };
    });
  }, [isRoundEnding, activeAlphaCard, handleRoundEnd, addLog, setOpponentCheatUsed]);

  // ========== handleNextStage ==========
  const handleNextStage = useCallback(() => {
    const current = gameStateRef.current;
    const clearedStage = current.stage;
    const nextStage = current.stage + 1;
    
    const nextMaxPlayerHp = Math.min(MAX_PLAYER_HP_LIMIT, current.maxPlayerHp + HP_PER_STAGE);
    const nextPlayerHp = Math.min(nextMaxPlayerHp, current.playerHp + HP_PER_STAGE);

    setSelectedInventoryCards(current.equippedAlphaCards.map(c => c.id));
    setSelectedInventoryItems(current.equippedItems.map(i => i.id));

    // 보상 빈도 조정
    // Phase 1 (1~10): 매 3스테이지마다 보상
    // Phase 2 (11~30): 매 5스테이지마다 보상
    // Phase 3 (31+): 매 5스테이지마다 보상 (보스 보상은 나중에 2택 1로 업그레이드됨)
    let isRewardStage = false;
    if (clearedStage <= 10 && clearedStage % 3 === 0) isRewardStage = true;
    else if (clearedStage > 10 && clearedStage % 5 === 0 && clearedStage % 10 !== 0) isRewardStage = true;

    if (clearedStage % 10 === 0) {
      // 10스테이지 단위는 보스
      let bossRewardCount = 1;
      if (clearedStage >= 30) bossRewardCount = 2; // 후반 보스는 보상을 2개 제시하고 선택
      
      const cards: AlphaCard[] = [];
      for (let i=0; i<bossRewardCount; i++) {
        // 실제로는 더 복잡한 로직이 필요하지만 임시로 같은 보스를 중복 방지해서 줍니다.
        cards.push(getBossCardForStage(clearedStage)); 
      }
      // 동일한 카드가 들어가면 키 충돌이 나므로 2개를 줄때는 다른 보스카드를 하나 섞도록 안전처리
      if (bossRewardCount > 1) {
         cards[1] = getBossCardForStage(clearedStage === 50 ? 40 : clearedStage + 10);
      }

      setRewardCards(cards);
      setGameState(prev => ({
        ...prev,
        phase: 'CARD_REWARD' as GamePhase,
        stage: nextStage,
        playerHp: nextPlayerHp,
        maxPlayerHp: nextMaxPlayerHp,
        opponentHp: getOpponentMaxHp(nextStage, prev.difficultyMultiplier),
        maxOpponentHp: getOpponentMaxHp(nextStage, prev.difficultyMultiplier),
        pot: 0,
        playerInvested: 0,
        callAmount: 0,
        logs: [`보스를 처치하고 특수 조커를 획득했습니다!`],
      }));
    } else if (isRewardStage) {
      // Duplicate policy (Option A): keep duplicates.
      // Reward generation no longer excludes already owned card types.
      const cards = getRandomAlphaCards(3);
      setRewardCards(cards);
      setGameState(prev => ({
        ...prev,
        phase: 'CARD_REWARD' as GamePhase,
        stage: nextStage,
        playerHp: nextPlayerHp,
        maxPlayerHp: nextMaxPlayerHp,
        opponentHp: getOpponentMaxHp(nextStage, prev.difficultyMultiplier),
        maxOpponentHp: getOpponentMaxHp(nextStage, prev.difficultyMultiplier),
        pot: 0,
        playerInvested: 0,
        callAmount: 0,
        logs: [`스테이지 ${clearedStage} 클리어! 보상을 선택하세요.`],
      }));
    } else {
      setGameState(prev => ({
        ...prev,
        phase: 'DECKBUILDING' as GamePhase,
        stage: nextStage,
        playerHp: nextPlayerHp,
        maxPlayerHp: nextMaxPlayerHp,
        opponentHp: getOpponentMaxHp(nextStage, prev.difficultyMultiplier),
        maxOpponentHp: getOpponentMaxHp(nextStage, prev.difficultyMultiplier),
        pot: 0,
        playerInvested: 0,
        callAmount: 0,
        logs: [`스테이지 ${clearedStage} 클리어! 덱을 구성하세요.`],
      }));
    }
    setSelectedInventoryCards([]);
  }, []);

  // ========== handleRevive ==========
  const handleRevive = useCallback(() => {
    setAlphaCardRuntimeById(createAlphaCardRuntime(gameStateRef.current.equippedAlphaCards));
    setOpponentCheatWarning(null);
    setOpponentCheatUsed(false);
    setGameState(prev => {
      const nextDifficulty = prev.difficultyMultiplier + 0.5;
      const nextPlayerHp = prev.maxPlayerHp; // Full heal

      setTimeout(() => {
        setOpponentDialogue(getEnemyForStage(prev.stage).dialogues.intro);
      }, 0);

      // dealNewRound 사용
      const { deck, playerHand, opponentHand } = dealNewRound(prev.stage);

      const newLogs = [...prev.logs, "판 뒤엎기! 난이도가 상승하며 부활했습니다.", "4장의 카드를 받았습니다. 버릴 카드 2장을 선택하세요."].slice(-5);

      return {
        ...prev,
        phase: 'DISCARD' as GamePhase,
        playerHp: nextPlayerHp,
        maxPlayerHp: prev.maxPlayerHp,
        reviveCount: prev.reviveCount - 1,
        difficultyMultiplier: nextDifficulty,
        deck,
        playerHand,
        opponentHand,
        communityCards: [],
        playerInvested: 0,
        callAmount: 0,
        pot: 0,
        revealedOpponentCards: [false, false],
        isShieldActive: false,
        logs: newLogs,
      };
    });
  }, [setOpponentCheatUsed]);

  // ========== handleGiveUp ==========
  const handleGiveUp = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      phase: 'GAMEOVER' as GamePhase,
      playerHp: 0
    }));
  }, []);

  // ========== handleGameOverKeepCard ==========
  const handleGameOverKeepCard = useCallback((cardId: string) => {
    setGameState(prev => {
      const cardToKeep = prev.inventoryAlphaCards.find(c => c.id === cardId);
      return {
        ...prev,
        phase: 'SCORE_PROMPT' as GamePhase,
        inventoryAlphaCards: cardToKeep ? [cardToKeep] : [],
      };
    });
  }, []);

  // ========== handleSaveScore ==========
  const handleSaveScore = useCallback(async () => {
    if (!playerName.trim()) return;
    setIsSubmitting(true);
    try {
      const current = gameStateRef.current;
      await saveScore({
        playerName: playerName.trim(),
        stage: current.stage,
        maxHp: current.maxPlayerHp,
        alphaCards: current.equippedAlphaCards.map(c => c.name),
      });
      setGameState(prev => ({
        ...prev,
        phase: 'MENU' as GamePhase,
      }));
      setPlayerName('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  }, [playerName]);

  // ========== handleSkipScore ==========
  const handleSkipScore = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      phase: 'MENU' as GamePhase,
    }));
    setPlayerName('');
  }, []);

  // ========== loadScoreboard ==========
  const loadScoreboard = useCallback(async () => {
    setGameState(prev => ({ ...prev, phase: 'SCOREBOARD' as GamePhase }));
    const scores = await getScores();
    setLeaderboard(scores);
  }, []);

  // ========== useAlphaCard ==========
  const useAlphaCard = useCallback((card: AlphaCard) => {
    const current = gameStateRef.current;
    if (isRoundEnding || current.phase === 'SHOWDOWN') return;
    if (activeAlphaCard) return;

    const usageRule = getAlphaCardUsageRuleByLevel(card.type, card.level ?? 1);
    const runtime = alphaCardRuntimeById[card.id] ?? {
      remainingCharges: usageRule.chargesPerStage,
      cooldown: 0,
    };

    if (runtime.remainingCharges <= 0) {
      addLog(`${card.name}의 이번 스테이지 충전이 모두 소진되었습니다.`);
      return;
    }
    if (runtime.cooldown > 0) {
      addLog(`${card.name}은(는) ${runtime.cooldown}라운드 후 다시 사용할 수 있습니다.`);
      return;
    }

    // Check HP Cost
    if (card.hpCost && current.playerHp <= card.hpCost) {
      addLog(`HP가 부족하여 ${card.name}을(를) 사용할 수 없습니다! (필요: ${card.hpCost} HP)`);
      return;
    }

    if (card.hpCost) {
      setGameState(prev => ({
        ...prev,
        playerHp: prev.playerHp - card.hpCost!
      }));
      addLog(`${card.name} 사용을 위해 ${card.hpCost} HP를 지불했습니다.`);
    }

    setAlphaCardRuntimeById(prev => {
      const currentRuntime = prev[card.id] ?? {
        remainingCharges: usageRule.chargesPerStage,
        cooldown: 0,
      };
      return {
        ...prev,
        [card.id]: {
          remainingCharges: Math.max(0, currentRuntime.remainingCharges - 1),
          cooldown: usageRule.roundCooldown,
        },
      };
    });

    if (usageRule.consumeOnUse) {
      setGameState(prev => ({
        ...prev,
        equippedAlphaCards: prev.equippedAlphaCards.filter(c => c.id !== card.id),
        inventoryAlphaCards: prev.inventoryAlphaCards.filter(c => c.id !== card.id),
      }));
      addLog(`${card.name}은(는) 사용 후 소멸했습니다.`);
    }

    const effectCtx: EffectContext = {
      gameState: gameStateRef.current,
      setGameState,
      addLog,
      setDamageEffect,
      handleRoundEnd,
      setRevealedDeckCards,
    };
    const effectResult = ALPHA_CARD_EFFECTS[card.type](card, effectCtx);
    if (effectResult === 'NEED_TARGET') {
      setActiveAlphaCard(card);
      addLog(`${card.name} 효과를 적용할 내 패를 선택하세요.`);
    }
  }, [isRoundEnding, activeAlphaCard, alphaCardRuntimeById, addLog, handleRoundEnd]);

  // ========== handleHandCardClick ==========
  const handleHandCardClick = useCallback((index: number) => {
    if (isRoundEnding) return;
    if (!activeAlphaCard) return;

    setGameState(prev => {
      const newHand = [...prev.playerHand];
      const targetCard = { ...newHand[index] };

      const modified = applyTargetedEffect(
        activeAlphaCard.type,
        targetCard,
        {
          communityCards: prev.communityCards,
          playerHand: prev.playerHand,
          opponentHand: prev.opponentHand,
        },
        addLog
      );

      newHand[index] = modified;
      return {
        ...prev,
        playerHand: newHand,
      };
    });
    setActiveAlphaCard(null);
  }, [isRoundEnding, activeAlphaCard, addLog]);

  // ========== UI 이벤트 핸들러 ==========
  const handleCardRewardSelect = useCallback((card: AlphaCard) => {
    const current = gameStateRef.current;
    const justClearedStage = current.stage - 1;
    const goToShop = justClearedStage > 0 && justClearedStage % 5 === 0;

    setGameState(prev => {
      const ownedSameType = prev.inventoryAlphaCards.filter(c => c.type === card.type);
      const maxLevel = getAlphaCardMaxLevel(card.type);
      const targetToUpgrade = ownedSameType.reduce((acc: AlphaCard | null, current: AlphaCard) => {
        if (!acc) return current;
        return (current.level ?? 1) > (acc.level ?? 1) ? current : acc;
      }, null as AlphaCard | null);

      let nextInv = prev.inventoryAlphaCards;
      let gainHp = 0;
      let rewardLog = `${card.name} 획득.`;

      if (!targetToUpgrade) {
        nextInv = [...prev.inventoryAlphaCards, { ...card, level: card.level ?? 1 }];
      } else if ((targetToUpgrade.level ?? 1) < maxLevel) {
        const nextLevel = (targetToUpgrade.level ?? 1) + 1;
        nextInv = prev.inventoryAlphaCards.map(invCard =>
          invCard.id === targetToUpgrade.id
            ? { ...invCard, level: nextLevel }
            : invCard
        );
        rewardLog = `${card.name} 중복 획득: Lv.${targetToUpgrade.level ?? 1} -> Lv.${nextLevel} 강화!`;
      } else {
        // Max-level duplicate fallback reward
        gainHp = 10;
        rewardLog = `${card.name} 중복 획득: 이미 최대 레벨이라 체력 10을 회복했습니다.`;
      }

      const nextPlayerHp = Math.min(MAX_PLAYER_HP_LIMIT, Math.min(prev.maxPlayerHp, prev.playerHp + gainHp));
      return {
        ...prev,
        phase: (goToShop ? 'SHOP' : 'DECKBUILDING') as GamePhase,
        playerHp: nextPlayerHp,
        inventoryAlphaCards: nextInv,
        shopItems: goToShop ? getRandomItems(3) : [],
        logs: [...prev.logs, `${rewardLog}${goToShop ? ' 상점에 입장합니다.' : ' 덱을 구성하세요.'}`].slice(-5)
      };
    });
  }, []);

  const handleBuyItem = useCallback((item: Item) => {
    const current = gameStateRef.current;
    if (current.playerHp <= item.price) return;
    if (current.inventoryItems.some(i => i.type === item.type)) return;
    setGameState(prev => ({
      ...prev,
      playerHp: prev.playerHp - item.price,
      inventoryItems: [...prev.inventoryItems, item],
      shopItems: prev.shopItems.filter(si => si.id !== item.id),
      logs: [...prev.logs, `${item.name} 구매 완료! (-${item.price} HP)`].slice(-5)
    }));
  }, []);

  const handleExitShop = useCallback(() => {
    setGameState(prev => ({ ...prev, phase: 'DECKBUILDING' as GamePhase }));
  }, []);

  const handleStartStageFromDeckbuilding = useCallback((toEquipCards: AlphaCard[], toEquipItems: Item[]) => {
    setAlphaCardRuntimeById(createAlphaCardRuntime(toEquipCards));
    setGameState(prev => ({
      ...prev,
      equippedAlphaCards: toEquipCards,
      equippedItems: toEquipItems
    }));
    startStage();
  }, [startStage]);

  const handleBackToMenu = useCallback(() => {
    setGameState(prev => ({ ...prev, phase: 'MENU' as GamePhase }));
  }, []);

  return {
    // State
    gameState,
    rewardCards,
    selectedInventoryCards,
    selectedInventoryItems,
    activeAlphaCard,
    revealedDeckCards,
    roundResultText,
    damageEffect,
    alphaCardRuntimeById,
    allInReadHint,
    opponentCheatWarning,
    isRoundEnding,
    opponentDialogue,
    playerName,
    leaderboard,
    isSubmitting,

    // Actions
    startGame,
    startStage,
    handleConfirmDiscard,
    handlePlayerAction,
    handleNextStage,
    handleRevive,
    handleGiveUp,
    handleGameOverKeepCard,
    handleSaveScore,
    handleSkipScore,
    useAlphaCard,
    handleHandCardClick,
    loadScoreboard,
    handleCardRewardSelect,
    handleBuyItem,
    handleExitShop,
    handleStartStageFromDeckbuilding,
    handleBackToMenu,

    // Setters
    setSelectedInventoryCards,
    setSelectedInventoryItems,
    setPlayerName,
    setGameState,

    // Helpers
    getMaxEquipSlots,
    getBgUrl,
  };
}
