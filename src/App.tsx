import { motion, AnimatePresence } from 'motion/react';
import { useGameEngine } from './hooks/useGameEngine';
import { getMaxItemSlots } from './lib/game';

// Game Components
import { Menu } from './components/game/Menu';
import { Scoreboard } from './components/game/Scoreboard';
import { CardReward } from './components/game/CardReward';
import { Shop } from './components/game/Shop';
import { Deckbuilding } from './components/game/Deckbuilding';
import { GameBoard } from './components/game/GameBoard';
import { GameOver } from './components/game/GameOver';
import { Victory } from './components/game/Victory';
import { ScorePrompt } from './components/game/ScorePrompt';
import { RevivePrompt } from './components/game/RevivePrompt';
import { DiscardPhase } from './components/game/DiscardPhase';

export default function App() {
  const engine = useGameEngine();

  return (
    <div 
      className="min-h-screen w-full transition-all duration-1000 relative bg-cover bg-center"
      style={{ backgroundImage: `url(${engine.getBgUrl(engine.gameState.stage)})` }}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-black/70 pointer-events-none"></div>
      
      <motion.div 
        animate={engine.damageEffect ? { x: [-10, 10, -10, 10, 0], y: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="min-h-screen flex flex-col max-w-6xl mx-auto p-2 sm:p-4 relative overflow-hidden z-10"
      >
      <AnimatePresence>
        {engine.roundResultText && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="bg-black/90 text-white px-8 py-4 rounded-xl border-4 border-yellow-400 text-2xl sm:text-4xl font-bold text-center shadow-[0_0_30px_rgba(250,204,21,0.5)]">
              {engine.roundResultText}
            </div>
          </motion.div>
        )}
        {engine.damageEffect === 'OPPONENT' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
            animate={{ opacity: 1, scale: 1.5, rotate: -45 }}
            exit={{ opacity: 0, scale: 2 }}
            transition={{ duration: 0.3 }}
            className="absolute top-1/4 left-1/2 -ml-32 w-64 h-4 bg-red-500 shadow-[0_0_30px_red] z-50 rounded-full pointer-events-none"
          />
        )}
        {engine.damageEffect === 'PLAYER' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: 45 }}
            animate={{ opacity: 1, scale: 1.5, rotate: 45 }}
            exit={{ opacity: 0, scale: 2 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-1/4 left-1/2 -ml-32 w-64 h-4 bg-red-500 shadow-[0_0_30px_red] z-50 rounded-full pointer-events-none"
          />
        )}
      </AnimatePresence>

      <header className="flex justify-end items-center mb-1 border-b border-gray-700 pb-1">
        {engine.gameState.phase !== 'MENU' && (
          <div className="flex gap-4 text-xs sm:text-sm">
            <div className="text-purple-400">판 뒤엎기: {engine.gameState.reviveCount}</div>
          </div>
        )}
      </header>

      {engine.gameState.phase === 'MENU' && (
        <Menu onStart={engine.startGame} onViewLeaderboard={engine.loadScoreboard} />
      )}

      {engine.gameState.phase === 'SCOREBOARD' && (
        <Scoreboard 
          leaderboard={engine.leaderboard} 
          onBack={engine.handleBackToMenu} 
        />
      )}

      {engine.gameState.phase === 'CARD_REWARD' && (
        <CardReward 
          rewardCards={engine.rewardCards} 
          inventoryCards={engine.gameState.inventoryAlphaCards}
          onSelect={engine.handleCardRewardSelect} 
        />
      )}

      {engine.gameState.phase === 'SHOP' && (
        <Shop 
          gameState={engine.gameState} 
          onBuyItem={engine.handleBuyItem} 
          onExit={engine.handleExitShop} 
        />
      )}

      {engine.gameState.phase === 'DECKBUILDING' && (
        <Deckbuilding 
          gameState={engine.gameState}
          selectedInventoryCards={engine.selectedInventoryCards}
          setSelectedInventoryCards={engine.setSelectedInventoryCards}
          selectedInventoryItems={engine.selectedInventoryItems}
          setSelectedInventoryItems={engine.setSelectedInventoryItems}
          getMaxEquipSlots={engine.getMaxEquipSlots}
          getMaxItemSlots={getMaxItemSlots}
          onStartStage={engine.handleStartStageFromDeckbuilding}
        />
      )}

      {engine.gameState.phase === 'DISCARD' && (
        <DiscardPhase 
          gameState={engine.gameState}
          onConfirmDiscard={engine.handleConfirmDiscard}
        />
      )}

      {['PREFLOP', 'FLOP', 'TURN', 'RIVER', 'SHOWDOWN'].includes(engine.gameState.phase) && (
        <GameBoard 
          gameState={engine.gameState}
          revealedDeckCards={engine.revealedDeckCards}
          activeAlphaCard={engine.activeAlphaCard}
          selectedHandCardIndex={null}
          alphaCardRuntimeById={engine.alphaCardRuntimeById}
          opponentCheatWarning={engine.opponentCheatWarning}
          isRoundEnding={engine.isRoundEnding}
          opponentDialogue={engine.opponentDialogue}
          onPlayerAction={engine.handlePlayerAction}
          onUseAlphaCard={engine.useAlphaCard}
          onHandCardClick={engine.handleHandCardClick}
        />
      )}

      {engine.gameState.phase === 'VICTORY' && (
        <Victory 
          gameState={engine.gameState}
          playerName={engine.playerName}
          setPlayerName={engine.setPlayerName}
          isSubmitting={engine.isSubmitting}
          onNextStage={engine.handleNextStage}
          onSaveScore={engine.handleSaveScore}
          onSkipScore={engine.handleSkipScore}
        />
      )}

      {engine.gameState.phase === 'REVIVE_PROMPT' && (
        <RevivePrompt 
          gameState={engine.gameState}
          onRevive={engine.handleRevive}
          onGiveUp={engine.handleGiveUp}
        />
      )}

      {engine.gameState.phase === 'GAMEOVER' && (
        <GameOver 
          gameState={engine.gameState} 
          onKeepCard={engine.handleGameOverKeepCard} 
        />
      )}

      {engine.gameState.phase === 'SCORE_PROMPT' && (
        <ScorePrompt 
          gameState={engine.gameState}
          playerName={engine.playerName}
          setPlayerName={engine.setPlayerName}
          isSubmitting={engine.isSubmitting}
          onSaveScore={engine.handleSaveScore}
          onSkipScore={engine.handleSkipScore}
        />
      )}

      </motion.div>
    </div>
  );
}
