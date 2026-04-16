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

      <div className="bg-gray-900/80 border-2 border-purple-500 p-8 rounded-3xl max-w-md w-full text-center shadow-[0_0_40px_rgba(168,85,247,0.3)]">
        <h3 className="text-2xl font-bold text-yellow-400 mb-4">판 뒤엎기 (부활)</h3>
        <p className="text-gray-300 mb-6">
          남은 기회: <span className="text-yellow-400 font-bold text-xl">{gameState.reviveCount}</span> / 3 <br/>
          <span className="text-sm text-red-400 mt-2 block">※ 부활 시 상대방의 공격력과 체력이 대폭 상승합니다!</span>
        </p>

        <div className="flex flex-col gap-4">
          <button 
            onClick={onRevive}
            className="py-4 bg-purple-600 hover:bg-purple-500 text-white font-black text-xl rounded-xl border-b-4 border-purple-800 transition-all active:border-b-0 active:translate-y-1 shadow-lg"
          >
            판 뒤엎기! (부활)
          </button>
          <button 
            onClick={onGiveUp}
            className="py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold rounded-xl transition-all"
          >
            포기하기
          </button>
        </div>
      </div>
    </div>
  );
};
