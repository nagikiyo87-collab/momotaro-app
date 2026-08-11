import { useState } from 'react';
import { TitlePage } from './pages/TitlePage';
import { GamePage } from './pages/GamePage';
import { useGameActions } from './hooks/useGameActions';
import { useAuth } from './hooks/useAuth';

function App() {
  const { createRoom, joinRoom } = useGameActions();
  const { userId } = useAuth();
  const [joinedRoomId, setJoinedRoomId] = useState<string | null>(null);

  const handleHostGame = async (playerName: string) => {
    if (!userId) throw new Error("通信の準備ができていません");
    const roomId = await createRoom(userId, playerName);
    if (!roomId) throw new Error("システムエラーにより部屋が作れませんでした");
    
    // 🔑 修正：ホストも部屋を作った瞬間にゲーム画面へ切り替える！
    setJoinedRoomId(roomId);
    
    return roomId;
  };

  const handleJoinGame = async (roomId: string, playerName: string) => {
    if (!userId) throw new Error("通信の準備ができていません");
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
}

export default App;