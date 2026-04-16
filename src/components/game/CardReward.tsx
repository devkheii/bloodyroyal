import React from 'react';
import { AlphaCard } from '../../lib/game';
import { AlphaCardUI } from '../AlphaCardUI';

interface CardRewardProps {
  rewardCards: AlphaCard[];
  onSelect: (card: AlphaCard) => void;
}

export const CardReward: React.FC<CardRewardProps> = ({ rewardCards, onSelect }) => {
  return (
    <div className="flex-grow flex flex-col space-y-6 items-center justify-center">
      <h2 className="text-2xl text-center text-purple-400">보상을 선택하세요</h2>
      <p className="text-center text-sm text-gray-400 mb-8">
        인벤토리에 추가할 조커를 1장 선택하세요.
      </p>
      
      <div className="flex flex-wrap gap-6 justify-center">
        {rewardCards.map((card, i) => (
          <AlphaCardUI 
            key={i} 
            card={card} 
            onClick={() => onSelect(card)}
          />
        ))}
      </div>
    </div>
  );
};
