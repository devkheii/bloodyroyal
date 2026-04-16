export interface ScoreEntry {
  id: string;
  playerName: string;
  stage: number;
  maxHp: number;
  alphaCards: string[];
  date: string;
}

// 추후 실제 DB(Firebase 등) 연동 시 이 함수들의 내부 로직만 교체하면 됩니다.

export async function saveScore(entry: Omit<ScoreEntry, 'id' | 'date'>): Promise<void> {
  // 네트워크 지연 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const newEntry: ScoreEntry = {
    ...entry,
    id: Math.random().toString(36).substring(2, 9),
    date: new Date().toISOString(),
  };

  const existing = localStorage.getItem('cheat_poker_scores');
  const scores: ScoreEntry[] = existing ? JSON.parse(existing) : [];
  scores.push(newEntry);
  
  // 정렬: 1순위 도달 스테이지(내림차순), 2순위 최대 HP(내림차순)
  scores.sort((a, b) => {
    if (b.stage !== a.stage) return b.stage - a.stage;
    return b.maxHp - a.maxHp;
  });

  // 상위 100개만 유지
  localStorage.setItem('cheat_poker_scores', JSON.stringify(scores.slice(0, 100)));
}

export async function getScores(): Promise<ScoreEntry[]> {
  // 네트워크 지연 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const existing = localStorage.getItem('cheat_poker_scores');
  if (!existing) {
    // 로컬 스토리지에 데이터가 없으면 더미 데이터 반환
    const dummyData: ScoreEntry[] = [
      { id: 'd1', playerName: '포커의신', stage: 50, maxHp: 1250, alphaCards: ['작두', '벌크업', '흡혈'], date: new Date().toISOString() },
      { id: 'd2', playerName: '타짜', stage: 34, maxHp: 450, alphaCards: ['투시', '미래 예지', '손패 교환'], date: new Date(Date.now() - 86400000).toISOString() },
      { id: 'd3', playerName: '초보자', stage: 12, maxHp: 150, alphaCards: ['힐링', '플러스'], date: new Date(Date.now() - 172800000).toISOString() },
    ];
    localStorage.setItem('cheat_poker_scores', JSON.stringify(dummyData));
    return dummyData;
  }
  
  return JSON.parse(existing);
}
