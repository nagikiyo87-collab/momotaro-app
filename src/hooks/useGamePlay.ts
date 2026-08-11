import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const useGamePlay = (roomId: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. サイコロを振る処理
  const rollDice = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1〜6のランダムな数値を生成
      const diceResult = Math.floor(Math.random() * 6) + 1;
      
      const roomRef = doc(db, 'games', roomId);
      
      // turnState の中身だけをピンポイントで更新し、次のフェーズ（routing）へ進める
      await updateDoc(roomRef, {
        'turnState.step': 'routing',
        'turnState.diceResult': diceResult,
      });

    } catch (err: any) {
      console.error('サイコロ処理エラー:', err);
      setError('サイコロを振る処理に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return { rollDice, loading, error };
};