import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';

import { ModalProvider } from './contexts/ModalContext';
import { TitlePage } from './pages/TitlePage';
import { GamePage } from './pages/GamePage';
import { useGameActions } from './hooks/useGameActions';
import { useAuth } from './hooks/useAuth';

// Firestoreを直接読み込むためのimport
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

const App = () => {
  const { createRoom, joinRoom } = useGameActions();
  const { userId } = useAuth();
  const [joinedRoomId, setJoinedRoomId] = useState<string | null>(null);

  // 🔑 ローカルストレージに保存された前回の部屋IDを取得
  const savedRoomId = localStorage.getItem('savedRoomId');

  const handleHostGame = async (playerName: string) => {
    if (!userId) throw new Error("通信の準備ができていません");
    const roomId = await createRoom(userId, playerName);
    if (!roomId) throw new Error("システムエラーにより部屋が作れませんでした");
    
    localStorage.setItem('savedRoomId', roomId);
    setJoinedRoomId(roomId);
    return roomId;
  };

  const handleJoinGame = async (roomId: string, playerName: string) => {
    if (!userId) throw new Error("通信の準備ができていません");

    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);

    if (roomSnap.exists()) {
      const roomData = roomSnap.data();
      if (roomData.players && roomData.players[userId]) {
        localStorage.setItem('savedRoomId', roomId);
        setJoinedRoomId(roomId);
        return;
      }
    }

    await joinRoom(roomId, userId, playerName);
    localStorage.setItem('savedRoomId', roomId);
    setJoinedRoomId(roomId); 
  };

  // 🔑 追加: タイトル画面から「続きから遊ぶ」を押された時の処理
  const handleResumeGame = () => {
    if (savedRoomId) {
      setJoinedRoomId(savedRoomId);
    }
  };

  if (joinedRoomId && userId) {
    return <GamePage roomId={joinedRoomId} userId={userId} />;
  }

  return (
    <TitlePage
      onHostGame={handleHostGame}
      onJoinGame={handleJoinGame}
      savedRoomId={savedRoomId}           // 🔑 TitlePageに渡す
      onResumeGame={handleResumeGame}     // 🔑 TitlePageに渡す
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

// Service Workerの自動登録
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.log('SW registration failed: ', err);
    });
  });
}