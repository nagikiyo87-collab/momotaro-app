import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const useGameSync = (roomId: string) => {
  const [roomData, setRoomData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // 🔑 エラー状態を追加

  useEffect(() => {
    if (!roomId) return;

    const roomRef = doc(db, 'rooms', roomId);
    
    // 🔑 エラー時の処理（第3引数）を追加
    const unsubscribe = onSnapshot(
      roomRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          setRoomData(docSnap.data());
        } else {
          console.log("部屋のデータが見つかりません");
        }
        setLoading(false);
      },
      (err) => {
        console.error("Firebase監視エラー:", err);
        setError(err.message); // エラーメッセージを保存
        setLoading(false);     // エラーが起きてもローディングを止める！
      }
    );

    return () => unsubscribe();
  }, [roomId]);

  return { roomData, loading, error };
};