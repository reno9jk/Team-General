// 환경 자동 판별
// - localhost / 127.0.0.1  → dev
// - URL에 '-dev' 포함      → dev  (예: username.github.io/team-generals-dev/)
// - 그 외                  → prod

const APP_ENV = (() => {
    const host = window.location.hostname;
    const path = window.location.pathname;

    if (host === 'localhost' || host === '127.0.0.1') {
        return 'dev';
    }

    if (host.includes('-dev') || path.includes('-dev')) {
        return 'dev';
    }

    return 'prod';
})();

const IS_DEV = APP_ENV === 'dev';
const IS_PROD = APP_ENV === 'prod';

if (typeof window !== 'undefined') {
    window.APP_ENV = APP_ENV;
    window.IS_DEV = IS_DEV;
    window.IS_PROD = IS_PROD;
}
