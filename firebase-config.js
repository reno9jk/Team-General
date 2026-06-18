// Firebase 설정 (환경별 자동 선택)
// env.js, config/firebase.dev.js, config/firebase.prod.js 가 먼저 로드되어야 합니다.

const firebaseConfig = IS_DEV ? FIREBASE_CONFIG_DEV : FIREBASE_CONFIG_PROD;

// Firebase가 초기화되었는지 확인
let firebaseInitialized = false;

// Firebase 초기화 함수
function initFirebase() {
    if (typeof firebase === 'undefined') {
        console.error('Firebase SDK가 로드되지 않았습니다. index.html에서 Firebase SDK를 먼저 로드하세요.');
        return false;
    }

    if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('YOUR_DEV')) {
        console.warn(`[${APP_ENV}] Firebase 설정이 완료되지 않았습니다. config/firebase.${APP_ENV}.js 파일을 확인하세요.`);
        return false;
    }

    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            firebaseInitialized = true;
            console.log(`Firebase 초기화 성공 (${APP_ENV})`);
            return true;
        } else {
            firebaseInitialized = true;
            return true;
        }
    } catch (error) {
        console.error('Firebase 초기화 실패:', error);
        return false;
    }
}

// Firebase 인증 및 Firestore 가져오기
function getFirebaseServices() {
    if (!firebaseInitialized) {
        if (!initFirebase()) {
            return null;
        }
    }

    try {
        const auth = firebase.auth();
        const db = firebase.firestore();
        return { auth, db };
    } catch (error) {
        console.error('Firebase 서비스 가져오기 실패:', error);
        return null;
    }
}

// 페이지 로드 시 Firebase 초기화 시도
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        initFirebase();
    });
}
