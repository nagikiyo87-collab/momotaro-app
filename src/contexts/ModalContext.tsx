import React, { createContext, useState, useContext, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti'; // 🔑 追加
import '../styles/index.css';

// どんな機能を持たせるかの設計図に「紙吹雪」を追加
export interface ModalContextType {
  showAlert: (message: string) => Promise<void>;
  showConfirm: (message: string) => Promise<boolean>;
  triggerConfetti: () => void; // 🔑 追加
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error('useModal must be used within a ModalProvider');
  return context;
};

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modal, setModal] = useState<{
    isOpen: boolean; type: 'alert' | 'confirm'; message: string;
    onConfirm?: () => void; onCancel?: () => void;
  }>({ isOpen: false, type: 'alert', message: '' });

  // 🔑 紙吹雪を管理するためのState
  const [confettiKey, setConfettiKey] = useState(0);

  const showAlert = (message: string): Promise<void> => {
    return new Promise((resolve) => {
      setModal({ isOpen: true, type: 'alert', message, onConfirm: () => { setModal(prev => ({ ...prev, isOpen: false })); resolve(); } });
    });
  };

  const showConfirm = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setModal({ isOpen: true, type: 'confirm', message, onConfirm: () => { setModal(prev => ({ ...prev, isOpen: false })); resolve(true); }, onCancel: () => { setModal(prev => ({ ...prev, isOpen: false })); resolve(false); } });
    });
  };

  // 🔑 紙吹雪を発射する関数
  const triggerConfetti = () => {
    setConfettiKey(prev => prev + 1); // Keyを変えることで何度でも発射できるようにする
  };

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm, triggerConfetti }}>
      {children}
      
      {/* 🔑 紙吹雪の描画エリア（一番手前に表示され、勝手に消えます） */}
      {confettiKey > 0 && (
        <Confetti
          key={confettiKey}
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}           // ずっと降り続けるのではなく、降ったら終わる
          numberOfPieces={400}      // 紙吹雪の枚数
          gravity={0.15}            // 落ちるスピード
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 10000, pointerEvents: 'none' }}
        />
      )}

      {/* ポップアップの表示部分 */}
      <AnimatePresence>
        {modal.isOpen && (
          <div style={overlayStyle}>
            <motion.div initial={{ scale: 0.5, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0, y: 20 }} transition={{ type: 'spring', bounce: 0.5 }} style={modalStyle}>
              <div style={messageStyle}>
                {modal.message.split('\n').map((line, i) => (
                  <React.Fragment key={i}>{line}<br/></React.Fragment>
                ))}
              </div>
              <div style={buttonContainerStyle}>
                {modal.type === 'confirm' && (
                  <button className="btn-pop btn-gray" style={{ width: '45%' }} onClick={modal.onCancel}>いいえ</button>
                )}
                <button className={`btn-pop ${modal.type === 'alert' ? 'btn-blue' : 'btn-green'}`} style={{ width: modal.type === 'alert' ? '100%' : '45%' }} onClick={modal.onConfirm}>
                  {modal.type === 'alert' ? 'OK' : 'はい'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ModalContext.Provider>
  );
};

const overlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' };
const modalStyle: React.CSSProperties = { background: '#fff', padding: '25px', borderRadius: '20px', width: '100%', maxWidth: '400px', border: '5px solid #34495e', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', textAlign: 'center' };
const messageStyle: React.CSSProperties = { fontSize: '1.1rem', fontWeight: '800', color: '#2c3e50', lineHeight: '1.6', marginBottom: '25px', wordBreak: 'break-word' };
const buttonContainerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: '10px' };