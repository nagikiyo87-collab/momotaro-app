import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// .envファイルから安全に合言葉を読み込む設定
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Firebaseのシステムを起動
const app = initializeApp(firebaseConfig);

// 他のファイルからデータベースと認証機能を呼び出せるようにする
export const db = getFirestore(app);
export const auth = getAuth(app);

// 🔑 ここを追加！：キャッシュを有効化し、通信ラグをゼロ（体感）にする
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.warn('複数タブが開かれています。');
  } else if (err.code == 'unimplemented') {
    console.warn('ブラウザがオフラインキャッシュに未対応です。');
  }
});