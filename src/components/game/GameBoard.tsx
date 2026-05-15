import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState, AlphaCard, getAlphaCardUsageRuleByLevel } from '../../lib/game';
import { Card, getBestHandCards, formatCard, HAND_NAMES_KO, evaluateHand } from '../../lib/poker';
import { PlayingCard } from '../PlayingCard';
import { AlphaCardUI } from '../AlphaCardUI';
import { HandProbability } from './HandProbability';
import { getEnemyForStage } from '../../lib/enemies';

const gameBoardObjects = import.meta.glob('../../images/game_board_object_*.png', { eager: true, import: 'default' }) as Record<string, string>;
const gameBoardObjectList = Object.entries(gameBoardObjects)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, src]) => {
    const match = path.match(/object_(\d+)\./);
    return { src, item: match ? `item${match[1]}` : 'item01' };
  });

interface GameBoardProps {
  gameState: GameState;
  revealedDeckCards: Card[];
  activeAlphaCard: AlphaCard | null;
  selectedHandCardIndex: number | null;
  alphaCardRuntimeById: Record<string, { remainingCharges: number; cooldown: number }>;
  opponentCheatWarning: string | null;
  isRoundEnding: boolean;
  opponentDialogue: string | null;
  onPlayerAction: (action: 'FOLD' | 'CALL' | 'RAISE' | 'ALL_IN') => void;
  onUseAlphaCard: (card: AlphaCard) => void;
  onHandCardClick: (index: number) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  revealedDeckCards,
  activeAlphaCard,
  selectedHandCardIndex,
  alphaCardRuntimeById,
  opponentCheatWarning,
  isRoundEnding,
  opponentDialogue,
  onPlayerAction,
  onUseAlphaCard,
  onHandCardClick,
}) => {
  const [showProbability, setShowProbability] = useState(true);
  const gameBoardRef = useRef<HTMLDivElement>(null);
  const [boardRect, setBoardRect] = useState({ right: 0, top: 0, height: 0 });

  useEffect(() => {
    const update = () => {
      if (gameBoardRef.current) {
        const rect = gameBoardRef.current.getBoundingClientRect();
        setBoardRect({ right: rect.right, top: rect.top, height: rect.height });
      }
    };
    update();
    window.addEventListener('resize', update);
    const observer = new ResizeObserver(update);
    if (gameBoardRef.current) observer.observe(gameBoardRef.current);
    return () => {
      window.removeEventListener('resize', update);
      observer.disconnect();
    };
  }, []);

  const isEarlyStage = gameState.stage <= 10;
  const enemy = getEnemyForStage(gameState.stage);
  let bestHandCards: string[] = [];
  let currentHandName = '';
  let opponentBestHandCards: string[] = [];
  let opponentHandName = '';

  if ((isEarlyStage || gameState.phase === 'SHOWDOWN') && gameState.communityCards.length > 0) {
    try {
      bestHandCards = getBestHandCards(gameState.playerHand, gameState.communityCards);
      const solved = evaluateHand(gameState.playerHand, gameState.communityCards);
      if (solved.name !== 'High Card' || gameState.phase === 'SHOWDOWN') {
        currentHandName = HAND_NAMES_KO[solved.name] || solved.name;
      }
    } catch (e) {
      console.error("Hand evaluation error:", e);
    }
  }

  if (gameState.phase === 'SHOWDOWN' && gameState.communityCards.length > 0) {
    try {
      opponentBestHandCards = getBestHandCards(gameState.opponentHand, gameState.communityCards);
      const solved = evaluateHand(gameState.opponentHand, gameState.communityCards);
      opponentHandName = HAND_NAMES_KO[solved.name] || solved.name;
    } catch (e) {
      console.error("Opponent hand evaluation error:", e);
    }
  }

  const unknownCards = [
    ...gameState.deck,
    ...gameState.opponentHand.filter((_, i) => !gameState.revealedOpponentCards[i])
  ];

  return (
    <div className="flex-grow flex flex-col items-center w-full max-w-6xl mx-auto game-board-scale">
      {/* Main Game Area */}
      <div ref={gameBoardRef} className="game-board w-full h-[800px] flex flex-col justify-between p-5 border-4 relative z-10 max-w-[800px]">
        {gameBoardObjectList.map((obj, i) => (
          <div key={i} className={`game-board-object ${obj.item}`}><img src={obj.src} alt="" /></div>
        ))}


        {/* Opponent Area */}
      <div className="flex flex-col items-center space-y-2 relative">
        {/* Enemy Avatar & Dialogue */}
        <div className="absolute top-0 left-4 flex items-start gap-2">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-800 border-4 border-black flex items-center justify-center text-2xl sm:text-3xl" style={{ boxShadow: '4px 4px 0px #000' }}>
              {enemy.emoji}
            <div className="absolute -bottom-2 -right-2 bg-red-800 text-white text-[8px] px-1 py-1 border-2 border-black font-bold">
              {enemy.name}
            </div>
          </div>
          <AnimatePresence>
            {opponentDialogue && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white text-black px-4 py-2 border-4 border-black max-w-[200px] text-xs sm:text-sm font-bold relative"
                style={{ boxShadow: '4px 4px 0px #000' }}
              >
                {opponentDialogue}
                <div className="absolute top-2 -left-2 w-4 h-4 bg-white border-l-4 border-t-4 border-black transform -rotate-45 -translate-x-1"></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-between w-full px-4 pt-16 sm:pt-20">
          <div className="text-red-400 ml-auto font-bold text-[10px] sm:text-xs">상대 체력: {gameState.opponentHp}/{gameState.maxOpponentHp}</div>
        </div>
        <div className="hp-gauge hp-gauge-red w-full mx-4">
          <div className="hp-fill" style={{ width: `${(gameState.opponentHp / gameState.maxOpponentHp) * 100}%` }}></div>
        </div>
        <div className="flex gap-2 mt-2">
          {gameState.opponentHand.map((card, i) => (
            <PlayingCard 
              key={i} 
              card={card} 
              hidden={gameState.phase !== 'SHOWDOWN' && !gameState.revealedOpponentCards[i]} 
              highlighted={gameState.phase === 'SHOWDOWN' && opponentBestHandCards.includes(formatCard(card))}
            />
          ))}
        </div>
        {gameState.phase === 'SHOWDOWN' && opponentHandName && (
          <div className="text-red-400 font-bold mt-2 animate-bounce">
            상대 족보: {opponentHandName}
          </div>
        )}
        {gameState.phase !== 'SHOWDOWN' && (
          gameState.callAmount > 0 ? (
            <div className="text-red-400 font-bold animate-pulse mt-2">
              ⚠️ 상대의 공격 예고: {gameState.callAmount} 데미지
            </div>
          ) : (
            <div className="text-gray-400 mt-2">
              상대가 관망 중입니다.
            </div>
          )
        )}
        {opponentCheatWarning && (
          <div className="mt-2 px-2 py-1 text-[10px] sm:text-xs font-bold text-black bg-yellow-300 border-2 border-black animate-pulse">
            {opponentCheatWarning}
          </div>
        )}
      </div>

      {/* Table Area */}
      <div className="flex flex-col items-center justify-center py-2 relative">
        {revealedDeckCards.length > 0 && (
          <div className="absolute top-0 flex flex-col items-center -mt-8">
            <div className="text-yellow-600 text-[10px] mb-1">미래 예지 (Next Cards)</div>
            <div className="flex gap-1 scale-50 origin-top opacity-80">
              {revealedDeckCards.map((card, i) => <PlayingCard key={i} card={card} />)}
            </div>
          </div>
        )}
        <div className="flex flex-col items-center mb-2">
          <div className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Stage {gameState.stage}/50</div>
          <div className="text-yellow-400 text-base font-bold">총 공격력(POT): {gameState.pot}</div>
        </div>
        <div className="flex gap-2 min-h-[100px] relative">
          {gameState.communityCards.map((card, i) => (
            <PlayingCard 
              key={i} 
              card={card} 
              highlighted={bestHandCards.includes(formatCard(card)) || (gameState.phase === 'SHOWDOWN' && opponentBestHandCards.includes(formatCard(card)))}
            />
          ))}
          
          {(isEarlyStage || gameState.phase === 'SHOWDOWN') && currentHandName && (
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-20">
              <div className="bg-yellow-500 text-black px-3 py-1 border-4 border-black text-xs font-bold whitespace-nowrap" style={{ boxShadow: '4px 4px 0px #000' }}>
                내 현재 족보: {currentHandName}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Player Area */}
      <div className="flex flex-col items-center space-y-2">
        <div className="flex justify-between w-full px-4">
          <div className="text-green-400 text-[10px] sm:text-xs">내 체력: {gameState.playerHp}/{gameState.maxPlayerHp}</div>
          <div className="text-blue-400 text-[10px] sm:text-xs">지불한 체력: {gameState.playerInvested}</div>
        </div>
        <div className="hp-gauge hp-gauge-green w-full mx-4">
          <div className="hp-fill" style={{ width: `${(gameState.playerHp / gameState.maxPlayerHp) * 100}%` }}></div>
        </div>
        
        <div className="flex flex-col items-center gap-2 w-full mt-4">
          {/* Jokers */}
          <div className="flex gap-2 pb-2 pt-4 px-2 w-full justify-center">
            {gameState.equippedAlphaCards.map((card) => {
              const runtime = alphaCardRuntimeById[card.id] ?? {
                remainingCharges: getAlphaCardUsageRuleByLevel(card.type, card.level ?? 1).chargesPerStage,
                cooldown: 0,
              };
              return (
                <AlphaCardUI
                  key={card.id}
                  card={card}
                  small
                  used={runtime.remainingCharges <= 0}
                  disabled={runtime.cooldown > 0 || isRoundEnding || !!activeAlphaCard}
                  chargesLeft={runtime.remainingCharges}
                  cooldownLeft={runtime.cooldown}
                  onClick={() => onUseAlphaCard(card)}
                />
              );
            })}
          </div>

          {/* Equipped Items */}
          {gameState.equippedItems.length > 0 && (
            <div className="flex gap-2 justify-center mb-2">
              {gameState.equippedItems.map((item) => (
                <div 
                  key={item.id} 
                  className="group relative px-2 py-1 bg-gray-800/80 border border-blue-500/50 rounded text-[10px] text-blue-300 flex items-center gap-1"
                >
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  {item.name}
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-2 bg-black border border-gray-700 rounded text-[9px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                    {item.description}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-4 items-end">
            {gameState.playerHand.map((card, i) => (
              <div 
                key={i} 
                onClick={() => onHandCardClick(i)}
                className={`transition-transform cursor-pointer ${activeAlphaCard ? 'hover:-translate-y-4 ring-2 ring-purple-500 rounded-lg' : ''}`}
              >
                <PlayingCard 
                  card={card} 
                  highlighted={bestHandCards.includes(formatCard(card))}
                />
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>

      {/* Controls - Below Game Board */}
      {['PREFLOP', 'FLOP', 'TURN', 'RIVER'].includes(gameState.phase) && (
        <div className="flex gap-2 items-center pt-3 max-w-[800px] w-full">
          {gameState.playerHp > 0 ? (
            <>
              <button
                onClick={() => onPlayerAction('FOLD')}
                disabled={isRoundEnding || !!activeAlphaCard}
                className="btn-bloodyroyal btn-bloodyroyal-fold disabled:opacity-50 disabled:cursor-not-allowed flex-1"
              >
                FOLD
              </button>
              <button
                onClick={() => onPlayerAction('CALL')}
                disabled={isRoundEnding || !!activeAlphaCard}
                className="btn-bloodyroyal btn-bloodyroyal-call disabled:opacity-50 disabled:cursor-not-allowed flex-1"
              >
                {gameState.callAmount > 0 ? `CALL(${Math.min(gameState.playerHp, gameState.callAmount)})` : 'CHECK'}
              </button>
              <button
                onClick={() => onPlayerAction('RAISE')}
                disabled={isRoundEnding || !!activeAlphaCard}
                className="btn-bloodyroyal btn-bloodyroyal-raise disabled:opacity-50 disabled:cursor-not-allowed flex-1"
              >
                RAISE(+10)
              </button>
              <button
                onClick={() => onPlayerAction('ALL_IN')}
                disabled={isRoundEnding || !!activeAlphaCard}
                className="btn-bloodyroyal btn-bloodyroyal-allin disabled:opacity-50 disabled:cursor-not-allowed flex-1"
              >
                ALL-IN
              </button>
            </>
          ) : (
            <button
              onClick={() => onPlayerAction('ALL_IN')}
              disabled={isRoundEnding || !!activeAlphaCard}
              className="btn-bloodyroyal btn-bloodyroyal-allin disabled:opacity-50 disabled:cursor-not-allowed flex-1"
            >
              ALL-IN
            </button>
          )}
        </div>
      )}

      {/* Sidebar / Hand Probability - Fixed Position */}
      {boardRect.right > 0 && (
        <div
          className="fixed z-40 flex"
          style={{ left: `${boardRect.right}px`, top: `${boardRect.top}px`, height: `${boardRect.height}px` }}
        >
          {showProbability && (
            <div className="w-56 lg:w-64 overflow-y-auto self-start mt-2">
              <HandProbability
                playerHand={gameState.playerHand}
                communityCards={gameState.communityCards}
                unknownCards={unknownCards}
              />
            </div>
          )}
          <button
            onClick={() => setShowProbability(!showProbability)}
            className="p-3 bg-black/80 border border-gray-600 text-yellow-500 text-xs flex items-center justify-center hover:bg-black/90 shrink-0 self-start mt-2"
            title="족보 확률 토글"
          >
            {showProbability ? '접기' : '족보 펼치기'}
          </button>
        </div>
      )}
    </div>
  );
};
