import React from 'react';
import { Card as PokerCard } from '../lib/poker';

interface CardProps {
  card?: PokerCard;
  hidden?: boolean;
  onClick?: () => void;
  selected?: boolean;
  highlighted?: boolean;
  className?: string;
}

export const PlayingCard: React.FC<CardProps> = ({ card, hidden, onClick, selected, highlighted, className = '' }) => {
  if (hidden || !card) {
    return (
      <div 
        className={`w-14 h-20 sm:w-16 sm:h-24 border-4 border-black bg-red-800 flex items-center justify-center relative ${className}`}
        style={{ boxShadow: '4px 4px 0px #000' }}
      >
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)', backgroundSize: '8px 8px', backgroundPosition: '0 0, 4px 4px' }}></div>
        <div className="w-8 h-8 border-4 border-black bg-red-600 rotate-45 flex items-center justify-center relative z-10">
        </div>
      </div>
    );
  }

  if (card.isJoker) {
    return (
      <div 
        onClick={onClick}
        className={`w-14 h-20 sm:w-16 sm:h-24 border-4 bg-purple-900 flex flex-col items-center justify-center p-1 cursor-pointer transition-transform ${selected ? 'border-yellow-400 -translate-y-1' : 'border-black'} ${highlighted ? 'border-yellow-400' : ''} ${className}`}
        style={{ boxShadow: selected || highlighted ? '4px 4px 0px #facc15' : '4px 4px 0px #000' }}
      >
        <div className="text-yellow-400 text-[10px] sm:text-xs">JOKER</div>
        <div className="text-2xl sm:text-4xl mt-1">🃏</div>
        <div className="text-purple-400 text-[8px] sm:text-[10px] mt-1">?</div>
      </div>
    );
  }

  const isRed = card.suit === 'h' || card.suit === 'd';
  const suitSymbol = {
    s: '♠',
    h: '♥',
    d: '♦',
    c: '♣'
  }[card.suit];

  const rankDisplay = card.rank === 'T' ? '10' : card.rank;

  return (
    <div 
      onClick={onClick}
      className={`w-14 h-20 sm:w-16 sm:h-24 border-4 bg-white flex flex-col justify-between p-1 cursor-pointer transition-transform ${selected ? 'border-yellow-400 -translate-y-1' : 'border-black hover:-translate-y-1 hover:border-gray-500'} ${highlighted ? 'border-yellow-400' : ''} ${className}`}
      style={{ boxShadow: selected || highlighted ? '4px 4px 0px #facc15' : '4px 4px 0px #000' }}
    >
      <div className={`text-xs sm:text-sm ${isRed ? 'text-red-600' : 'text-black'}`}>
        {rankDisplay}
      </div>
      <div className={`text-xl sm:text-3xl text-center flex-grow flex items-center justify-center ${isRed ? 'text-red-600' : 'text-black'}`}>
        {suitSymbol}
      </div>
      <div className={`text-xs sm:text-sm text-right ${isRed ? 'text-red-600' : 'text-black'} rotate-180`}>
        {rankDisplay}
      </div>
    </div>
  );
}
