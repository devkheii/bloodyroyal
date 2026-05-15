import React, { useMemo } from 'react';
import { Card, evaluateHand, HAND_NAMES_KO } from '../../lib/poker';

interface HandProbabilityProps {
  playerHand: Card[];
  communityCards: Card[];
  unknownCards: Card[];
}

const HAND_ORDER = [
  'Pair',
  'Two Pair',
  'Three of a Kind',
  'Straight',
  'Flush',
  'Full House',
  'Four of a Kind',
  'Straight Flush',
  'Royal Flush'
];

const HAND_DESCRIPTIONS: Record<string, string> = {
  'Royal Flush': '같은 무늬의 A, K, Q, J, 10',
  'Straight Flush': '같은 무늬의 연속된 숫자 5장',
  'Four of a Kind': '같은 숫자 4장',
  'Full House': '같은 숫자 3장 + 같은 숫자 2장',
  'Flush': '같은 무늬 5장',
  'Straight': '연속된 숫자 5장',
  'Three of a Kind': '같은 숫자 3장',
  'Two Pair': '같은 숫자 2장쌍이 2개',
  'Pair': '같은 숫자 2장',
  'High Card': '아무 족보도 없을 때 가장 높은 숫자'
};

export const HandProbability: React.FC<HandProbabilityProps> = ({ playerHand, communityCards, unknownCards }) => {
  const probabilities = useMemo(() => {
    const remainingToDeal = 5 - communityCards.length;
    if (remainingToDeal <= 0) return null;

    const iterations = 200; // Sufficient for a rough estimate
    const counts: Record<string, number> = {};
    HAND_ORDER.forEach(h => counts[h] = 0);

    for (let i = 0; i < iterations; i++) {
      // Shuffle a copy of unknown cards and pick the required number
      const shuffled = [...unknownCards].sort(() => 0.5 - Math.random());
      const simulatedCommunity = [...communityCards, ...shuffled.slice(0, remainingToDeal)];
      
      const solved = evaluateHand(playerHand, simulatedCommunity);
      const handName = solved.name;

      // Increment count for this hand and all hands "below" it in rank
      let found = false;
      for (let j = HAND_ORDER.length - 1; j >= 0; j--) {
        if (HAND_ORDER[j] === handName || found) {
          counts[HAND_ORDER[j]]++;
          found = true;
        }
      }
    }

    return HAND_ORDER.map(name => ({
      name,
      label: HAND_NAMES_KO[name] || name,
      prob: (counts[name] / iterations) * 100
    })).reverse(); // Show better hands at top
  }, [playerHand, communityCards, unknownCards]);

  if (!probabilities) {
    return (
      <div className="bg-black/60 backdrop-blur-md border border-gray-700 rounded-lg p-4 text-center">
        <div className="text-yellow-500 font-bold mb-1">최종 결과 대기 중</div>
        <div className="text-gray-400 text-[10px]">모든 카드가 공개되었습니다.</div>
      </div>
    );
  }

  return (
    <div className="bg-black/60 backdrop-blur-md border border-gray-700 rounded-lg p-3 shadow-xl">
      <div className="font-bold text-yellow-500 mb-3 flex justify-between items-center border-b border-gray-800 pb-1 text-xs">
        <span>족보 완성 확률 (River 기준)</span>
      </div>

      <div className="space-y-2">
        {probabilities.map((item) => (
          <div key={item.name} className="flex flex-col gap-1 group relative">
            <div className="flex justify-between text-[16px] px-1 cursor-help">
              <span className={item.prob > 0 ? 'text-gray-200' : 'text-gray-600'}>{item.label}</span>
              <span className={item.prob > 50 ? 'text-green-400 font-bold' : item.prob > 20 ? 'text-yellow-500' : 'text-gray-500'}>
                {item.prob.toFixed(1)}%
              </span>
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max px-2 py-1 bg-gray-800 border border-gray-600 rounded text-[16px] text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
              {HAND_DESCRIPTIONS[item.name]}
            </div>
            <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden border border-gray-800">
              <div 
                className={`h-full transition-all duration-500 ${
                  item.prob > 70 ? 'bg-green-500' : 
                  item.prob > 30 ? 'bg-yellow-500' : 
                  item.prob > 0 ? 'bg-blue-500' : 'bg-gray-800'
                }`}
                style={{ width: `${item.prob}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-[14px] text-gray-500 italic leading-tight">
        * 현재 알 수 없는 카드들을 바탕으로 시뮬레이션한 확률입니다.
      </div>
    </div>
  );
};
