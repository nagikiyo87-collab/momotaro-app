import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';

import { ModalProvider } from './contexts/ModalContext';
import { TitlePage } from './pages/TitlePage';
import { GamePage } from './pages/GamePage';
import { useGameActions } from './hooks/useGameActions';
import { useAuth } from './hooks/useAuth';

import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

const App = () => {
  const { createRoom, joinRoom } = useGameActions();
  const { userId } = useAuth();
  const [joinedRoomId, setJoinedRoomId] = useState<string | null>(null);

  const savedRoomId = localStorage.getItem('savedRoomId');

  // 🔑 修正: セッションストレージを使って、リロード時はそのままゲーム画面に復帰させる
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRoomId = params.get('roomId');

    if (!urlRoomId && savedRoomId) {
      // 現在のタブのセッション履歴を確認
      const isSessionActive = sessionStorage.getItem('isSessionActive');
      if (isSessionActive) {
        // リロード時: セッションが生きているので即座にゲーム画面へ復帰
        setJoinedRoomId(savedRoomId);
      } else {
        // PWA起動時・新規タブ時: タイトル画面を表示させるためフラグだけ立てる
        sessionStorage.setItem('isSessionActive', 'true');
      }
    } else {
      sessionStorage.setItem('isSessionActive', 'true');
    }
  }, [savedRoomId]);

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
      savedRoomId={savedRoomId}
      onResumeGame={handleResumeGame}
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