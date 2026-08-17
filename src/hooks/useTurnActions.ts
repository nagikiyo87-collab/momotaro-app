import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { STATIONS, MISSIONS, ITEMS, type Mission, type Property } from '../data/gameData';
import { useModal } from '../contexts/ModalContext';
import { ITEM_REGISTRY } from '../game/items/itemRegistry';
import type { ItemContext } from '../game/items/types';

const STAY_TIMES = [30, 45, 60];
const SEASONS = ['spring', 'summer', 'autumn', 'winter'];

export const useTurnActions = (
  roomId: string, userId: string, roomData: any, me: any, opponent: any, opponentId: string | undefined, currentProperties: Property[]
) => {
  const modal = useModal(); 
  const { showAlert, showConfirm, triggerConfetti } = modal;

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [activeItemEffect, setActiveItemEffect] = useState<string | null>(null);
  const [spentInput, setSpentInput] = useState<string>('');
  
  const [dest1, setDest1] = useState<string>('');
  const [dest2, setDest2] = useState<string>('');
  const [dest3, setDest3] = useState<string>('');

  const isMyTurn = roomData?.currentTurn === userId; 
  const isRollingDice = roomData?.isRollingDice || false;
  const pendingDiceTotal = roomData?.pendingDiceTotal ?? null;
  const isSpinningRoulette = roomData?.isSpinningRoulette || false;
  const pendingRouletteData = roomData?.pendingRouletteData ?? null;

  const [displayDice, setDisplayDice] = useState<number | null>(null);
  const [displayRoulette, setDisplayRoulette] = useState<number | null>(null);

  const sharedPosition = roomData?.sharedPosition || 0;
  const currentYear = roomData?.year || 1;
  const currentSeason = roomData?.season || 'spring';
  const bombyPossessedId = roomData?.bombyPossessedId;

  const [isAnimatingDice, setIsAnimatingDice] = useState(false);
  const [isAnimatingRoulette, setIsAnimatingRoulette] = useState(false);

  useEffect(() => {
    let interval: number;
    if (isRollingDice && pendingDiceTotal !== null) {
      setIsAnimatingDice(true);
      let count = 0;
      const maxCount = 20;
      interval = window.setInterval(() => {
        setDisplayDice(Math.floor(Math.random() * 6) + 1);
        count++;
        if (count >= maxCount) {
          window.clearInterval(interval);
          setDisplayDice(pendingDiceTotal);
          setIsAnimatingDice(false);
        }
      }, 50);
    } else if (!isRollingDice && pendingDiceTotal === null) {
      setDisplayDice(null);
      setIsAnimatingDice(false);
    }
    return () => window.clearInterval(interval);
  }, [isRollingDice, pendingDiceTotal]);

  useEffect(() => {
    let interval: number;
    if (isSpinningRoulette && pendingRouletteData !== null) {
      setIsAnimatingRoulette(true);
      let count = 0;
      const maxCount = 20;
      interval = window.setInterval(() => {
        setDisplayRoulette(STAY_TIMES[Math.floor(Math.random() * STAY_TIMES.length)]);
        count++;
        if (count >= maxCount) {
          window.clearInterval(interval);
          setDisplayRoulette(pendingRouletteData.time); 
          setIsAnimatingRoulette(false);
        }
      }, 50);
    } else if (!isSpinningRoulette && pendingRouletteData === null) {
      setDisplayRoulette(null);
      setIsAnimatingRoulette(false);
    }
    return () => window.clearInterval(interval);
  }, [isSpinningRoulette, pendingRouletteData]);

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
    if (!opponentId || isRollingDice || pendingDiceTotal !== null) return;
    let roll = Math.floor(Math.random() * 6) + 1;
    let finalTotal = roll;
    if (activeItemEffect === 'i_dice_plus2') finalTotal = roll + 2; 
    else if (activeItemEffect === 'i_dice_double') {
      const roll2 = Math.floor(Math.random() * 6) + 1;
      finalTotal = roll + roll2;
    }
    // 🔑 awaitを外してバックグラウンド送信に
    updateDoc(doc(db, 'rooms', roomId), { isRollingDice: true, pendingDiceTotal: finalTotal }).catch(console.error);
  };

  const handleConfirmMove = async () => {
    if (pendingDiceTotal === null) return;
    let itemMessage = '';
    if (activeItemEffect === 'i_dice_plus2') itemMessage = `🎲 ダイス+2カードの効果が適用されました！`;
    else if (activeItemEffect === 'i_dice_double') itemMessage = `🎲 サイコロ2個振りの効果が適用されました！`;
    
    // UIのアラート待機は残す
    if (itemMessage) await showAlert(itemMessage);

    let nextPosition = sharedPosition + pendingDiceTotal;
    if (nextPosition >= STATIONS.length - 1) nextPosition = STATIONS.length - 1;
    
    // 🔑 awaitを外して即時画面切り替え
    updateDoc(doc(db, 'rooms', roomId), { 
      sharedPosition: nextPosition, lastDiceRoll: pendingDiceTotal, phase: 'roulette', isRollingDice: false, pendingDiceTotal: null
    }).catch(console.error);
    
    setActiveItemEffect(null);
  };

  const handleUseItem = async (itemId: string, index: number) => {
    if (!opponentId || activeItemEffect) {
      if (activeItemEffect) await showAlert('⚠️ すでに別のアイテム効果を準備中です！');
      return;
    }

    if (roomData?.squareType === 'green' && ['i_mission_swap', 'i_mission_share', 'i_mission_reroll'].includes(itemId)) {
      await showAlert('⚠️ 協力ミッション中は、ミッションを変えるアイテムは使えません！');
      return;
    }

    const itemFunc = ITEM_REGISTRY[itemId];
    if (!itemFunc) { await showAlert('⚠️ このアイテムは現在調整中です！'); return; }
    
    const confirmUse = await showConfirm(`アイテム「${ITEMS.find(i => i.id === itemId)?.name}」を使いますか？`);
    if (!confirmUse) return;

    const ctx: ItemContext = { userId, opponentId, roomId, me, opponent, roomData, modal };
    const result = await itemFunc(ctx);
    if (!result) return; 

    const newItems = [...(me?.items || [])];
    newItems.splice(index, 1);
    const updates: any = { [`players.${userId}.items`]: newItems, ...result.updates };
    
    if (result.activeEffect) setActiveItemEffect(result.activeEffect);
    if (result.message) await showAlert(result.message);
    
    // 🔑 awaitを外す
    updateDoc(doc(db, 'rooms', roomId), updates).catch(console.error);
  };

  const handleDiscardItem = async (index: number) => {
    const newItems = [...(me?.items || [])];
    newItems.splice(index, 1);
    // 🔑 awaitを外す
    updateDoc(doc(db, 'rooms', roomId), { [`players.${userId}.items`]: newItems }).catch(console.error);
  };

  const handleSpinRoulette = async () => {
    if (!opponentId || isSpinningRoulette || pendingRouletteData !== null) return;
    const timeResult = STAY_TIMES[Math.floor(Math.random() * STAY_TIMES.length)];
    const squareTypes = ['blue', 'red', 'green', 'yellow'] as const;
    let chosenType: typeof squareTypes[number] = squareTypes[Math.floor(Math.random() * squareTypes.length)];
    let targetMissions = MISSIONS.filter(m => m.type === chosenType);
    if (chosenType === 'yellow') targetMissions = MISSIONS; 

    let myMissionObj: Mission; let opponentMissionObj: Mission;
    const randomMission = targetMissions[Math.floor(Math.random() * targetMissions.length)];

    if (chosenType === 'green' || (chosenType === 'yellow' && randomMission.type === 'green')) {
      myMissionObj = randomMission; opponentMissionObj = randomMission;
    } else {
      myMissionObj = randomMission;
      const otherMissions = targetMissions.filter(m => m.id !== myMissionObj.id);
      opponentMissionObj = otherMissions.length > 0 ? otherMissions[Math.floor(Math.random() * otherMissions.length)] : myMissionObj;
    }
    
    // 🔑 awaitを外す
    updateDoc(doc(db, 'rooms', roomId), {
      isSpinningRoulette: true, pendingRouletteData: { time: timeResult, squareType: chosenType, myMissionId: myMissionObj.id, opMissionId: opponentMissionObj.id }
    }).catch(console.error);
  };

  const handleConfirmRoulette = async () => {
    if (!pendingRouletteData || !opponentId) return;
    // 🔑 awaitを外す
    updateDoc(doc(db, 'rooms', roomId), {
      stayTime: pendingRouletteData.time, 
      squareType: pendingRouletteData.squareType, 
      currentMissions: { [userId]: pendingRouletteData.myMissionId, [opponentId]: pendingRouletteData.opMissionId }, 
      phase: 'destination', 
      destinations: {}, 
      isSpinningRoulette: false,
      pendingRouletteData: null
    }).catch(console.error);
  };

  const handleSubmitDestination = async () => {
    if (isMyTurn) {
      if (!dest1) { await showAlert('⚠️ 1番目の目的地を入力してください！'); return; }
      // 🔑 awaitを外す
      updateDoc(doc(db, 'rooms', roomId), {
        'destinations.dest1': dest1,
        'destinations.dest3': dest3 || ''
      }).catch(console.error);
    } else {
      if (!dest2) { await showAlert('⚠️ 2番目の目的地を入力してください！'); return; }
      // 🔑 awaitを外す
      updateDoc(doc(db, 'rooms', roomId), {
        'destinations.dest2': dest2
      }).catch(console.error);
    }
  };

  const handleConfirmDestinations = async () => {
    const time = roomData.stayTime || 30;
    // 🔑 awaitを外す
    updateDoc(doc(db, 'rooms', roomId), {
      phase: 'mission',
      missionTimer: { isRunning: true, remainingSeconds: time * 60, endTime: Date.now() + time * 60 * 1000 }
    }).catch(console.error);
    setDest1(''); setDest2(''); setDest3('');
  };

  const handleEndMission = async (
    mySuccess: boolean, opponentSuccess: boolean, myMission?: Mission | null, opponentMission?: Mission | null, reachedFirstDest: boolean = true 
  ) => {
    if (!opponentId || !myMission || !opponentMission) return;
    let actualMySuccess = mySuccess;
    let passMsg = '';
    if (!mySuccess && activeItemEffect === 'i_mission_pass') { actualMySuccess = true; passMsg = `\n🎟️ ミッションフリーパスの効果で、無条件クリア扱いになりました！`; }
    if (actualMySuccess && opponentSuccess) triggerConfetti();

    let myMoneyChange = 0; let opponentMoneyChange = 0;
    let newBombyId = bombyPossessedId; 
    const myNewItems: string[] = [...(me?.items || [])];
    const opponentNewItems: string[] = [...(opponent?.items || [])];
    let myItemMsg = passMsg; let opponentItemMsg = '';
    let availableItems = [...ITEMS];

    if (actualMySuccess) {
      let reward = myMission.reward || 0;
      if (activeItemEffect === 'i_reward_double') { reward *= 2; myItemMsg += `\n💰 報酬2倍カードの効果で獲得金額が2倍！`; }
      if (myMission.type === 'blue') myMoneyChange += reward;
      if (myMission.type === 'green') { myMoneyChange += reward; opponentMoneyChange += myMission.reward; }
    } else {
      if (myMission.type === 'red') {
        if (myMission.penaltyType === 'half_money') {
          const currentMoney = me?.money || 0;
          if (currentMoney > 0) { const lostAmount = Math.ceil(currentMoney / 2); myMoneyChange -= lostAmount; myItemMsg += `\n💸 所持金半減ペナルティ: -${lostAmount}円`; }
        } else { myMoneyChange -= myMission.penalty; }
      }
    }

    if (opponentSuccess) {
      if (opponentMission.type === 'blue') opponentMoneyChange += opponentMission.reward;
      if (opponentMission.type === 'green' && myMission.type !== 'green') { myMoneyChange += opponentMission.reward; opponentMoneyChange += opponentMission.reward; }
    } else {
      if (opponentMission.type === 'red') {
        if (opponentMission.penaltyType === 'half_money') {
          const opCurrentMoney = opponent?.money || 0;
          if (opCurrentMoney > 0) { const lostAmount = Math.ceil(opCurrentMoney / 2); opponentMoneyChange -= lostAmount; opponentItemMsg += `\n💸 所持金半減ペナルティ: -${lostAmount}円`; }
        } else { opponentMoneyChange -= opponentMission.penalty; }
      }
    }

    if (roomData?.squareType === 'yellow') {
      if (actualMySuccess) {
        const idx = Math.floor(Math.random() * availableItems.length);
        const randomItem = availableItems[idx]; availableItems.splice(idx, 1); myNewItems.push(randomItem.id); 
        myItemMsg += `\n🎁 アイテムマス効果:「${randomItem.name}」をGET！`; 
        if (myNewItems.length > 3) myItemMsg += `\n⚠️ カバンがいっぱいです！次へ進む前に1つ捨ててください。`;
      }
      if (opponentSuccess) {
        const idx = Math.floor(Math.random() * availableItems.length);
        const randomItem = availableItems[idx]; availableItems.splice(idx, 1); opponentNewItems.push(randomItem.id); 
        opponentItemMsg += `\n🎁 アイテムマス効果:「${randomItem.name}」をGET！`; 
        if (opponentNewItems.length > 3) opponentItemMsg += `\n⚠️ 相手のカバンがいっぱいになりました。`;
      }
    }

    let destPenaltyMsg = '';
    const currentTurn = roomData?.currentTurn;
    if (!reachedFirstDest) {
      const PENALTY_AMOUNT = 1000;
      if (currentTurn === userId) {
        myMoneyChange -= PENALTY_AMOUNT;
        destPenaltyMsg = `\n⏰ 【到着失敗】代表者(あなた)にペナルティ -${PENALTY_AMOUNT}円！`;
      } else if (currentTurn === opponentId) {
        opponentMoneyChange -= PENALTY_AMOUNT;
        destPenaltyMsg = `\n⏰ 【到着失敗】代表者(あいて)にペナルティ -${PENALTY_AMOUNT}円！`;
      }
    }

    const myResult = processDebtAndSales(me?.money || 0, me?.properties || [], myMoneyChange);
    const opResult = processDebtAndSales(opponent?.money || 0, opponent?.properties || [], opponentMoneyChange);

    if (!actualMySuccess && opponentSuccess) newBombyId = userId; 
    else if (actualMySuccess && !opponentSuccess) newBombyId = opponentId; 
    else if (!actualMySuccess && !opponentSuccess) newBombyId = Math.random() < 0.5 ? userId : opponentId; 

    let alertMsg = `【ミッション結果】\nあなた: ${myMoneyChange >= 0 ? '+' : ''}${myMoneyChange}円${myItemMsg}\nあいて: ${opponentMoneyChange >= 0 ? '+' : ''}${opponentMoneyChange}円${opponentItemMsg}\n`;
    alertMsg += destPenaltyMsg; 
    if (myResult.soldNames.length > 0) alertMsg += `\n⚠️ 借金返済のため、あなたの物件が売却されました: ${myResult.soldNames.join(', ')}`;
    if (opResult.soldNames.length > 0) alertMsg += `\n⚠️ 借金返済のため、あいての物件が売却されました: ${opResult.soldNames.join(', ')}`;
    
    let nextBombyType = roomData?.bombyType || 'normal';
    if (newBombyId && newBombyId !== bombyPossessedId) {
      alertMsg += `\n⚠️⚠️⚠️\nミッション結果により、${newBombyId === userId ? 'あなた' : 'あいて'}に貧乏神が取り憑きました！\n`;
      nextBombyType = 'normal';
    }

    alertMsg += `\n続けて「リアル出費の入力」に移動します！`;
    
    // UIアラート待機はそのまま
    await showAlert(alertMsg);
    setActiveItemEffect(null); 

    // 🔑 awaitを外す
    updateDoc(doc(db, 'rooms', roomId), {
      [`players.${userId}.money`]: myResult.newMoney, [`players.${userId}.properties`]: myResult.remainingProperties, [`players.${userId}.items`]: myNewItems,
      [`players.${opponentId}.money`]: opResult.newMoney, [`players.${opponentId}.properties`]: opResult.remainingProperties, [`players.${opponentId}.items`]: opponentNewItems,
      bombyPossessedId: newBombyId, bombyType: nextBombyType, phase: 'spending', spendings: {} 
    }).catch(console.error);
  };

  const handleSubmitSpending = async () => {
    if (spentInput === '') { await showAlert('⚠️ 使ってない場合は「0」を入力してください！'); return; }
    const amount = Number(spentInput);
    // 🔑 awaitを外す
    updateDoc(doc(db, 'rooms', roomId), { [`spendings.${userId}`]: amount }).catch(console.error);
  };

  const handleFinishSpending = async () => {
    if (!opponentId) return;
    const mySpent = roomData?.spendings?.[userId] || 0;
    const opSpent = roomData?.spendings?.[opponentId] || 0;
    
    const myResult = processDebtAndSales(me?.money || 0, me?.properties || [], -mySpent);
    const opResult = processDebtAndSales(opponent?.money || 0, opponent?.properties || [], -opSpent);

    let msg = `【リアル出費の精算】\nあなた: -${mySpent}円\nあいて: -${opSpent}円\n`;
    if (myResult.soldNames.length > 0) msg += `\n⚠️ 借金返済のため、あなたの物件が売却されました: ${myResult.soldNames.join(', ')}`;
    if (opResult.soldNames.length > 0) msg += `\n⚠️ 借金返済のため、あいての物件が売却されました: ${opResult.soldNames.join(', ')}`;

    msg += `\n続けて「物件のシークレット入札」に移動します！`;
    await showAlert(msg);

    // 🔑 awaitを外す
    updateDoc(doc(db, 'rooms', roomId), {
      [`players.${userId}.money`]: myResult.newMoney, [`players.${userId}.properties`]: myResult.remainingProperties,
      [`players.${opponentId}.money`]: opResult.newMoney, [`players.${opponentId}.properties`]: opResult.remainingProperties,
      phase: 'bidding', bids: {}
    }).catch(console.error);
    setSpentInput('');
  };

  const handleSubmitBid = async (finalPropertyId: string) => {
    let finalAmount = bidAmount;
    if (finalPropertyId && finalPropertyId !== 'skip') {
      const selectedProp = currentProperties.find(p => p.id === finalPropertyId);
      if (selectedProp) {
        if (selectedProp.type === 'limit' && bidAmount > selectedProp.price) {
          await showAlert(`⚠️ リアル入札額（${bidAmount}円）が物件の上限を超えています！\nルールに基づき、ゲーム内の入札額は「${selectedProp.price}円」として確定します。`);
          finalAmount = selectedProp.price;
        } else if (selectedProp.type === 'fixed') { 
          finalAmount = selectedProp.price; 
        }
        
        if (finalAmount > (me?.money || 0)) {
          await showAlert(`⚠️ 所持金（${me?.money}円）を超えて物件を買うことはできません！\n今回は「買えない」扱いとなります。`);
          finalAmount = 0; finalPropertyId = ''; 
        }
      }
    } else { finalAmount = 0; }
    
    // 🔑 awaitを外す
    updateDoc(doc(db, 'rooms', roomId), { [`bids.${userId}`]: { propertyId: finalPropertyId, amount: finalAmount } }).catch(console.error);
  };

  const handleRevealBids = async (myBid: any, opponentBid: any) => {
    if (!opponentId) return;
    let myWonProperty: Property | null = null; let opponentWonProperty: Property | null = null;

    if (myBid.propertyId !== opponentBid.propertyId) {
      if (myBid.propertyId) myWonProperty = currentProperties.find(p => p.id === myBid.propertyId) || null;
      if (opponentBid.propertyId) opponentWonProperty = currentProperties.find(p => p.id === opponentBid.propertyId) || null;
    } else if (myBid.propertyId && opponentBid.propertyId) {
      const contestedProperty = currentProperties.find(p => p.id === myBid.propertyId);
      if (contestedProperty) {
        if (myBid.amount > opponentBid.amount) myWonProperty = contestedProperty;
        else if (opponentBid.amount > myBid.amount) opponentWonProperty = contestedProperty;
        else {
          if (Math.random() > 0.5) { myWonProperty = contestedProperty; await showAlert("【バッティング同額！】\nサイコロ勝負の結果、あなたの勝利です！"); } 
          else { opponentWonProperty = contestedProperty; await showAlert("【バッティング同額！】\nサイコロ勝負の結果、相手の勝利です！"); } 
        }
      }
    }

    const myProperties: Property[] = [...(me.properties || [])];
    const opponentProperties: Property[] = [...(opponent?.properties || [])];
    let myNewMoney = me.money || 0; 
    let opponentNewMoney = opponent?.money || 0;
    
    let myPaidCost = 0;
    let opPaidCost = 0;

    if (myWonProperty) { 
      myProperties.push(myWonProperty); 
      myPaidCost = myWonProperty.type === 'fixed' ? myWonProperty.price : myBid.amount;
      myNewMoney -= myPaidCost; 
    }
    if (opponentWonProperty) { 
      opponentProperties.push(opponentWonProperty); 
      opPaidCost = opponentWonProperty.type === 'fixed' ? opponentWonProperty.price : opponentBid.amount;
      opponentNewMoney -= opPaidCost; 
    }

    let alertMessage = `【入札結果】\nあなた: ${myWonProperty ? myWonProperty.name + ` を獲得！(-${myPaidCost}円)` : '獲得なし'}\nあいて: ${opponentWonProperty ? opponentWonProperty.name + ` を獲得！(-${opPaidCost}円)` : '獲得なし'}`;

    const currentSeasonIndex = SEASONS.indexOf(currentSeason);
    let nextSeasonIndex = currentSeasonIndex + 1; let nextYear = currentYear;

    if (currentSeason === 'winter') {
      nextSeasonIndex = 0; nextYear += 1;       
      const calculateIncome = (props: Property[]) => props.reduce((sum, prop) => sum + Math.floor(prop.price * (prop.rate / 100)), 0);
      const myIncome = calculateIncome(myProperties); const opponentIncome = calculateIncome(opponentProperties);
      myNewMoney += myIncome; opponentNewMoney += opponentIncome; 
      alertMessage += `\n\n🌸🌸🌸 決算ボーナス 🌸🌸🌸\n1年間の収益が振り込まれました！\nあなた: +${myIncome}円\nあいて: +${opponentIncome}円`;
    }

    let myDebtMsg = ''; let opDebtMsg = '';
    if (myNewMoney < 0) { const interest = Math.floor(Math.abs(myNewMoney) * 0.2); myNewMoney -= interest; myDebtMsg = `\n💀 借金利息(20%): あなた -${interest}円 (総借金: ${myNewMoney}円)`; }
    if (opponentNewMoney < 0) { const interest = Math.floor(Math.abs(opponentNewMoney) * 0.2); opponentNewMoney -= interest; opDebtMsg = `\n💀 借金利息(20%): あいて -${interest}円 (総借金: ${opponentNewMoney}円)`; }
    if (myDebtMsg || opDebtMsg) alertMessage += `\n\n💸💸💸 借金利息発生 💸💸💸${myDebtMsg}${opDebtMsg}`;

    await showAlert(alertMessage);
    const isGoal = sharedPosition === STATIONS.length - 1;

    const nextPhase = isGoal ? 'result' : (roomData.bombyPossessedId ? 'bomby' : 'dice');

    // 🔑 awaitを外す
    updateDoc(doc(db, 'rooms', roomId), {
      [`players.${userId}.properties`]: myProperties, [`players.${opponentId}.properties`]: opponentProperties,
      [`players.${userId}.money`]: myNewMoney, [`players.${opponentId}.money`]: opponentNewMoney,
      year: nextYear, season: SEASONS[nextSeasonIndex], phase: nextPhase, currentTurn: opponentId 
    }).catch(console.error);
  };

  const handleBombyAction = async () => {
    if (!opponentId) return;
    if (roomData?.bombyPossessedId !== userId) return; 
    
    // 💡 テストする時はここの数字を書き換えてください
    const rand = Math.floor(Math.random() * 100);
    let newType = 'normal';
    if (rand < 5) newType = 'king'; else if (rand < 25) newType = 'petit';   

    const currentType = roomData?.bombyType || 'normal';

    if (newType !== currentType) {
      if (newType === 'king') {
        await showAlert("⚡️⚡️⚡️⚡️⚡️⚡️⚡️\n\n「グエッヘッヘ！\nオレ様はキングボンビーだ！\nこれからお前に地獄を見せてやるのねん！」\n\n⚡️⚡️⚡️⚡️⚡️⚡️⚡️");
      } else if (newType === 'petit') {
        await showAlert("✨✨✨✨✨✨✨\n\n「ボク、プチボンビーなのねん！\nよろしくなのねん！」\n\n✨✨✨✨✨✨✨");
      } else if (newType === 'normal') {
        await showAlert("💨💨💨\n\n「普通の貧乏神に戻ったのねん…」\n\n💨💨💨");
      }
    }

    let moneyChange = 0; let message = ''; let remainingProps = [...(me?.properties || [])];

    if (newType === 'king') {
      const roll = Math.floor(Math.random() * 6) + 1; moneyChange = roll * -1000;
      message = `【👑 キングボンビーの悪行】\n「グエッヘッヘ！サイコロの目は『${roll}』だ！」\n所持金から ${Math.abs(moneyChange)}円 奪われた...`;
      if (remainingProps.length > 0) {
        remainingProps.sort((a, b) => b.price - a.price); const lostProp = remainingProps.shift()!; 
        message += `\n\nさらに一番高い物件「${lostProp.name}」を捨てられたのねん！`;
      }
      message += `\n\nさらに現実で「ロック画面を相手が撮った変顔」に変更してください！`;
    } else if (newType === 'petit') {
      if (Math.random() < 0.5) { moneyChange = -100; message = `【👼 プチボンビーの悪行】\n「お小遣いちょうだいのねん！」\n所持金が -100円 されました。`; } 
      else { message = `【👼 プチボンビーの悪行】\n「今回は何もしないでおいてあげるのねん！」\n（ノーダメージ）`; }
    } else { 
      const act = Math.random();
      if (act < 0.33) { 
        moneyChange = -1000; 
        message = `【😈 貧乏神の悪行】\n「お金を落としてきたのねん！」\n所持金が -1000円 されました。`; 
      } else if (act < 0.66) { 
        await showAlert(`【😈 貧乏神の悪行】\n「のどが渇いたのねん！」\n現実で相手に「ジュースかお菓子」を奢ってください！`);
        
        const input = window.prompt('相手に奢る（または奢った）ジュースやお菓子の金額（円）を半角数字で入力してください。', '150');
        const cost = parseInt(input || '0', 10);
        const finalCost = (!isNaN(cost) && cost > 0) ? cost : 150;
        moneyChange = -finalCost; 
        message = `【😈 貧乏神の悪行 (結果)】\nゲーム内の所持金からジュース代 -${finalCost}円 されたのねん！`; 
      } else { 
        message = `【😈 貧乏神の悪行】\n「歩くの疲れたのねん！」\n次の駅まで相手の「カバン持ち」をしてください！`; 
      }
    }
    const myResult = processDebtAndSales(me?.money || 0, remainingProps, moneyChange);
    if (myResult.soldNames.length > 0) message += `\n\n⚠️ 借金返済のため、物件が強制売却されました: ${myResult.soldNames.join(', ')}`;
    
    await showAlert(message);

    // 🔑 awaitを外す
    updateDoc(doc(db, 'rooms', roomId), {
      [`players.${userId}.money`]: myResult.newMoney, [`players.${userId}.properties`]: myResult.remainingProperties,
      bombyType: newType, phase: 'dice'
    }).catch(console.error);
  };

  return {
    diceResult: displayDice, rouletteResult: displayRoulette, 
    selectedPropertyId, setSelectedPropertyId, bidAmount, setBidAmount, activeItemEffect, setActiveItemEffect,
    isRollingDice, isSpinningRoulette, isAnimatingDice, isAnimatingRoulette,
    pendingDiceTotal, pendingRouletteData,
    spentInput, setSpentInput,
    dest1, setDest1, dest2, setDest2, dest3, setDest3, 
    handleRollDice, handleConfirmMove, handleUseItem, handleDiscardItem, 
    handleSpinRoulette, handleConfirmRoulette, 
    handleSubmitDestination, handleConfirmDestinations, 
    handleEndMission, handleSubmitSpending, handleFinishSpending, 
    handleSubmitBid, handleRevealBids, handleBombyAction,
  };
};