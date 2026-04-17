import React, { useMemo, useState } from 'react';
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
  const [cardFilter, setCardFilter] = useState<'ALL' | 'BOSS' | 'CONSUMABLE' | 'PERSISTENT'>('ALL');
  const [cardSort, setCardSort] = useState<'RECENT' | 'NAME' | 'COST_ASC' | 'COST_DESC'>('RECENT');

  const filteredSortedCards = useMemo(() => {
    const filtered = gameState.inventoryAlphaCards.filter(card => {
      if (cardFilter === 'BOSS') return !!card.isBossCard;
      if (cardFilter === 'CONSUMABLE') return !!card.isConsumable;
      if (cardFilter === 'PERSISTENT') return !card.isConsumable;
      return true;
    });

    const cards = [...filtered];
    if (cardSort === 'NAME') {
      cards.sort((a, b) => a.name.localeCompare(b.name));
    } else if (cardSort === 'COST_ASC') {
      cards.sort((a, b) => (a.hpCost ?? 0) - (b.hpCost ?? 0));
    } else if (cardSort === 'COST_DESC') {
      cards.sort((a, b) => (b.hpCost ?? 0) - (a.hpCost ?? 0));
    } else {
      // Keep acquisition order by default (most recently acquired last)
    }

    return cards;
  }, [gameState.inventoryAlphaCards, cardFilter, cardSort]);

  return (
    <div className="flex-grow flex flex-col space-y-6">
      <h2 className="text-xl text-center text-purple-400">덱 및 아이템 구성</h2>
      <p className="text-center text-xs text-gray-400">
        이번 스테이지에 사용할 조커를 최대 {getMaxEquipSlots(gameState.stage)}장 장착하세요.
        <br/>
        패시브 아이템은 최대 {getMaxItemSlots(gameState.stage)}개 장착 가능합니다.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-center text-xs">
        <div className="text-gray-300 text-center sm:text-left">보유 조커: {gameState.inventoryAlphaCards.length}장</div>
        <div className="flex gap-2 justify-center">
          <select
            value={cardFilter}
            onChange={e => setCardFilter(e.target.value as 'ALL' | 'BOSS' | 'CONSUMABLE' | 'PERSISTENT')}
            className="bg-gray-900 border border-gray-700 px-2 py-1 rounded text-gray-200"
          >
            <option value="ALL">전체</option>
            <option value="BOSS">보스</option>
            <option value="CONSUMABLE">소모형</option>
            <option value="PERSISTENT">지속형</option>
          </select>
          <select
            value={cardSort}
            onChange={e => setCardSort(e.target.value as 'RECENT' | 'NAME' | 'COST_ASC' | 'COST_DESC')}
            className="bg-gray-900 border border-gray-700 px-2 py-1 rounded text-gray-200"
          >
            <option value="RECENT">획득순</option>
            <option value="NAME">이름순</option>
            <option value="COST_ASC">코스트↑</option>
            <option value="COST_DESC">코스트↓</option>
          </select>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-4 justify-center">
        {filteredSortedCards.map(card => (
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
