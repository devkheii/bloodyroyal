import React from 'react';
import { GameState } from '../../lib/game';
import { AlphaCardUI } from '../AlphaCardUI';

interface DeckbuildingProps {
  gameState: GameState;
  selectedInventoryCards: string[];
  setSelectedInventoryCards: React.Dispatch<React.SetStateAction<string[]>>;
  selectedInventoryItems: string[];
  setSelectedInventoryItems: React.Dispatch<React.SetStateAction<string[]>>;
  getMaxEquipSlots: (stage: number) => number;
  getMaxItemSlots: (stage: number) => number;
  onStartStage: (toEquipCards: any[], toEquipItems: any[]) => void;
}

export const Deckbuilding: React.FC<DeckbuildingProps> = ({
  gameState,
  selectedInventoryCards,
  setSelectedInventoryCards,
  selectedInventoryItems,
  setSelectedInventoryItems,
  getMaxEquipSlots,
  getMaxItemSlots,
  onStartStage,
}) => {
  return (
    <div className="flex-grow flex flex-col space-y-6">
      <h2 className="text-xl text-center text-purple-400">덱 및 아이템 구성</h2>
      <p className="text-center text-xs text-gray-400">
        이번 스테이지에 사용할 조커를 최대 {getMaxEquipSlots(gameState.stage)}장 장착하세요.
        <br/>
        패시브 아이템은 최대 {getMaxItemSlots(gameState.stage)}개 장착 가능합니다.
      </p>
      
      <div className="flex flex-wrap gap-4 justify-center">
        {gameState.inventoryAlphaCards.map(card => (
          <AlphaCardUI 
            key={card.id} 
            card={card} 
            selected={selectedInventoryCards.includes(card.id)}
            onClick={() => {
              if (selectedInventoryCards.includes(card.id)) {
                setSelectedInventoryCards(prev => prev.filter(id => id !== card.id));
              } else {
                setSelectedInventoryCards(prev => {
                  const maxSlots = getMaxEquipSlots(gameState.stage);
                  if (prev.length >= maxSlots) {
                    return [...prev.slice(1), card.id];
                  }
                  return [...prev, card.id];
                });
              }
            }}
          />
        ))}
      </div>

      {gameState.inventoryItems.length > 0 && (
        <>
          <h3 className="text-lg text-center text-yellow-400 mt-4">보유 아이템</h3>
          <div className="flex flex-wrap gap-4 justify-center">
            {gameState.inventoryItems.map(item => (
              <div 
                key={item.id} 
                className={`w-32 h-40 bg-gray-800 border-2 rounded-xl p-2 flex flex-col items-center justify-between cursor-pointer transition-all ${selectedInventoryItems.includes(item.id) ? 'border-green-400 shadow-[0_0_15px_rgba(74,222,128,0.5)] -translate-y-2' : 'border-gray-600'}`}
                onClick={() => {
                  if (selectedInventoryItems.includes(item.id)) {
                    setSelectedInventoryItems(prev => prev.filter(id => id !== item.id));
                  } else {
                    setSelectedInventoryItems(prev => {
                      const maxSlots = getMaxItemSlots(gameState.stage);
                      if (prev.length >= maxSlots) {
                        return [...prev.slice(1), item.id];
                      }
                      return [...prev, item.id];
                    });
                  }
                }}
              >
                <div className="text-center">
                  <h4 className="text-sm font-bold text-yellow-400 mb-1">{item.name}</h4>
                  <p className="text-[10px] text-gray-300 leading-tight">{item.description}</p>
                </div>
                {selectedInventoryItems.includes(item.id) && (
                  <div className="text-green-400 text-xs font-bold mt-2">장착됨</div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <div className="flex justify-center mt-8">
        <button 
          onClick={() => {
            let toEquipCards = gameState.inventoryAlphaCards.filter(c => selectedInventoryCards.includes(c.id));
            if (toEquipCards.length === 0 && gameState.inventoryAlphaCards.length > 0) {
               const maxSlots = getMaxEquipSlots(gameState.stage);
               const shuffled = [...gameState.inventoryAlphaCards].sort(() => 0.5 - Math.random());
               toEquipCards = shuffled.slice(0, maxSlots);
            }

            let toEquipItems = gameState.inventoryItems.filter(i => selectedInventoryItems.includes(i.id));
            if (toEquipItems.length === 0 && gameState.inventoryItems.length > 0) {
               const maxSlots = getMaxItemSlots(gameState.stage);
               const shuffled = [...gameState.inventoryItems].sort(() => 0.5 - Math.random());
               toEquipItems = shuffled.slice(0, maxSlots);
            }

            onStartStage(toEquipCards, toEquipItems);
          }}
          className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white border-4 border-green-800 rounded-sm"
        >
          스테이지 {gameState.stage} 시작
        </button>
      </div>
    </div>
  );
};
