import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const useGameSync = (roomId: string) => {
  const [roomData, setRoomData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const roomRef = doc(db, 'rooms', roomId);
    
    // 🔑 修正: 第2引数に { includeMetadataChanges: true } を追加して即時反映モードにする
    const unsubscribe = onSnapshot(
      roomRef, 
      { includeMetadataChanges: true },
      (docSnap) => {
        if (docSnap.exists()) {
          // 🔑 追加: 自分の操作がサーバーに届く前に、画面だけ一瞬で切り替わっているか確認（開発用）
          if (docSnap.metadata.hasPendingWrites) {
            console.log("🚀 ローカルキャッシュから爆速で即時反映中...");
          }
          setRoomData(docSnap.data());
        } else {
          console.log("部屋のデータが見つかりません");
        }
        setLoading(false);
      },
      (err) => {
        console.error("Firebase監視エラー:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [roomId]);

  return { roomData, loading, error };
};