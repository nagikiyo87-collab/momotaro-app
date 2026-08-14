import React, { useState, useEffect } from 'react';
import { ITEMS } from '../data/gameData';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onAdjustMoney?: (amount: number) => Promise<void>; 
};

type TabType = 'basic' | 'mission' | 'property' | 'bomby' | 'item';
type ViewMode = 'menu' | 'rules' | 'adjust_money'; 

export const RuleModal: React.FC<Props> = ({ isOpen, onClose, onAdjustMoney }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('menu');
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>(''); 

  useEffect(() => {
    if (isOpen) {
      setViewMode('menu');
      setActiveTab('basic');
      setAdjustAmount('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  const getItemTypeName = (type: string) => {
    switch (type) {
      case 'attack': return '⚔️ 妨害・逆転系';
      case 'support': return '✨ 自身強化・便利系';
      case 'defense': return '🛡️ 防御・回避系';
      default: return '🎒 その他';
    }
  };

  const handleQuit = () => {
    if (window.confirm("ゲームを一時退出してホーム画面に戻りますか？\n（同じルームIDを入力すれば元の状態に復帰できます）")) {
      localStorage.removeItem('savedRoomId');
      window.location.href = '/?step=route_select';
    }
  };

  const submitAdjustment = async (multiplier: number) => {
    if (!adjustAmount || !onAdjustMoney) return;
    const amount = Number(adjustAmount) * multiplier; 
    await onAdjustMoney(amount);
    alert(`所持金を ${Number(adjustAmount)}円 ${multiplier > 0 ? '増やしました' : '減らしました'}！`);
    setAdjustAmount('');
    onClose(); 
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' }}>
      <div style={{ background: '#fff', width: '100%', maxWidth: '500px', maxHeight: '90vh', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        
        {/* =========================================
            画面①：メインメニュー画面
        ========================================= */}
        {viewMode === 'menu' && (
          <>
            <div style={{ flexShrink: 0, background: '#f1c40f', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, color: '#d35400', fontSize: '1.2rem', fontWeight: '900' }}>⚙️ メニュー</h2>
              <button onClick={onClose} style={{ background: '#fff', border: 'none', width: '30px', height: '30px', borderRadius: '50%', fontWeight: 'bold', color: '#d35400', cursor: 'pointer' }}>✕</button>
            </div>
            
            <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: '20px', background: '#fdfdfd', flex: 1 }}>
              <p style={{ textAlign: 'center', color: '#7f8c8d', fontWeight: 'bold', margin: '0 0 10px 0' }}>操作を選んでください</p>
              
              <button onClick={() => setViewMode('rules')} style={{ background: '#3498db', color: '#fff', border: 'none', padding: '20px', borderRadius: '16px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 8px 0 #2980b9', transition: 'transform 0.1s' }}>
                📖 ルール・アイテム確認
              </button>

              <button onClick={() => setViewMode('adjust_money')} style={{ background: '#2ecc71', color: '#fff', border: 'none', padding: '20px', borderRadius: '16px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 8px 0 #27ae60', transition: 'transform 0.1s' }}>
                💰 所持金の修正 (入力ミス救済)
              </button>
              
              <button onClick={handleQuit} style={{ background: '#e74c3c', color: '#fff', border: 'none', padding: '20px', borderRadius: '16px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 8px 0 #c0392b', transition: 'transform 0.1s' }}>
                🚪 ゲームを一時退出する
              </button>
            </div>
          </>
        )}

        {/* =========================================
            画面②：ルール確認画面
        ========================================= */}
        {viewMode === 'rules' && (
          <>
            <div style={{ flexShrink: 0, background: '#3498db', padding: '15px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => setViewMode('menu')} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                ⬅️ 戻る
              </button>
              <h2 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', fontWeight: '900' }}>📖 ルール確認</h2>
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', width: '30px', height: '30px', borderRadius: '50%', fontWeight: 'bold', color: '#fff', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ flexShrink: 0, display: 'flex', overflowX: 'auto', background: '#f8f9fa', borderBottom: '2px solid #ecf0f1', padding: '0 10px' }}>
              {[
                { id: 'basic', label: '基本' },
                { id: 'mission', label: 'マス' },
                { id: 'property', label: '物件' },
                { id: 'bomby', label: '貧乏神' },
                { id: 'item', label: 'アイテム' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  style={{
                    background: 'none', border: 'none', padding: '12px 15px', fontSize: '0.9rem', fontWeight: 'bold', whiteSpace: 'nowrap', cursor: 'pointer',
                    color: activeTab === tab.id ? '#e67e22' : '#7f8c8d',
                    borderBottom: activeTab === tab.id ? '3px solid #e67e22' : '3px solid transparent'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, background: '#fdfdfd' }}>
              {activeTab === 'basic' && (
                <div>
                  <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '8px', marginBottom: '15px' }}>🏆 勝利条件と基本の流れ</h3>
                  <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#34495e' }}>
                    **【勝利条件】**<br/>
                    ゴール（高尾山口駅）に到着した時点で、**「所持金 ＋ 物件の価値」** の総資産が多かった方の勝利です。<br/><br/>
                    **【ゲームの流れ】**<br/>
                    ① 代表者がサイコロを振って2人で進む。<br/>
                    ② ルーレットで「滞在時間」と「マスの種類」を決める。<br/>
                    ③ お互いの行きたい目的地を決め、確定したら出発。<br/>
                    ④ 制限時間内にミッションを実行する。<br/>
                    ⑤ 滞在中、現実で使ったお金を入力して所持金から引く。<br/>
                    ⑥ その駅の「物件」をシークレット入札で購入する。<br/>
                    ⑦ 冬の終わりに決算（物件の収益受け取り）が発生します。
                  </p>
                </div>
              )}

              {activeTab === 'item' && (
                <div>
                  <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '8px', marginBottom: '15px' }}>🎒 アイテムについて</h3>
                  <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#34495e', marginBottom: '15px', background: '#fff3e0', padding: '10px', borderRadius: '8px' }}>
                    ・アイテムは最大 **3個** まで持てます。<br/>
                    ・4個目を手に入れた時は、どれか1つを捨てます。<br/>
                    ・1度使うとなくなります。<br/>
                    <span style={{ color: '#c0392b', fontWeight: 'bold' }}>※ 自分の所持金がマイナス（借金状態）の時は、「割り勘カード」は使えません。</span>
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {ITEMS.map(item => (
                      <div key={item.id} style={{ border: '1px solid #dcdde1', borderRadius: '8px', overflow: 'hidden' }}>
                        <button 
                          onClick={() => toggleAccordion(item.id)}
                          style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', background: openAccordion === item.id ? '#f1f2f6' : '#fff', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.75rem', color: '#7f8c8d', fontWeight: 'bold' }}>{getItemTypeName(item.type)}</span>
                            <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#2c3e50' }}>{item.name}</span>
                          </div>
                          <span style={{ color: '#bdc3c7', fontSize: '1.2rem' }}>
                            {openAccordion === item.id ? '−' : '＋'}
                          </span>
                        </button>
                        {openAccordion === item.id && (
                          <div style={{ padding: '15px', background: '#fff', borderTop: '1px dashed #dcdde1', fontSize: '0.9rem', color: '#34495e', lineHeight: '1.5' }}>
                            {item.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'mission' && (
                <div>
                  <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '8px', marginBottom: '15px' }}>📍 マスの種類とペナルティ</h3>
                  <ul style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#34495e', paddingLeft: '20px', marginBottom: '15px' }}>
                    <li><b style={{ color: '#3498db' }}>🔵 青マス</b>：成功でお金がもらえる！</li>
                    <li><b style={{ color: '#e74c3c' }}>🔴 赤マス</b>：失敗するとお金が減るか半分に…！</li>
                    <li><b style={{ color: '#2ecc71' }}>🟢 協力マス</b>：2人で成功すればボーナス！</li>
                    <li><b style={{ color: '#f1c40f' }}>🟡 アイテムマス</b>：成功するとアイテムGET！</li>
                  </ul>
                  <div style={{ background: '#ffefeb', padding: '10px', borderRadius: '8px', border: '2px solid #ff7675' }}>
                    <h4 style={{ color: '#c0392b', margin: '0 0 5px 0', fontSize: '0.95rem' }}>⏰ 到達ペナルティ</h4>
                    <p style={{ fontSize: '0.85rem', margin: 0, color: '#d63031', lineHeight: '1.5' }}>
                      タイマー内に「1番目の目的地」に到着できなかった場合、**目的地を決めた代表者のみ -1,000円** のペナルティを受けます。
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'property' && (
                <div>
                  <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '8px', marginBottom: '15px' }}>🏢 物件と借金</h3>
                  <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#34495e' }}>
                    ・ゲーム内の所持金のみで現実の買い物をします。<br/>
                    ・上限額を超えて買っても、ゲーム内では上限額として計算されます。<br/>
                    <span style={{ fontWeight: 'bold', color: '#8e44ad' }}>・公園などの「固定値」スポットは、入札額の入力は不要で、固定の金額が引かれます。</span><br/>
                    ・相手と同じ物件を選んだ場合は、**「実際の購入額が高い方」**が獲得します。（同額ならサイコロ勝負）<br/>
                    ・借金（マイナス）になると、**毎ターン20%の利息**が増えていきます。
                  </p>
                </div>
              )}

              {activeTab === 'bomby' && (
                <div>
                  <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '8px', marginBottom: '15px' }}>😈 貧乏神（ボンビー）</h3>
                  <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#34495e' }}>
                    ミッションに失敗すると取り憑かれます。ターン開始時に様々な悪行をしてきます。<br/><br/>
                    ・**貧乏神**：お金を減らしたり、ジュースを奢らせたりする。<br/>
                    ・**プチボンビー**：被害は少なめ。<br/>
                    ・**キングボンビー**：サイコロの目×1000円を奪う、一番高い物件を捨てるなど、致命的な被害をもたらす！
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* =========================================
            画面③：所持金の修正画面（救済システム）
        ========================================= */}
        {viewMode === 'adjust_money' && (
          <>
            <div style={{ flexShrink: 0, background: '#2ecc71', padding: '15px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => setViewMode('menu')} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                ⬅️ 戻る
              </button>
              <h2 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', fontWeight: '900' }}>💰 所持金の修正</h2>
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', width: '30px', height: '30px', borderRadius: '50%', fontWeight: 'bold', color: '#fff', cursor: 'pointer' }}>✕</button>
            </div>
            
            <div style={{ padding: '30px 20px', display: 'flex', flexDirection: 'column', gap: '20px', background: '#fdfdfd', flex: 1 }}>
              <p style={{ color: '#2c3e50', fontWeight: 'bold', lineHeight: '1.5', margin: 0 }}>
                入力ミスなどでゲーム内の所持金がズレてしまった場合、ここで直接修正できます。（相手には通知されません）
              </p>
              
              <div>
                <label style={{ fontWeight: 'bold', color: '#e67e22', fontSize: '0.9rem' }}>修正する金額（円）</label>
                <input 
                  type="text" 
                  inputMode="numeric" 
                  pattern="[0-9]*"
                  placeholder="例: 1000" 
                  value={adjustAmount}
                  onChange={e => setAdjustAmount(e.target.value.replace(/[^0-9]/g, ''))}
                  style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '3px solid #bdc3c7', fontSize: '1.2rem', fontWeight: '800', boxSizing: 'border-box', outline: 'none', marginTop: '5px' }} 
                />
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button 
                  onClick={() => submitAdjustment(1)} 
                  style={{ flex: 1, background: '#3498db', color: '#fff', border: 'none', padding: '15px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 6px 0 #2980b9' }}
                >
                  ➕ 増やす
                </button>
                <button 
                  onClick={() => submitAdjustment(-1)} 
                  style={{ flex: 1, background: '#e74c3c', color: '#fff', border: 'none', padding: '15px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 6px 0 #c0392b' }}
                >
                  ➖ 減らす
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};