import React from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export const RuleModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#2c3e50' }}>📖 ルール確認</h3>
          <button onClick={onClose} style={closeBtnStyle}>✖</button>
        </div>

        <div style={contentStyle}>
          <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '15px', textAlign: 'left' }}>
            タップすると詳細が開きます。
          </p>

          <details style={detailsStyle}>
            <summary style={summaryStyle}>🏆 勝利条件と基本の流れ</summary>
            <div style={innerContentStyle}>
              <ul style={ulStyle}>
                <li style={liStyle}><strong>ゴール:</strong> 高尾山口駅（サイコロの目がオーバーしても到着）</li>
                <li style={liStyle}><strong>勝敗:</strong> ゴール到達時の「所持金 ＋ 物件価値」の総資産が多い方の勝利。差額によって敗者の奢りランクが決定。</li>
                <li style={liStyle}><strong>季節と決算:</strong> 1ターンごとに「春→夏→秋→冬」と進み、冬の終わりに物件収益が振り込まれる（決算）。</li>
              </ul>
            </div>
          </details>

          <details style={detailsStyle}>
            <summary style={summaryStyle}>📍 マスの種類とミッション</summary>
            <div style={innerContentStyle}>
              <ul style={ulStyle}>
                <li style={liStyle}><strong>🔵 青マス:</strong> 成功でボーナス。失敗してもペナルティなし。</li>
                <li style={liStyle}><strong>🔴 赤マス:</strong> 成功でボーナスだが、失敗すると所持金が減るなどのペナルティ。</li>
                <li style={liStyle}><strong>🟢 協力マス:</strong> 2人で挑戦。成功すれば2人ともボーナス。</li>
                <li style={liStyle}><strong>🟡 アイテムマス:</strong> 成功するとアイテムを1つGET（最大3つまで）。</li>
              </ul>
            </div>
          </details>

          <details style={detailsStyle}>
            <summary style={summaryStyle}>🛍️ リアル課金と物件システム</summary>
            <div style={innerContentStyle}>
              <ul style={ulStyle}>
                <li style={liStyle}><strong>絶対ルール:</strong> 現実の飲食・買い物は「ゲーム内の所持金」の範囲内でしか使えない。</li>
                <li style={liStyle}><strong>シークレット入札:</strong> 同じ物件（お店）を2人で選んだ場合、リアル購入額が高い方が獲得。</li>
                <li style={liStyle}><strong>上限額:</strong> 物件の上限額以上のお金を使っても、ゲーム内の入札額は「上限額」に丸められる。</li>
                <li style={liStyle}><strong>借金と売却:</strong> 所持金がマイナスになると物件が半額で強制売却。それでもマイナスなら毎ターン20%の利息がつく。</li>
              </ul>
            </div>
          </details>

          <details style={detailsStyle}>
            <summary style={summaryStyle}>😈 ボンビーシステム</summary>
            <div style={innerContentStyle}>
              <ul style={ulStyle}>
                <li style={liStyle}><strong>憑依条件:</strong> ミッションに失敗した側に取り憑く（両方失敗はランダム）。</li>
                <li style={liStyle}><strong>悪行発動:</strong> 憑依されている人の「ターン開始時」に悪行を働く。</li>
                <li style={liStyle}><strong>変身:</strong> 毎ターン変身判定。（ノーマル 75% / プチ 20% / キング 5%）</li>
                <li style={liStyle}><strong>キングボンビー:</strong> 所持金を大きく奪い、一番高い物件を強制没収する。</li>
              </ul>
            </div>
          </details>

          <details style={detailsStyle}>
            <summary style={summaryStyle}>🎒 アイテムについて</summary>
            <div style={innerContentStyle}>
              <ul style={ulStyle}>
                <li style={liStyle}><strong>所持上限:</strong> 最大3つまで。</li>
                <li style={liStyle}><strong>使用タイミング:</strong> 自分のターンの「サイコロを振る前」に1ターン1回だけ使える。</li>
              </ul>
            </div>
          </details>

        </div>
      </div>
    </div>
  );
};

// --- スタイル定義 ---
const overlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
  backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 1000,
  display: 'flex', justifyContent: 'center', alignItems: 'center',
  padding: '20px', boxSizing: 'border-box'
};
const modalStyle: React.CSSProperties = {
  backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '400px',
  maxHeight: '85vh', display: 'flex', flexDirection: 'column',
  boxShadow: '0 10px 25px rgba(0,0,0,0.2)', overflow: 'hidden'
};
const headerStyle: React.CSSProperties = {
  padding: '15px 20px', borderBottom: '1px solid #eee', background: '#f8f9fa',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
};
const closeBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', fontSize: '1.5rem', color: '#7f8c8d', cursor: 'pointer', padding: 0
};
const contentStyle: React.CSSProperties = {
  padding: '20px', overflowY: 'auto', flex: 1, textAlign: 'left'
};
const detailsStyle: React.CSSProperties = {
  marginBottom: '10px', background: '#fdfefe', border: '1px solid #e0e0e0', borderRadius: '6px',
};
const summaryStyle: React.CSSProperties = {
  padding: '12px 15px', fontWeight: 'bold', fontSize: '0.95rem', color: '#34495e',
  cursor: 'pointer', outline: 'none', listStyle: 'none', display: 'flex', alignItems: 'center'
};
const innerContentStyle: React.CSSProperties = {
  padding: '10px 15px 15px 15px', borderTop: '1px dashed #eee', fontSize: '0.85rem', color: '#555', lineHeight: '1.6', textAlign: 'left'
};
const ulStyle: React.CSSProperties = {
  margin: 0, paddingLeft: '18px', textAlign: 'left'
};
const liStyle: React.CSSProperties = {
  marginBottom: '6px', textAlign: 'left'
};