import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const useGameActions = () => {
  
  const createRoom = async (userId: string, playerName: string) => {
    try {
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const roomRef = doc(db, 'rooms', roomId);
      
      await setDoc(roomRef, {
        status: 'waiting',
        currentTurn: userId,
        sharedPosition: 0,
        phase: 'dice', 
        stayTime: null,
        year: 1,           
        season: 'spring',  
        bombyPossessedId: null, 
        bombyType: 'normal',    
        players: {
          [userId]: { 
            name: playerName, 
            money: 3000, 
            properties: [],
            items: ['i_dice_plus2'] // 🔑 初期アイテムを追加
          }
        },
        createdAt: new Date(),
      });
      
      return roomId;
    } catch (error) {
      console.error("Firebaseへの部屋作成エラー:", error);
      return null;
    }
  };

  const joinRoom = async (roomId: string, userId: string, playerName: string) => {
    try {
      const roomRef = doc(db, 'rooms', roomId);
      const roomSnap = await getDoc(roomRef);
      
      if (!roomSnap.exists()) {
        throw new Error("部屋が見つかりません。番号が間違っている可能性があります。");
      }

      const roomData = roomSnap.data();
      if (roomData.players[userId]) {
        throw new Error("自分自身が作った部屋にはゲスト参加できません。");
      }
      
      await updateDoc(roomRef, {
        [`players.${userId}`]: { 
          name: playerName, 
          money: 3000, 
          properties: [],
          items: ['i_dice_plus2'] // 🔑 初期アイテムを追加
        },
        status: 'playing' 
      });
    } catch (error) {
      console.error("部屋への参加エラー:", error);
      throw error;
    }
  };

  return { createRoom, joinRoom };
};