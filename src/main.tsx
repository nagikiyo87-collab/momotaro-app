import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';

import { ModalProvider } from './contexts/ModalContext';
import { TitlePage } from './pages/TitlePage';
import { GamePage } from './pages/GamePage';
import { useGameActions } from './hooks/useGameActions';
import { useAuth } from './hooks/useAuth';

// 🔑 Firestoreを直接読み込むためのimportを追加
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

const App = () => {
  const { createRoom, joinRoom } = useGameActions();
  const { userId } = useAuth();
  const [joinedRoomId, setJoinedRoomId] = useState<string | null>(null);

  const handleHostGame = async (playerName: string) => {
    if (!userId) throw new Error("通信の準備ができていません");
    const roomId = await createRoom(userId, playerName);
    if (!roomId) throw new Error("システムエラーにより部屋が作れませんでした");
    
    setJoinedRoomId(roomId);
    return roomId;
  };

  const handleJoinGame = async (roomId: string, playerName: string) => {
    if (!userId) throw new Error("通信の準備ができていません");

    // 🔑 通信エラーやリロードからの「復帰（リジューム）」チェック
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);

    if (roomSnap.exists()) {
      const roomData = roomSnap.data();
      // もし自分がすでにこの部屋のプレイヤーとして登録されていたら、新規参加処理をスキップして復帰！
      if (roomData.players && roomData.players[userId]) {
        setJoinedRoomId(roomId);
        return;
      }
    }

    // まだ部屋にいない場合は通常の参加処理を行う
    await joinRoom(roomId, userId, playerName);
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