import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useGameSync } from '../hooks/useGameSync';
import { useTurnActions } from '../hooks/useTurnActions';
import { STATIONS, STATION_PROPERTIES, MISSIONS, ITEMS, PASSIVE_ITEMS, getStationSquares } from '../data/gameData'; 
import { RuleModal } from '../components/RuleModal';
import { GameHeader, PlayerCards, GameMapView, BottomNav, SeasonalBackground, StationShopList, MissionPhaseUI, SpendingPhaseUI, BiddingPhaseUI, ResultPhaseUI } from '../components/GameUI';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { QRCodeSVG } from 'qrcode.react'; 
import { BombyTransformOverlay } from '../components/bomby/BombyTransformOverlay';
import '../styles/index.css'; 

// 3D サイコロ（three.js を含むので、ゲーム画面に入ってから別に読み込む。タイトル画面は軽いまま）
const DiceRollOverlay = lazy(() => import('../components/dice/DiceRollOverlay'));

type Props = { roomId: string; userId: string; };

export const GamePage: React.FC<Props> = ({ roomId, userId }) => {
  const { roomData, loading, error } = useGameSync(roomId);
  const [isRuleOpen, setIsRuleOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'main' | 'map'>('main');
  const [copySuccess, setCopySuccess] = useState(false);

  const players = roomData?.players || {};
  const me = players[userId];
  const opponentId = Object.keys(players).find(id => id !== userId);
  const opponent = opponentId ? players[opponentId] : null;

  const sharedPosition = roomData?.sharedPosition || 0;
  const isMyTurn = roomData?.currentTurn === userId;
  const currentStationName = STATIONS[sharedPosition];
  const currentProperties = STATION_PROPERTIES[currentStationName] || [];

  const actions = useTurnActions(roomId, userId, roomData, me, opponent, opponentId, currentProperties);
  const phase = roomData?.phase || 'dice';

  useEffect(() => {
    if (!roomId || !userId) return;
    
    const setOnlineStatus = async (isOnline: boolean) => {
      try {
        await updateDoc(doc(db, 'rooms', roomId), {
          [`players.${userId}.isOnline`]: isOnline
        });
      } catch (e) {
        console.error("ステータス更新エラー", e);
      }
    };

    setOnlineStatus(true);

    const handleVisibilityChange = () => {
      setOnlineStatus(document.visibilityState === 'visible');
    };

    const handleBeforeUnload = () => {
      setOnlineStatus(false);
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      setOnlineStatus(false);
    };
  }, [roomId, userId]);


  const handleAdjustMoney = async (amount: number) => {
    const currentMoney = me?.money || 0;
    await updateDoc(doc(db, 'rooms', roomId), {
      [`players.${userId}.money`]: currentMoney + amount
    });
  };

  useEffect(() => {
    if (phase !== 'bidding') { actions.setSelectedPropertyId(''); actions.setBidAmount(0); }
    if (phase !== 'spending') { actions.setSpentInput(''); } 
  }, [phase]);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>🔄 データを読み込み中...</div>;
  if (error || !roomData) return <div style={{ color: 'red' }}>⚠️ エラーが発生しました</div>;

  const getSeasonLabel = (season: string) => season === 'spring' ? '🌸 春' : season === 'summer' ? '🌻 夏' : season === 'autumn' ? '🍁 秋' : '❄️ 冬';
  
  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId).then(() => { setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); });
  };

  // 🔑 追加：待機画面から退出する処理
  const handleQuit = () => {
    if (window.confirm("ゲームを一時退出してタイトル画面に戻りますか？\n（同じルームIDを入力すれば元の状態に復帰できます）")) {
      localStorage.removeItem('savedRoomId');
      window.location.href = '/?step=route_select';
    }
  };

  const inviteUrl = `${window.location.origin}?roomId=${roomId}`;
  const myItems: string[] = me?.items || [];
  const currentMissions = roomData?.currentMissions || {};
  const myMission = MISSIONS.find(m => m.id === currentMissions[userId]);
  const opponentMission = opponentId ? MISSIONS.find(m => m.id === currentMissions[opponentId]) : undefined;

  // 今ターンの目的地メモ。変更前の部屋は目的地 1〜3 番目をそのまま表示
  const destinationNotes: string[] = roomData?.destinationNotes
    ?? [roomData?.destinations?.dest1, roomData?.destinations?.dest2, roomData?.destinations?.dest3].filter(Boolean);

  const MISSION_ITEMS = ['i_mission_swap', 'i_mission_share', 'i_mission_reroll', 'i_reward_double', 'i_mission_pass', 'i_time_extend'];
  const BOMBY_ITEMS = ['i_bomby_pass'];

  // 持っているだけで効くカード（防御シールド）と、廃止したカード（ダイス-2 など）には「使う」ボタンを出さない
  const dicePhaseItems = myItems.filter(id => !MISSION_ITEMS.includes(id) && !BOMBY_ITEMS.includes(id) && !PASSIVE_ITEMS.includes(id) && ITEMS.some(i => i.id === id));
  const bombyPhaseItems = roomData?.bombyPossessedId === userId ? myItems.filter(id => BOMBY_ITEMS.includes(id)) : [];
  const availableDiceItems = [...dicePhaseItems, ...bombyPhaseItems];

  const BANNED_ON_GREEN = ['i_mission_swap', 'i_mission_share', 'i_mission_reroll'];
  const availableMissionItems = myItems.filter(id => {
    if (!MISSION_ITEMS.includes(id)) return false;
    if (roomData?.squareType === 'green' && BANNED_ON_GREEN.includes(id)) return false;
    return true;
  });

  const waitingForOpponent = !opponentId; 
  
  // 相手がアプリを閉じても画面は切り替えない（2026-11-25 ユーザー希望）。まだ相手が参加していないときだけ待機画面
  if (waitingForOpponent) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.9)', zIndex: 999999,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '20px', textAlign: 'center', backdropFilter: 'blur(10px)'
      }}>
        <h2 style={{ color: waitingForOpponent ? '#f1c40f' : '#e74c3c', fontSize: '1.6rem', marginBottom: '15px' }}>
          {waitingForOpponent ? '⏳ 相手を待っています' : '⚠️ 相手が退出しました'}
        </h2>
        <p style={{ color: '#fff', marginBottom: '25px', fontWeight: 'bold', lineHeight: '1.6' }}>
          {waitingForOpponent 
            ? '以下のQRコードを読み取ってもらうか、\nルームIDを共有して招待してください。'
            : '相手がアプリを閉じたか、通信が切断されました。\n復帰するまでゲームを進行できません。'}
        </p>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', display: 'inline-block', marginBottom: '20px' }}>
          <QRCodeSVG value={inviteUrl} size={180} />
        </div>
        
        {/* 🔑 ボタンを縦に並べて押しやすく配置 */}
        <div style={{ marginBottom: '25px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', width: '100%' }}>
          <p style={{ color: '#fbc02d', fontSize: '1.4rem', fontWeight: '900', letterSpacing: '3px', margin: '0 0 5px 0', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            ルームID: {roomId}
          </p>
          <button 
            onClick={handleCopyRoomId}
            style={{
              width: '100%', maxWidth: '280px',
              background: copySuccess ? '#27ae60' : '#34495e',
              color: '#fff',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '1.05rem',
              cursor: 'pointer',
              boxShadow: '0 4px 0 rgba(0,0,0,0.3)',
              transition: 'background 0.3s'
            }}
          >
            {copySuccess ? '✅ コピー完了！' : '📋 ルームIDをコピー'}
          </button>

          {/* 🔑 退出用のボタン */}
          <button 
            onClick={handleQuit}
            style={{
              width: '100%', maxWidth: '280px',
              background: '#e74c3c',
              color: '#fff',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '1.05rem',
              cursor: 'pointer',
              boxShadow: '0 4px 0 #c0392b'
            }}
          >
            🚪 ゲームを退出する
          </button>
        </div>

        <p style={{ color: '#bdc3c7', fontSize: '0.95rem', fontWeight: 'bold' }}>
          {waitingForOpponent ? '相手が参加すると自動でゲームが始まります。' : '相手が画面を開いて戻ってくると\n自動で再開します。'}
        </p>
      </div>
    );
  }

  if (myItems.length > 3) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <h2 style={{ color: '#f1c40f', fontSize: '1.5rem', marginBottom: '10px', textAlign: 'center' }}>🎒 カバンがいっぱいです！</h2>
        <p style={{ color: '#fff', marginBottom: '30px', fontWeight: 'bold' }}>上限の3個を超えました。<br/>捨てるアイテムを1つ選んでください。</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '350px' }}>
          {myItems.map((itemId, idx) => {
            const itemData = ITEMS.find(i => i.id === itemId);
            return (
              <button key={idx} onClick={() => actions.handleDiscardItem(idx)} style={{ background: '#fff', border: 'none', padding: '15px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', color: '#e74c3c', cursor: 'pointer', boxShadow: '0 4px 0 #c0392b' }}>
                🗑️ {itemData?.name} を捨てる
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '10px', position: 'relative', paddingBottom: phase === 'result' ? '20px' : '80px', overflowX: 'hidden' }}>
      <SeasonalBackground season={roomData?.season || 'spring'} />
      <GameHeader 
        currentYear={roomData?.year || 1} 
        seasonLabel={getSeasonLabel(roomData?.season || 'spring')} 
        roomId={roomId} 
 
        inviteUrl={inviteUrl}
        onOpenRule={() => setIsRuleOpen(true)} 
        currentStationName={currentStationName} 
        remainingStations={STATIONS.length - 1 - sharedPosition} 
      />

      {phase === 'result' ? (
        <ResultPhaseUI me={me} opponent={opponent} />
      ) : (
        <>
          <PlayerCards me={me} opponent={opponent} isMyTurn={isMyTurn} userId={userId} opponentId={opponentId} bombyPossessedId={roomData?.bombyPossessedId} bombyType={roomData?.bombyType || 'normal'} inviteUrl={inviteUrl} />

          <AnimatePresence mode="wait">
            {activeTab === 'main' && (
              <motion.div key="main" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} transition={{ duration: 0.2 }}>
                <div style={{ textAlign: 'center', background: '#ffffff', padding: '25px', borderRadius: '16px', border: '4px dashed #dcdde1' }}>
                  
                  {phase === 'dice' && (
                    <>
                      <h3 style={{ margin: '0 0 15px 0', color: isMyTurn ? '#ff4757' : '#747d8c', fontWeight: '800', fontSize: '1.3rem' }}>
                        {isMyTurn ? '🎲 あなたが代表者です！' : '⏳ 相手がサイコロを振っています...'}
                      </h3>
                      
                      {isMyTurn && availableDiceItems.length > 0 && (
                        <div style={{ background: '#fffde7', padding: '15px', borderRadius: '12px', marginBottom: '20px', border: '4px solid #fbc02d', textAlign: 'left' }}>
                          <p style={{ margin: '0 0 12px 0', fontWeight: '800', fontSize: '1rem', color: '#f57f17' }}>🎒 アイテムを使う</p>
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {availableDiceItems.map((itemId) => {
                              const idx = myItems.indexOf(itemId);
                              return (
                                <button key={idx} className="btn-pop btn-yellow" style={{ width: 'auto', padding: '10px 15px', fontSize: '0.9rem' }} onClick={() => actions.handleUseItem(itemId, idx)}>
                                  {ITEMS.find(i => i.id === itemId)?.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 出目の表示（転がる演出は画面いっぱいの DiceRollOverlay で行う） */}
                      <div style={{ marginBottom: '20px', fontSize: '3rem', fontWeight: 900, color: '#2f3542', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        {actions.pendingDiceTotal !== null ? (
                          <>🎲 {actions.pendingDiceTotal}<span style={{ fontSize: '1.1rem' }}>マス</span></>
                        ) : (
                          <span style={{ fontSize: '4rem' }}>🎲</span>
                        )}
                      </div>

                      {actions.pendingDiceTotal !== null ? (
                        // サイコロが止まって結果表示が閉じたら、自動で次のフェーズへ進む
                        <button className="btn-pop btn-green" disabled>
                          🚃 {actions.pendingDiceTotal}マス進みます…
                        </button>
                      ) : actions.canChooseDiceCount && isMyTurn && opponent && !actions.isRollingDice ? (
                        // 後半（折り返し以降）は、サイコロを 1 個か 2 個か選べる
                        <div>
                          <p style={{ margin: '0 0 10px 0', fontWeight: 800, color: '#57606f', fontSize: '0.9rem' }}>
                            後半はサイコロの数を選べます
                            {actions.activeItemEffect === 'i_dice_double' && '（2個振りカードで +1個）'}
                          </p>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn-pop" onClick={() => actions.handleRollDice(1)}>🎲 1個で振る</button>
                            <button className="btn-pop btn-blue" onClick={() => actions.handleRollDice(2)}>🎲🎲 2個で振る</button>
                          </div>
                        </div>
                      ) : (
                        <button className="btn-pop" onClick={() => actions.handleRollDice(1)} disabled={!isMyTurn || !opponent || actions.isRollingDice}>
                          {actions.isRollingDice ? '🎲 サイコロ回転中...' : (!opponent ? '相手を待っています' : 'サイコロを振る')}
                        </button>
                      )}
                    </>
                  )}

                  {/* ルーレットは廃止（2026-11-25）。変更前に作った部屋でこの画面に止まっていたら先へ進める */}
                  {phase === 'roulette' && (
                    <button className="btn-pop btn-green" onClick={actions.handleArrive} disabled={!isMyTurn}>
                      {isMyTurn ? '🚀 この駅のミッションへ進む' : '⏳ 代表者を待っています...'}
                    </button>
                  )}

                  {/* 目的地を決めるフェーズは廃止（2026-11-25）。変更前の部屋でこの画面に止まっていたらミッションへ */}
                  {phase === 'destination' && (
                    <button className="btn-pop btn-green" onClick={actions.handleSkipToMission}>
                      🚀 ミッションへ進む
                    </button>
                  )}

                  {phase === 'mission' && (
                    <>
                      {isMyTurn && availableMissionItems.length > 0 && (
                        <div style={{ background: '#fffde7', padding: '15px', borderRadius: '12px', marginBottom: '20px', border: '4px solid #fbc02d', textAlign: 'left' }}>
                          <p style={{ margin: '0 0 12px 0', fontWeight: '800', fontSize: '1rem', color: '#f57f17' }}>🎒 ミッション用アイテムを使う</p>
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {availableMissionItems.map((itemId) => {
                              const idx = myItems.indexOf(itemId);
                              return (
                                <button key={idx} className="btn-pop btn-yellow" style={{ width: 'auto', padding: '10px 15px', fontSize: '0.9rem' }} onClick={() => actions.handleUseItem(itemId, idx)}>
                                  {ITEMS.find(i => i.id === itemId)?.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      <MissionPhaseUI 
                        roomId={roomId} 
                        timerData={roomData?.missionTimer}
                        currentStationName={currentStationName} 
                        stayTime={roomData?.stayTime || 0} 
                        squareType={roomData?.squareType} 
                        destinationNotes={destinationNotes}
                        onAddNote={actions.handleAddDestinationNote}
                        onRemoveNote={actions.handleRemoveDestinationNote}
                        myResult={roomData?.missionResults?.[userId] ?? null}
                        opResult={opponentId ? roomData?.missionResults?.[opponentId] ?? null : null}
                        onSetResult={(who, success) => {
                          const shared = myMission?.type === 'green' && myMission?.id === opponentMission?.id;
                          actions.handleSetMissionResult(who === 'me' ? userId : opponentId!, success, shared);
                        }}
                        myMission={myMission} 
                        opponentMission={opponentMission} 
                        opponentName={opponent?.name || '相手'} 
                        isMyTurn={isMyTurn} 
                        onEndMission={(mySuccess, opSuccess) => actions.handleEndMission(mySuccess, opSuccess, myMission, opponentMission)} 
                      />
                      {/* ミッション中も、この駅で買える物件を見られるように */}
                      <StationShopList stationName={currentStationName} properties={currentProperties} onPick={actions.handleAddDestinationNote} />
                    </>
                  )}

                  {phase === 'spending' && (
                    <SpendingPhaseUI 
                      spentInput={actions.spentInput} 
                      setSpentInput={actions.setSpentInput}
                      mySpending={roomData?.spendings?.[userId]} 
                      opponentSpending={opponentId ? roomData?.spendings?.[opponentId] : undefined}
                      bothSubmitted={!!(roomData?.spendings?.[userId] !== undefined && opponentId && roomData?.spendings?.[opponentId] !== undefined)}
                      isMyTurn={isMyTurn}
                      onSubmitSpending={actions.handleSubmitSpending}
                      onFinishSpending={actions.handleFinishSpending}
                    />
                  )}

                  {phase === 'bidding' && (
                    <BiddingPhaseUI stayTime={roomData?.stayTime || 0} currentProperties={currentProperties} selectedPropertyId={actions.selectedPropertyId} setSelectedPropertyId={actions.setSelectedPropertyId} bidAmount={actions.bidAmount} setBidAmount={actions.setBidAmount} myBid={roomData?.bids?.[userId]} opponentBid={roomData?.bids?.[opponentId!]} bothSubmitted={!!(roomData?.bids?.[userId] && roomData?.bids?.[opponentId!])} isMyTurn={isMyTurn} onSubmitBid={actions.handleSubmitBid} onRevealBids={() => actions.handleRevealBids(roomData.bids[userId], roomData.bids[opponentId!])} myMoney={me?.money || 0} />
                  )}

                  {phase === 'bomby' && (
                    <div>
                      <h3 style={{ margin: '0 0 15px 0', color: '#8e44ad', fontWeight: '800' }}>⚠️ 貧乏神のターン！</h3>
                      {roomData?.bombyPossessedId === userId ? (
                        <button className="btn-pop btn-purple" onClick={() => actions.handleBombyAction()} style={{ width: '100%' }}>
                          🎲 悪行を受ける...
                        </button>
                      ) : (
                        <p style={{ color: '#747d8c', fontWeight: '800', fontSize: '1.1rem' }}>⏳ 相手が貧乏神の悪行を受けています...</p>
                      )}
                    </div>
                  )}

                </div>
              </motion.div>
            )}

            {activeTab === 'map' && (
              <GameMapView
                currentStationName={currentStationName}
                sharedPosition={sharedPosition}
                squares={getStationSquares(roomId)}
                maxMove={actions.canChooseDiceCount ? 12 : 6}
              />
            )}
          </AnimatePresence>

          <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
        </>
      )}

      <RuleModal isOpen={isRuleOpen} onClose={() => setIsRuleOpen(false)} onAdjustMoney={handleAdjustMoney} />
      {/* 貧乏神の変身の演出（ターンの終わり。2 台とも再生） */}
      <BombyTransformOverlay transform={roomData?.bombyTransform} />
      <Suspense fallback={null}>
        <DiceRollOverlay
          rollKey={actions.diceRollKey}
          values={actions.pendingDiceValues}
          bonus={actions.pendingDiceBonus}
          seed={actions.diceSeed}
          onDone={(key) => {
            // 進める操作は振った人の端末だけが行う（2 台で二重に進まないように）
            if (isMyTurn && key === actions.diceRollKey) actions.handleConfirmMove();
          }}
        />
      </Suspense>
    </div>
  );
};