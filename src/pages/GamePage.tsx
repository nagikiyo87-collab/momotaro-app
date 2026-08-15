import React, { useState, useEffect } from 'react';
import { useGameSync } from '../hooks/useGameSync';
import { useTurnActions } from '../hooks/useTurnActions';
import { STATIONS, STATION_PROPERTIES, MISSIONS, ITEMS } from '../data/gameData'; 
import { RuleModal } from '../components/RuleModal';
import { GameHeader, PlayerCards, GameMapView, BottomNav, AnimatedDice, AnimatedRoulette, SeasonalBackground, DestinationPhaseUI, MissionPhaseUI, SpendingPhaseUI, BiddingPhaseUI, ResultPhaseUI } from '../components/GameUI';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { QRCodeSVG } from 'qrcode.react'; // 🔑 QRコード生成ライブラリを追加
import '../styles/index.css'; 

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

  // 🔑 追加: 自分のオンライン状態（離脱）の検知と更新
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

    // 画面を開いた時にオンラインにする
    setOnlineStatus(true);

    // タブ切り替えやバックグラウンド移行時の処理
    const handleVisibilityChange = () => {
      setOnlineStatus(document.visibilityState === 'visible');
    };

    // ブラウザを閉じる・リロード時の処理
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
    if (phase === 'dice') { actions.setActiveItemEffect(null); }
  }, [phase]);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>🔄 データを読み込み中...</div>;
  if (error || !roomData) return <div style={{ color: 'red' }}>⚠️ エラーが発生しました</div>;

  const getSeasonLabel = (season: string) => season === 'spring' ? '🌸 春' : season === 'summer' ? '🌻 夏' : season === 'autumn' ? '🍁 秋' : '❄️ 冬';
  
  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId).then(() => { setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); });
  };

  const inviteUrl = `${window.location.origin}?roomId=${roomId}`;
  const myItems: string[] = me?.items || [];
  const currentMissions = roomData?.currentMissions || {};
  const myMission = MISSIONS.find(m => m.id === currentMissions[userId]);
  const opponentMission = opponentId ? MISSIONS.find(m => m.id === currentMissions[opponentId]) : undefined;

  const MISSION_ITEMS = ['i_mission_swap', 'i_mission_share', 'i_mission_reroll', 'i_reward_double', 'i_mission_pass', 'i_time_extend'];
  const BOMBY_ITEMS = ['i_bomby_pass'];

  const dicePhaseItems = myItems.filter(id => !MISSION_ITEMS.includes(id) && !BOMBY_ITEMS.includes(id));
  const bombyPhaseItems = roomData?.bombyPossessedId === userId ? myItems.filter(id => BOMBY_ITEMS.includes(id)) : [];
  const availableDiceItems = [...dicePhaseItems, ...bombyPhaseItems];

  const BANNED_ON_GREEN = ['i_mission_swap', 'i_mission_share', 'i_mission_reroll'];
  const availableMissionItems = myItems.filter(id => {
    if (!MISSION_ITEMS.includes(id)) return false;
    if (roomData?.squareType === 'green' && BANNED_ON_GREEN.includes(id)) return false;
    return true;
  });

  // 🔑 追加: 相手がいない・抜けた場合のブロック画面を最優先で表示
  const opponentIsOffline = opponentId && opponent && opponent.isOnline === false;
  const waitingForOpponent = !opponentId; // 最初、まだ相手が入ってきていない時
  
  if (waitingForOpponent || opponentIsOffline) {
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
        <p style={{ color: '#fbc02d', fontSize: '1.4rem', fontWeight: '900', letterSpacing: '3px', marginBottom: '20px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          ID: {roomId}
        </p>
        <p style={{ color: '#bdc3c7', fontSize: '0.95rem', fontWeight: 'bold' }}>
          {waitingForOpponent ? '相手が参加すると自動でゲームが始まります。' : '相手が画面を開いて戻ってくると\n自動で再開します。'}
        </p>
      </div>
    );
  }

  // カバンがいっぱいの時の処理
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
        copySuccess={copySuccess} 
        onCopyRoomId={handleCopyRoomId} 
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

                      <div style={{ marginBottom: '20px' }}>
                        <AnimatedDice 
                          isRolling={actions.isAnimatingDice} 
                          result={actions.diceResult} 
                        />
                      </div>

                      {actions.pendingDiceTotal !== null ? (
                        <button className="btn-pop btn-green" onClick={actions.handleConfirmMove} disabled={!isMyTurn}>
                          👉 この出目（{actions.pendingDiceTotal}マス）で進む！
                        </button>
                      ) : (
                        <button className="btn-pop" onClick={actions.handleRollDice} disabled={!isMyTurn || !opponent || actions.isRollingDice}>
                          {actions.isRollingDice ? '🎲 サイコロ回転中...' : (!opponent ? '相手を待っています' : 'サイコロを振る')}
                        </button>
                      )}
                    </>
                  )}

                  {phase === 'roulette' && (
                    <>
                      <h3 style={{ margin: '0 0 15px 0', color: isMyTurn ? '#2ed573' : '#747d8c', fontWeight: '800', fontSize: '1.3rem' }}>
                        {isMyTurn ? '⏱️ 滞在時間 ＆ マス決定！' : '⏳ 相手がルーレットを回しています...'}
                      </h3>
                      
                      <div style={{ marginBottom: '20px' }}>
                        <AnimatedRoulette 
                          isSpinning={actions.isAnimatingRoulette} 
                          result={actions.rouletteResult} 
                        />
                      </div>
                      
                      {actions.pendingRouletteData !== null ? (
                        <button className="btn-pop" onClick={actions.handleConfirmRoulette} disabled={!isMyTurn}>
                          🚀 目的地決定へ進む！
                        </button>
                      ) : (
                        <button className="btn-pop btn-green" onClick={actions.handleSpinRoulette} disabled={!isMyTurn || actions.rouletteResult !== null || actions.isSpinningRoulette}>
                          {actions.isSpinningRoulette ? '⏱️ ルーレット回転中...' : 'ルーレットを回す'}
                        </button>
                      )}
                    </>
                  )}

                  {phase === 'destination' && (
                    <DestinationPhaseUI
                      isMyTurn={isMyTurn}
                      dest1={actions.dest1} setDest1={actions.setDest1}
                      dest2={actions.dest2} setDest2={actions.setDest2}
                      dest3={actions.dest3} setDest3={actions.setDest3}
                      savedDestinations={roomData?.destinations}
                      onSubmit={actions.handleSubmitDestination}
                      onStart={actions.handleConfirmDestinations}
                    />
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
                        destinations={roomData?.destinations} 
                        myMission={myMission} 
                        opponentMission={opponentMission} 
                        opponentName={opponent?.name || '相手'} 
                        isMyTurn={isMyTurn} 
                        onEndMission={(mySuccess, opSuccess, reachedFirst) => actions.handleEndMission(mySuccess, opSuccess, myMission, opponentMission, reachedFirst)} 
                      />
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

            {activeTab === 'map' && <GameMapView currentStationName={currentStationName} sharedPosition={sharedPosition} />}
          </AnimatePresence>

          <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
        </>
      )}

      <RuleModal isOpen={isRuleOpen} onClose={() => setIsRuleOpen(false)} onAdjustMoney={handleAdjustMoney} />
    </div>
  );
};