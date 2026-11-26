import { useEffect, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * レシートの写真（2026-11-26）
 * - 写真は小さく圧縮（長い辺 720px・JPEG）して、Firestore の rooms/{roomId}/receipts に 1 枚 1 件で保存する
 *   （部屋のデータ本体に入れると、更新のたびに写真も毎回送られて重くなるため分ける）
 * - Firebase Storage は無料プランでは新しく使えないため、Firestore を使う（1 件 1MB まで。圧縮後は 100KB 前後）
 * - 保存には Firestore のセキュリティルールで receipts への読み書きを許可しておく必要がある
 */
export type Receipt = { id: string; uid: string; stationIndex: number; image: string; createdAt: number };

/** 画像を縮小・圧縮して data URL にする */
export const compressImage = (file: File, maxSide = 720, quality = 0.6): Promise<string> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });

/** その駅のレシート（2 人分）を読む。追加・削除もここから */
export const useReceipts = (roomId: string, stationIndex: number) => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;
    const q = query(collection(db, 'rooms', roomId, 'receipts'), where('stationIndex', '==', stationIndex));
    return onSnapshot(
      q,
      (snap) => {
        setReceipts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Receipt, 'id'>) })).sort((a, b) => a.createdAt - b.createdAt));
        setError(null);
      },
      (e) => setError(e.code === 'permission-denied' ? 'permission' : e.message),
    );
  }, [roomId, stationIndex]);

  const addReceipt = async (uid: string, file: File) => {
    const image = await compressImage(file);
    await addDoc(collection(db, 'rooms', roomId, 'receipts'), { uid, stationIndex, image, createdAt: Date.now() });
  };
  const removeReceipt = (id: string) => deleteDoc(doc(db, 'rooms', roomId, 'receipts', id));

  return { receipts, error, addReceipt, removeReceipt };
};
