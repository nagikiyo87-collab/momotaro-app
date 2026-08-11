import React, { useState, useEffect } from 'react';
import { useGameSync } from '../hooks/useGameSync';
import { QRCodeSVG } from 'qrcode.react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { STATIONS, STATION_PROPERTIES, MISSIONS, ITEMS, type Mission, type Property } from '../data/gameData'; 
import { RuleModal } from '../components/RuleModal';

type Props = {
  roomId: string;
  userId: string;
};

const STAY_TIMES = [30, 45, 60]; 
const SEASONS = ['spring', 'summer', 'autumn', 'winter']; 

export const GamePage: React.FC<Props> = ({ roomId, userId }) => {
  const { roomData, loading, error } = useGameSync(roomId);
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [rouletteResult, setRouletteResult] = useState<number | null>(null);

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [activeItemEffect, setActiveItemEffect] = useState<string | null>(null);

  const [isRuleOpen, setIsRuleOpen] = useState<boolean>(false);
  
  // 🔑 追加：タブの切り替え状態（'main' か 'map'）
  const [activeTab, setActiveTab] = useState<'main' | 'map'>('main');
  
  // 🔑 追加：コピー完了の通知用State
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const phase = roomData?.phase || 'dice'; 
  useEffect(() => {
    if (phase !== 'bidding') {
      setSelectedPropertyId('');
      setBidAmount(0);
    }
    if (phase === 'dice') {
      setActiveItemEffect(null);
    }
  }, [phase]);

  // 🔑 追加：部屋番号をクリップボードにコピーする処理
  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }).catch(err => {
      console.error("コピーに失敗しました", err);
      alert("コピーに失敗しました");
    });
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>🔄 データを読み込み中...</div>;
  if (error || !roomData) return <div style={{ color: 'red' }}>⚠️ エラーが発生しました</div>;

  const players = roomData.players || {};
  const me = players[userId];
  const opponentId = Object.keys(players).find(id => id !== userId);
  const opponent = opponentId ? players[opponentId] : null;

  const sharedPosition = roomData.sharedPosition || 0;
  const isMyTurn = roomData.currentTurn === userId;
  const stayTime = roomData.stayTime || 0;
  const currentYear = roomData.year || 1;
  const currentSeason = roomData.season || 'spring';
  
  const bombyPossessedId = roomData.bombyPossessedId;
  const bombyType = roomData.bombyType || 'normal';

  const currentStationName = STATIONS[sharedPosition];
  const currentProperties = STATION_PROPERTIES[currentStationName] || [];

  const currentMissions = roomData.currentMissions || {};
  const myMission = MISSIONS.find(m => m.id === currentMissions[userId]);
  const opponentMission = opponentId ? MISSIONS.find(m => m.id === currentMissions[opponentId]) : null;

  const bids = roomData.bids || {};
  const myBid = bids[userId];
  const opponentBid = opponentId ? bids[opponentId] : null;
  const bothSubmitted = myBid && opponentBid;

  const processDebtAndSales = (initialMoney: number, properties: Property[], moneyChange: number) => {
    let newMoney = initialMoney + moneyChange;
    let remainingProperties = [...properties];
    const soldNames: string[] = [];
    if (newMoney < 0 && remainingProperties.length > 0) {
      remainingProperties.sort((a, b) => a.price - b.price); 
      while (newMoney < 0 && remainingProperties.length > 0) {
        const soldProp = remainingProperties.shift()!;
        const sellPrice = Math.floor(soldProp.price * 0.5); 
        newMoney += sellPrice;
        soldNames.push(`${soldProp.name}(+${sellPrice}円)`);
      }
    }
    return { newMoney, remainingProperties, soldNames };
  };

  const handleRollDice = async () => {
    if (!isMyTurn || !opponentId) return;
    let roll = Math.floor(Math.random() * 6) + 1;
    if (activeItemEffect === 'i_dice_plus2') {
      roll += 2;
      alert(`🎲 ダイス+2カードの効果！\n出目が ${roll - 2} ＋ 2 ＝ 【${roll}】 になりました！`);
    } else if (activeItemEffect === 'i_dice_double') {
      const roll2 = Math.floor(Math.random() * 6) + 1;
      const total = roll + roll2;
      alert(`🎲 サイコロ2個振りの効果！\n出目が ${roll} と ${roll2} で、合計 【${total}】 になりました！`);
      roll = total;
    }
    setDiceResult(roll);
    let nextPosition = sharedPosition + roll;
    if (nextPosition >= STATIONS.length - 1) nextPosition = STATIONS.length - 1;
    await updateDoc(doc(db, 'rooms', roomId), {
      sharedPosition: nextPosition,
      lastDiceRoll: roll,
      phase: 'roulette' 
    });
    setActiveItemEffect(null); 
  };

  const handleUseItem = async (itemId: string, index: number) => {
    if (!isMyTurn || !opponentId || activeItemEffect) {
      if (activeItemEffect) alert('すでにこのターンでサイコロ系のアイテムを使用しています！');
      return;
    }
    const confirmUse = window.confirm(`アイテム「${ITEMS.find(i => i.id === itemId)?.name}」を使いますか？`);
    if (!confirmUse) return;
    const newItems = [...(me?.items || [])];
    newItems.splice(index, 1);
    let updates: any = { [`players.${userId}.items`]: newItems };

    if (itemId === 'i_money_swap') {
      updates[`players.${userId}.money`] = opponent?.money || 0;
      updates[`players.${opponentId}.money`] = me?.money || 0;
      alert('💥 所持金入れ替え発動！\n自分と相手の所持金をそっくりそのまま入れ替えました！');
    } else if (itemId === 'i_random_box') {
      const getMoney = Math.floor(Math.random() * 30 + 1) * 100;
      updates[`players.${userId}.money`] = (me?.money || 0) + getMoney;
      alert(`🎁 ランダムボックスを開けた！\nなんと【${getMoney}円】を手に入れた！`);
    } else if (itemId === 'i_dice_plus2' || itemId === 'i_dice_double') {
      setActiveItemEffect(itemId);
      alert(`✨ アイテムをセットしました！\nサイコロを振ると効果が発動します。`);
    }
    await updateDoc(doc(db, 'rooms', roomId), updates);
  };

  const handleSpinRoulette = async () => {
    if (!isMyTurn || !opponentId) return;
    const timeResult = STAY_TIMES[Math.floor(Math.random() * STAY_TIMES.length)];
    setRouletteResult(timeResult);
    const squareTypes: ('blue' | 'red' | 'green' | 'yellow')[] = ['blue', 'red', 'green', 'yellow'];
    const chosenType = squareTypes[Math.floor(Math.random() * squareTypes.length)];
    const targetMissions = MISSIONS.filter(m => m.type === chosenType);

    let myMissionObj: Mission;
    let opponentMissionObj: Mission;
    if (chosenType === 'green') {
      myMissionObj = targetMissions[Math.floor(Math.random() * targetMissions.length)];
      opponentMissionObj = myMissionObj;
    } else {
      myMissionObj = targetMissions[Math.floor(Math.random() * targetMissions.length)];
      const otherMissions = targetMissions.filter(m => m.id !== myMissionObj.id);
      opponentMissionObj = otherMissions.length > 0 ? otherMissions[Math.floor(Math.random() * otherMissions.length)] : myMissionObj;
    }
    setTimeout(async () => {
      await updateDoc(doc(db, 'rooms', roomId), {
        stayTime: timeResult,
        squareType: chosenType, 
        currentMissions: {
          [userId]: myMissionObj.id,
          [opponentId]: opponentMissionObj.id
        },
        phase: 'mission', 
      });
      setRouletteResult(null);
      setDiceResult(null);
    }, 2000);
  };

  const handleEndMission = async (mySuccess: boolean, opponentSuccess: boolean) => {
    if (!isMyTurn || !opponentId || !myMission || !opponentMission) return;
    let myMoneyChange = 0; let opponentMoneyChange = 0;
    let newBombyId = bombyPossessedId; 
    const myNewItems: string[] = [...(me?.items || [])];
    const opponentNewItems: string[] = [...(opponent?.items || [])];
    let myItemMsg = ''; let opponentItemMsg = '';
    let availableItems = [...ITEMS];

    if (mySuccess) {
      if (myMission.type === 'blue') myMoneyChange += myMission.reward;
      if (myMission.type === 'green') { myMoneyChange += myMission.reward; opponentMoneyChange += myMission.reward; }
      if (myMission.type === 'yellow') {
        const idx = Math.floor(Math.random() * availableItems.length);
        const randomItem = availableItems[idx];
        availableItems.splice(idx, 1); 
        if (myNewItems.length < 3) { myNewItems.push(randomItem.id); myItemMsg = `\n🎁 アイテム「${randomItem.name}」をGET！`; }
      }
    } else {
      if (myMission.type === 'red') myMoneyChange -= myMission.penalty;
    }

    if (opponentSuccess) {
      if (opponentMission.type === 'blue') opponentMoneyChange += opponentMission.reward;
      if (opponentMission.type === 'green' && myMission.type !== 'green') { myMoneyChange += opponentMission.reward; opponentMoneyChange += opponentMission.reward; }
      if (opponentMission.type === 'yellow') {
        const idx = Math.floor(Math.random() * availableItems.length);
        const randomItem = availableItems[idx];
        if (opponentNewItems.length < 3) { opponentNewItems.push(randomItem.id); opponentItemMsg = `\n🎁 アイテム「${randomItem.name}」をGET！`; }
      }
    } else {
      if (opponentMission.type === 'red') opponentMoneyChange -= opponentMission.penalty;
    }

    const myResult = processDebtAndSales(me?.money || 0, me?.properties || [], myMoneyChange);
    const opResult = processDebtAndSales(opponent?.money || 0, opponent?.properties || [], opponentMoneyChange);

    if (!mySuccess && opponentSuccess) newBombyId = userId;
    else if (mySuccess && !opponentSuccess) newBombyId = opponentId;
    else if (!mySuccess && !opponentSuccess) newBombyId = Math.random() < 0.5 ? userId : opponentId;
    else if (mySuccess && opponentSuccess) { if (!bombyPossessedId) newBombyId = Math.random() < 0.5 ? userId : opponentId; }

    let alertMsg = `【ミッション結果】\nあなた: ${myMoneyChange >= 0 ? '+' : ''}${myMoneyChange}円${myItemMsg}\nあいて: ${opponentMoneyChange >= 0 ? '+' : ''}${opponentMoneyChange}円${opponentItemMsg}\n`;
    if (myResult.soldNames.length > 0) alertMsg += `\n⚠️ 借金返済のため、あなたの物件が売却されました: ${myResult.soldNames.join(', ')}`;
    if (opResult.soldNames.length > 0) alertMsg += `\n⚠️ 借金返済のため、あいての物件が売却されました: ${opResult.soldNames.join(', ')}`;
    if (newBombyId && newBombyId !== bombyPossessedId) {
      if (mySuccess && opponentSuccess && !bombyPossessedId) alertMsg += `\n⚠️⚠️⚠️\n2人ともクリアしましたが、貧乏神が ${newBombyId === userId ? 'あなた' : 'あいて'} に取り憑きました！\n`;
      else alertMsg += `\n⚠️⚠️⚠️\nミッション結果により、${newBombyId === userId ? 'あなた' : 'あいて'}に貧乏神が取り憑きました！\n`;
    }
    alertMsg += `\n続けて「物件のシークレット入札」に移動します！`;
    alert(alertMsg);

    await updateDoc(doc(db, 'rooms', roomId), {
      [`players.${userId}.money`]: myResult.newMoney,
      [`players.${userId}.properties`]: myResult.remainingProperties,
      [`players.${userId}.items`]: myNewItems,
      [`players.${opponentId}.money`]: opResult.newMoney,
      [`players.${opponentId}.properties`]: opResult.remainingProperties,
      [`players.${opponentId}.items`]: opponentNewItems,
      bombyPossessedId: newBombyId, 
      phase: 'bidding', 
      bids: {} 
    });
  };

  const handleSubmitBid = async (finalPropertyId: string) => {
    let finalAmount = bidAmount;
    if (finalPropertyId && finalPropertyId !== 'skip') {
      const selectedProp = currentProperties.find(p => p.id === finalPropertyId);
      if (selectedProp) {
        if (selectedProp.type === 'limit' && bidAmount > selectedProp.price) {
          alert(`⚠️ リアル入札額（${bidAmount}円）が物件の上限を超えています！\nルールに基づき、ゲーム内の入札額は「${selectedProp.price}円」として確定します。`);
          finalAmount = selectedProp.price;
        } else if (selectedProp.type === 'fixed') {
          finalAmount = selectedProp.price;
        }
        if (finalAmount > (me?.money || 0)) {
          alert(`⚠️ 所持金（${me?.money}円）を超えて物件を買うことはできません！\n今回は「買えない」扱いとなります。`);
          finalAmount = 0;
          finalPropertyId = ''; 
        }
      }
    } else {
      finalAmount = 0;
    }
    await updateDoc(doc(db, 'rooms', roomId), {
      [`bids.${userId}`]: { propertyId: finalPropertyId, amount: finalAmount }
    });
  };

  const handleRevealBids = async () => {
    if (!isMyTurn || !opponentId || !bothSubmitted) return;

    let myWonProperty: Property | null = null;
    let opponentWonProperty: Property | null = null;

    if (myBid.propertyId !== opponentBid.propertyId) {
      if (myBid.propertyId) myWonProperty = currentProperties.find(p => p.id === myBid.propertyId) || null;
      if (opponentBid.propertyId) opponentWonProperty = currentProperties.find(p => p.id === opponentBid.propertyId) || null;
    } else if (myBid.propertyId && opponentBid.propertyId) {
      const contestedProperty = currentProperties.find(p => p.id === myBid.propertyId);
      if (contestedProperty) {
        if (myBid.amount > opponentBid.amount) myWonProperty = contestedProperty;
        else if (opponentBid.amount > myBid.amount) opponentWonProperty = contestedProperty;
        else {
          if (Math.random() > 0.5) { myWonProperty = contestedProperty; alert("【バッティング同額！】\nサイコロ勝負の結果、あなたの勝利です！"); }
          else { opponentWonProperty = contestedProperty; alert("【バッティング同額！】\nサイコロ勝負の結果、相手の勝利です！"); }
        }
      }
    }

    const myProperties: Property[] = [...(me.properties || [])];
    const opponentProperties: Property[] = [...(opponent?.properties || [])];
    let myNewMoney = me.money || 0;
    let opponentNewMoney = opponent?.money || 0;
    
    if (myWonProperty) { myProperties.push(myWonProperty); myNewMoney -= myBid.amount; }
    if (opponentWonProperty) { opponentProperties.push(opponentWonProperty); opponentNewMoney -= opponentBid.amount; }

    let alertMessage = `【入札結果】\nあなた: ${myWonProperty ? myWonProperty.name + ' を獲得！' : '獲得なし'}\nあいて: ${opponentWonProperty ? opponentWonProperty.name + ' を獲得！' : '獲得なし'}`;

    const currentSeasonIndex = SEASONS.indexOf(currentSeason);
    let nextSeasonIndex = currentSeasonIndex + 1;
    let nextYear = currentYear;

    if (currentSeason === 'winter') {
      nextSeasonIndex = 0; nextYear += 1;       
      const calculateIncome = (props: Property[]) => props.reduce((sum, prop) => sum + Math.floor(prop.price * (prop.rate / 100)), 0);
      const myIncome = calculateIncome(myProperties);
      const opponentIncome = calculateIncome(opponentProperties);
      myNewMoney += myIncome; opponentNewMoney += opponentIncome; 
      alertMessage += `\n\n🌸🌸🌸 決算ボーナス 🌸🌸🌸\n1年間の収益が振り込まれました！\nあなた: +${myIncome}円\nあいて: +${opponentIncome}円`;
    }

    let myDebtMsg = ''; let opDebtMsg = '';
    if (myNewMoney < 0) {
      const interest = Math.floor(Math.abs(myNewMoney) * 0.2); 
      myNewMoney -= interest; 
      myDebtMsg = `\n💀 借金利息(20%): あなた -${interest}円 (総借金: ${myNewMoney}円)`;
    }
    if (opponentNewMoney < 0) {
      const interest = Math.floor(Math.abs(opponentNewMoney) * 0.2);
      opponentNewMoney -= interest;
      opDebtMsg = `\n💀 借金利息(20%): あいて -${interest}円 (総借金: ${opponentNewMoney}円)`;
    }

    if (myDebtMsg || opDebtMsg) alertMessage += `\n\n💸💸💸 借金利息発生 💸💸💸${myDebtMsg}${opDebtMsg}`;

    const nextSeason = SEASONS[nextSeasonIndex];
    alert(alertMessage);

    const isGoal = sharedPosition === STATIONS.length - 1;
    const nextPhase = isGoal ? 'result' : (roomData.bombyPossessedId === opponentId ? 'bomby' : 'dice');

    await updateDoc(doc(db, 'rooms', roomId), {
      [`players.${userId}.properties`]: myProperties,
      [`players.${opponentId}.properties`]: opponentProperties,
      [`players.${userId}.money`]: myNewMoney,
      [`players.${opponentId}.money`]: opponentNewMoney,
      year: nextYear, season: nextSeason, phase: nextPhase, currentTurn: opponentId 
    });
  };

  const handleBombyAction = async () => {
    if (!isMyTurn || bombyPossessedId !== userId) return;

    const rand = Math.random() * 100;
    let newType = 'normal';
    if (rand < 5) newType = 'king';
    else if (rand < 25) newType = 'petit';

    let moneyChange = 0; let message = '';
    let remainingProps = [...(me?.properties || [])];

    if (newType === 'king') {
      const roll = Math.floor(Math.random() * 6) + 1;
      moneyChange = roll * -1000;
      message = `【👑 キングボンビー登場！】\n「グエッヘッヘ！サイコロの目は『${roll}』だ！」\n所持金から ${Math.abs(moneyChange)}円 奪われた...`;
      if (remainingProps.length > 0) {
        remainingProps.sort((a, b) => b.price - a.price); 
        const lostProp = remainingProps.shift()!; 
        message += `\nさらに一番高い物件「${lostProp.name}」を捨てられたのねん！`;
      }
      message += `\nさらに現実で「ロック画面を相手が撮った変顔」に変更してください！`;
    } else if (newType === 'petit') {
      if (Math.random() < 0.5) { moneyChange = -100; message = `【👼 プチボンビー】\n「お小遣いちょうだいのねん！」\n所持金が -100円 されました。`; } 
      else { message = `【👼 プチボンビー】\n「今回は何もしないでおいてあげるのねん！」\n（ノーダメージ）`; }
    } else { 
      const act = Math.random();
      if (act < 0.33) { moneyChange = -1000; message = `【😈 貧乏神】\n「お金を落としてきたのねん！」\n所持金が -1000円 されました。`; } 
      else if (act < 0.66) { message = `【😈 貧乏神】\n「のどが渇いたのねん！」\n現実で相手に「ジュースかお菓子」を奢ってください！`; } 
      else { message = `【😈 貧乏神】\n「歩くの疲れたのねん！」\n次の駅まで相手の「カバン持ち」をしてください！`; }
    }

    const myResult = processDebtAndSales(me?.money || 0, remainingProps, moneyChange);
    if (myResult.soldNames.length > 0) message += `\n⚠️ 借金返済のため、物件が強制売却されました: ${myResult.soldNames.join(', ')}`;

    alert(message);
    await updateDoc(doc(db, 'rooms', roomId), {
      [`players.${userId}.money`]: myResult.newMoney,
      [`players.${userId}.properties`]: myResult.remainingProperties,
      bombyType: newType,
      phase: 'dice'
    });
  };

  const inviteUrl = `${window.location.origin}?roomId=${roomId}`;

  const getMissionColor = (type?: string) => {
    if (type === 'blue') return { bg: '#e3f2fd', border: '#64b5f6', text: '#1976d2', label: '🔵 青マス' };
    if (type === 'red') return { bg: '#ffebee', border: '#e57373', text: '#d32f2f', label: '🔴 赤マス' };
    if (type === 'yellow') return { bg: '#fffde7', border: '#ffd54f', text: '#f57f17', label: '🟡 アイテムマス' };
    return { bg: '#e8f5e9', border: '#81c784', text: '#388e3c', label: '🟢 協力マス' }; 
  };
  const getSeasonLabel = (season: string) => {
    if (season === 'spring') return '🌸 春';
    if (season === 'summer') return '🌻 夏';
    if (season === 'autumn') return '🍁 秋';
    if (season === 'winter') return '❄️ 冬';
    return '';
  };
  const getBombyIcon = (type: string) => {
    if (type === 'king') return '👑';
    if (type === 'petit') return '👼';
    return '😈';
  };
  const calculateTotalAsset = (player: any) => {
    if (!player) return 0;
    const money = player.money || 0;
    const propertiesValue = (player.properties || []).reduce((sum: number, p: Property) => sum + p.price, 0);
    return money + propertiesValue;
  };
  const getRankAndReward = (diff: number) => {
    if (diff >= 30000) return { rank: '🏆 Sランク', reward: '上限10,000円までの豪華な食事を奢る（焼肉、回らない寿司など）' };
    if (diff >= 10000) return { rank: '🥇 Aランク', reward: 'ちょっといいランチ・ディナー奢り（3,000〜5,000円程度）' };
    if (diff >= 3000)  return { rank: '🥈 Bランク', reward: 'カフェでケーキセット、または軽食奢り（1,000〜2,000円程度）' };
    return { rank: '🥉 Cランク', reward: 'コンビニで好きなアイス＆ジュース奢り（数百円）' };
  };

  const currentSquare = getMissionColor(roomData?.squareType);
  const currentlySelectedProperty = currentProperties.find(p => p.id === selectedPropertyId);
  const myItems: string[] = me?.items || [];

  return (
    <div style={{ ...containerStyle, paddingBottom: phase === 'result' ? '20px' : '80px' }}> {/* 🔑 ボトムナビ用の余白 */}
      
      <header style={headerStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: '0', fontSize: '1.3rem', color: '#2c3e50' }}>🚃 新宿 〜 高尾山口</h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ background: '#fff', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', border: '2px solid #e67e22', color: '#e67e22', fontSize: '0.85rem', boxShadow: '0 2px 4px rgba(230,126,34,0.2)' }}>
              📅 {currentYear}年目 {getSeasonLabel(currentSeason)}
            </div>
            <button 
              onClick={() => setIsRuleOpen(true)}
              style={{ background: '#3498db', color: '#fff', border: 'none', borderRadius: '50%', width: '36px', height: '36px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 2px 6px rgba(52,152,219,0.3)', fontSize: '1.1rem' }}
            >
              📖
            </button>
          </div>
        </div>
        
        {/* 🔑 部屋番号とコピー機能 */}
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px', gap: '8px' }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#7f8c8d' }}>部屋番号: <strong style={{ color: '#2c3e50', fontSize: '0.95rem' }}>{roomId}</strong></p>
          <button onClick={handleCopyRoomId} style={{ background: '#f1f2f6', border: '1px solid #dcdde1', borderRadius: '4px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer', color: '#2f3640', fontWeight: 'bold' }}>
            {copySuccess ? '✅ コピー完了' : '📋 コピー'}
          </button>
        </div>
      </header>

      {/* 🏁 リザルト画面 */}
      {phase === 'result' ? (
        <div style={{ padding: '20px', background: '#fff', borderRadius: '12px', border: '4px solid #f1c40f', textAlign: 'center', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#e67e22', margin: '0 0 20px 0', fontSize: '1.8rem' }}>🎉 ゴール到着！ 🎉</h2>
          <p style={{ fontWeight: 'bold', marginBottom: '20px' }}>お疲れ様でした！すべての旅が終了しました。<br/>運命の最終結果発表です！</p>
          
          {(() => {
            const myTotal = calculateTotalAsset(me);
            const opTotal = calculateTotalAsset(opponent);
            const diff = Math.abs(myTotal - opTotal);
            const result = getRankAndReward(diff);
            const amIWinner = myTotal > opTotal;
            const isDraw = myTotal === opTotal;

            return (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ flex: 1, background: amIWinner && !isDraw ? '#ffefeb' : '#f5f6fa', padding: '15px', borderRadius: '8px', border: amIWinner && !isDraw ? '2px solid #ff7675' : '1px solid #ccc' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}>あなた</h3>
                    <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>所持金: {me?.money?.toLocaleString()}円</p>
                    <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>物件価値: {(myTotal - (me?.money || 0)).toLocaleString()}円</p>
                    <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #ccc' }} />
                    <p style={{ margin: '0', fontWeight: 'bold', fontSize: '1.2rem', color: '#e74c3c' }}>総資産: {myTotal.toLocaleString()}円</p>
                  </div>
                  <div style={{ flex: 1, background: !amIWinner && !isDraw ? '#ffefeb' : '#f5f6fa', padding: '15px', borderRadius: '8px', border: !amIWinner && !isDraw ? '2px solid #ff7675' : '1px solid #ccc' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}>{opponent?.name}</h3>
                    <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>所持金: {opponent?.money?.toLocaleString()}円</p>
                    <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>物件価値: {(opTotal - (opponent?.money || 0)).toLocaleString()}円</p>
                    <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #ccc' }} />
                    <p style={{ margin: '0', fontWeight: 'bold', fontSize: '1.2rem', color: '#e74c3c' }}>総資産: {opTotal.toLocaleString()}円</p>
                  </div>
                </div>
                <div style={{ background: '#fdf2e9', padding: '15px', borderRadius: '8px', border: '2px dashed #e67e22' }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#d35400', fontSize: '1.3rem' }}>
                    {isDraw ? '🤝 奇跡の引き分け！' : `👑 勝者: ${amIWinner ? 'あなた' : opponent?.name}！`}
                  </h3>
                  {!isDraw && (
                    <>
                      <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>総資産の差額: {diff.toLocaleString()}円</p>
                      <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #f39c12' }}>
                        <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#c0392b', fontSize: '1.1rem' }}>{result.rank}</p>
                        <p style={{ margin: '0', fontSize: '0.9rem', lineHeight: '1.4' }}>敗者のペナルティ（ご褒美）:<br/><strong>{result.reward}</strong></p>
                      </div>
                    </>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      ) : (
        <>
          {/* 🔑 タブによる画面の出し分け */}
          
          {/* 【メイン（アクション）タブ】 */}
          {activeTab === 'main' && (
            <div style={{ animation: 'fadeIn 0.2s ease-in' }}>
              <div style={playersAreaStyle}>
                <div style={{ ...playerCardStyle, border: isMyTurn ? '4px solid #ff4757' : '4px solid #ccc', boxShadow: isMyTurn ? '0 4px 12px rgba(255,71,87,0.3)' : '0 4px 6px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '1.05rem', color: '#2f3542' }}>
                    👤 {me?.name || 'あなた'} 
                    {bombyPossessedId === userId && <span title="ボンビー憑依中！"> {getBombyIcon(bombyType)}</span>}
                  </h3>
                  <p style={{ margin: '5px 0', color: (me?.money || 0) < 0 ? '#e74c3c' : '#27ae60', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    💰 {me?.money?.toLocaleString() || 3000}円
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#747d8c', marginTop: '10px', background: '#f1f2f6', padding: '5px 8px', borderRadius: '6px' }}>
                    <span>🏠 {me?.properties?.length || 0}件</span>
                    <span>🎒 {myItems.length}/3 個</span> 
                  </div>
                </div>
                <div style={{ ...playerCardStyle, border: !isMyTurn && opponent ? '4px solid #ff4757' : '4px solid #ccc', opacity: opponent ? 1 : 0.6, boxShadow: !isMyTurn && opponent ? '0 4px 12px rgba(255,71,87,0.3)' : '0 4px 6px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '1.05rem', color: '#2f3542' }}>
                    {opponent ? `👤 ${opponent.name}` : '👤 あいて（待機中...）'}
                    {bombyPossessedId === opponentId && <span title="ボンビー憑依中！"> {getBombyIcon(bombyType)}</span>}
                  </h3>
                  {!opponent ? (
                    <div style={{ margin: '10px 0' }}><QRCodeSVG value={inviteUrl} size={90} /></div>
                  ) : (
                    <>
                      <p style={{ margin: '5px 0', color: (opponent?.money || 0) < 0 ? '#e74c3c' : '#27ae60', fontWeight: 'bold', fontSize: '1.1rem' }}>
                        💰 {opponent?.money?.toLocaleString() || 3000}円
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#747d8c', marginTop: '10px', background: '#f1f2f6', padding: '5px 8px', borderRadius: '6px' }}>
                        <span>🏠 {opponent?.properties?.length || 0}件</span>
                        <span>🎒 {opponent?.items?.length || 0}/3 個</span> 
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div style={actionAreaStyle}>
                {phase === 'bomby' && (
                  <>
                    <h3 style={{ margin: '0 0 15px 0', color: '#8e44ad' }}>{isMyTurn ? '⚠️ 貧乏神の悪行！' : '⏳ 相手が貧乏神の悪行を受けています...'}</h3>
                    <div style={{ padding: '20px', background: '#f4ecf7', borderRadius: '8px', marginBottom: '15px' }}>
                      <div style={{ fontSize: '4rem', marginBottom: '10px' }}>{getBombyIcon(bombyType)}</div>
                      <p style={{ fontWeight: 'bold', color: '#555', marginBottom: '15px' }}>ターン開始時、貧乏神が悪さをします！</p>
                      {isMyTurn && <button style={{ ...primaryBtnStyle, background: '#8e44ad' }} onClick={handleBombyAction}>覚悟を決めて判定を受ける</button>}
                    </div>
                  </>
                )}

                {phase === 'dice' && (
                  <>
                    <h3 style={{ margin: '0 0 15px 0', color: isMyTurn ? '#ff4757' : '#747d8c' }}>{isMyTurn ? '🎲 あなたが代表者です！' : '⏳ 相手がサイコロを振ります...'}</h3>
                    {isMyTurn && myItems.length > 0 && (
                      <div style={{ background: '#fffde7', padding: '10px', borderRadius: '8px', marginBottom: '15px', border: '2px solid #fbc02d', textAlign: 'left' }}>
                        <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', fontSize: '0.9rem', color: '#f57f17' }}>🎒 アイテムを使う（サイコロを振る前に1つだけ）</p>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {myItems.map((itemId, idx) => {
                            const itemData = ITEMS.find(i => i.id === itemId);
                            return (
                              <button 
                                key={idx} 
                                style={{ padding: '8px 12px', background: '#fff', border: '1px solid #fbc02d', borderRadius: '4px', fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                                onClick={() => handleUseItem(itemId, idx)}
                              >
                                {itemData?.name}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    <div style={{ height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', borderRadius: '12px', marginBottom: '15px' }}>
                      {diceResult !== null ? <div style={{ fontSize: '4rem', fontWeight: 'bold' }}>{diceResult}</div> : 
                       roomData?.lastDiceRoll ? <div style={{ fontSize: '4rem', fontWeight: 'bold', color: '#ccc' }}>{roomData.lastDiceRoll}</div> : 
                       <div style={{ color: '#aaa' }}>サイコロを振ってください</div>}
                    </div>
                    <button style={{ ...primaryBtnStyle, opacity: !isMyTurn ? 0.5 : 1, boxShadow: '0 4px 6px rgba(255,71,87,0.3)' }} onClick={handleRollDice} disabled={!isMyTurn || !opponent}>
                      {!opponent ? '相手を待っています' : '2人で進む'}
                    </button>
                  </>
                )}

                {phase === 'roulette' && (
                  <>
                    <h3 style={{ margin: '0 0 15px 0', color: isMyTurn ? '#2ed573' : '#747d8c' }}>{isMyTurn ? '⏱️ 滞在時間 ＆ マス決定！' : '⏳ 相手がルーレットを回しています...'}</h3>
                    <div style={{ height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', borderRadius: '12px', marginBottom: '15px' }}>
                      {rouletteResult !== null ? <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#2ed573' }}>{rouletteResult}分</div> : <div style={{ color: '#aaa', fontSize: '0.9rem' }}>最長滞在時間を決めます</div>}
                    </div>
                    <button style={{ ...secondaryBtnStyle, opacity: !isMyTurn ? 0.5 : 1, boxShadow: '0 4px 6px rgba(46,213,115,0.3)' }} onClick={handleSpinRoulette} disabled={!isMyTurn || rouletteResult !== null}>
                      ルーレットを回す
                    </button>
                  </>
                )}

                {phase === 'mission' && (
                  <>
                    <h3 style={{ margin: '0 0 10px 0', color: '#3498db' }}>🏙️ ミッションタイム！</h3>
                    <div style={{ padding: '15px', background: '#e1f5fe', borderRadius: '8px', marginBottom: '15px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '1.1rem' }}>📍 {currentStationName}</span>
                        <span style={{ fontWeight: 'bold', color: '#e74c3c', fontSize: '1.1rem', background: '#fff', padding: '4px 8px', borderRadius: '6px', border: '1px solid #ff7675' }}>⏱️ {stayTime}分</span>
                      </div>

                      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                        <span style={{ background: currentSquare.bg, border: `2px solid ${currentSquare.border}`, color: currentSquare.text, padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                          {currentSquare.label} に到達！
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                        {myMission && (
                          <div style={{ background: currentSquare.bg, border: `2px solid ${currentSquare.border}`, padding: '10px', borderRadius: '8px', textAlign: 'left' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: currentSquare.text, marginBottom: '4px' }}>👤 あなたのミッション</div>
                            <div style={{ fontWeight: 'bold', fontSize: '0.95rem', marginBottom: '4px' }}>{myMission.name}</div>
                            <p style={{ margin: '0 0 6px 0', fontSize: '0.85rem' }}>{myMission.description}</p>
                          </div>
                        )}
                        {opponentMission && (
                          <div style={{ background: currentSquare.bg, border: `2px solid ${currentSquare.border}`, padding: '10px', borderRadius: '8px', textAlign: 'left', opacity: 0.9 }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: currentSquare.text, marginBottom: '4px' }}>👤 {opponent?.name || '相手'}のミッション</div>
                            <div style={{ fontWeight: 'bold', fontSize: '0.95rem', marginBottom: '4px' }}>{opponentMission.name}</div>
                            <p style={{ margin: '0 0 6px 0', fontSize: '0.85rem' }}>{opponentMission.description}</p>
                          </div>
                        )}
                      </div>

                      {isMyTurn ? (
                        <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #ccc', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                          <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', fontSize: '0.95rem', color: '#2c3e50' }}>📝 ミッション結果を入力</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button style={{ ...primaryBtnStyle, background: '#2ed573' }} onClick={() => handleEndMission(true, true)}>🎉 2人とも成功！</button>
                            {roomData?.squareType !== 'green' && (
                              <div style={{ display: 'flex', gap: '10px' }}>
                                <button style={{ ...primaryBtnStyle, background: '#3498db', padding: '12px' }} onClick={() => handleEndMission(true, false)}>👍 あなたのみ</button>
                                <button style={{ ...primaryBtnStyle, background: '#e67e22', padding: '12px' }} onClick={() => handleEndMission(false, true)}>👎 相手のみ</button>
                              </div>
                            )}
                            <button style={{ ...primaryBtnStyle, background: '#747d8c' }} onClick={() => handleEndMission(false, false)}>😭 2人とも失敗...</button>
                          </div>
                        </div>
                      ) : (
                        <p style={{ color: '#747d8c', fontWeight: 'bold' }}>⏳ 代表者が結果を入力しています...</p>
                      )}
                    </div>
                  </>
                )}

                {phase === 'bidding' && (
                  <>
                    <h3 style={{ margin: '0 0 10px 0', color: '#9b59b6' }}>🛍️ 物件シークレット入札</h3>
                    <div style={{ padding: '15px', background: '#f5eef8', borderRadius: '8px', marginBottom: '15px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                      
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                         <span style={{ fontWeight: 'bold', color: '#e74c3c', fontSize: '1rem', background: '#fff', padding: '4px 8px', borderRadius: '6px', border: '1px solid #ff7675' }}>⏱️ 残り滞在: {stayTime}分</span>
                      </div>

                      {!myBid ? (
                        <div style={{ textAlign: 'left' }}>
                          <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', fontSize: '0.9rem', color: '#2c3e50' }}>どの物件を買いましたか？（タップして選択）</p>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                            {currentProperties.map(p => (
                              <div 
                                key={p.id} 
                                onClick={() => setSelectedPropertyId(p.id)}
                                style={{ 
                                  background: selectedPropertyId === p.id ? '#fdf2e9' : '#fff', 
                                  border: selectedPropertyId === p.id ? '2px solid #e67e22' : '1px solid #ccc',
                                  padding: '12px 10px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center',
                                  boxShadow: selectedPropertyId === p.id ? '0 0 8px rgba(230,126,34,0.4)' : '0 2px 4px rgba(0,0,0,0.05)',
                                  transition: 'all 0.2s'
                                }}
                              >
                                <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '5px', color: '#2c3e50' }}>{p.name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#e67e22', fontWeight: 'bold' }}>
                                  {p.type === 'limit' ? `上限: ${p.price}円` : `固定: ${p.price}円`}
                                </div>
                              </div>
                            ))}

                            <div 
                              onClick={() => { setSelectedPropertyId('skip'); setBidAmount(0); }}
                              style={{ 
                                background: selectedPropertyId === 'skip' ? '#f5f5f5' : '#fff', 
                                border: selectedPropertyId === 'skip' ? '2px solid #7f8c8d' : '1px dashed #ccc',
                                padding: '12px 10px', borderRadius: '8px', cursor: 'pointer', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                                boxShadow: selectedPropertyId === 'skip' ? '0 0 8px rgba(127,140,141,0.4)' : 'none'
                              }}
                            >
                              <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#7f8c8d' }}>買わない<br/>(スキップ)</div>
                            </div>
                          </div>

                          {currentlySelectedProperty && (
                            <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #e67e22', marginBottom: '15px', animation: 'fadeIn 0.2s ease-in' }}>
                              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', fontSize: '0.95rem', color: '#d35400' }}>
                                🛒 【{currentlySelectedProperty.name}】 を選択中
                              </p>
                              
                              {currentlySelectedProperty.type === 'limit' ? (
                                <>
                                  <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#555' }}>実際に使った金額（円）を入力してください</p>
                                  <input 
                                    type="number" 
                                    placeholder="例: 1200"
                                    style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '2px solid #ccc', fontSize: '1.1rem', boxSizing: 'border-box', outline: 'none' }}
                                    value={bidAmount || ''}
                                    onChange={(e) => setBidAmount(Number(e.target.value))}
                                  />
                                </>
                              ) : (
                                <p style={{ margin: '0', fontSize: '0.85rem', color: '#7f8c8d', background: '#f1f2f6', padding: '10px', borderRadius: '6px' }}>
                                  ※この物件は「固定値（{currentlySelectedProperty.price}円）」のため金額の入力は不要です。
                                </p>
                              )}
                            </div>
                          )}

                          {selectedPropertyId && (
                            <button 
                              style={{ ...primaryBtnStyle, background: '#9b59b6', boxShadow: '0 4px 6px rgba(155,89,182,0.3)' }} 
                              onClick={() => {
                                const finalPropertyId = selectedPropertyId === 'skip' ? '' : selectedPropertyId;
                                handleSubmitBid(finalPropertyId);
                              }}
                            >
                              🔒 入札を確定する（相手には見えません）
                            </button>
                          )}
                        </div>
                      ) : (
                        <div style={{ padding: '30px 20px', textAlign: 'center', background: '#fff', borderRadius: '8px', border: '1px solid #2ecc71' }}>
                          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>✅</div>
                          <p style={{ fontWeight: 'bold', color: '#27ae60', fontSize: '1.1rem', margin: '0 0 10px 0' }}>あなたの入札が完了しました！</p>
                          {!opponentBid && <p style={{ color: '#7f8c8d', fontSize: '0.9rem', margin: 0 }}>相手の入札を待っています...</p>}
                        </div>
                      )}

                      {bothSubmitted && isMyTurn && (
                        <div style={{ marginTop: '20px', borderTop: '2px dashed #d2b4de', paddingTop: '15px' }}>
                          <p style={{ fontWeight: 'bold', color: '#e74c3c', fontSize: '1.1rem' }}>🎉 2人の入札が揃いました！</p>
                          <button style={{ ...primaryBtnStyle, background: '#e74c3c', marginTop: '10px', boxShadow: '0 4px 6px rgba(231,76,60,0.3)' }} onClick={handleRevealBids}>
                            結果発表 ＆ 次のターンへ
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 【マップ（現在地）タブ】 */}
          {activeTab === 'map' && (
            <div style={{ padding: '15px', background: '#e1efc3', borderRadius: '12px', animation: 'fadeIn 0.2s ease-in', minHeight: '60vh', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <span style={{ background: '#fff', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', color: '#27ae60', border: '2px solid #27ae60', fontSize: '1.1rem', boxShadow: '0 2px 4px rgba(39,174,96,0.2)' }}>
                  📍 現在地: {currentStationName}
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '300px', margin: '0 auto', position: 'relative' }}>
                {/* 線を描画（見た目をすごろく風に） */}
                <div style={{ position: 'absolute', left: '30px', top: '20px', bottom: '20px', width: '4px', background: '#bdc3c7', zIndex: 0 }}></div>
                
                {STATIONS.map((station, index) => {
                  const isHere = index === sharedPosition;
                  const isPassed = index < sharedPosition;
                  
                  return (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '15px', zIndex: 1, padding: '5px 0' }}>
                      <div style={{ 
                        width: '24px', height: '24px', borderRadius: '50%', 
                        background: isHere ? '#f1c40f' : (isPassed ? '#bdc3c7' : '#fff'),
                        border: isHere ? '4px solid #f39c12' : '3px solid #95a5a6',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        boxShadow: isHere ? '0 0 10px rgba(241,196,15,0.6)' : 'none'
                      }}>
                        {isHere && <span style={{ fontSize: '0.8rem' }}>📍</span>}
                      </div>
                      <div style={{ 
                        padding: '10px 15px', background: isHere ? '#fff9e6' : '#fff', 
                        border: isHere ? '2px solid #f39c12' : '1px solid #dcdde1', 
                        borderRadius: '8px', flex: 1, fontWeight: isHere ? 'bold' : 'normal',
                        color: isPassed ? '#7f8c8d' : '#2c3e50',
                        boxShadow: isHere ? '0 4px 6px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.05)'
                      }}>
                        {station}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* 🔑 追加：ボトムナビゲーション（画面下部に固定） */}
      {phase !== 'result' && (
        <div style={bottomNavStyle}>
          <div 
            onClick={() => setActiveTab('main')}
            style={{ ...bottomNavItemStyle, color: activeTab === 'main' ? '#e74c3c' : '#7f8c8d' }}
          >
            <div style={{ fontSize: '1.4rem', marginBottom: '2px' }}>🎲</div>
            <span style={{ fontWeight: activeTab === 'main' ? 'bold' : 'normal' }}>アクション</span>
          </div>
          
          {/* 区切り線 */}
          <div style={{ width: '1px', background: '#eee', margin: '5px 0' }}></div>

          <div 
            onClick={() => setActiveTab('map')}
            style={{ ...bottomNavItemStyle, color: activeTab === 'map' ? '#27ae60' : '#7f8c8d' }}
          >
            <div style={{ fontSize: '1.4rem', marginBottom: '2px' }}>🗺️</div>
            <span style={{ fontWeight: activeTab === 'map' ? 'bold' : 'normal' }}>マップ</span>
          </div>
        </div>
      )}

      <RuleModal isOpen={isRuleOpen} onClose={() => setIsRuleOpen(false)} />
    </div>
  );
};

// --- スタイル定義 ---
const containerStyle: React.CSSProperties = { maxWidth: '500px', margin: '0 auto', padding: '10px', fontFamily: 'sans-serif', position: 'relative' };
const headerStyle: React.CSSProperties = { padding: '15px', background: '#f8f9fa', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' };
const playersAreaStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '20px' };
const playerCardStyle: React.CSSProperties = { flex: 1, background: '#ffffff', padding: '15px', borderRadius: '12px', textAlign: 'center', transition: 'all 0.2s' };
const actionAreaStyle: React.CSSProperties = { textAlign: 'center', background: '#ffffff', padding: '20px', borderRadius: '12px', border: '2px dashed #dcdde1', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' };
const primaryBtnStyle: React.CSSProperties = { padding: '15px 10px', fontSize: '1.1rem', fontWeight: 'bold', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%', transition: 'all 0.2s' };
const secondaryBtnStyle: React.CSSProperties = { ...primaryBtnStyle, background: '#2ed573' };

// ボトムナビゲーションのスタイル
const bottomNavStyle: React.CSSProperties = {
  position: 'fixed', bottom: 0, left: 0, width: '100%', backgroundColor: '#fff', borderTop: '1px solid #e0e0e0',
  display: 'flex', justifyContent: 'space-evenly', padding: '8px 0', zIndex: 100,
  boxShadow: '0 -2px 10px rgba(0,0,0,0.05)', paddingBottom: 'calc(8px + env(safe-area-inset-bottom))' // iPhoneの下部バー対応
};
const bottomNavItemStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, cursor: 'pointer', fontSize: '0.75rem'
};