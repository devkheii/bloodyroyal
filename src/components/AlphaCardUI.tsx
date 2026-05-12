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
  const size = small ? 16 : 24;
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
  const widthClass = small ? 'w-16' : 'w-24 sm:w-32';
  const heightClass = small ? 'h-24' : 'h-32 sm:h-44';
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
      className={`group ${widthClass} ${heightClass} ${className} ${isBlocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
    >
      <div className={`relative w-full h-full transition-transform ${selected ? '-translate-y-1' : ''}`} style={{ boxShadow: selected ? '4px 4px 0px #facc15' : '4px 4px 0px #000' }}>
        
        {/* Front */}
        <div className={`absolute inset-0 bg-purple-900 border-4 ${selected ? 'border-yellow-400' : 'border-black'} flex flex-col items-center justify-center ${used || isOutOfCharge ? 'grayscale' : ''} ${!small && !isBlocked ? 'group-hover:opacity-0' : ''} transition-opacity duration-0`}>
          <div className="text-purple-300 mb-2">
            {getIconForType(card.type, !!small)}
          </div>
          <span className={`${small ? 'text-[8px]' : 'text-[10px] sm:text-xs'} text-purple-200 font-bold text-center px-1 leading-tight`}>
            {card.name}
          </span>
          <span className="mt-1 text-[9px] text-yellow-300 font-bold">Lv.{cardLevel}</span>
          {card.hpCost && (
            <span className="absolute -top-3 -right-3 bg-red-600 text-white text-[10px] px-1 py-0.5 border-2 border-black font-bold" style={{ boxShadow: '2px 2px 0px #000' }}>
              -{card.hpCost}
            </span>
          )}
          {typeof chargesLeft === 'number' && (
            <span className="absolute -top-3 -left-3 bg-blue-700 text-white text-[10px] px-1 py-0.5 border-2 border-black font-bold" style={{ boxShadow: '2px 2px 0px #000' }}>
              x{chargesLeft}
            </span>
          )}
          {hasCooldown && (
            <div className="absolute inset-0 bg-black/65 flex items-center justify-center rounded-lg">
              <span className="text-yellow-300 font-bold text-[10px] border-2 border-yellow-300 px-1">
                CD {cooldownLeft}
              </span>
            </div>
          )}
          {!hasCooldown && (used || isOutOfCharge) && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
              <span className="text-red-500 font-bold text-[10px] rotate-[-45deg] border-2 border-red-500 px-1">
                {isOutOfCharge ? 'EMPTY' : 'USED'}
              </span>
            </div>
          )}
        </div>

        {/* Back / Tooltip */}
        <div className={`absolute ${small ? 'bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 shadow-[8px_8px_0px_#000]' : 'inset-0'} bg-black border-4 ${small ? 'border-white z-50' : 'border-black z-10'} p-2 flex flex-col items-center justify-center text-center opacity-0 group-hover:opacity-100 transition-opacity duration-0 pointer-events-none`}>
          <div className={`${small ? 'text-xs' : 'text-xs sm:text-sm'} text-yellow-300 mb-1 border-b-2 border-gray-600 w-full pb-1 font-bold`}>
            {card.name} (Lv.{cardLevel})
          </div>
          <span className={`${small ? 'text-[10px]' : 'text-[10px] sm:text-[12px]'} text-gray-200 leading-relaxed flex-grow flex items-center justify-center`}>
            {card.description}
          </span>
          <div className="w-full mt-1 border-t border-gray-700 pt-1 text-[9px] leading-tight text-cyan-200">
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

      </div>
    </div>
  );
}
