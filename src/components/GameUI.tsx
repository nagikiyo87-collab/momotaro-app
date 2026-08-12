import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { STATIONS, ITEMS, type Mission, type Property } from '../data/gameData';
import { useModal } from '../contexts/ModalContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

// --- ① ヘッダー UI ---
export const GameHeader: React.FC<{ 
  currentYear: number; 
  seasonLabel: string; 
  roomId: string; 
  copySuccess: boolean; 
  onCopyRoomId: () => void; 
  onOpenRule: () => void; 
  currentStationName: string; 
  remainingStations: number;  
}> = ({ currentYear, seasonLabel, roomId, copySuccess, onCopyRoomId, onOpenRule, currentStationName, remainingStations }) => (
  <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: 'rgba(255, 255, 255, 0.95)', padding: '15px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', backdropFilter: 'blur(5px)' }}>
    <div>
      <div style={{ fontWeight: '900', color: '#2c3e50', fontSize: '1.3rem', marginBottom: '6px' }}>
        {currentYear}年目 {seasonLabel}
      </div>
      <div style={{ fontSize: '0.9rem', color: '#e67e22', fontWeight: 'bold', background: '#fff3e0', padding: '6px 10px', borderRadius: '8px', display: 'inline-block' }}>
        📍 {currentStationName} <span style={{ color: '#d35400', marginLeft: '5px', fontSize: '0.8rem' }}>(残り {remainingStations} マス)</span>
      </div>
    </div>
    
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ fontSize: '0.8rem', color: '#7f8c8d', fontWeight: 'bold', letterSpacing: '1px', textAlign: 'right' }}>
        ルームID: {roomId}
      </div>
      <button onClick={onCopyRoomId} style={{ background: '#3498db', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 0 #2980b9' }}>
        {copySuccess ? '✓ コピー完了' : '📋 ルームIDのコピー'}
      </button>
      <button onClick={onOpenRule} style={{ background: '#f1c40f', color: '#d35400', border: 'none', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 0 #f39c12' }}>
        📖 ルール確認
      </button>
    </div>
  </header>
);

// --- ② プレイヤーカード UI ---
export const PlayerCards: React.FC<{
  me: any; opponent: any; isMyTurn: boolean; userId: string; opponentId: string | undefined;
  bombyPossessedId: string | null; bombyType: string; inviteUrl: string;
}> = ({ me, opponent, isMyTurn, userId, opponentId, bombyPossessedId, bombyType, inviteUrl }) => {
  const getBombyIcon = (type: string) => type === 'king' ? '👑' : type === 'petit' ? '👼' : '😈';

  // 🔑 タップされたプレイヤーの詳細を表示するためのステート
  const [detailPlayer, setDetailPlayer] = useState<'me' | 'opponent' | null>(null);

  // 🔑 詳細モーダルを描画する関数
  const renderDetailModal = () => {
    if (!detailPlayer) return null;
    const player = detailPlayer === 'me' ? me : opponent;
    const isMe = detailPlayer === 'me';
    
    // アイテムIDの配列からアイテムの詳細データを取得
    const playerItems = (player?.items || []).map((id: string) => ITEMS.find(i => i.id === id)).filter(Boolean);
    const playerProperties = player?.properties || [];

    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setDetailPlayer(null)}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: '#fdfdfd', width: '100%', maxWidth: '400px', maxHeight: '85vh', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
          
          <div style={{ background: isMe ? '#ff4757' : '#3498db', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900' }}>👤 {isMe ? 'あなた' : player?.name} の詳細</h3>
            <button onClick={() => setDetailPlayer(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', width: '30px', height: '30px', borderRadius: '50%', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>✕</button>
          </div>

          <div style={{ padding: '20px', overflowY: 'auto' }}>
            <h4 style={{ color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '5px', marginBottom: '10px' }}>🎒 所持アイテム ({playerItems.length}/3)</h4>
            {playerItems.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                {playerItems.map((item: any, i: number) => (
                  <div key={i} style={{ background: '#fff', border: '2px solid #f1c40f', borderRadius: '8px', padding: '10px' }}>
                    <div style={{ fontWeight: 'bold', color: '#d35400', marginBottom: '4px' }}>{item.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>{item.description}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '20px' }}>アイテムは持っていません。</p>
            )}

            <h4 style={{ color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '5px', marginBottom: '10px' }}>🏠 所有物件 ({playerProperties.length}件)</h4>
            {playerProperties.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {playerProperties.map((prop: Property, i: number) => (
                  <div key={i} style={{ background: '#fff', border: '2px solid #bdc3c7', borderRadius: '8px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{prop.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>収益率: {prop.rate}%</div>
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#27ae60' }}>
                      {prop.price.toLocaleString()}円
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#aaa', fontSize: '0.9rem' }}>物件はまだ所有していません。</p>
            )}
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <>
      {/* モーダルの描画（非表示時は何も出ません） */}
      {renderDetailModal()}

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', marginBottom: '25px' }}>
        <div 
          onClick={() => setDetailPlayer('me')} // 🔑 タップで開く
          style={{ flex: 1, background: '#ffffff', padding: '20px 15px', borderRadius: '16px', textAlign: 'center', border: isMyTurn ? '4px solid #ff4757' : '4px solid #dcdde1', boxShadow: isMyTurn ? '0 8px 0 rgba(255,71,87,0.3)' : '0 6px 0 rgba(0,0,0,0.1)', transform: isMyTurn ? 'translateY(-4px)' : 'none', transition: 'all 0.2s', cursor: 'pointer' }}
        >
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', color: '#2f3542', fontWeight: '800' }}>
            👤 {me?.name || 'あなた'} {bombyPossessedId === userId && <span title="貧乏神が憑依中！">{getBombyIcon(bombyType)}</span>}
          </h3>
          <p style={{ margin: '5px 0', color: (me?.money || 0) < 0 ? '#e74c3c' : '#27ae60', fontWeight: '800', fontSize: '1.3rem' }}>💰 {me?.money?.toLocaleString() || 3000}円</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#747d8c', marginTop: '10px', background: '#f1f2f6', padding: '6px 10px', borderRadius: '8px', fontWeight: 'bold' }}>
            <span>🏠 {me?.properties?.length || 0}件</span>
            <span>🎒 {me?.items?.length || 0}/3 個</span>
          </div>
        </div>

        <div 
          onClick={() => { if (opponent) setDetailPlayer('opponent') }} // 🔑 相手がいればタップで開く
          style={{ flex: 1, background: '#ffffff', padding: '20px 15px', borderRadius: '16px', textAlign: 'center', border: !isMyTurn && opponent ? '4px solid #ff4757' : '4px solid #dcdde1', opacity: opponent ? 1 : 0.6, boxShadow: !isMyTurn && opponent ? '0 8px 0 rgba(255,71,87,0.3)' : '0 6px 0 rgba(0,0,0,0.1)', transform: !isMyTurn && opponent ? 'translateY(-4px)' : 'none', transition: 'all 0.2s', cursor: opponent ? 'pointer' : 'default' }}
        >
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', color: '#2f3542', fontWeight: '800' }}>
            {opponent ? `👤 ${opponent.name}` : '👤 あいて'} {bombyPossessedId === opponentId && <span title="貧乏神が憑依中！">{getBombyIcon(bombyType)}</span>}
          </h3>
          {!opponent ? (
            <div style={{ margin: '15px 0' }}><QRCodeSVG value={inviteUrl} size={90} /></div>
          ) : (
            <>
              <p style={{ margin: '5px 0', color: (opponent?.money || 0) < 0 ? '#e74c3c' : '#27ae60', fontWeight: '800', fontSize: '1.3rem' }}>💰 {opponent?.money?.toLocaleString() || 3000}円</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#747d8c', marginTop: '10px', background: '#f1f2f6', padding: '6px 10px', borderRadius: '8px', fontWeight: 'bold' }}>
                <span>🏠 {opponent?.properties?.length || 0}件</span>
                <span>🎒 {opponent?.items?.length || 0}/3 個</span>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

// --- ③ マップ UI ---
export const GameMapView: React.FC<{ currentStationName: string; sharedPosition: number }> = ({ currentStationName, sharedPosition }) => (
  <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} transition={{ duration: 0.2 }} style={{ padding: '20px', background: '#e1efc3', borderRadius: '16px', minHeight: '70vh', border: '4px solid #badc58', position: 'relative', overflow: 'hidden' }}>
    <div style={{ textAlign: 'center', marginBottom: '40px', position: 'relative', zIndex: 10 }}>
      <span style={{ background: '#fff', padding: '10px 20px', borderRadius: '25px', fontWeight: '800', color: '#27ae60', border: '3px solid #27ae60', fontSize: '1.2rem', boxShadow: '0 6px 0 rgba(39,174,96,0.3)' }}>
        📍 現在地: {currentStationName}
      </span>
    </div>
    <div style={{ position: 'relative', width: '100%', padding: '20px 0', marginTop: '20px' }}>
      <div style={{ position: 'absolute', top: '0', bottom: '0', left: '50%', transform: 'translateX(-50%)', width: '16px', background: '#a4b0be', borderRadius: '8px', zIndex: 0, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)' }}></div>
      {STATIONS.map((station, index) => {
        const isHere = index === sharedPosition;
        const isPassed = index < sharedPosition;
        const isStart = index === 0;
        const isGoal = index === STATIONS.length - 1;
        const isLeft = index % 2 === 0;

        return (
          <div key={index} style={{ display: 'flex', justifyContent: 'center', position: 'relative', height: '110px', alignItems: 'center' }}>
            <motion.div 
              animate={{ scale: isHere ? [1, 1.2, 1] : 1 }} 
              transition={{ repeat: isHere ? Infinity : 0, duration: 1.5 }} 
              style={{ 
                position: 'absolute', left: '50%', transform: 'translate(-50%, 0)', 
                width: isHere || isGoal || isStart ? '52px' : '40px', 
                height: isHere || isGoal || isStart ? '52px' : '40px', 
                borderRadius: '50%', background: isHere ? '#f1c40f' : (isPassed ? '#bdc3c7' : '#fff'), 
                border: isHere ? '6px solid #f39c12' : (isGoal ? '6px solid #e74c3c' : '5px solid #95a5a6'), 
                zIndex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', 
                boxShadow: isHere ? '0 0 20px rgba(241,196,15,0.8)' : '0 4px 0 rgba(0,0,0,0.1)' 
              }}
            >
              {isHere && <span style={{ fontSize: '1.6rem', transform: 'translateY(-3px)' }}>👤</span>}
              {(!isHere && isGoal) && <span style={{ fontSize: '1.4rem' }}>🏁</span>}
              {(!isHere && isStart) && <span style={{ fontSize: '1.2rem' }}>🚩</span>}
            </motion.div>
            <div style={{ 
              position: 'absolute', [isLeft ? 'right' : 'left']: 'calc(50% + 40px)', 
              background: isHere ? '#fff9e6' : '#fff', border: isHere ? '3px solid #f39c12' : '3px solid #dcdde1', 
              padding: '10px 16px', borderRadius: '16px', fontWeight: '800', fontSize: '1.1rem',
              color: isPassed ? '#7f8c8d' : '#2c3e50', boxShadow: isHere ? '0 6px 0 rgba(243,156,18,0.3)' : '0 4px 0 rgba(0,0,0,0.05)',
              whiteSpace: 'nowrap', zIndex: 1
            }}>
              {station}
            </div>
          </div>
        );
      })}
    </div>
  </motion.div>
);

// --- ④ ボトムナビ UI ---
export const BottomNav: React.FC<{ activeTab: 'main' | 'map'; onChangeTab: (tab: 'main' | 'map') => void }> = ({ activeTab, onChangeTab }) => (
  <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', backgroundColor: '#fff', borderTop: '3px solid #ecf0f1', display: 'flex', justifyContent: 'space-evenly', padding: '10px 0', zIndex: 100, boxShadow: '0 -4px 15px rgba(0,0,0,0.05)', paddingBottom: 'calc(10px + env(safe-area-inset-bottom))' }}>
    <div onClick={() => onChangeTab('main')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, cursor: 'pointer', color: activeTab === 'main' ? '#e74c3c' : '#7f8c8d' }}>
      <motion.div animate={{ scale: activeTab === 'main' ? 1.2 : 1 }} style={{ fontSize: '1.6rem', marginBottom: '4px' }}>🎲</motion.div>
      <span style={{ fontWeight: activeTab === 'main' ? '800' : 'bold', fontSize: '0.8rem' }}>アクション</span>
    </div>
    <div style={{ width: '2px', background: '#ecf0f1', margin: '8px 0', borderRadius: '1px' }}></div>
    <div onClick={() => onChangeTab('map')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, cursor: 'pointer', color: activeTab === 'map' ? '#27ae60' : '#7f8c8d' }}>
      <motion.div animate={{ scale: activeTab === 'map' ? 1.2 : 1 }} style={{ fontSize: '1.6rem', marginBottom: '4px' }}>🗺️</motion.div>
      <span style={{ fontWeight: activeTab === 'map' ? '800' : 'bold', fontSize: '0.8rem' }}>マップ</span>
    </div>
  </div>
);

// --- 新規追加: 完全同期型ミッション用タイマーコンポーネント ---
const MissionTimer: React.FC<{ roomId: string; stayTime: number; timerData: any }> = ({ roomId, stayTime, timerData }) => {
  const [displayTime, setDisplayTime] = useState(stayTime * 60);

  useEffect(() => {
    if (!timerData) {
      setDisplayTime(stayTime * 60);
      return;
    }

    // 🔑 動いている場合は、現在時刻と終了予定時刻から残り時間を計算し続ける（閉じてもズレない！）
    if (timerData.isRunning && timerData.endTime) {
      const interval = window.setInterval(() => {
        const now = Date.now();
        const diff = Math.max(0, Math.floor((timerData.endTime - now) / 1000));
        setDisplayTime(diff);
      }, 200); // 0.2秒ごとに画面を更新
      return () => window.clearInterval(interval);
    } else {
      // 止まっている場合は、保存されている残り時間を表示
      setDisplayTime(timerData.remainingSeconds ?? stayTime * 60);
    }
  }, [timerData, stayTime]);

  const handleToggle = async () => {
    const ref = doc(db, 'rooms', roomId);
    if (timerData?.isRunning) {
      // ⏸ 一時停止：現在時刻から残り時間を逆算して保存
      const now = Date.now();
      const remaining = Math.max(0, Math.floor(((timerData.endTime || now) - now) / 1000));
      await updateDoc(ref, { 'missionTimer.isRunning': false, 'missionTimer.remainingSeconds': remaining });
    } else {
      // ▶️ スタート：現在の残り時間から「終了予定時刻（絶対時間）」を計算して保存
      const currentRemaining = timerData?.remainingSeconds ?? stayTime * 60;
      const endTime = Date.now() + currentRemaining * 1000;
      await updateDoc(ref, { 'missionTimer.isRunning': true, 'missionTimer.endTime': endTime, 'missionTimer.remainingSeconds': currentRemaining });
    }
  };

  const handleReset = async () => {
    const ref = doc(db, 'rooms', roomId);
    await updateDoc(ref, { 'missionTimer.isRunning': false, 'missionTimer.remainingSeconds': stayTime * 60, 'missionTimer.endTime': null });
  };

  const m = Math.floor(displayTime / 60).toString().padStart(2, '0');
  const s = (displayTime % 60).toString().padStart(2, '0');
  const isRunning = timerData?.isRunning;

  return (
    <div style={{ background: '#2c3e50', padding: '15px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
      <div style={{ color: '#ecf0f1', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '5px' }}>⏳ 2人共通ミッションタイマー</div>
      <div style={{ fontSize: '4rem', fontWeight: '900', fontFamily: 'monospace', color: displayTime <= 300 ? '#e74c3c' : '#2ecc71', margin: '10px 0', textShadow: '0 2px 4px rgba(0,0,0,0.5)', letterSpacing: '2px' }}>
        {m}:{s}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
        <button onClick={handleToggle} style={{ background: isRunning ? '#e74c3c' : '#3498db', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem', boxShadow: `0 4px 0 ${isRunning ? '#c0392b' : '#2980b9'}` }}>
          {isRunning ? '⏸ 一時停止' : '▶️ スタート'}
        </button>
        <button onClick={handleReset} style={{ background: '#7f8c8d', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 0 #34495e' }}>
          🔄 リセット
        </button>
      </div>
    </div>
  );
};

// --- ⑤ ミッション詳細 UI ---
export const MissionPhaseUI: React.FC<{
  roomId: string; timerData: any; // 🔑 追加
  currentStationName: string; stayTime: number; squareType: string;
  myMission: Mission | undefined; opponentMission: Mission | undefined; opponentName: string;
  isMyTurn: boolean; onEndMission: (mySuccess: boolean, opSuccess: boolean) => void;
}> = ({ roomId, timerData, currentStationName, stayTime, squareType, myMission, opponentMission, opponentName, isMyTurn, onEndMission }) => {
  const getMissionColor = (type?: string) => {
    if (type === 'blue') return { bg: '#e3f2fd', border: '#64b5f6', text: '#1976d2', label: '🔵 青マス' };
    if (type === 'red') return { bg: '#ffebee', border: '#e57373', text: '#d32f2f', label: '🔴 赤マス' };
    if (type === 'yellow') return { bg: '#fffde7', border: '#ffd54f', text: '#f57f17', label: '🟡 アイテムマス' };
    return { bg: '#e8f5e9', border: '#81c784', text: '#388e3c', label: '🟢 協力マス' }; 
  };
  const currentSquare = getMissionColor(squareType);

  return (
    <>
      <h3 style={{ margin: '0 0 15px 0', color: '#3498db', fontWeight: '800', fontSize: '1.3rem' }}>🏙️ ミッションタイム！</h3>
      
      {/* 🔑 タイマーに roomId と timerData を渡す */}
      <MissionTimer roomId={roomId} stayTime={stayTime} timerData={timerData} />

      {/* --- これより下は以前と同じなのでそのまま残します --- */}
      <div style={{ padding: '20px', background: '#e1f5fe', borderRadius: '16px', marginBottom: '15px', border: '4px solid #81d4fa' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <span style={{ fontWeight: '800', color: '#2c3e50', fontSize: '1.2rem' }}>📍 {currentStationName}</span>
          <span style={{ fontWeight: '800', color: '#e74c3c', fontSize: '1.2rem', background: '#fff', padding: '6px 12px', borderRadius: '10px', border: '3px solid #ff7675' }}>⏱️ {stayTime}分</span>
        </div>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <span style={{ background: currentSquare.bg, border: `3px solid ${currentSquare.border}`, color: currentSquare.text, padding: '8px 16px', borderRadius: '20px', fontWeight: '800', fontSize: '1rem', boxShadow: '0 4px 0 rgba(0,0,0,0.05)' }}>
            {currentSquare.label} に到達！
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
          {myMission && (
            <div style={{ background: currentSquare.bg, border: `3px solid ${currentSquare.border}`, padding: '15px', borderRadius: '12px', textAlign: 'left', boxShadow: '0 4px 0 rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: '800', color: currentSquare.text, marginBottom: '6px' }}>👤 あなたのミッション</div>
              <div style={{ fontWeight: '800', fontSize: '1.1rem', marginBottom: '6px' }}>{myMission.name}</div>
              <p style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 'bold' }}>{myMission.description}</p>
            </div>
          )}
          {opponentMission && (
            <div style={{ background: currentSquare.bg, border: `3px solid ${currentSquare.border}`, padding: '15px', borderRadius: '12px', textAlign: 'left', opacity: 0.9, boxShadow: '0 4px 0 rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: '800', color: currentSquare.text, marginBottom: '6px' }}>👤 {opponentName}のミッション</div>
              <div style={{ fontWeight: '800', fontSize: '1.1rem', marginBottom: '6px' }}>{opponentMission.name}</div>
              <p style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 'bold' }}>{opponentMission.description}</p>
            </div>
          )}
        </div>
        {isMyTurn ? (
          <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '3px solid #ccc', boxShadow: '0 6px 0 rgba(0,0,0,0.1)' }}>
            <p style={{ margin: '0 0 15px 0', fontWeight: '800', fontSize: '1.1rem', color: '#2c3e50' }}>📝 ミッション結果を入力</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <button className="btn-pop btn-green" onClick={() => onEndMission(true, true)}>🎉 2人とも成功！</button>
              {squareType !== 'green' && (
                <div style={{ display: 'flex', gap: '15px' }}>
                  <button className="btn-pop btn-blue" onClick={() => onEndMission(true, false)}>👍 あなたのみ</button>
                  <button className="btn-pop btn-yellow" onClick={() => onEndMission(false, true)}>👎 相手のみ</button>
                </div>
              )}
              <button className="btn-pop btn-gray" onClick={() => onEndMission(false, false)}>😭 2人とも失敗...</button>
            </div>
          </div>
        ) : (
          <p style={{ color: '#747d8c', fontWeight: '800', fontSize: '1.1rem' }}>⏳ 代表者が結果を入力しています...</p>
        )}
      </div>
    </>
  );
};
// --- ⑥ 入札 UI ---
export const BiddingPhaseUI: React.FC<{
  stayTime: number; currentProperties: Property[];
  selectedPropertyId: string; setSelectedPropertyId: (id: string) => void;
  bidAmount: number; setBidAmount: (amount: number) => void;
  myBid: any; opponentBid: any; bothSubmitted: boolean; isMyTurn: boolean;
  myMoney: number;
  onSubmitBid: (id: string) => void; onRevealBids: () => void;
}> = ({ stayTime, currentProperties, selectedPropertyId, setSelectedPropertyId, bidAmount, setBidAmount, myBid, opponentBid, bothSubmitted, isMyTurn, myMoney, onSubmitBid, onRevealBids }) => {
  const currentlySelectedProperty = currentProperties.find(p => p.id === selectedPropertyId);
  const isBroke = myMoney <= 0; 

  return (
    <>
      <h3 style={{ margin: '0 0 15px 0', color: '#9b59b6', fontWeight: '800', fontSize: '1.3rem' }}>🛍️ 物件シークレット入札</h3>
      <div style={{ padding: '20px', background: '#f5eef8', borderRadius: '16px', marginBottom: '15px', border: '4px solid #d2b4de' }}>
        
        {/* 🔑 使われていなかった stayTime（残り滞在時間）の表示を復活！ */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
          <span style={{ fontWeight: '800', color: '#e74c3c', fontSize: '1.1rem', background: '#fff', padding: '6px 12px', borderRadius: '10px', border: '3px solid #ff7675' }}>
            ⏱️ 残り滞在: {stayTime}分
          </span>
        </div>

        {/* 借金状態のときのアラートとスキップ処理 */}
        {isBroke ? (
          <div style={{ background: '#ffefeb', padding: '20px', borderRadius: '12px', border: '3px solid #ff7675', marginBottom: '20px', textAlign: 'center' }}>
            <p style={{ color: '#d63031', fontWeight: '900', fontSize: '1.1rem', margin: '0 0 15px 0' }}>⚠️ 所持金が {myMoney}円 のため、入札に参加できません！</p>
            {!myBid ? (
              <button onClick={() => onSubmitBid('skip')} className="btn-pop" style={{ background: '#7f8c8d', boxShadow: '0 4px 0 #34495e' }}>今回は諦めてスキップする</button>
            ) : (
              <p style={{ color: '#7f8c8d', fontWeight: 'bold', margin: 0 }}>⏳ 相手の入札を待っています...</p>
            )}
          </div>
        ) : (
          /* 正常時（お金がある時）のUI */
          !myBid ? (
            <div style={{ textAlign: 'left' }}>
              <p style={{ margin: '0 0 15px 0', fontWeight: '800', fontSize: '1.05rem', color: '#2c3e50' }}>どの物件を買いましたか？（所持金: {myMoney}円）</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                {currentProperties.map(p => (
                  <div key={p.id} onClick={() => setSelectedPropertyId(p.id)} style={{ background: selectedPropertyId === p.id ? '#fdf2e9' : '#fff', border: selectedPropertyId === p.id ? '3px solid #e67e22' : '3px solid #bdc3c7', padding: '15px 10px', borderRadius: '12px', cursor: 'pointer', textAlign: 'center', boxShadow: selectedPropertyId === p.id ? '0 6px 0 #d35400' : '0 4px 0 #95a5a6', transform: selectedPropertyId === p.id ? 'translateY(-2px)' : 'none', transition: 'all 0.1s' }}>
                    <div style={{ fontWeight: '800', fontSize: '1rem', marginBottom: '6px', color: '#2c3e50' }}>{p.name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#e67e22', fontWeight: '800' }}>{p.type === 'limit' ? `上限: ${p.price}円` : `固定: ${p.price}円`}</div>
                  </div>
                ))}
                <div onClick={() => { setSelectedPropertyId('skip'); setBidAmount(0); }} style={{ background: selectedPropertyId === 'skip' ? '#f5f5f5' : '#fff', border: selectedPropertyId === 'skip' ? '3px solid #7f8c8d' : '3px dashed #bdc3c7', padding: '15px 10px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', boxShadow: selectedPropertyId === 'skip' ? '0 6px 0 #7f8c8d' : 'none', transform: selectedPropertyId === 'skip' ? 'translateY(-2px)' : 'none', transition: 'all 0.1s' }}>
                  <div style={{ fontWeight: '800', fontSize: '1rem', color: '#7f8c8d' }}>買わない<br/>(スキップ)</div>
                </div>
              </div>
              {currentlySelectedProperty && (
                <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '3px solid #e67e22', marginBottom: '20px', animation: 'fadeIn 0.2s ease-in', boxShadow: '0 6px 0 rgba(230,126,34,0.2)' }}>
                  <p style={{ margin: '0 0 12px 0', fontWeight: '800', fontSize: '1.1rem', color: '#d35400' }}>🛒 【{currentlySelectedProperty.name}】 を選択中</p>
                  {currentlySelectedProperty.type === 'limit' ? (
                    <>
                      <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#555', fontWeight: 'bold' }}>実際に使った金額（円）を入力してください</p>
                      <input type="number" placeholder="例: 1200" style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '3px solid #bdc3c7', fontSize: '1.2rem', fontWeight: '800', boxSizing: 'border-box', outline: 'none' }} value={bidAmount || ''} onChange={(e) => setBidAmount(Number(e.target.value))} />
                    </>
                  ) : (
                    <p style={{ margin: '0', fontSize: '0.9rem', color: '#7f8c8d', background: '#f1f2f6', padding: '12px', borderRadius: '8px', fontWeight: 'bold' }}>※この物件は「固定値（{currentlySelectedProperty.price}円）」のため金額の入力は不要です。</p>
                  )}
                </div>
              )}
              {selectedPropertyId && (
                <button className="btn-pop btn-purple" onClick={() => onSubmitBid(selectedPropertyId === 'skip' ? '' : selectedPropertyId)}>
                  🔒 入札を確定する
                </button>
              )}
            </div>
          ) : (
            <div style={{ padding: '30px 20px', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '4px solid #2ecc71', boxShadow: '0 8px 0 rgba(46,204,113,0.3)' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '15px' }}>✅</div>
              <p style={{ fontWeight: '800', color: '#27ae60', fontSize: '1.2rem', margin: '0 0 10px 0' }}>あなたの入札が完了しました！</p>
              {!opponentBid && <p style={{ color: '#7f8c8d', fontSize: '1rem', fontWeight: 'bold', margin: 0 }}>相手の入札を待っています...</p>}
            </div>
          )
        )}
        
        {bothSubmitted && isMyTurn && (
          <div style={{ marginTop: '25px', borderTop: '3px dashed #d2b4de', paddingTop: '20px' }}>
            <p style={{ fontWeight: '800', color: '#e74c3c', fontSize: '1.2rem', marginBottom: '15px' }}>🎉 2人の入札が揃いました！</p>
            <button className="btn-pop" onClick={onRevealBids}>結果発表 ＆ 次のターンへ</button>
          </div>
        )}
      </div>
    </>
  );
};

// --- ⑦ リザルト（結果発表）UI ---
export const ResultPhaseUI: React.FC<{ me: any; opponent: any }> = ({ me, opponent }) => {
  const { triggerConfetti } = useModal(); 
  
  useEffect(() => {
    triggerConfetti();
  }, []);

  const calculateTotalAsset = (player: any) => {
    if (!player) return 0;
    return (player.money || 0) + (player.properties || []).reduce((sum: number, p: any) => sum + p.price, 0);
  };

  const getRankAndReward = (diff: number) => {
    if (diff >= 30000) return { rank: '🏆 Sランク', reward: '上限10,000円までの豪華な食事を奢る（焼肉、回らない寿司など）' };
    if (diff >= 10000) return { rank: '🥇 Aランク', reward: 'ちょっといいランチ・ディナー奢り（3,000〜5,000円程度）' };
    if (diff >= 3000)  return { rank: '🥈 Bランク', reward: 'カフェでケーキセット、または軽食奢り（1,000〜2,000円程度）' };
    return { rank: '🥉 Cランク', reward: 'コンビニで好きなアイス＆ジュース奢り（数百円）' };
  };

  const handleGoHome = () => {
    window.location.href = '/'; 
  };

  const myTotal = calculateTotalAsset(me);
  const opTotal = calculateTotalAsset(opponent);
  const diff = Math.abs(myTotal - opTotal);
  const result = getRankAndReward(diff);
  const amIWinner = myTotal > opTotal;
  const isDraw = myTotal === opTotal;

  return (
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5 }} style={{ padding: '20px', background: '#fff', borderRadius: '16px', border: '6px solid #f1c40f', textAlign: 'center', boxShadow: '0 12px 0 #f39c12' }}>
      <h2 style={{ color: '#e67e22', margin: '0 0 20px 0', fontSize: '2rem', fontWeight: '800' }}>🎉 ゴール到着！ 🎉</h2>
      <p style={{ fontWeight: '800', marginBottom: '20px', fontSize: '1.1rem' }}>お疲れ様でした！すべての旅が終了しました。<br/>運命の最終結果発表です！</p>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', marginBottom: '20px' }}>
        <div style={{ flex: 1, background: amIWinner && !isDraw ? '#ffefeb' : '#f5f6fa', padding: '15px', borderRadius: '12px', border: amIWinner && !isDraw ? '3px solid #ff7675' : '3px solid #dcdde1', boxShadow: '0 4px 0 rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', fontWeight: '800' }}>あなた</h3>
          <p style={{ margin: '5px 0', fontSize: '0.9rem', fontWeight: 'bold' }}>所持金: {me?.money?.toLocaleString()}円</p>
          <p style={{ margin: '5px 0', fontSize: '0.9rem', fontWeight: 'bold' }}>物件価値: {(myTotal - (me?.money || 0)).toLocaleString()}円</p>
          <hr style={{ margin: '15px 0', border: 'none', borderTop: '2px dashed #ccc' }} />
          <p style={{ margin: '0', fontWeight: '800', fontSize: '1.4rem', color: '#e74c3c' }}>総資産: {myTotal.toLocaleString()}円</p>
        </div>
        <div style={{ flex: 1, background: !amIWinner && !isDraw ? '#ffefeb' : '#f5f6fa', padding: '15px', borderRadius: '12px', border: !amIWinner && !isDraw ? '3px solid #ff7675' : '3px solid #dcdde1', boxShadow: '0 4px 0 rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', fontWeight: '800' }}>{opponent?.name}</h3>
          <p style={{ margin: '5px 0', fontSize: '0.9rem', fontWeight: 'bold' }}>所持金: {opponent?.money?.toLocaleString()}円</p>
          <p style={{ margin: '5px 0', fontSize: '0.9rem', fontWeight: 'bold' }}>物件価値: {(opTotal - (opponent?.money || 0)).toLocaleString()}円</p>
          <hr style={{ margin: '15px 0', border: 'none', borderTop: '2px dashed #ccc' }} />
          <p style={{ margin: '0', fontWeight: '800', fontSize: '1.4rem', color: '#e74c3c' }}>総資産: {opTotal.toLocaleString()}円</p>
        </div>
      </div>
      <div style={{ background: '#fdf2e9', padding: '20px', borderRadius: '12px', border: '4px solid #e67e22', boxShadow: '0 6px 0 rgba(230,126,34,0.3)', marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#d35400', fontSize: '1.5rem', fontWeight: '800' }}>
          {isDraw ? '🤝 奇跡の引き分け！' : `👑 勝者: ${amIWinner ? 'あなた' : opponent?.name}！`}
        </h3>
        {!isDraw && (
          <>
            <p style={{ margin: '0 0 15px 0', fontWeight: '800', fontSize: '1.1rem' }}>総資産の差額: {diff.toLocaleString()}円</p>
            <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '3px solid #f39c12' }}>
              <p style={{ margin: '0 0 8px 0', fontWeight: '800', color: '#c0392b', fontSize: '1.3rem' }}>{result.rank}</p>
              <p style={{ margin: '0', fontSize: '1rem', lineHeight: '1.5', fontWeight: 'bold' }}>敗者のペナルティ（ご褒美）:<br/><strong>{result.reward}</strong></p>
            </div>
          </>
        )}
      </div>

      <button 
        onClick={handleGoHome} 
        style={{ background: '#3498db', color: '#fff', border: 'none', padding: '15px 30px', borderRadius: '30px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 0 #2980b9', width: '100%' }}
      >
        🏠 ホーム画面に戻る
      </button>
    </motion.div>
  );
};

// --- ⑧ 季節の背景 UI ---
export const SeasonalBackground: React.FC<{ season: string }> = ({ season }) => {
  const themes = {
    spring: { bg: 'linear-gradient(135deg, #fff0f5 0%, #ffc3a0 100%)', icon: '🌸' },
    summer: { bg: 'linear-gradient(135deg, #e0f7fa 0%, #81d4fa 100%)', icon: '🌻' },
    autumn: { bg: 'linear-gradient(135deg, #fdf2e9 0%, #f5b041 100%)', icon: '🍁' },
    winter: { bg: 'linear-gradient(135deg, #f4f6f9 0%, #a9cce3 100%)', icon: '❄️' }
  };
  const theme = themes[season as keyof typeof themes] || themes.spring;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: theme.bg, zIndex: -1, overflow: 'hidden' }}>
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`${season}-${i}`}
          initial={{ top: '-10%', left: `${Math.random() * 100}%`, opacity: 0, rotate: 0 }}
          animate={{ top: '110%', opacity: [0, 0.5, 0], rotate: 360 }}
          transition={{ duration: 10 + Math.random() * 10, repeat: Infinity, ease: "linear", delay: Math.random() * 8 }}
          style={{ position: 'absolute', fontSize: '2rem' }}
        >
          {theme.icon}
        </motion.div>
      ))}
    </div>
  );
};

// --- ⑨ サイコロ 3Dアニメーション UI ---
export const AnimatedDice: React.FC<{ isRolling: boolean; result: number | null }> = ({ isRolling, result }) => {
  return (
    <div style={{ perspective: '800px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '120px' }}>
      <motion.div
        animate={
          isRolling
            ? { rotateX: [0, 360, 720], rotateY: [0, 360, 720], scale: [1, 1.2, 1] }
            : { rotateX: 0, rotateY: 0, scale: 1 }
        }
        transition={
          isRolling
            ? { duration: 0.5, repeat: Infinity, ease: 'linear' }
            : { type: 'spring', stiffness: 200, damping: 10 }
        }
        style={{
          width: '80px', height: '80px',
          background: isRolling ? 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)' : '#ff4757',
          borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center',
          boxShadow: isRolling ? '0 10px 30px rgba(255, 71, 87, 0.5)' : '0 8px 0 #c0392b',
          border: '4px solid #fff',
        }}
      >
        {!isRolling && result !== null ? (
          <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} style={{ fontSize: '3rem', fontWeight: '900', color: '#fff' }}>
            {result}
          </motion.span>
        ) : (
          <span style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.5)' }}>?</span>
        )}
      </motion.div>
    </div>
  );
};

// --- ⑩ ルーレット スロットアニメーション UI ---
export const AnimatedRoulette: React.FC<{ isSpinning: boolean; result: number | null }> = ({ isSpinning, result }) => {
  return (
    <div style={{ height: '100px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8f9fa', borderRadius: '16px', border: '4px solid #ecf0f1', position: 'relative' }}>
      {isSpinning ? (
        <motion.div
          animate={{ y: [0, -100, 0] }}
          transition={{ duration: 0.2, repeat: Infinity, ease: 'linear' }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}
        >
          <span style={{ fontSize: '3.5rem', fontWeight: '900', color: '#bdc3c7', filter: 'blur(2px)' }}>30</span>
          <span style={{ fontSize: '3.5rem', fontWeight: '900', color: '#95a5a6', filter: 'blur(2px)' }}>45</span>
          <span style={{ fontSize: '3.5rem', fontWeight: '900', color: '#7f8c8d', filter: 'blur(2px)' }}>60</span>
        </motion.div>
      ) : (
        <motion.div initial={{ scale: 0, y: 50 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.6 }}>
          {result !== null ? (
            <span style={{ fontSize: '3.5rem', fontWeight: '900', color: '#2ed573' }}>{result}分</span>
          ) : (
            <span style={{ color: '#aaa', fontWeight: 'bold' }}>最長滞在時間を決めます</span>
          )}
        </motion.div>
      )}
    </div>
  );
};