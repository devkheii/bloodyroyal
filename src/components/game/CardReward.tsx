import React from 'react';
import { AlphaCard, getAlphaCardMaxLevel, getAlphaCardUsageRuleByLevel } from '../../lib/game';
import { AlphaCardUI } from '../AlphaCardUI';

interface CardRewardProps {
  rewardCards: AlphaCard[];
  inventoryCards: AlphaCard[];
  onSelect: (card: AlphaCard) => void;
}

export const CardReward: React.FC<CardRewardProps> = ({ rewardCards, inventoryCards, onSelect }) => {
  const getOwnedCount = (card: AlphaCard) => inventoryCards.filter(c => c.type === card.type).length;
  const getUpgradePreview = (card: AlphaCard): string | null => {
    const ownedSameType = inventoryCards.filter(c => c.type === card.type);
    if (ownedSameType.length === 0) return null;

    const highestLevel = ownedSameType.reduce((acc, c) => Math.max(acc, c.level ?? 1), 1);
    const maxLevel = getAlphaCardMaxLevel(card.type);
    const currentRule = getAlphaCardUsageRuleByLevel(card.type, highestLevel);

    if (currentRule.consumeOnUse || highestLevel >= maxLevel) {
      return `선택 시 최대 레벨 보상: 체력 +10`;
    }

    const nextLevel = highestLevel + 1;
    const nextRule = getAlphaCardUsageRuleByLevel(card.type, nextLevel);
    return `선택 시 Lv.${highestLevel} → Lv.${nextLevel} (충전 ${currentRule.chargesPerStage}→${nextRule.chargesPerStage}, CD ${currentRule.roundCooldown}→${nextRule.roundCooldown})`;
  };

  return (
    <div className="flex-grow flex flex-col space-y-6 items-center justify-center">
      <h2 className="text-2xl text-center text-purple-400">보상을 선택하세요</h2>
      <p className="text-center text-sm text-gray-400 mb-8">
        인벤토리에 추가할 조커를 1장 선택하세요. 중복 카드는 기존 카드 강화로 전환됩니다.
      </p>
      
      <div className="flex flex-wrap gap-6 justify-center">
        {rewardCards.map((card, i) => {
          const ownedCount = getOwnedCount(card);
          const upgradePreview = getUpgradePreview(card);
          return (
            <div key={`${card.id}-${i}`} className="flex flex-col items-center gap-2">
              <AlphaCardUI card={card} onClick={() => onSelect(card)} />
              {ownedCount > 0 && (
                <>
                  <div className="text-xs text-yellow-300">기보유 {ownedCount}장</div>
                  {upgradePreview && (
                    <div className="text-[10px] text-cyan-300 text-center max-w-[220px] leading-tight">
                      {upgradePreview}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
