import React from 'react';
import { AlphaCard as AlphaCardType, getAlphaCardMaxLevel, getAlphaCardUsageRuleByLevel } from '../lib/game';
import { Eye, Droplet, Plus, Minus, RefreshCcw, Skull, Heart, ArrowLeftRight, Search, ArrowUpCircle, Shield, Copy, Hash, Sparkles, CircleDashed, EyeOff } from 'lucide-react';

interface AlphaCardProps {
  card: AlphaCardType;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  used?: boolean;
  chargesLeft?: number;
  cooldownLeft?: number;
  small?: boolean;
  className?: string;
}

const getIconForType = (type: string, small: boolean) => {
  const size = small ? 18 : 28;
  switch (type) {
    case 'PEEK_OPPONENT': return <Eye size={size} />;
    case 'CHANGE_SUIT': return <Droplet size={size} />;
    case 'PLUS_ONE': return <Plus size={size} />;
    case 'MINUS_ONE': return <Minus size={size} />;
    case 'RELOAD': return <RefreshCcw size={size} />;
    case 'GUILLOTINE': return <Skull size={size} />;
    case 'VAMPIRE': return <Heart size={size} className="text-red-500" />;
    case 'SWAP_HAND': return <ArrowLeftRight size={size} />;
    case 'PEEK_DECK': return <Search size={size} />;
    case 'MAX_HP_UP': return <ArrowUpCircle size={size} />;
    case 'SHIELD': return <Shield size={size} />;
    case 'COPY_CARD': return <Copy size={size} />;
    case 'LUCKY_SEVEN': return <Hash size={size} />;
    case 'JOKER': return <Sparkles size={size} className="text-yellow-400" />;
    case 'BLACKHOLE': return <CircleDashed size={size} />;
    case 'THIRD_EYE': return <Eye size={size} className="text-blue-400" />;
    case 'SIXTH_SENSE': return <EyeOff size={size} />;
    default: return <Sparkles size={size} />;
  }
};

export const AlphaCardUI: React.FC<AlphaCardProps> = ({ card, onClick, selected, disabled, used, chargesLeft, cooldownLeft, small, className = '' }) => {
  const widthClass = small ? 'w-22' : 'w-32 sm:w-40';
  const heightClass = small ? 'h-30' : 'h-44 sm:h-56';
  const cardLevel = card.level ?? 1;
  const maxLevel = getAlphaCardMaxLevel(card.type);
  const currentRule = getAlphaCardUsageRuleByLevel(card.type, cardLevel);
  const nextLevel = Math.min(maxLevel, cardLevel + 1);
  const nextRule = getAlphaCardUsageRuleByLevel(card.type, nextLevel);
  const isLevelingDisabled = !!currentRule.consumeOnUse || maxLevel <= 1;
  const canUpgrade = !isLevelingDisabled && cardLevel < maxLevel;
  const isOutOfCharge = typeof chargesLeft === 'number' && chargesLeft <= 0;
  const hasCooldown = typeof cooldownLeft === 'number' && cooldownLeft > 0;
  const isBlocked = !!disabled || !!used || isOutOfCharge || hasCooldown;

  return (
    <div
      onClick={isBlocked ? undefined : onClick}
      className={`group alpha-card ${widthClass} ${heightClass} ${className} ${isBlocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} relative`}
    >
      <div className={`relative w-full h-full transition-transform ${selected ? '-translate-y-1' : ''}`}>

        {/* Front */}
        <div className={`absolute inset-0 alpha-card-front ${selected ? 'card-selected' : ''} flex flex-col items-center justify-center ${used || isOutOfCharge ? 'grayscale' : ''} transition-opacity duration-0`}>
          <div className="text-amber-300 mb-2">
            {getIconForType(card.type, !!small)}
          </div>
          <span className={`${small ? 'text-xs' : 'text-sm'} text-amber-100 text-center px-1 leading-tight`}>
            {card.name}
          </span>
          <span className={`mt-1 ${small ? 'text-xs' : 'text-sm'} text-yellow-300`}>Lv.{cardLevel}</span>
          {card.hpCost && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white alpha-card-badge px-1 py-0.5">
              -{card.hpCost}
            </span>
          )}
          {typeof chargesLeft === 'number' && (
            <span className="absolute -top-2 -left-2 bg-blue-700 text-white alpha-card-badge px-1 py-0.5">
              x{chargesLeft}
            </span>
          )}
          {hasCooldown && (
            <div className="absolute inset-0 bg-black/65 flex items-center justify-center">
              <span className="text-yellow-300 text-sm border-2 border-yellow-300 px-1">
                CD {cooldownLeft}
              </span>
            </div>
          )}
          {!hasCooldown && (used || isOutOfCharge) && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-red-500 text-sm rotate-[-45deg] border-2 border-red-500 px-1">
                {isOutOfCharge ? 'EMPTY' : 'USED'}
              </span>
            </div>
          )}
        </div>

        {/* Tooltip - 카드 위에 팝업으로 표시 */}
        {!isBlocked && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 alpha-card-tooltip p-3 flex-col items-center text-center hidden group-hover:flex pointer-events-none z-50">
            <div className="text-sm text-yellow-300 mb-1 border-b-2 border-amber-800/50 w-full pb-1">
              {card.name} (Lv.{cardLevel})
            </div>
            <span className="text-xs sm:text-sm text-amber-100/80 leading-relaxed py-1">
              {card.description}
            </span>
            <div className="w-full mt-1 border-t border-gray-700 pt-1 text-xs leading-tight text-cyan-200">
              {isLevelingDisabled ? (
                <div>강화 효과: 소모형 카드(충전/쿨다운 강화 없음)</div>
              ) : (
                <>
                  <div>현재: 충전 {currentRule.chargesPerStage}회 / CD {currentRule.roundCooldown}R</div>
                  {canUpgrade ? (
                    <div className="text-yellow-300">다음 Lv.{nextLevel}: 충전 {nextRule.chargesPerStage}회 / CD {nextRule.roundCooldown}R</div>
                  ) : (
                    <div className="text-yellow-300">최대 레벨 도달 (Lv.{maxLevel})</div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
