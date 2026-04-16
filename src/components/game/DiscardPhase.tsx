import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GameState } from '../../lib/game';
import { formatCard } from '../../lib/poker';

interface DiscardPhaseProps {
  gameState: GameState;
  onConfirmDiscard: (discardIndices: number[]) => void;
}

export const DiscardPhase: React.FC<DiscardPhaseProps> = ({ gameState, onConfirmDiscard }) => {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  const toggleSelection = (index: number) => {
    if (selectedIndices.includes(index)) {
      setSelectedIndices(prev => prev.filter(i => i !== index));
    } else {
      if (selectedIndices.length < 2) {
        setSelectedIndices(prev => [...prev, index]);
      }
    }
  };

  const handleConfirm = () => {
    if (selectedIndices.length === 2) {
      onConfirmDiscard(selectedIndices);
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center space-y-8 p-4">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-yellow-400 mb-2">시작 패 선택</h2>
        <p className="text-gray-300">버릴 카드 2장을 선택하세요.</p>
      </div>

      <div className="flex gap-4">
        {gameState.playerHand.map((card, index) => {
          const isSelected = selectedIndices.includes(index);
          const isRed = card.suit === 'h' || card.suit === 'd';
          const suitSymbol = { s: '♠', h: '♥', d: '♦', c: '♣' }[card.suit];

          return (
            <motion.div
              key={index}
              onClick={() => toggleSelection(index)}
              className={`w-28 h-40 border-4 flex flex-col items-center justify-center bg-white cursor-pointer relative transition-all ${
                isSelected ? 'border-red-500 opacity-50 translate-y-2' : 'border-black'
              }`}
              style={{ boxShadow: isSelected ? 'none' : '4px 4px 0px #000' }}
            >
              <div className={`text-3xl font-bold ${isRed ? 'text-red-600' : 'text-black'}`}>
                {card.rank === 'T' ? '10' : card.rank}
              </div>
              <div className={`text-4xl ${isRed ? 'text-red-600' : 'text-black'}`}>
                {suitSymbol}
              </div>
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-red-500 font-black text-4xl rotate-45">+</div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <button
        onClick={handleConfirm}
        disabled={selectedIndices.length !== 2}
        className={`px-8 py-4 border-4 text-xl font-bold transition-transform ${
          selectedIndices.length === 2 
            ? 'bg-green-600 hover:bg-green-500 text-white border-black active:translate-y-1 active:translate-x-1' 
            : 'bg-gray-700 text-gray-500 border-gray-900 cursor-not-allowed'
        }`}
        style={{ boxShadow: selectedIndices.length === 2 ? '6px 6px 0px #000' : 'none' }}
      >
        선택 완료 ({selectedIndices.length}/2)
      </button>
    </div>
  );
};
