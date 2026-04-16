import React from 'react';
import { Item, GameState } from '../../lib/game';

interface ShopProps {
  gameState: GameState;
  onBuyItem: (item: Item) => void;
  onExit: () => void;
}

export const Shop: React.FC<ShopProps> = ({ gameState, onBuyItem, onExit }) => {
  return (
    <div className="flex-grow flex flex-col space-y-6 items-center justify-center">
      <h2 className="text-3xl text-center text-yellow-400 mb-2">상점</h2>
      <p className="text-center text-sm text-gray-400 mb-8">
        체력(HP)을 지불하여 패시브 아이템을 구매할 수 있습니다.<br/>
        현재 내 체력: <span className="text-green-400 font-bold">{gameState.playerHp} HP</span>
      </p>

      <div className="flex flex-wrap gap-6 justify-center">
        {gameState.shopItems.map(item => {
          const isOwned = gameState.inventoryItems.some(i => i.type === item.type);
          const canAfford = gameState.playerHp > item.price;
          
          return (
            <div 
              key={item.id} 
              className={`w-48 h-64 bg-gray-800 border-4 rounded-xl p-4 flex flex-col items-center justify-between transition-all ${isOwned ? 'border-gray-600 opacity-50' : 'border-yellow-600 hover:border-yellow-400 hover:-translate-y-2'}`}
            >
              <div className="text-center">
                <h3 className="text-lg font-bold text-yellow-400 mb-2">{item.name}</h3>
                <p className="text-xs text-gray-300 leading-relaxed">{item.description}</p>
              </div>
              
              <div className="flex flex-col items-center gap-2 w-full">
                <div className="text-green-400 font-mono font-bold">{item.price} HP</div>
                <button 
                  onClick={() => !isOwned && canAfford && onBuyItem(item)}
                  disabled={isOwned || !canAfford}
                  className={`w-full py-2 rounded font-bold transition-colors ${isOwned ? 'bg-gray-700 text-gray-500' : canAfford ? 'bg-yellow-600 hover:bg-yellow-500 text-black' : 'bg-red-900 text-red-400 cursor-not-allowed'}`}
                >
                  {isOwned ? '보유 중' : canAfford ? '구매하기' : '체력 부족'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button 
        onClick={onExit}
        className="px-8 py-3 bg-gray-600 hover:bg-gray-500 text-white border-4 border-gray-800 rounded-sm mt-8"
      >
        상점 나가기
      </button>
    </div>
  );
};
