import React, { useState, useEffect } from 'react'; // 🔑 useEffect を追加
import { QRCodeSVG } from 'qrcode.react';

type Props = {
  onHostGame: (name: string) => Promise<string>;
  onJoinGame: (roomId: string, name: string) => Promise<void>;
};

// 画面の進行ステップ
type ScreenStep = 'tap_start' | 'home' | 'route_select' | 'room_setup';

export const TitlePage: React.FC<Props> = ({ onHostGame, onJoinGame }) => {
  // 画面状態
  const [step, setStep] = useState<ScreenStep>('tap_start');
  
  // 部屋作成・参加の状態
  const [playerName, setPlayerName] = useState('');
  const [inputRoomId, setInputRoomId] = useState('');
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
  const [mode, setMode] = useState<'menu' | 'host' | 'join'>('menu');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 🔑 追加：URLに ?roomId=XXXX が含まれている場合、自動で参加モード画面を開く！
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRoomId = params.get('roomId');
    
    if (urlRoomId) {
      setInputRoomId(urlRoomId.toUpperCase()); // ルームIDをセット
      setStep('room_setup');                   // 部屋設定画面へスキップ
      setMode('join');                         // 参加モードにする
    }
  }, []);

  // 1. 部屋を作る処理
  const handleHost = async () => {
    setLoading(true);
    setError('');
    try {
      // 名前が未入力の場合は「プレイヤー1」をデフォルト名に
      const finalName = playerName.trim() !== '' ? playerName.trim() : 'プレイヤー1';
      const roomId = await onHostGame(finalName);
      setCreatedRoomId(roomId);
    } catch (err: any) {
      setError('部屋の作成に失敗しました: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. 部屋に入る処理
  const handleJoin = async () => {
    if (!inputRoomId.trim()) {
      setError('部屋番号を入力してください');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // 名前が未入力の場合は「プレイヤー2」をデフォルト名に
      const finalName = playerName.trim() !== '' ? playerName.trim() : 'プレイヤー2';
      await onJoinGame(inputRoomId.trim().toUpperCase(), finalName);
    } catch (err: any) {
      setError('部屋に参加できませんでした。番号を確認してください。');
    } finally {
      setLoading(false);
    }
  };

  // スマホでQRを読んだ時に直接アクセスできるURLを作成
  const inviteUrl = createdRoomId 
    ? `${window.location.origin}?roomId=${createdRoomId}`
    : '';

  // -------------------------------------------------------------
  // 画面①: タップしてスタート
  // -------------------------------------------------------------
  if (step === 'tap_start') {
    return (
      <div 
        onClick={() => setStep('home')}
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <h1 style={{ fontSize: '2.5rem', marginBottom: '20px', textShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>
          🍑 桃鉄すごろく 🍑
        </h1>
        <p style={{ fontSize: '1.2rem', animation: 'blink 1.5s infinite', fontWeight: 'bold' }}>
          — TAP TO START —
        </p>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 画面②: ホーム画面（ゲームモード選択）
  // -------------------------------------------------------------
  if (step === 'home') {
    return (
      <div style={containerStyle}>
        <h2>🏠 ホーム画面</h2>
        <p>プレイするモードを選んでください</p>
        <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <button style={primaryBtnStyle} onClick={() => setStep('route_select')}>
            ⚔️ 2人で対戦（オンライン）
          </button>
          <button style={{ ...primaryBtnStyle, opacity: 0.5, cursor: 'not-allowed' }} disabled>
            🤖 1人で遊ぶ（準備中）
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 画面③: ルート選択画面
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // 画面④: 部屋作成・参加画面
  // -------------------------------------------------------------
  return (
    <div style={containerStyle}>
      <h2>🚃 新宿 〜 高尾山口編</h2>

      {/* プレイヤー名入力 */}
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

      {error && <p style={{ color: 'red', fontSize: '0.9rem' }}>{error}</p>}

      {/* モード未選択 */}
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

      {/* ホスト：部屋作成完了画面 */}
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
              
              {/* QRコード */}
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

      {/* ゲスト：部屋参加入力画面 */}
      {mode === 'join' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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

// 簡易スタイル定義
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
  border: '1px solid #ccc',
  boxSizing: 'border-box',
  fontSize: '1rem',
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
};

const secondaryBtnStyle: React.CSSProperties = { ...primaryBtnStyle, background: '#2ed573' };
const backBtnStyle: React.CSSProperties = { ...primaryBtnStyle, background: '#a4b0be' };