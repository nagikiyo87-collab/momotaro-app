import React, { useState, useEffect } from 'react';
import { useGameSync } from '../hooks/useGameSync';
import { useTurnActions } from '../hooks/useTurnActions';
import { STATIONS, STATION_PROPERTIES, MISSIONS, ITEMS } from '../data/gameData'; 
import { RuleModal } from '../components/RuleModal';
import { GameHeader, PlayerCards, GameMapView, BottomNav, MissionPhaseUI, BiddingPhaseUI, ResultPhaseUI, SeasonalBackground, AnimatedDice, AnimatedRoulette } from '../components/GameUI';
import { motion, AnimatePresence } from 'framer-motion';
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

  useEffect(() => {
    if (phase !== 'bidding') { actions.setSelectedPropertyId(''); actions.setBidAmount(0); }
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

  // アイテムのフェーズごとの出し分け設定
  const MISSION_ITEMS = ['i_mission_swap', 'i_mission_share', 'i_mission_reroll', 'i_reward_double', 'i_mission_pass', 'i_time_extend'];
  const BOMBY_ITEMS = ['i_bomby_pass'];

  const dicePhaseItems = myItems.filter(id => !MISSION_ITEMS.includes(id) && !BOMBY_ITEMS.includes(id));
  const bombyPhaseItems = roomData?.bombyPossessedId === userId ? myItems.filter(id => BOMBY_ITEMS.includes(id)) : [];
  const availableDiceItems = [...dicePhaseItems, ...bombyPhaseItems];
  const availableMissionItems = myItems.filter(id => MISSION_ITEMS.includes(id));

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

                      {/* 🔑 3Dサイコロアニメーション部品を配置 */}
                      <div style={{ marginBottom: '20px' }}>
                        <AnimatedDice 
                          isRolling={actions.isRollingDice} 
                          result={actions.pendingDiceTotal !== null ? actions.pendingDiceTotal : actions.diceResult} 
                        />
                      </div>

                      {/* 🔑 出目が決まったら「次へ進むボタン」に切り替わる！ */}
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
                      
                      {/* 🔑 スロット風ルーレットアニメーション部品を配置 */}
                      <div style={{ marginBottom: '20px' }}>
                        <AnimatedRoulette 
                          isSpinning={actions.isSpinningRoulette} 
                          result={actions.pendingRouletteData !== null ? actions.pendingRouletteData.time : actions.rouletteResult} 
                        />
                      </div>

                      {/* 🔑 ルーレットの結果が決まったら「ミッションへ進むボタン」に切り替わる！ */}
                      {actions.pendingRouletteData !== null ? (
                        <button className="btn-pop" onClick={actions.handleConfirmRoulette} disabled={!isMyTurn}>
                          🚀 ミッションへ進む！
                        </button>
                      ) : (
                        <button className="btn-pop btn-green" onClick={actions.handleSpinRoulette} disabled={!isMyTurn || actions.rouletteResult !== null || actions.isSpinningRoulette}>
                          {actions.isSpinningRoulette ? '⏱️ ルーレット回転中...' : 'ルーレットを回す'}
                        </button>
                      )}
                    </>
                  )}

                  {phase === 'mission' && (
                    <>
                      {/* 🔑 消えていた「ミッション用アイテムを使う」ボタンのコードを復活させました！ */}
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
                      
                      {/* 🔑 同期型タイマー対応のミッションUI */}
                      <MissionPhaseUI 
                        roomId={roomId} 
                        timerData={roomData?.missionTimer}
                        currentStationName={currentStationName} 
                        stayTime={roomData?.stayTime || 0} 
                        squareType={roomData?.squareType} 
                        myMission={myMission} 
                        opponentMission={opponentMission} 
                        opponentName={opponent?.name || '相手'} 
                        isMyTurn={isMyTurn} 
                        onEndMission={(mySuccess, opSuccess) => actions.handleEndMission(mySuccess, opSuccess, myMission, opponentMission)} 
                      />
                    </>
                  )}
                  {phase === 'bidding' && (
                    <BiddingPhaseUI stayTime={roomData?.stayTime || 0} currentProperties={currentProperties} selectedPropertyId={actions.selectedPropertyId} setSelectedPropertyId={actions.setSelectedPropertyId} bidAmount={actions.bidAmount} setBidAmount={actions.setBidAmount} myBid={roomData?.bids?.[userId]} opponentBid={roomData?.bids?.[opponentId!]} bothSubmitted={!!(roomData?.bids?.[userId] && roomData?.bids?.[opponentId!])} isMyTurn={isMyTurn} onSubmitBid={actions.handleSubmitBid} onRevealBids={() => actions.handleRevealBids(roomData.bids[userId], roomData.bids[opponentId!])} myMoney={me?.money || 0} />
                  )}

                  {phase === 'bomby' && (
                    <div>
                      <h3 style={{ margin: '0 0 15px 0', color: '#8e44ad', fontWeight: '800' }}>⚠️ 貧乏神の悪行！</h3>
                      {isMyTurn ? <button className="btn-pop btn-purple" onClick={() => actions.handleBombyAction()}>判定を受ける</button> : <p>相手が貧乏神の悪行を受けています...</p>}
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

      <RuleModal isOpen={isRuleOpen} onClose={() => setIsRuleOpen(false)} />
    </div>
  );
};