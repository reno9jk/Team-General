// Firebase 기반 데이터 저장소
// 기존 DataStore와 동일한 API를 제공하여 App 클래스 변경을 최소화

class FirebaseDataStore {
    constructor() {
        this.projects = [];
        this.members = [];
        this.milestones = [];
        
        this.db = null;
        this.auth = null;
        this.userId = null;
        this.initialized = false;
        
        // Firebase 초기화 및 인증
        this.init();
    }

    async init() {
        // file:// 직접 열기 또는 Firebase SDK 미로드 시 즉시 데모 모드
        const isFileProtocol = window.location.protocol === 'file:';
        const isFirebaseMissing = typeof firebase === 'undefined' || typeof getFirebaseServices === 'undefined' || window.__firebaseLoadFailed;

        if (isFileProtocol || isFirebaseMissing) {
            console.warn('데모 모드 진입 (사유: ' + (isFileProtocol ? 'file:// 직접 열기' : 'Firebase SDK 미로드') + ')');
            this.enterDemoMode();
            return;
        }

        try {
            // Firebase 서비스 가져오기
            const services = getFirebaseServices();
            if (!services) {
                console.warn('Firebase를 사용할 수 없습니다. 데모 모드로 진입합니다.');
                this.enterDemoMode();
                return;
            }

            this.auth = services.auth;
            this.db = services.db;

            // 인증 상태 확인 및 로그인 처리
            this.auth.onAuthStateChanged(async (user) => {
                if (user) {
                    // 허용된 사용자인지 확인
                    if (typeof isAllowedUser !== 'undefined' && !isAllowedUser(user)) {
                        // 허용되지 않은 사용자 - 로그아웃
                        await this.auth.signOut();
                        this.showAccessDeniedMessage();
                        return;
                    }
                    
                    this.userId = user.uid;
                    this.isDemoMode = false;
                    this.hideDemoBanner();
                    this.showSidebarUser(user.email);
                    await this.loadAll();
                    // 데이터 변경 콜백이 있다면 호출
                    if (this.onDataChanged) {
                        this.onDataChanged();
                    }
                } else {
                    // 로그인되지 않은 경우 - 데모 모드로 진입
                    this.enterDemoMode();
                }
            });

            // 실시간 리스너 설정
            this.setupRealtimeListeners();

            this.initialized = true;
        } catch (error) {
            console.error('Firebase 초기화 실패:', error);
            this.initialized = false;
            // Firebase 연결 실패 시에도 데모 모드로 폴백
            this.enterDemoMode();
        }
    }

    enterDemoMode() {
        // 더미 데이터 로드
        this.isDemoMode = true;
        this.projects = typeof DEMO_PROJECTS !== 'undefined' ? JSON.parse(JSON.stringify(DEMO_PROJECTS)) : [];
        this.members = typeof DEMO_MEMBERS !== 'undefined' ? JSON.parse(JSON.stringify(DEMO_MEMBERS)) : [];
        this.milestones = typeof DEMO_MILESTONES !== 'undefined' ? JSON.parse(JSON.stringify(DEMO_MILESTONES)) : [];
        this.initialized = true;

        // 데모 배너 표시
        this.showDemoBanner();

        // 앱 렌더링 — onDataChanged는 App 생성자에서 할당되므로 한 틱 뒤에 호출
        setTimeout(() => {
            if (this.onDataChanged) {
                this.onDataChanged();
            }
        }, 0);
    }

    showDemoBanner() {
        if (document.getElementById('demoBanner')) return;
        const banner = document.createElement('div');
        banner.id = 'demoBanner';
        banner.className = 'demo-banner';
        const isFile = window.location.protocol === 'file:';
        const bannerMsg = isFile
            ? '데모 모드 — 파일을 직접 열었습니다. 실제 데이터를 사용하려면 로컬 서버 또는 배포 URL로 접속 후 로그인하세요.'
            : '데모 모드 — 샘플 데이터로 시연 중입니다. 실제 데이터는 로그인 후 확인하세요.';
        banner.innerHTML = `
            <span class="demo-banner-icon">📋</span>
            <span class="demo-banner-text">${bannerMsg}</span>
            ${!isFile ? `<button class="demo-banner-login-btn" onclick="app && app.store && app.store.showLoginModal()">로그인하기</button>` : ''}
        `;
        // body 하단에 삽입
        document.body.appendChild(banner);
    }

    hideDemoBanner() {
        const banner = document.getElementById('demoBanner');
        if (banner) banner.remove();
    }

    showSidebarUser(email) {
        const userEl = document.getElementById('sidebarUser');
        const emailEl = document.getElementById('sidebarUserEmail');
        const logoutBtn = document.getElementById('sidebarLogoutBtn');
        if (!userEl) return;

        if (emailEl) emailEl.textContent = email || '';
        userEl.style.display = 'flex';

        if (logoutBtn && !logoutBtn._bound) {
            logoutBtn._bound = true;
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async handleLogout() {
        if (!confirm('로그아웃 하시겠습니까?')) return;
        try {
            await this.auth.signOut();
            // 로그아웃 후 페이지 새로고침 (데모 모드로 복귀)
            window.location.reload();
        } catch (e) {
            console.error('로그아웃 실패:', e);
        }
    }

    // 데모 모드에서 저장/수정/삭제 차단
    _demoGuard() {
        if (this.isDemoMode) {
            this._showDemoNotice();
            return true;
        }
        return false;
    }

    _showDemoNotice() {
        let toast = document.getElementById('demoToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'demoToast';
            toast.className = 'demo-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = '🔒 데모 모드에서는 데이터를 저장할 수 없습니다. 로그인 후 이용해 주세요.';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    showLoginModal() {
        // 로그인 모달이 이미 있는지 확인
        let modal = document.getElementById('loginModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'loginModal';
            modal.className = 'modal active';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 400px;">
                    <div class="modal-header">
                        <h3>로그인 필요</h3>
                    </div>
                    <div class="modal-body">
                        <p style="margin-bottom: 20px; color: var(--text-secondary);">
                            이 서비스는 인증된 사용자만 사용할 수 있습니다.
                        </p>
                        <form id="loginForm" style="padding: 0;">
                            <div class="form-group">
                                <label for="loginEmail">이메일</label>
                                <input type="email" id="loginEmail" required placeholder="이메일 주소">
                            </div>
                            <div class="form-group">
                                <label for="loginPassword">비밀번호</label>
                                <input type="password" id="loginPassword" required placeholder="비밀번호">
                            </div>
                            <div id="loginError" style="color: var(--danger); margin-bottom: 16px; display: none;"></div>
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">로그인</button>
                            </div>
                        </form>
                        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border-color);">
                            <p style="font-size: 12px; color: var(--text-secondary); text-align: center;">
                                계정이 없으신가요?<br>
                                <a href="#" id="showRegister" style="color: var(--primary);">회원가입</a>
                            </p>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // 로그인 폼 제출
            document.getElementById('loginForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin();
            });

            // 회원가입 링크 클릭
            document.getElementById('showRegister').addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterModal();
            });
        } else {
            modal.classList.add('active');
        }
    }

    showRegisterModal() {
        // 로그인 모달 숨기기
        const loginModal = document.getElementById('loginModal');
        if (loginModal) loginModal.classList.remove('active');

        // 회원가입 모달이 이미 있는지 확인
        let modal = document.getElementById('registerModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'registerModal';
            modal.className = 'modal active';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 400px;">
                    <div class="modal-header">
                        <h3>회원가입</h3>
                        <button class="close-btn" onclick="document.getElementById('registerModal').classList.remove('active'); document.getElementById('loginModal').classList.add('active');">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <p style="margin-bottom: 20px; color: var(--text-secondary); font-size: 13px;">
                            ⚠️ 이 서비스는 특정 사용자만 사용할 수 있습니다.<br>
                            허용된 이메일 주소로만 가입할 수 있습니다.
                        </p>
                        <form id="registerForm" style="padding: 0;">
                            <div class="form-group">
                                <label for="registerEmail">이메일</label>
                                <input type="email" id="registerEmail" required placeholder="이메일 주소">
                            </div>
                            <div class="form-group">
                                <label for="registerPassword">비밀번호</label>
                                <input type="password" id="registerPassword" required placeholder="비밀번호 (최소 6자)">
                            </div>
                            <div id="registerError" style="color: var(--danger); margin-bottom: 16px; display: none;"></div>
                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary" onclick="document.getElementById('registerModal').classList.remove('active'); document.getElementById('loginModal').classList.add('active');">취소</button>
                                <button type="submit" class="btn btn-primary">회원가입</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // 회원가입 폼 제출
            document.getElementById('registerForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleRegister();
            });
        } else {
            modal.classList.add('active');
        }
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const errorDiv = document.getElementById('loginError');

        try {
            errorDiv.style.display = 'none';
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            
            // 허용된 사용자인지 다시 확인 (이중 체크)
            if (typeof isAllowedUser !== 'undefined' && !isAllowedUser(userCredential.user)) {
                await this.auth.signOut();
                errorDiv.textContent = '접근 권한이 없습니다. 허용된 사용자만 로그인할 수 있습니다.';
                errorDiv.style.display = 'block';
                return;
            }

            // 로그인 성공 - 모달 닫기
            document.getElementById('loginModal').classList.remove('active');
        } catch (error) {
            let errorMessage = '로그인에 실패했습니다.';
            if (error.code === 'auth/user-not-found') {
                errorMessage = '등록되지 않은 이메일입니다.';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = '비밀번호가 올바르지 않습니다.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = '올바른 이메일 주소를 입력하세요.';
            }
            errorDiv.textContent = errorMessage;
            errorDiv.style.display = 'block';
        }
    }

    async handleRegister() {
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const errorDiv = document.getElementById('registerError');

        try {
            errorDiv.style.display = 'none';

            // 허용된 이메일인지 확인
            if (typeof isAllowedUser === 'function') {
                const mockUser = { email };
                if (!isAllowedUser(mockUser)) {
                    errorDiv.textContent = '허용되지 않은 이메일 주소입니다.';
                    errorDiv.style.display = 'block';
                    return;
                }
            }

            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            
            // 회원가입 성공 - 모달 닫기
            document.getElementById('registerModal').classList.remove('active');
            document.getElementById('loginModal').classList.remove('active');
        } catch (error) {
            let errorMessage = '회원가입에 실패했습니다.';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = '이미 등록된 이메일입니다. 로그인해주세요.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = '비밀번호는 최소 6자 이상이어야 합니다.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = '올바른 이메일 주소를 입력하세요.';
            }
            errorDiv.textContent = errorMessage;
            errorDiv.style.display = 'block';
        }
    }

    showAccessDeniedMessage() {
        // 접근 거부 메시지 표시
        let modal = document.getElementById('accessDeniedModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'accessDeniedModal';
            modal.className = 'modal active';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 400px;">
                    <div class="modal-header">
                        <h3>접근 권한 없음</h3>
                    </div>
                    <div class="modal-body">
                        <div style="text-align: center; padding: 20px;">
                            <i class="fas fa-lock" style="font-size: 48px; color: var(--danger); margin-bottom: 16px;"></i>
                            <p style="margin-bottom: 20px; color: var(--text-secondary);">
                                이 서비스는 허용된 사용자만 사용할 수 있습니다.
                            </p>
                            <button class="btn btn-primary" onclick="this.closest('.modal').classList.remove('active'); window.location.reload();">
                                로그아웃
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } else {
            modal.classList.add('active');
        }
    }

    setupRealtimeListeners() {
        if (!this.db || !this.userId) return;

        // 프로젝트 실시간 리스너
        this.db.collection('users').doc(this.userId).collection('projects')
            .onSnapshot((snapshot) => {
                this.projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                if (this.onDataChanged) this.onDataChanged();
            });

        // 구성원 실시간 리스너
        this.db.collection('users').doc(this.userId).collection('members')
            .onSnapshot((snapshot) => {
                this.members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                if (this.onDataChanged) this.onDataChanged();
            });

        // 마일스톤 실시간 리스너
        this.db.collection('users').doc(this.userId).collection('milestones')
            .onSnapshot((snapshot) => {
                this.milestones = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                if (this.onDataChanged) this.onDataChanged();
            });
    }

    async loadAll() {
        if (!this.db || !this.userId) return;

        try {
            // 프로젝트 로드
            const projectsSnapshot = await this.db.collection('users').doc(this.userId).collection('projects').get();
            this.projects = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // 구성원 로드
            const membersSnapshot = await this.db.collection('users').doc(this.userId).collection('members').get();
            this.members = membersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // 마일스톤 로드
            const milestonesSnapshot = await this.db.collection('users').doc(this.userId).collection('milestones').get();
            this.milestones = milestonesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('데이터 로드 실패:', error);
        }
    }

    // 사용자 ID 경로 헬퍼
    getCollectionPath(collectionName) {
        if (!this.userId) {
            throw new Error('사용자가 로그인되지 않았습니다.');
        }
        return this.db.collection('users').doc(this.userId).collection(collectionName);
    }

    // 연도별 프로젝트 필터링 (기존과 동일)
    getProjectsByYear(year) {
        return this.projects.filter(project => {
            if (project.year) {
                return project.year === year;
            }
            if (project.deadline) {
                const deadlineYear = new Date(project.deadline).getFullYear();
                return deadlineYear === year;
            }
            if (project.createdAt) {
                const createdYear = new Date(project.createdAt).getFullYear();
                return createdYear === year;
            }
            return true;
        });
    }

    // 연도별 구성원 필터링 (기존과 동일)
    getMembersByYear(year) {
        const yearProjects = this.getProjectsByYear(year);
        const projectIds = yearProjects.map(p => p.id);
        return this.members.filter(member => projectIds.includes(member.projectId));
    }

    // 프로젝트 CRUD
    async addProject(project) {
        if (this._demoGuard()) return null;
        project.id = Date.now().toString();
        project.createdAt = new Date().toISOString();
        
        if (this.initialized && this.db && this.userId) {
            try {
                await this.getCollectionPath('projects').doc(project.id).set(project);
                this.projects.push(project);
                return project;
            } catch (error) {
                console.error('프로젝트 추가 실패:', error);
                throw error;
            }
        } else {
            // Firebase가 초기화되지 않은 경우 로컬에만 추가
            this.projects.push(project);
            return project;
        }
    }

    async updateProject(id, updates) {
        if (this._demoGuard()) return null;
        const index = this.projects.findIndex(p => p.id === id);
        if (index === -1) return null;

        const updatedProject = { ...this.projects[index], ...updates };
        
        if (this.initialized && this.db && this.userId) {
            try {
                await this.getCollectionPath('projects').doc(id).update(updates);
                this.projects[index] = updatedProject;
                return updatedProject;
            } catch (error) {
                console.error('프로젝트 업데이트 실패:', error);
                throw error;
            }
        } else {
            this.projects[index] = updatedProject;
            return updatedProject;
        }
    }

    async deleteProject(id) {
        if (this._demoGuard()) return;
        if (this.initialized && this.db && this.userId) {
            try {
                const batch = this.db.batch();
                
                // 프로젝트 삭제
                batch.delete(this.getCollectionPath('projects').doc(id));
                
                // 관련 구성원 삭제
                const membersToDelete = this.members.filter(m => m.projectId === id);
                membersToDelete.forEach(member => {
                    batch.delete(this.getCollectionPath('members').doc(member.id));
                });
                
                // 관련 마일스톤 삭제
                const milestonesToDelete = this.milestones.filter(m => m.projectId === id);
                milestonesToDelete.forEach(milestone => {
                    batch.delete(this.getCollectionPath('milestones').doc(milestone.id));
                });
                
                await batch.commit();
                
                this.projects = this.projects.filter(p => p.id !== id);
                this.members = this.members.filter(m => m.projectId !== id);
                this.milestones = this.milestones.filter(m => m.projectId !== id);
            } catch (error) {
                console.error('프로젝트 삭제 실패:', error);
                throw error;
            }
        } else {
            this.projects = this.projects.filter(p => p.id !== id);
            this.members = this.members.filter(m => m.projectId !== id);
            this.milestones = this.milestones.filter(m => m.projectId !== id);
        }
    }

    getProject(id) {
        return this.projects.find(p => p.id === id);
    }

    // 구성원 CRUD
    async addMember(member) {
        if (this._demoGuard()) return null;
        member.id = Date.now().toString();
        if (!member.band) {
            member.band = 'A';
        }
        
        if (this.initialized && this.db && this.userId) {
            try {
                await this.getCollectionPath('members').doc(member.id).set(member);
                this.members.push(member);
                return member;
            } catch (error) {
                console.error('구성원 추가 실패:', error);
                throw error;
            }
        } else {
            this.members.push(member);
            return member;
        }
    }

    async updateMember(id, updates) {
        if (this._demoGuard()) return null;
        const index = this.members.findIndex(m => m.id === id);
        if (index === -1) return null;

        const updatedMember = { ...this.members[index], ...updates };
        
        if (this.initialized && this.db && this.userId) {
            try {
                await this.getCollectionPath('members').doc(id).update(updates);
                this.members[index] = updatedMember;
                return updatedMember;
            } catch (error) {
                console.error('구성원 업데이트 실패:', error);
                throw error;
            }
        } else {
            this.members[index] = updatedMember;
            return updatedMember;
        }
    }

    async deleteMember(id) {
        if (this._demoGuard()) return;
        if (this.initialized && this.db && this.userId) {
            try {
                await this.getCollectionPath('members').doc(id).delete();
                this.members = this.members.filter(m => m.id !== id);
            } catch (error) {
                console.error('구성원 삭제 실패:', error);
                throw error;
            }
        } else {
            this.members = this.members.filter(m => m.id !== id);
        }
    }

    getMembersByProject(projectId) {
        return this.members.filter(m => m.projectId === projectId);
    }

    getMembersByBand(band) {
        if (band === 'all') return this.members;
        return this.members.filter(m => m.band === band);
    }

    getMembersByProjectAndBand(projectId, band) {
        let members = this.members.filter(m => m.projectId === projectId);
        if (band !== 'all') {
            members = members.filter(m => m.band === band);
        }
        return members;
    }

    getProjectProgress(projectId) {
        const members = this.getMembersByProject(projectId);
        if (members.length === 0) return 0;
        const total = members.reduce((sum, m) => sum + m.progress, 0);
        return Math.round(total / members.length);
    }

    // 밴드별 통계 (기존과 동일)
    getBandStats(band, year = null) {
        let members = this.getMembersByBand(band);
        
        if (year) {
            const yearProjects = this.getProjectsByYear(year);
            const projectIds = yearProjects.map(p => p.id);
            members = members.filter(m => projectIds.includes(m.projectId));
        }

        const count = members.length;
        
        if (count === 0) {
            return { count: 0, avgProgress: 0, avgContribution: 0 };
        }

        const avgProgress = Math.round(members.reduce((sum, m) => sum + m.progress, 0) / count);
        const avgContribution = (members.reduce((sum, m) => sum + m.contribution, 0) / count).toFixed(1);

        return { count, avgProgress, avgContribution };
    }

    // 통계 (기존과 동일)
    getStats(year = null) {
        const projects = year ? this.getProjectsByYear(year) : this.projects;
        const projectIds = projects.map(p => p.id);
        const members = year ? this.members.filter(m => projectIds.includes(m.projectId)) : this.members;

        const totalProjects = projects.length;
        const completedProjects = projects.filter(p => p.status === 'completed').length;
        const inProgressProjects = projects.filter(p => p.status === 'in-progress').length;
        const totalMembers = new Set(members.map(m => m.name)).size; // 이름 기준 중복 제거
        
        return { totalProjects, completedProjects, inProgressProjects, totalMembers };
    }

    getTopContributors(limit = 5, band = 'all', year = null) {
        let members = band === 'all' ? this.members : this.members.filter(m => m.band === band);
        
        if (year) {
            const yearProjects = this.getProjectsByYear(year);
            const projectIds = yearProjects.map(p => p.id);
            members = members.filter(m => projectIds.includes(m.projectId));
        }
        
        const memberScores = members.map(m => {
            const project = this.getProject(m.projectId);
            return {
                ...m,
                projectName: project ? project.name : '알 수 없음',
                score: m.contribution * (m.progress / 100)
            };
        });
        
        return memberScores
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    // 마일스톤 CRUD
    async addMilestone(milestone) {
        if (this._demoGuard()) return null;
        milestone.id = Date.now().toString();
        milestone.createdAt = new Date().toISOString();
        
        if (this.initialized && this.db && this.userId) {
            try {
                await this.getCollectionPath('milestones').doc(milestone.id).set(milestone);
                this.milestones.push(milestone);
                return milestone;
            } catch (error) {
                console.error('마일스톤 추가 실패:', error);
                throw error;
            }
        } else {
            this.milestones.push(milestone);
            return milestone;
        }
    }

    async updateMilestone(id, updates) {
        if (this._demoGuard()) return null;
        const index = this.milestones.findIndex(m => m.id === id);
        if (index === -1) return null;

        const updatedMilestone = { ...this.milestones[index], ...updates };
        
        if (this.initialized && this.db && this.userId) {
            try {
                await this.getCollectionPath('milestones').doc(id).update(updates);
                this.milestones[index] = updatedMilestone;
                return updatedMilestone;
            } catch (error) {
                console.error('마일스톤 업데이트 실패:', error);
                throw error;
            }
        } else {
            this.milestones[index] = updatedMilestone;
            return updatedMilestone;
        }
    }

    async deleteMilestone(id) {
        if (this._demoGuard()) return;
        if (this.initialized && this.db && this.userId) {
            try {
                await this.getCollectionPath('milestones').doc(id).delete();
                this.milestones = this.milestones.filter(m => m.id !== id);
            } catch (error) {
                console.error('마일스톤 삭제 실패:', error);
                throw error;
            }
        } else {
            this.milestones = this.milestones.filter(m => m.id !== id);
        }
    }

    getMilestonesByProject(projectId) {
        return this.milestones.filter(m => m.projectId === projectId);
    }

    getMilestone(id) {
        return this.milestones.find(m => m.id === id);
    }

    getMilestoneCurrentProgress(milestone) {
        const currentMonth = new Date().getMonth() + 1;
        return milestone.monthlyProgress[currentMonth] || 0;
    }

    getMilestoneAverageProgress(milestone) {
        const values = Object.values(milestone.monthlyProgress).filter(v => v > 0);
        if (values.length === 0) return 0;
        return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    }

    getProjectMilestoneProgress(projectId) {
        const milestones = this.getMilestonesByProject(projectId);
        if (milestones.length === 0) return null;
        
        const currentMonth = new Date().getMonth() + 1;
        const total = milestones.reduce((sum, m) => {
            return sum + (m.monthlyProgress[currentMonth] || 0);
        }, 0);
        
        return Math.round(total / milestones.length);
    }

    getDaysRemaining(deadline) {
        if (!deadline) return null;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deadlineDate = new Date(deadline);
        deadlineDate.setHours(0, 0, 0, 0);
        
        const diffTime = deadlineDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
    }

    // 종합평가 (기존과 동일 - 로직 변경 없음)
    // 종합평가 - 구성원별 전체 프로젝트 성과 집계 (프로젝트별 합산, 연도별 필터링)
    getComprehensiveEvaluation(band = 'all', year = null) {
        let membersToEvaluate = year ? this.getMembersByYear(year) : this.members;

        const memberMap = new Map();

        membersToEvaluate.forEach(member => {
            const project = this.getProject(member.projectId);
            const projectName = project ? project.name : '알 수 없음';
            const projectWeight = project ? (project.weight || 5) : 5;

            if (!memberMap.has(member.name)) {
                memberMap.set(member.name, {
                    name: member.name,
                    band: member.band,
                    projects: [],
                    roles: [],
                    projectBreakdown: [],
                    weightedProgressSum: 0,
                    weightedContributionSum: 0,
                    weightedCollaborationSum: 0,
                    weightedLeadershipSum: 0,
                    weightedSkillSum: 0,
                    totalWeight: 0,
                    totalScore: 0
                });
            }

            const data = memberMap.get(member.name);
            if (!data.projects.includes(projectName)) data.projects.push(projectName);
            if (member.role && !data.roles.includes(member.role)) data.roles.push(member.role);

            const progress      = member.progress     || 0;
            const contribution  = member.contribution  || 0;
            const collaboration = member.collaboration || 5;
            const leadership    = member.leadership    || 5;
            const skill         = member.skill         || 5;
            const evalScore     = project ? (project.evalScore !== undefined ? project.evalScore : 100) : 100;

            const projectScore = parseFloat((
                (progress * 0.25) +
                (contribution * 2) +
                (collaboration * 1.5) +
                (leadership * 1.5) +
                (skill * 2)
            ).toFixed(1));

            // 1차 결과: 가중치 반영
            const weightedScore = parseFloat((projectScore * projectWeight / 10).toFixed(1));

            // 최종 결과: 프로젝트 최종 평가(%) 적용
            const finalScore = parseFloat((weightedScore * evalScore / 100).toFixed(1));

            data.projectBreakdown.push({ projectName, projectWeight, evalScore, progress, contribution, collaboration, leadership, skill, projectScore, weightedScore, finalScore });

            data.weightedProgressSum      += progress      * projectWeight;
            data.weightedContributionSum  += contribution  * projectWeight;
            data.weightedCollaborationSum += collaboration * projectWeight;
            data.weightedLeadershipSum    += leadership    * projectWeight;
            data.weightedSkillSum         += skill         * projectWeight;
            data.totalWeight              += projectWeight;
            data.totalScore               += finalScore;
        });

        let results = Array.from(memberMap.values()).map(data => {
            const w = data.totalWeight;
            return {
                name: data.name,
                band: data.band,
                projects: data.projects,
                roles: data.roles,
                projectBreakdown: data.projectBreakdown,
                avgProgress:      w > 0 ? Math.round(data.weightedProgressSum / w) : 0,
                avgContribution:  w > 0 ? parseFloat((data.weightedContributionSum / w).toFixed(1)) : 0,
                avgCollaboration: w > 0 ? parseFloat((data.weightedCollaborationSum / w).toFixed(1)) : 0,
                avgLeadership:    w > 0 ? parseFloat((data.weightedLeadershipSum / w).toFixed(1)) : 0,
                avgSkill:         w > 0 ? parseFloat((data.weightedSkillSum / w).toFixed(1)) : 0,
                totalScore:       parseFloat(data.totalScore.toFixed(1))
            };
        });

        if (band !== 'all') results = results.filter(r => r.band === band);
        results.sort((a, b) => b.totalScore - a.totalScore);
        results.forEach((r, i) => { r.rank = i + 1; });

        return results;
    }

    getEvaluationStats(year = null) {
        const members = year ? this.getMembersByYear(year) : this.members;
        const projects = year ? this.getProjectsByYear(year) : this.projects;
        const uniqueMembers = new Set(members.map(m => m.name));
        const evaluation = this.getComprehensiveEvaluation('all', year);
        const avgScore = evaluation.length > 0 
            ? (evaluation.reduce((sum, e) => sum + e.totalScore, 0) / evaluation.length).toFixed(1)
            : 0;

        return {
            totalMembers: uniqueMembers.size,
            totalProjects: projects.length,
            avgScore: avgScore
        };
    }

    // LocalStorage에서 데이터 마이그레이션
    async migrateFromLocalStorage() {
        if (!this.initialized || !this.db || !this.userId) {
            console.warn('Firebase가 초기화되지 않아 마이그레이션을 수행할 수 없습니다.');
            return false;
        }

        try {
            const batch = this.db.batch();
            let hasData = false;

            // 프로젝트 마이그레이션
            const localProjects = JSON.parse(localStorage.getItem('projects') || '[]');
            if (localProjects.length > 0) {
                hasData = true;
                for (const project of localProjects) {
                    const docRef = this.getCollectionPath('projects').doc(project.id);
                    batch.set(docRef, project);
                }
            }

            // 구성원 마이그레이션
            const localMembers = JSON.parse(localStorage.getItem('members') || '[]');
            if (localMembers.length > 0) {
                hasData = true;
                for (const member of localMembers) {
                    const docRef = this.getCollectionPath('members').doc(member.id);
                    batch.set(docRef, member);
                }
            }

            // 마일스톤 마이그레이션
            const localMilestones = JSON.parse(localStorage.getItem('milestones') || '[]');
            if (localMilestones.length > 0) {
                hasData = true;
                for (const milestone of localMilestones) {
                    const docRef = this.getCollectionPath('milestones').doc(milestone.id);
                    batch.set(docRef, milestone);
                }
            }

            if (hasData) {
                await batch.commit();
                console.log('LocalStorage 데이터가 Firebase로 마이그레이션되었습니다.');
                // 마이그레이션 후 데이터 다시 로드
                await this.loadAll();
                return true;
            } else {
                console.log('마이그레이션할 LocalStorage 데이터가 없습니다.');
                return false;
            }
        } catch (error) {
            console.error('마이그레이션 실패:', error);
            return false;
        }
    }
}

