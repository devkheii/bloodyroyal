import React from 'react';
import { motion } from 'motion/react';
import { GameState } from '../../lib/game';

interface RevivePromptProps {
  gameState: GameState;
  onRevive: () => void;
  onGiveUp: () => void;
}

export const RevivePrompt: React.FC<RevivePromptProps> = ({ gameState, onRevive, onGiveUp }) => {
  return (
    <div className="flex-grow flex flex-col items-center justify-center space-y-8 p-4">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        <h2 className="text-4xl font-black text-red-500 mb-4 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">패배...</h2>
        <p className="text-gray-300 text-lg">체력이 모두 소진되었습니다.</p>
      </motion.div>

      <div className="panel-bloodyroyal panel-bloodyroyal-purple p-8 max-w-md w-full text-center">
        <h3 className="text-2xl font-bold text-yellow-400 mb-4">판 뒤엎기 (부활)</h3>
        <p className="text-gray-300 mb-6">
          남은 기회: <span className="text-yellow-400 font-bold text-xl">{gameState.reviveCount}</span> / 3 <br/>
          <span className="text-sm text-red-400 mt-2 block">※ 부활 시 상대방의 공격력과 체력이 대폭 상승합니다!</span>
        </p>

        <div className="flex flex-col gap-4">
          <button
            onClick={onRevive}
            className="btn-bloodyroyal btn-bloodyroyal-purple"
          >
            판 뒤엎기! (부활)
          </button>
          <button
            onClick={onGiveUp}
            className="btn-bloodyroyal btn-bloodyroyal-fold"
          >
            포기하기
          </button>
        </div>
      </div>
    </div>
  );
};
