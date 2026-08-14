import { StrictMode, useState, useEffect } from 'react'; // 🔑 useEffect を追加
import { createRoot } from 'react-dom/client';
import './styles/index.css';

import { ModalProvider } from './contexts/ModalContext';
import { TitlePage } from './pages/TitlePage';
import { GamePage } from './pages/GamePage';
import { useGameActions } from './hooks/useGameActions';
import { useAuth } from './hooks/useAuth';

// 🔑 Firestoreを直接読み込むためのimport
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

const App = () => {
  const { createRoom, joinRoom } = useGameActions();
  const { userId } = useAuth();
  const [joinedRoomId, setJoinedRoomId] = useState<string | null>(null);

  // 🔑 1. アプリ起動（リロード）時に、スマホに保存された部屋IDを自動復元！
  useEffect(() => {
    // ※URLに新しい ?roomId=... がついている場合は招待優先のため自動復元をスキップ
    const params = new URLSearchParams(window.location.search);
    const urlRoomId = params.get('roomId');

    if (!urlRoomId) {
      const savedRoomId = localStorage.getItem('savedRoomId');
      if (savedRoomId) {
        setJoinedRoomId(savedRoomId);
      }
    }
  }, []);

  const handleHostGame = async (playerName: string) => {
    if (!userId) throw new Error("通信の準備ができていません");
    const roomId = await createRoom(userId, playerName);
    if (!roomId) throw new Error("システムエラーにより部屋が作れませんでした");
    
    // 🔑 部屋IDをスマホに保存
    localStorage.setItem('savedRoomId', roomId);
    setJoinedRoomId(roomId);
    return roomId;
  };

  const handleJoinGame = async (roomId: string, playerName: string) => {
    if (!userId) throw new Error("通信の準備ができていません");

    // 通信エラーやリロードからの「復帰（リジューム）」チェック
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);

    if (roomSnap.exists()) {
      const roomData = roomSnap.data();
      if (roomData.players && roomData.players[userId]) {
        // 🔑 部屋IDをスマホに保存
        localStorage.setItem('savedRoomId', roomId);
        setJoinedRoomId(roomId);
        return;
      }
    }

    // まだ部屋にいない場合は通常の参加処理を行う
    await joinRoom(roomId, userId, playerName);
    
    // 🔑 部屋IDをスマホに保存
    localStorage.setItem('savedRoomId', roomId);
    setJoinedRoomId(roomId); 
  };

  if (joinedRoomId && userId) {
    return <GamePage roomId={joinedRoomId} userId={userId} />;
  }

  return (
    <TitlePage
      onHostGame={handleHostGame}
      onJoinGame={handleJoinGame}
    />
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ModalProvider>
      <App />
    </ModalProvider>
  </StrictMode>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.log('SW registration failed: ', err);
    });
  });
}