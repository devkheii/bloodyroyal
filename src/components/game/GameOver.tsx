import React from 'react';
import { GameState } from '../../lib/game';
import { AlphaCardUI } from '../AlphaCardUI';

interface GameOverProps {
  gameState: GameState;
  onKeepCard: (cardId: string) => void;
}

export const GameOver: React.FC<GameOverProps> = ({ gameState, onKeepCard }) => {
  return (
    <div className="flex-grow flex flex-col items-center justify-center space-y-8">
      <h2 className="text-5xl text-red-600 font-bold" style={{ textShadow: '4px 4px 0px #000' }}>GAME OVER</h2>
      <p className="text-sm text-gray-300">모든 체력을 잃었습니다. (도달 스테이지: {gameState.stage})</p>
      
      <div className="panel-bloodyroyal w-full p-8 flex flex-col items-center">
        <p className="text-xs text-yellow-600 mb-4">다음 게임으로 계승할 조커를 1장 선택하세요:</p>
        <div className="flex flex-wrap gap-4 justify-center">
          {gameState.inventoryAlphaCards.map(card => (
            <AlphaCardUI 
              key={card.id} 
              card={card} 
              onClick={() => onKeepCard(card.id)}
            />
          ))}
          {gameState.inventoryAlphaCards.length === 0 && (
            <button
              onClick={() => onKeepCard('')}
              className="btn-bloodyroyal btn-bloodyroyal-fold"
            >
              처음부터 다시
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
