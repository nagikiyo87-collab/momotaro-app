import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

type Props = {
  onHostGame: (name: string) => Promise<string>;
  onJoinGame: (roomId: string, name: string) => Promise<void>;
  savedRoomId: string | null;         
  onResumeGame: () => void;           
};

type ScreenStep = 'tap_start' | 'home' | 'route_select' | 'room_setup';

export const TitlePage: React.FC<Props> = ({ onHostGame, onJoinGame, savedRoomId, onResumeGame }) => {
  const [step, setStep] = useState<ScreenStep>('tap_start');
  
  const [playerName, setPlayerName] = useState('');
  const [inputRoomId, setInputRoomId] = useState('');
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
  const [mode, setMode] = useState<'menu' | 'host' | 'join'>('menu');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 🔑 追加：PWA（ホーム画面アプリ）として開かれているか判定するステート
  const [isStandalone, setIsStandalone] = useState(true);

  useEffect(() => {
    // 🔑 追加：Web（Safari等）かアプリ（PWA）かを判定するロジック
    const checkStandalone = () => {
      const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                    ('standalone' in window.navigator && (window.navigator as any).standalone);
      setIsStandalone(!!isPWA);
    };
    checkStandalone();

    const params = new URLSearchParams(window.location.search);
    const urlRoomId = params.get('roomId');
    const stepParam = params.get('step'); 
    
    if (urlRoomId) {
      setInputRoomId(urlRoomId.toUpperCase());
      setStep('room_setup');
      setMode('join');
    } else if (stepParam === 'route_select') {
      setStep('route_select');
    }
  }, []);

  const handleHost = async () => {
    setLoading(true);
    setError('');
    try {
      const finalName = playerName.trim() !== '' ? playerName.trim() : 'プレイヤー1';
      const roomId = await onHostGame(finalName);
      setCreatedRoomId(roomId);
    } catch (err: any) {
      setError('部屋の作成に失敗しました: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!inputRoomId.trim()) {
      setError('部屋番号を入力してください');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const finalName = playerName.trim() !== '' ? playerName.trim() : 'プレイヤー2';
      await onJoinGame(inputRoomId.trim().toUpperCase(), finalName);
    } catch (err: any) {
      setError('部屋に参加できませんでした。番号を確認してください。');
    } finally {
      setLoading(false);
    }
  };

  const inviteUrl = createdRoomId 
    ? `${window.location.origin}?roomId=${createdRoomId}`
    : '';

  if (step === 'tap_start') {
    return (
      <div 
        onClick={() => setStep('home')}
        style={{
          height: '100dvh', 
          width: '100%',    
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingBottom: '15vh',
          boxSizing: 'border-box', 
          overflow: 'hidden',      
          backgroundImage: 'url(/home.png)',
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <p style={{ 
          fontSize: '1.5rem', 
          animation: 'blink 1.5s infinite', 
          fontWeight: '900',
          color: '#ffffff',
          textShadow: '0 2px 10px rgba(0,0,0,0.8), 0 0 5px rgba(0,0,0,0.5)', 
          letterSpacing: '2px'
        }}>
          — TAP TO START —
        </p>
      </div>
    );
  }

  if (step === 'home') {
    return (
      <div style={containerStyle}>
        <h2>🏠 ホーム画面</h2>
        <p>プレイするモードを選んでください</p>
        <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* 🔑 前回の続きがある場合のみボタンを表示 */}
          {savedRoomId && (
            <button style={{ ...primaryBtnStyle, background: '#3498db', boxShadow: '0 4px 0 #2980b9' }} onClick={onResumeGame}>
              ▶️ 前回の続きから遊ぶ
            </button>
          )}

          <button style={primaryBtnStyle} onClick={() => setStep('route_select')}>
            ⚔️ 2人で対戦（部屋を作る/入る）
          </button>
          
          <button style={backBtnStyle} onClick={() => setStep('tap_start')}>
            ⬅️ タイトルに戻る
          </button>
        </div>
      </div>
    );
  }

  if (step === 'route_select') {
    return (
      <div style={containerStyle}>
        <h2>🗺️ ルート選択</h2>
        <p>挑戦するステージを選んでください</p>
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <button style={primaryBtnStyle} onClick={() => setStep('room_setup')}>
            🚃 新宿 ～ 高尾山口編
          </button>
          <button style={backBtnStyle} onClick={() => setStep('home')}>
            ⬅️ 戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h2>🚃 新宿 〜 高尾山口編</h2>

      {/* 🔑 追加：Webブラウザで開いている場合の警告メッセージ */}
      {!isStandalone && (
        <div style={{ background: '#fff9c4', padding: '15px', borderRadius: '12px', border: '3px solid #fbc02d', marginBottom: '20px', textAlign: 'left' }}>
          <p style={{ margin: '0 0 8px 0', color: '#f57f17', fontWeight: '900', fontSize: '1rem' }}>⚠️ ブラウザ版で開いています</p>
          <p style={{ margin: '0', color: '#333', fontSize: '0.85rem', fontWeight: 'bold' }}>
            最高の体験のために、ホーム画面に追加した「アプリ版」から起動するのがオススメです！
          </p>
        </div>
      )}

      <div style={{ marginBottom: '20px', textAlign: 'left' }}>
        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', fontWeight: 'bold' }}>
          プレイヤー名（空欄なら自動設定）:
        </label>
        <input
          type="text"
          placeholder="例: たろう（空欄可）"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          style={inputStyle}
        />
      </div>

      {error && <p style={{ color: 'red', fontSize: '0.9rem', fontWeight: 'bold' }}>{error}</p>}

      {mode === 'menu' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button style={primaryBtnStyle} onClick={() => { setMode('host'); handleHost(); }}>
            🏠 部屋を作る（ホスト）
          </button>
          <button style={secondaryBtnStyle} onClick={() => setMode('join')}>
            🔑 部屋に入る（ゲスト）
          </button>
          <button style={backBtnStyle} onClick={() => setStep('route_select')}>
            ⬅️ ルート選択に戻る
          </button>
        </div>
      )}

      {mode === 'host' && (
        <div>
          {loading ? (
            <p>部屋を作成中...</p>
          ) : (
            <div>
              <p>以下の部屋番号またはQRコードを相手に共有してください</p>
              <div style={{ background: '#eee', padding: '15px', borderRadius: '8px', fontSize: '1.8rem', fontWeight: 'bold', letterSpacing: '2px', margin: '15px 0' }}>
                {createdRoomId}
              </div>
              
              {inviteUrl && (
                <div style={{ background: '#fff', padding: '10px', display: 'inline-block', borderRadius: '8px' }}>
                  <QRCodeSVG value={inviteUrl} size={160} />
                </div>
              )}
              
              <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '10px' }}>
                ※相手が参加すると自動でゲームが始まります
              </p>
            </div>
          )}
        </div>
      )}

      {mode === 'join' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          {/* 🔑 追加：QRで飛んできた人にコピーボタンを提供 */}
          {inputRoomId && !isStandalone && (
             <div style={{ marginBottom: '10px', padding: '10px', background: '#e3f2fd', borderRadius: '8px', border: '2px dashed #64b5f6' }}>
               <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', fontWeight: 'bold', color: '#1976d2' }}>
                 アプリ版で開く場合は、以下のIDをコピーしてアプリ側で入力してください！
               </p>
               <button 
                 onClick={() => navigator.clipboard.writeText(inputRoomId)}
                 style={{ padding: '8px', width: '100%', background: '#1976d2', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                 📋 ルームID ({inputRoomId}) をコピー
               </button>
             </div>
          )}

          <input
            type="text"
            placeholder="6桁のルームIDを入力"
            value={inputRoomId}
            onChange={(e) => setInputRoomId(e.target.value)}
            style={inputStyle}
          />
          <button style={primaryBtnStyle} onClick={handleJoin} disabled={loading}>
            {loading ? '参加中...' : '参加する'}
          </button>
          <button style={backBtnStyle} onClick={() => setMode('menu')}>
            戻る
          </button>
        </div>
      )}
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  maxWidth: '400px',
  margin: '40px auto',
  padding: '20px',
  textAlign: 'center',
  background: '#ffffff',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  borderRadius: '6px',
  border: '2px solid #ccc',
  boxSizing: 'border-box',
  fontSize: '1.2rem',
  fontWeight: 'bold',
  textAlign: 'center',
  letterSpacing: '2px'
};

const primaryBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  background: '#ff4757',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  fontSize: '1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  boxShadow: '0 4px 0 #c0392b',
};

const secondaryBtnStyle: React.CSSProperties = { ...primaryBtnStyle, background: '#2ed573', boxShadow: '0 4px 0 #27ae60' };
const backBtnStyle: React.CSSProperties = { ...primaryBtnStyle, background: '#a4b0be', boxShadow: '0 4px 0 #747d8c' };