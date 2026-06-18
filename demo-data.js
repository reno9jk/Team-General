// ============================================================
//  데모 모드 더미 데이터
//  로그인하지 않은 사용자에게 시스템 구조/기능을 시연할 때 사용
// ============================================================

const DEMO_PROJECTS = [
    {
        id: 'demo-p1',
        name: 'AI 고객상담 자동화',
        description: '챗봇 기반 1차 상담 자동화 및 배포 운영',
        status: 'in-progress',
        deadline: '2026-09-30',
        year: 2026,
        weight: 9,
        createdAt: '2026-01-10'
    },
    {
        id: 'demo-p2',
        name: '데이터 파이프라인 고도화',
        description: 'ETL 파이프라인 재설계 및 실시간 처리 적용',
        status: 'in-progress',
        deadline: '2026-08-31',
        year: 2026,
        weight: 8,
        createdAt: '2026-02-01'
    },
    {
        id: 'demo-p3',
        name: '보안 취약점 점검 체계 구축',
        description: '정기 취약점 스캔 자동화 및 대응 프로세스 수립',
        status: 'completed',
        deadline: '2026-05-31',
        year: 2026,
        weight: 7,
        createdAt: '2026-01-15'
    },
    {
        id: 'demo-p4',
        name: '사내 업무포털 UI 개편',
        description: '사용자 경험 개선을 위한 화면 리뉴얼',
        status: 'planning',
        deadline: '2026-12-31',
        year: 2026,
        weight: 5,
        createdAt: '2026-03-01'
    },
    {
        id: 'demo-p5',
        name: '클라우드 인프라 마이그레이션',
        description: '온프레미스 서버를 클라우드 환경으로 전환',
        status: 'on-hold',
        deadline: '2026-11-30',
        year: 2026,
        weight: 6,
        createdAt: '2026-02-20'
    }
];

const DEMO_MEMBERS = [
    // AI 고객상담 자동화
    {
        id: 'demo-m1',
        projectId: 'demo-p1',
        name: '김지훈',
        role: 'PM',
        band: 'A',
        progress: 72,
        contribution: 9,
        collaboration: 8,
        leadership: 9,
        skill: 8,
        notes: '일정 관리 및 이해관계자 커뮤니케이션 주도',
        monthlyProgress: { '1': 10, '2': 18, '3': 25, '4': 38, '5': 52, '6': 72 }
    },
    {
        id: 'demo-m2',
        projectId: 'demo-p1',
        name: '이수연',
        role: '개발',
        band: 'A',
        progress: 68,
        contribution: 8,
        collaboration: 9,
        leadership: 7,
        skill: 9,
        notes: 'NLP 모델 파인튜닝 및 API 개발 담당',
        monthlyProgress: { '1': 8, '2': 15, '3': 28, '4': 42, '5': 55, '6': 68 }
    },
    {
        id: 'demo-m3',
        projectId: 'demo-p1',
        name: '박민준',
        role: '기획',
        band: 'B',
        progress: 80,
        contribution: 7,
        collaboration: 8,
        leadership: 6,
        skill: 7,
        notes: '시나리오 설계 및 QA 진행',
        monthlyProgress: { '1': 15, '2': 30, '3': 48, '4': 60, '5': 72, '6': 80 }
    },

    // 데이터 파이프라인 고도화
    {
        id: 'demo-m4',
        projectId: 'demo-p2',
        name: '최서윤',
        role: 'TL',
        band: 'A',
        progress: 55,
        contribution: 9,
        collaboration: 8,
        leadership: 8,
        skill: 9,
        notes: '아키텍처 설계 및 기술 검토 리드',
        monthlyProgress: { '1': 5, '2': 12, '3': 20, '4': 35, '5': 45, '6': 55 }
    },
    {
        id: 'demo-m5',
        projectId: 'demo-p2',
        name: '정우성',
        role: '개발',
        band: 'B',
        progress: 50,
        contribution: 6,
        collaboration: 7,
        leadership: 5,
        skill: 8,
        notes: 'Kafka 스트리밍 파이프라인 구현',
        monthlyProgress: { '1': 0, '2': 8, '3': 18, '4': 30, '5': 42, '6': 50 }
    },

    // 보안 취약점 점검 체계
    {
        id: 'demo-m6',
        projectId: 'demo-p3',
        name: '오하은',
        role: '보안',
        band: 'A',
        progress: 100,
        contribution: 10,
        collaboration: 9,
        leadership: 9,
        skill: 10,
        notes: '전체 취약점 스캔 체계 수립 및 완료',
        monthlyProgress: { '1': 20, '2': 40, '3': 60, '4': 80, '5': 100, '6': 100 }
    },
    {
        id: 'demo-m7',
        projectId: 'demo-p3',
        name: '한도현',
        role: '개발',
        band: 'B',
        progress: 100,
        contribution: 8,
        collaboration: 8,
        leadership: 6,
        skill: 8,
        notes: '자동화 스크립트 개발 완료',
        monthlyProgress: { '1': 15, '2': 35, '3': 55, '4': 75, '5': 100, '6': 100 }
    },

    // 사내 업무포털
    {
        id: 'demo-m8',
        projectId: 'demo-p4',
        name: '임예진',
        role: 'UI/UX',
        band: 'B',
        progress: 15,
        contribution: 5,
        collaboration: 7,
        leadership: 5,
        skill: 7,
        notes: '화면 설계서 작성 중',
        monthlyProgress: { '1': 0, '2': 0, '3': 5, '4': 10, '5': 12, '6': 15 }
    },

    // ── 복수 프로젝트 참여 예시 ──────────────────────────────────
    // 이수연 (3개 프로젝트): demo-p1 (이미 등록) + demo-p2 + demo-p5
    {
        id: 'demo-m9',
        projectId: 'demo-p2',
        name: '이수연',
        role: '개발',
        band: 'A',
        progress: 60,
        contribution: 8,
        collaboration: 8,
        leadership: 6,
        skill: 9,
        notes: '실시간 데이터 수집 모듈 API 설계 지원',
        monthlyProgress: { '1': 0, '2': 5, '3': 15, '4': 30, '5': 45, '6': 60 }
    },
    {
        id: 'demo-m10',
        projectId: 'demo-p5',
        name: '이수연',
        role: '개발',
        band: 'A',
        progress: 20,
        contribution: 6,
        collaboration: 7,
        leadership: 5,
        skill: 9,
        notes: '클라우드 전환 기술 검토 참여 (보류 단계)',
        monthlyProgress: { '1': 0, '2': 5, '3': 12, '4': 18, '5': 20, '6': 20 }
    },

    // 최서윤 (2개 프로젝트): demo-p2 (이미 등록) + demo-p4
    {
        id: 'demo-m11',
        projectId: 'demo-p4',
        name: '최서윤',
        role: 'TL',
        band: 'A',
        progress: 20,
        contribution: 8,
        collaboration: 9,
        leadership: 9,
        skill: 8,
        notes: '업무포털 기술 방향 수립 및 개발팀 리드',
        monthlyProgress: { '1': 0, '2': 0, '3': 5, '4': 12, '5': 16, '6': 20 }
    }
];

const DEMO_MILESTONES = [
    // AI 고객상담 자동화
    {
        id: 'demo-ms1',
        projectId: 'demo-p1',
        name: '챗봇 프로토타입 완성',
        description: '기본 대화 흐름 구현 및 내부 테스트',
        year: 2026,
        monthlyProgress: { '1': 20, '2': 50, '3': 100, '4': 100, '5': 100, '6': 100, '7': 100, '8': 100, '9': 100, '10': 100, '11': 100, '12': 100 }
    },
    {
        id: 'demo-ms2',
        projectId: 'demo-p1',
        name: '파일럿 서비스 오픈',
        description: '일부 채널 대상 파일럿 운영 시작',
        year: 2026,
        monthlyProgress: { '1': 0, '2': 10, '3': 30, '4': 60, '5': 90, '6': 100, '7': 100, '8': 100, '9': 100, '10': 100, '11': 100, '12': 100 }
    },
    {
        id: 'demo-ms3',
        projectId: 'demo-p1',
        name: '전체 채널 전환',
        description: '전 채널 챗봇 전환 완료',
        year: 2026,
        monthlyProgress: { '1': 0, '2': 0, '3': 0, '4': 5, '5': 15, '6': 35, '7': 55, '8': 75, '9': 100, '10': 100, '11': 100, '12': 100 }
    },

    // 데이터 파이프라인
    {
        id: 'demo-ms4',
        projectId: 'demo-p2',
        name: '아키텍처 설계 확정',
        description: '신규 파이프라인 아키텍처 리뷰 완료',
        year: 2026,
        monthlyProgress: { '1': 30, '2': 80, '3': 100, '4': 100, '5': 100, '6': 100, '7': 100, '8': 100, '9': 100, '10': 100, '11': 100, '12': 100 }
    },
    {
        id: 'demo-ms5',
        projectId: 'demo-p2',
        name: '스트리밍 처리 모듈 개발',
        description: 'Kafka 기반 실시간 처리 구현',
        year: 2026,
        monthlyProgress: { '1': 0, '2': 5, '3': 15, '4': 28, '5': 42, '6': 55, '7': 80, '8': 100, '9': 100, '10': 100, '11': 100, '12': 100 }
    },

    // 보안 취약점
    {
        id: 'demo-ms6',
        projectId: 'demo-p3',
        name: '1차 취약점 스캔 완료',
        description: '전체 시스템 대상 1차 점검',
        year: 2026,
        monthlyProgress: { '1': 40, '2': 100, '3': 100, '4': 100, '5': 100, '6': 100, '7': 100, '8': 100, '9': 100, '10': 100, '11': 100, '12': 100 }
    },
    {
        id: 'demo-ms7',
        projectId: 'demo-p3',
        name: '자동화 스크립트 배포',
        description: '정기 스캔 자동화 시스템 운영 시작',
        year: 2026,
        monthlyProgress: { '1': 0, '2': 20, '3': 50, '4': 80, '5': 100, '6': 100, '7': 100, '8': 100, '9': 100, '10': 100, '11': 100, '12': 100 }
    }
];
