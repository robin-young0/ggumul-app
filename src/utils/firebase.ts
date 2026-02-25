import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, isSupported } from 'firebase/messaging';

// Firebase 설정 (환경변수에서 가져옴)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Firebase 초기화
let app;
let db;
let messaging;

// Firebase가 설정되어 있는지 확인 (모든 필수 값이 있어야 함)
export const isFirebaseConfigured = () => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId &&
    // 'undefined' 문자열이 아닌지도 확인
    firebaseConfig.apiKey !== 'undefined' &&
    firebaseConfig.projectId !== 'undefined'
  );
};

// Firebase 초기화 (설정이 있을 때만)
if (isFirebaseConfigured()) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);

    // Messaging은 지원하는 환경에서만 초기화
    isSupported().then((supported) => {
      if (supported && app) {
        messaging = getMessaging(app);
      }
    }).catch((err) => {
      console.warn('[Firebase] Messaging 초기화 실패:', err);
    });

    console.log('[Firebase] 초기화 완료');
  } catch (err) {
    console.error('[Firebase] 초기화 실패:', err);
  }
} else {
  console.log('[Firebase] 환경 변수가 설정되지 않아 Firebase를 초기화하지 않습니다.');
}

export { app, db, messaging };
