// 인증 설정 (환경별 자동 선택)
// env.js, config/auth.dev.js, config/auth.prod.js 가 먼저 로드되어야 합니다.

const AUTH_CONFIG = IS_DEV ? AUTH_CONFIG_DEV : AUTH_CONFIG_PROD;

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isAllowedUser(user) {
    if (!user) return false;

    if (AUTH_CONFIG.allowedEmails && user.email) {
        const email = user.email.toLowerCase();
        return AUTH_CONFIG.allowedEmails.some(
            (allowed) => allowed.toLowerCase() === email
        );
    }

    if (AUTH_CONFIG.allowedEmail && user.email) {
        return user.email.toLowerCase() === AUTH_CONFIG.allowedEmail.toLowerCase();
    }

    if (AUTH_CONFIG.allowedUserId) {
        return user.uid === AUTH_CONFIG.allowedUserId;
    }

    return false;
}
