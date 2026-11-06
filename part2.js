// ================= زعيم القنبلة الموقوتة (المستوى 2) =================
let bombTimer = null;
let bombTimeLeft = 30;
let wiresCut = 0;

function startBombBoss() {
    showTopToast(`زعيم المستوى ${currentLevelPlaying}: تفكيك القنبلة 💣`, 'error');
    wiresCut = 0;
    bombTimeLeft = 30;
    currentBossQIndex = 0;
    updateBombUI();
    navigateTo('view-boss-bomb', `زعيم المستوى ${currentLevelPlaying}`, 'فكك القنبلة قبل الانفجار');
    renderBombQuestion();
    resumeBombTimer();
}

function updateBombUI() {
    const timerDisplay = document.getElementById('bomb-timer-display');
    const wiresDisplay = document.getElementById('bomb-wires-cut');
    if (timerDisplay) {
        timerDisplay.innerText = `00:${String(Math.max(0, bombTimeLeft)).padStart(2, '0')}`;
    }
    if (wiresDisplay) {
        wiresDisplay.innerText = `الأسلاك المقطوعة: ${wiresCut} / 3 ✂️`;
    }
}

function renderBombQuestion() {
    if (currentBossQIndex >= bossQuestionsDeck.length) { concludeLevelBoss(false); return; }
    const qData = bossQuestionsDeck[currentBossQIndex];
    const qTextEl = document.getElementById('bomb-q-text');
    if (qTextEl) qTextEl.innerText = qData.q;
    
    const optsBox = document.getElementById('bomb-options-list');
    if (!optsBox) return;
    optsBox.innerHTML = '';
    
    let options = shuffleArray([...qData.a]);
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option-btn';
        btn.innerText = opt;
        btn.onclick = () => {
            if (opt === qData.a[qData.correct]) {
                playSuccessSound();
                wiresCut++;
                if (wiresCut >= 3) {
                    clearInterval(bombTimer);
                    concludeLevelBoss(true);
                } else {
                    currentBossQIndex++;
                    renderBombQuestion();
                }
            } else {
                playErrorSound();
                bombTimeLeft -= 5;
                showTopToast('-5 ثواني! أسرع!', 'error');
                currentBossQIndex++;
                renderBombQuestion();
            }
        };
        optsBox.appendChild(btn);
    });
}

// 7. منطق زعيم صراع الوحش
let playerHearts = 3;
let monsterHp = 100;

function startMonsterBoss() {
    showTopToast(`زعيم المستوى ${currentLevelPlaying}: صراع الوحش 🐉`, 'info');
    playerHearts = 3;
    monsterHp = 100;
    updateMonsterUI();
    navigateTo('view-boss-monster', 'الوحش المجهول', 'هاجم قبل أن يقضي عليك');
    renderMonsterQuestion();
}

function updateMonsterUI() {
    const heartsEl = document.getElementById('player-hearts');
    const hpBarEl = document.getElementById('monster-hp-bar');
    if (heartsEl) heartsEl.innerText = '❤️'.repeat(playerHearts) + '🖤'.repeat(3 - playerHearts);
    if (hpBarEl) hpBarEl.style.width = `${monsterHp}%`;
}

function renderMonsterQuestion() {
    if (currentBossQIndex >= bossQuestionsDeck.length) { concludeLevelBoss(false); return; }
    const qData = bossQuestionsDeck[currentBossQIndex];
    const qTextEl = document.getElementById('monster-q-text');
    if (qTextEl) qTextEl.innerText = qData.q;
    
    const optsBox = document.getElementById('monster-options-list');
    if (!optsBox) return;
    optsBox.innerHTML = '';
    
    let options = shuffleArray([...qData.a]);
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option-btn';
        btn.innerText = opt;
        btn.onclick = () => {
            if (opt === qData.a[qData.correct]) {
                playSuccessSound();
                monsterHp -= 34;
                updateMonsterUI();
                if (monsterHp <= 0) {
                    concludeLevelBoss(true);
                } else {
                    currentBossQIndex++;
                    renderMonsterQuestion();
                }
            } else {
                playErrorSound();
                playerHearts--;
                updateMonsterUI();
                if (playerHearts <= 0) {
                    concludeLevelBoss(false);
                } else {
                    currentBossQIndex++;
                    renderMonsterQuestion();
                }
            }
        };
        optsBox.appendChild(btn);
    });
}

function openCooldownModal(levelNum, cooldownTime) {
    playErrorSound();
    pendingLevelStart = levelNum;
    openModal('modal-boss-cooldown');
    
    if (cooldownTickerInterval) clearInterval(cooldownTickerInterval);
    
    cooldownTickerInterval = setInterval(() => {
        let diff = cooldownTime - Date.now();
        if (diff <= 0) {
            clearInterval(cooldownTickerInterval);
            document.getElementById('cooldown-timer-display').innerText = "00:00:00";
            let userLevels = currentUser.levels_progress || {};
            if(userLevels[levelNum]) {
                userLevels[levelNum].cooldown = 0;
                db.ref('users/' + currentUser.phone + '/levels_progress').set(userLevels);
            }
            closeModal('modal-boss-cooldown');
            openLevelsMap();
        } else {
            let h = Math.floor(diff / (1000 * 60 * 60));
            let m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            let s = Math.floor((diff % (1000 * 60)) / 1000);
            document.getElementById('cooldown-timer-display').innerText = 
                `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }
    }, 1000);
}

function payToSkipCooldown() {
    playClickSound();
    const cost = globalBossConfig.skipCost || 50;

    if ((currentUser.coins || 0) < cost) {
        showTopToast(`رصيدك من العملات غير كافٍ! تحتاج إلى ${cost} عملة للدفع.`, 'error');
        return;
    }
    
    db.ref('users/' + currentUser.phone).transaction(user => {
        if(user) {
            user.coins = (user.coins || 0) - cost;
            if(user.levels_progress && user.levels_progress[pendingLevelStart]) {
                user.levels_progress[pendingLevelStart].cooldown = 0;
            }
        }
        return user;
    }).then(() => {
        currentUser.coins -= cost;
        if(currentUser.levels_progress[pendingLevelStart]) currentUser.levels_progress[pendingLevelStart].cooldown = 0;
        
        updateProfileUI();
        clearInterval(cooldownTickerInterval);
        closeModal('modal-boss-cooldown');
        showTopToast(`تم الدفع (${cost} عملة) وإلغاء وقت الراحة بنجاح! 💸`, 'success');
        
        // 👈 الدخول لمواجهة الزعيم مباشرة بدلاً من شاشة البداية
        startDynamicBossDirectly();
    });
}

// ================= دوال إيقاف واستئناف الوقت للتحديات =================
function pauseAllActiveTimers() {
    if (typeof timerInterval !== 'undefined') clearInterval(timerInterval);
    if (typeof penaltyTimer !== 'undefined') clearInterval(penaltyTimer);
    if (typeof bombTimer !== 'undefined') clearInterval(bombTimer);
    if (typeof stopStadiumCrowdAudio === 'function') stopStadiumCrowdAudio();
}

function resumeQuizTimer() {
    const timerEl = document.getElementById('quiz-timer'); 
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--; 
        if(timerEl) {
            timerEl.innerHTML = `⏱️ ${timeLeft}`; 
            if (timeLeft <= 5) timerEl.style.color = '#ef4444';
        }
        if (timeLeft <= 0) { 
            clearInterval(timerInterval); 
            handleQuizAnswer(null, false, true); 
        }
    }, 1000);
}

function resumeLevelTimer() {
    const timerEl = document.getElementById('quiz-timer'); 
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--; 
        if(timerEl) {
            timerEl.innerHTML = `⏱️ ${timeLeft}`; 
            if (timeLeft <= 5) timerEl.style.color = '#ef4444';
        }
        if (timeLeft <= 0) { 
            clearInterval(timerInterval); 
            handleLevelAnswer(null, '', 'TIMEOUT'); 
        }
    }, 1000);
}

function resumePenaltyTimer() {
    const timerPill = document.getElementById('penalty-timer-pill');
    clearInterval(penaltyTimer);
    penaltyTimer = setInterval(() => {
        penaltyTimeLeft--;
        if (timerPill) timerPill.innerText = `⏱️ ${penaltyTimeLeft}ث`;
        if (penaltyTimeLeft <= 0) {
            clearInterval(penaltyTimer);
            handlePenaltyAnswerClick(null, '', 'TIMEOUT');
        }
    }, 1000);
}

function resumeBombTimer() {
    clearInterval(bombTimer);
    bombTimer = setInterval(() => {
        bombTimeLeft--;
        updateBombUI();
        if (bombTimeLeft <= 0) {
            clearInterval(bombTimer);
            concludeLevelBoss(false);
        }
    }, 1000);
}

// =========================================================
// التحديث النهائي والأخير لتنظيف وحل مشاكل المستويات والزعماء
// =========================================================

function startPenaltyBoss() {
    isPenaltyGameActive = false; // تصفير الحالة لمنع الاستئناف الخاطئ
    showTopToast(`زعيم المستوى ${currentLevelPlaying}: ركلات الجزاء ⚽🔥`, 'info');
    navigateTo('view-penalty-select', `زعيم المستوى ${currentLevelPlaying}`, 'اختر نجمك للتسديد');
}

function launchPenaltyMode(strikerId, strikerName, strikerImg) {
    playClickSound();

    selectedPenaltyStriker = { id: strikerId, name: strikerName, img: strikerImg };
    isPenaltyGameActive = true; 
    penaltyCorrectAnswersCount = 0;
    
    // سحب أسئلة الزعيم الحقيقية المحملة مسبقاً
    penaltyQuestionsDeck = [...bossQuestionsDeck]; 
    currentPenaltyQIndex = 0;

    const strikerImgEl = document.getElementById('penalty-striker-img');
    const strikerNameEl = document.getElementById('penalty-striker-name');
    if (strikerImgEl) strikerImgEl.src = strikerImg;
    if (strikerNameEl) strikerNameEl.innerText = strikerName;

    resetPenaltyStadiumActors(); 
    startStadiumCrowdAudio();
    
    navigateTo('view-penalty-arena', `زعيم المستوى ${currentLevelPlaying}`, `تسديدة ${strikerName}`);
    renderPenaltyQuestion(); 
}

// =========================================================
// التحديث الجذري والأخير لزعيم ركلات الجزاء ورفع الأسئلة
// =========================================================

// 1. إصلاح دالة رفع الأسئلة لتقرأ التصنيف بشكل صحيح وترفع 5 أسئلة
function uploadAdminLevelQuestions() {
    playClickSound();
    const levelNum = parseInt(document.getElementById('adm-upload-lvl-num').value);
    const type = document.getElementById('adm-upload-lvl-type').value; 
    const rawText = document.getElementById('adm-lvl-bulk-input').value.trim();

    if (!levelNum || levelNum < 1 || levelNum > 50 || !rawText) {
        showTopToast('يرجى تحديد رقم المستوى ولصق الأسئلة!', 'error'); return;
    }

    const lines = rawText.split('\n');
    let formattedQuestions = [];

    lines.forEach(line => {
        if (line.trim() === '') return; // تجاهل السطور الفاضية
        
        const parts = line.split('#').map(p => p.trim());
        
        // نتأكد إن السطر فيه 6 أجزاء: تصنيف + سؤال + إجابة صح + 3 غلط
        if (parts.length >= 6) {
            const [cat, qText, correct, opt1, opt2, opt3] = parts;
            formattedQuestions.push({ 
                q: qText, 
                a: [correct, opt1, opt2, opt3], 
                correct: 0, 
                categoryName: cat // 👈 حفظ التصنيف الفعلي هنا
            });
        }
    });

    if (formattedQuestions.length === 0) { 
        showTopToast('صيغة خاطئة! استخدم: التصنيف # السؤال # الصح # خطأ # خطأ # خطأ', 'error'); 
        return; 
    }

    db.ref(`levels_data/level_${levelNum}/${type}`).set(formattedQuestions).then(() => {
        document.getElementById('adm-lvl-bulk-input').value = '';
        showTopToast(`تم رفع (${formattedQuestions.length}) أسئلة بنجاح لـ ${type === 'classic' ? 'المستوى' : 'الزعيم'} ${levelNum} 🚀`, 'success');
    });
}

// 2. إصلاح استدعاء الزعيم ليعوض النقص لو السحابة فيها أقل من 5 أسئلة
// 3. عرض السؤال والتصنيف بدقة وتشغيل الـ 5 أسئلة
function renderPenaltyQuestion() {
    isPenaltyAnswerLocked = false;
    
    if (!penaltyQuestionsDeck || penaltyQuestionsDeck.length === 0) {
        triggerPenaltyShootoutCinematic();
        return;
    }

    const qData = penaltyQuestionsDeck[currentPenaltyQIndex];
    if (!qData || currentPenaltyQIndex >= 5) {
        triggerPenaltyShootoutCinematic();
        return;
    }

    const questionText = qData.q || "سؤال زعيم ركلات الجزاء";
    const catText = qData.categoryName || "عام";
    const optionsArray = qData.a || ["خيار 1", "خيار 2", "خيار 3", "خيار 4"];
    const correctIdx = qData.correct !== undefined ? qData.correct : 0;
    const correctText = optionsArray[correctIdx];

    // إظهار رقم السؤال + التصنيف (الكاتيجوري) مع بعض فوق
    document.getElementById('penalty-q-counter').innerHTML = `السؤال ${currentPenaltyQIndex + 1} من 5 | <span style="color:#00f0ff;">${catText}</span>`;
    document.getElementById('penalty-q-text').innerText = questionText;

    const optionsBox = document.getElementById('penalty-options-box');
    optionsBox.innerHTML = '';

    let shuffledOptions = shuffleArray([...optionsArray]);

    shuffledOptions.forEach(optText => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option-btn';
        btn.style.padding = '10px 14px';
        btn.style.margin = '2px 0';
        btn.style.fontSize = '0.85rem';
        btn.innerText = optText;
        btn.onclick = () => handlePenaltyAnswerClick(btn, optText, correctText);
        optionsBox.appendChild(btn);
    });

    startPenaltyQuestionTimer();
}

// =========================================================
// التحديث النهائي: خريطة سريعة + كاش الأسئلة + رسوم التحسين + توجيه الزعماء الذكي
// =========================================================

function openLevelsMap() {
    playClickSound();
    if (!currentUser) { showTopToast('يرجى تسجيل الدخول أولاً!', 'error'); return; }
    navigateTo('view-levels-map', 'تحدي المعلومات', 'خريطة المستويات');
    renderLevelsGridUI();
}

function startLevelNode(levelNum, state) {
    playClickSound();
    
    let userLevels = (currentUser && currentUser.levels_progress) ? currentUser.levels_progress : {};
    let lvlData = userLevels[levelNum] || {};
    
    if (lvlData.cooldown && lvlData.cooldown > Date.now()) {
        openCooldownModal(levelNum, lvlData.cooldown);
        return;
    }

    if(state === 'locked') {
        const requiredStars = getLevelReqStars(levelNum);
        showTopToast(`المستوى مغلق! تحتاج ${requiredStars} نجمة تراكمية وهزيمة زعيم المستوى السابق 🔒`, 'error');
        return;
    }
    
    pendingLevelStart = levelNum;
    let rewards = getLevelRewards(levelNum);
    
    document.getElementById('level-intro-title').innerText = `المستوى ${levelNum}`;
    document.getElementById('level-intro-rewards').innerText = `المكافأة الكبرى: ${rewards.xp} نقاط | ${rewards.coins} عملة `;

    let totalGlobalStars = 0;
    for(let k in userLevels) { totalGlobalStars += (userLevels[k].stars || 0); }
    
    let reqStarsForNext = getLevelReqStars(levelNum + 1);
    let btnDirectBoss = document.getElementById('btn-direct-boss');
    let btnStartQuiz = document.getElementById('btn-start-level-quiz');
    let bossWarning = document.getElementById('level-boss-warning'); 
    let hasPlayedCurrentLevel = (lvlData.stars !== undefined);

    // فحص الجلسة المعلقة (سواء في الذاكرة أو بعد التحديث من الكاش)
    const savedSession = getActiveQuizSession();
    const hasPausedSession = (savedSession && savedSession.level === levelNum && savedSession.currentIndex < 10) ||
                             (isClassicQuizActive && !isLevelBossActive && currentLevelPlaying === levelNum && currentQuizIndex < 10);

    if (lvlData.boss_defeated) {
        if(bossWarning) bossWarning.style.display = 'none'; 
        if(btnDirectBoss) btnDirectBoss.style.display = 'none';
        if(btnStartQuiz) {
            btnStartQuiz.style.background = hasPausedSession ? 'linear-gradient(135deg, #00c853 0%, #007e33 100%)' : 'rgba(255, 255, 255, 0.05)';
            btnStartQuiz.style.border = hasPausedSession ? 'none' : '1px solid rgba(255, 255, 255, 0.2)';
            btnStartQuiz.style.color = hasPausedSession ? '#fff' : 'var(--text-main)';
            btnStartQuiz.innerText = hasPausedSession ? 'استئناف التحدي ⏯️' : 'تحسين النجوم (-15 عملة) 🔄';
        }
    } else if (totalGlobalStars >= reqStarsForNext && !lvlData.boss_defeated && hasPlayedCurrentLevel) {
        if(bossWarning) bossWarning.style.display = 'block'; 
        if(btnDirectBoss) btnDirectBoss.style.display = 'block';
        if(btnStartQuiz) {
            btnStartQuiz.style.background = hasPausedSession ? 'linear-gradient(135deg, #00c853 0%, #007e33 100%)' : 'rgba(255, 255, 255, 0.05)';
            btnStartQuiz.style.border = hasPausedSession ? 'none' : '1px solid rgba(255, 255, 255, 0.2)';
            btnStartQuiz.style.color = hasPausedSession ? '#fff' : 'var(--text-main)';
            btnStartQuiz.innerText = hasPausedSession ? 'استئناف التحدي ⏯️' : 'تحسين النجوم (-15 عملة) 🔄';
        }
    } else {
        if(bossWarning) bossWarning.style.display = 'block'; 
        if(btnDirectBoss) btnDirectBoss.style.display = 'none';
        if(btnStartQuiz) {
            btnStartQuiz.style.background = hasPausedSession ? 'linear-gradient(135deg, #00c853 0%, #007e33 100%)' : 'linear-gradient(135deg, var(--accent-gold) 0%, #b38600 100%)';
            btnStartQuiz.style.border = 'none';
            btnStartQuiz.style.color = hasPausedSession ? '#fff' : '#000';
            btnStartQuiz.innerText = hasPausedSession ? 'استئناف التحدي ⏯️' : (hasPlayedCurrentLevel ? 'تحسين النجوم (-15 عملة) 🔄' : 'بدء التحدي 🚀');
        }
    }
    openModal('modal-level-intro');
}

async function confirmStartLevel() {
    closeModal('modal-level-intro');
    
    const savedSession = getActiveQuizSession();

    // 1. التحقق من الاستئناف من الذاكرة الحية (داخل التطبيق)
    if (isClassicQuizActive && !isLevelBossActive && currentLevelPlaying === pendingLevelStart && activeQuizQuestions && activeQuizQuestions.length > 0 && currentQuizIndex < 10) {
        showTopToast(`جاري استكمال مستوى ${currentLevelPlaying} 🚀`, 'success');
        navigateTo('view-quiz-game', `مستوى ${currentLevelPlaying}`, 'تحدي المعلومات');
        if (!isAnswerLocked && typeof resumeLevelTimer === 'function') resumeLevelTimer();
        return;
    }

    // 2. الاستئناف بعد الـ Refresh أو الخروج وإعادة الفتح
    if (savedSession && savedSession.level === pendingLevelStart && savedSession.questions && savedSession.currentIndex < 10) {
        showTopToast(`جاري استئناف محاولتك في مستوى ${savedSession.level} ⏯️`, 'success');
        currentLevelPlaying = savedSession.level;
        activeQuizQuestions = savedSession.questions;
        currentQuizIndex = savedSession.currentIndex;
        quizScoreCount = savedSession.score || 0;
        currentLevelStarsEarned = savedSession.starsEarned || 0;
        isClassicQuizActive = true;
        isLevelBossActive = false;
        
        navigateTo('view-quiz-game', `مستوى ${currentLevelPlaying}`, 'تحدي المعلومات');
        renderLevelQuestion();
        return;
    }

    // إذا كانت جلسة جديدة، يتم مسح أي جلسة معلقة قديمة
    clearActiveQuizSession();

    // التحقق من رسوم التحسين (خصم 15 عملة) للبدء الجديد فقط
    let userLevels = (currentUser && currentUser.levels_progress) ? currentUser.levels_progress : {};
    let hasPlayedCurrentLevel = (userLevels[pendingLevelStart] && userLevels[pendingLevelStart].stars !== undefined);
    
    if (hasPlayedCurrentLevel) {
        if ((currentUser.coins || 0) < 15) {
            showTopToast('رصيدك غير كافٍ للتحسين! تحتاج 15 عملة 💸', 'error');
            return;
        }
        await db.ref('users/' + currentUser.phone + '/coins').transaction(c => (c || 0) - 15);
        currentUser.coins -= 15;
        if(typeof updateProfileUI === 'function') updateProfileUI();
        if(typeof updateHeaderCoinsDisplay === 'function') updateHeaderCoinsDisplay();
    }

    currentLevelPlaying = pendingLevelStart;
    currentLevelStarsEarned = 0;
    
    // نظام الكاش للأسئلة
    const cacheKey = `cached_level_${currentLevelPlaying}_classic`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
        startClassicQuizWithQuestions(JSON.parse(cachedData));
    } else {
        showTopToast('جاري تحميل أسئلة المستوى... ⏳', 'info');
        db.ref(`levels_data/level_${currentLevelPlaying}/classic`).once('value').then(snap => {
            if (!snap.exists()) {
                showTopToast('لم يتم رفع أسئلة لهذا المستوى بعد!', 'error');
                return;
            }
            let questions = [];
            snap.forEach(child => {
                let val = child.val();
                if (Array.isArray(val)) val.forEach(q => { if (q && q.q) questions.push(q); });
                else if (val && val.q) questions.push(val);
            });
            
            if (questions.length < 10) {
                showTopToast(`عذراً، الأسئلة المرفوعة ${questions.length} فقط (مطلوب 10)!`, 'error');
                return;
            }
            localStorage.setItem(cacheKey, JSON.stringify(questions));
            startClassicQuizWithQuestions(questions);
        }).catch(e => {
            showTopToast('حدث خطأ بالشبكة أثناء جلب الأسئلة.', 'error');
        });
    }
}

function startClassicQuizWithQuestions(questions) {
    activeQuizQuestions = shuffleArray(questions).slice(0, 10);
    currentQuizIndex = 0;
    quizScoreCount = 0;
    isClassicQuizActive = true;
    navigateTo('view-quiz-game', `مستوى ${currentLevelPlaying}`, 'تحدي المعلومات');
    renderLevelQuestion();
}

function triggerCorrectBossMode() {
    isLevelBossActive = true;
    currentBossQIndex = 0;

    // التوزيع الدقيق حسب رقم المستوى
    const remainder = currentLevelPlaying % 3;

    if (remainder === 1) {
        activeBossType = 'penalty';
        startPenaltyBoss(); // هذه الدالة ستعرض توست وتوجه للساحة
    } else if (remainder === 2) {
        activeBossType = 'bomb';
        startBombBoss();
    } else {
        activeBossType = 'monster';
        startMonsterBoss();
    }
}

function launchBossWithQuestions(questions) {
    bossQuestionsDeck = shuffleArray(questions).slice(0, 5);
    triggerCorrectBossMode();
}

function startDynamicBoss() {
    closeModal('modal-pre-boss');
    showTopToast('جاري استدعاء الزعيم... ⏳', 'info');
    
    // نظام كاش للزعيم أيضاً
    const cacheKey = `cached_level_${currentLevelPlaying}_boss`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
        launchBossWithQuestions(JSON.parse(cachedData));
    } else {
        db.ref(`levels_data/level_${currentLevelPlaying}/boss`).once('value').then(snap => {
            let questions = [];
            if (snap.exists()) {
                snap.forEach(child => {
                    let val = child.val();
                    if (Array.isArray(val)) val.forEach(q => { if (q && q.q) questions.push(q); });
                    else if (val && val.q) questions.push(val);
                });
            }
            
            if (questions.length < 5) {
                showTopToast(`تم إيجاد ${questions.length} سؤال فقط للزعيم. جاري الاستكمال!`, 'info');
                const fallbacks = [
                    { q: "ما هي عاصمة مصر؟", a: ["القاهرة", "الإسكندرية", "الجيزة", "أسوان"], correct: 0, categoryName: "عام" },
                    { q: "ما هو العنصر الأكثر وفرة في الغلاف الجوي؟", a: ["النيتروجين", "الأكسجين", "ثاني أكسيد الكربون", "الهيدروجين"], correct: 0, categoryName: "عام" },
                    { q: "كم عدد عظام جسم الإنسان البالغ؟", a: ["206", "180", "250", "300"], correct: 0, categoryName: "عام" },
                    { q: "ما هو الكوكب الأقرب للشمس؟", a: ["عطارد", "الزهرة", "المريخ", "المشتري"], correct: 0, categoryName: "عام" },
                    { q: "أي من الآتي يعتبر خطراً بيولوجياً في الهاسب؟", a: ["السالمونيلا", "شظايا الزجاج", "بقايا المنظفات", "المسامير"], correct: 0, categoryName: "عام" }
                ];
                let i = 0;
                while (questions.length < 5) { questions.push(fallbacks[i % fallbacks.length]); i++; }
            }
            localStorage.setItem(cacheKey, JSON.stringify(questions)); // الحفظ في الكاش
            launchBossWithQuestions(questions);
        }).catch(e => {
            showTopToast('خطأ في جلب أسئلة الزعيم!', 'error');
        });
    }
}

function startDynamicBossDirectly() {
    playClickSound();
    closeModal('modal-level-intro');
    closeModal('modal-boss-cooldown');
    
    // 🚀 التعديل السحري: إجبار تحديث المستوى فوراً وبدون شروط
    currentLevelPlaying = pendingLevelStart;
    
    showTopToast('جاري استدعاء الزعيم مباشرة... ⚔️', 'info');
    
    db.ref(`levels_data/level_${currentLevelPlaying}/boss`).once('value').then(snap => {
        let questions = [];
        if (snap.exists()) {
            snap.forEach(child => {
                let val = child.val();
                if (Array.isArray(val)) {
                    val.forEach(q => { if (q && q.q) questions.push(q); });
                } else if (val && val.q) {
                    questions.push(val);
                }
            });
        }
        
        if (questions.length < 5) {
            const fallbacks = [
                { q: "ما هي عاصمة مصر؟", a: ["القاهرة", "الإسكندرية", "الجيزة", "أسوان"], correct: 0, categoryName: "عام" },
                { q: "ما هو العنصر الأكثر وفرة في الغلاف الجوي؟", a: ["النيتروجين", "الأكسجين", "ثاني أكسيد الكربون", "الهيدروجين"], correct: 0, categoryName: "عام" },
                { q: "كم عدد عظام جسم الإنسان البالغ؟", a: ["206", "180", "250", "300"], correct: 0, categoryName: "عام" },
                { q: "ما هو الكوكب الأقرب للشمس؟", a: ["عطارد", "الزهرة", "المريخ", "المشتري"], correct: 0, categoryName: "عام" },
                { q: "أي من الآتي يعتبر خطراً بيولوجياً في الهاسب؟", a: ["السالمونيلا", "شظايا الزجاج", "بقايا المنظفات", "المسامير"], correct: 0, categoryName: "عام" }
            ];
            let i = 0;
            while (questions.length < 5) {
                questions.push(fallbacks[i % fallbacks.length]);
                i++;
            }
        }
        
        bossQuestionsDeck = shuffleArray(questions).slice(0, 5);
        triggerCorrectBossMode(); 

    }).catch((e) => {
        console.log("Error loading direct boss questions:", e);
        showTopToast('خطأ في جلب أسئلة الزعيم!', 'error');
    });
}

// دوال إدارة جلسة التحدي المعلق
function saveActiveQuizSession() {
    if (!isClassicQuizActive || isLevelBossActive || !activeQuizQuestions || activeQuizQuestions.length === 0) return;
    const sessionData = {
        level: currentLevelPlaying,
        questions: activeQuizQuestions,
        currentIndex: currentQuizIndex,
        score: quizScoreCount,
        starsEarned: currentLevelStarsEarned,
        timestamp: Date.now()
    };
    localStorage.setItem('active_level_quiz_session', JSON.stringify(sessionData));
}

function getActiveQuizSession() {
    try {
        const raw = localStorage.getItem('active_level_quiz_session');
        if (!raw) return null;
        return JSON.parse(raw);
    } catch(e) {
        return null;
    }
}

function clearActiveQuizSession() {
    localStorage.removeItem('active_level_quiz_session');
}

// ================= محرك عرض المحتوى للطالب =================
    let currentActiveCategory = '';
    window.tempLessonContentStore = {}; // مخزن مؤقت لسرعة فتح الشروحات المدمجة

    function openSubjectTypeDetails(type) {
        if (typeof playClickSound === 'function') playClickSound();
        currentActiveType = type;
        const typeName = type === 'theory' ? 'قسم النظري' : 'قسم العملي';
        
        document.getElementById('subject-detail-label').innerText = `${currentActiveSubject} - ${typeName}`;
        
        const lecturesTitle = document.getElementById('hub-lectures-title');
        if (lecturesTitle) {
            lecturesTitle.innerText = type === 'theory' ? 'المحاضرات' : 'السكاشن';
        }
        
        navigateTo('view-subject-detail', currentActiveSubject, typeName);
        if (typeof updateBookRewardBadgeUI === 'function') updateBookRewardBadgeUI();
        
        setTimeout(updateAllRedDots, 50); // 👈 إضافة النقطة الحمراء
    }

function openDynamicContentList(category) {
        if (typeof playClickSound === 'function') playClickSound();
        currentActiveCategory = category;

        const safeKey = getSafeSubjectKey(currentActiveSubject);
        localStorage.setItem(`seen_marker_${safeKey}_${currentActiveType}_${category}`, Date.now().toString());
        setTimeout(updateAllRedDots, 50);
        
        let catName = '';
        if (category === 'lectures') catName = currentActiveType === 'theory' ? 'المحاضرات' : 'السكاشن';
        if (category === 'summaries') catName = 'الشروحات والتلخيصات';
        if (category === 'quizzes') catName = 'بنك الأسئلة والاختبارات';

        document.getElementById('dynamic-list-title').innerText = `${currentActiveSubject} - ${catName}`;
        navigateTo('view-dynamic-list', currentActiveSubject, catName);
        
        const container = document.getElementById('dynamic-content-container');
        // 👈 تم مسح السطر المكرر (const safeKey) من هنا لمنع توقف الكود
        const path = `scientific_content/${safeKey}/${currentActiveType}/${category}`;
        const cacheKey = `cache_${safeKey}_${currentActiveType}_${category}`;
        const cachedData = localStorage.getItem(cacheKey);

        // 1. عرض البيانات من ذاكرة الهاتف فوراً
        if (cachedData) {
            renderDynamicContentDOM(JSON.parse(cachedData), container);
        } else {
            container.innerHTML = '<p style="text-align:center; color: var(--text-sub);">جاري التحميل... ⏳</p>';
        }

        // 2. فحص صامت في الخلفية باستخدام .once
        db.ref(path).once('value').then(snap => {
            let items = [];
            if (snap.exists()) {
                snap.forEach(child => { items.push({ id: child.key, ...child.val() }); });
            }
            
            const newDataString = JSON.stringify(items);
            
            // 3. لو الداتا اللي على السيرفر مختلفة، حدث الموبايل واعرض الجديد
            if (newDataString !== cachedData) {
                localStorage.setItem(cacheKey, newDataString);
                renderDynamicContentDOM(items, container);
            }
        });
    }

        function openLessonReader(title, itemId) {
        if (typeof playClickSound === 'function') playClickSound();
        const storedItem = window.tempLessonContentStore[itemId];
        const contentHtml = (storedItem && storedItem.content) ? storedItem.content : 'عذراً، محتوى الشرح غير متوفر.';
        
        document.getElementById('lesson-reader-title').innerText = title;
        document.getElementById('lesson-reader-body').innerHTML = contentHtml;
        
        const qBoxes = document.querySelectorAll('#lesson-reader-body .interactive-q-box');
        qBoxes.forEach(box => {
            const btns = Array.from(box.querySelectorAll('.quiz-option-btn'));
            if (btns.length > 0) {
                const parent = btns[0].parentNode;
                for (let i = btns.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [btns[i], btns[j]] = [btns[j], btns[i]];
                }
                parent.innerHTML = '';
                btns.forEach(btn => parent.appendChild(btn));
            }
        });

        navigateTo('view-lesson-reader', currentActiveSubject, title);
    }

    // ================= دوال إدارة المحتوى العلمي (الأدمن) =================

// ================= بناء الكروت وتوجيهها للواجهة الصحيحة بذكاء =================
    function renderDynamicContentDOM(items, container) {
    window.tempLessonContentStore = {}; 
    
    if (items.length === 0) {
        container.innerHTML = '<div class="auth-card" style="text-align:center; padding: 30px 15px;"><span style="font-size:3rem; display:block; margin-bottom:10px;">📭</span><p style="color:var(--text-sub); font-weight:700;">لا يوجد محتوى حالياً.</p></div>';
        return;
    }

    if (currentActiveCategory === 'quizzes') {
        let banksHTML = ''; 
        let examsHTML = '';
        const rewardedExams = (currentUser && currentUser.rewarded_exams) ? currentUser.rewarded_exams : [];

        items.forEach(item => {
            window.tempLessonContentStore[item.id] = item;
            const customEmoji = item.emoji || (item.formatType === 'exam' ? '⏱️' : '📚');

            if (item.formatType === 'qbank') {
                banksHTML += `
                <div class="eng-bento-card" style="--theme-color: var(--accent-gold); padding: 16px 10px; text-align: center; align-items: center; justify-content: center;" onclick="openQBankMode('${item.id}')">
                    <div class="dynamic-emoji-box" style="width: 45px; height: 45px; font-size: 1.6rem; margin: 0 auto 10px;">${customEmoji}</div>
                    <h4 style="font-size: 0.9rem; margin-bottom: 4px; color: var(--text-main);">${item.title}</h4>
                    <div style="font-size:0.7rem; color:var(--text-sub);">تدريب مفتوح</div>
                </div>`;
            } else if (item.formatType === 'exam') {
    const isCompleted = rewardedExams.includes(item.id);
    const examRewardUI = isCompleted 
        ? `<div style="font-size:0.75rem; color:var(--accent-emerald); font-weight:900;">مكتمل ✔️ (متاح للتدريب)</div>` 
        : `<div style="font-size:0.75rem; color:#ef4444; font-weight:800;">${item.examTime} دقيقة | +${item.examXP} XP</div>`;

                examsHTML += `
                <div class="eng-bento-card" style="--theme-color: ${isCompleted ? 'var(--accent-emerald)' : '#ef4444'}; padding: 16px 10px; text-align: center; align-items: center; justify-content: center; border-color: ${isCompleted ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'};" onclick="showExamRulesConfirmation('${item.id}')">
                    <div class="dynamic-emoji-box" style="width: 45px; height: 45px; font-size: 1.6rem; margin: 0 auto 10px;">${customEmoji}</div>
                    <h4 style="font-size: 0.9rem; margin-bottom: 4px; color: var(--text-main);">${item.title}</h4>${examRewardUI}
                </div>`;
            } else {
                let clickAction = item.formatType === 'content' ? `onclick="openLessonReader('${item.title}', '${item.id}')"` : (item.url ? `onclick="window.open('${item.url}', '_blank');"` : ``);
                banksHTML += `
                <div class="eng-bento-card" style="--theme-color: #3b82f6; padding: 16px 10px; text-align: center; align-items: center; justify-content: center;" ${clickAction}>
                    <div class="dynamic-emoji-box" style="width: 45px; height: 45px; font-size: 1.6rem; margin: 0 auto 10px;">${customEmoji}</div>
                    <h4 style="font-size: 0.9rem; margin-bottom: 4px; color: var(--text-main);">${item.title}</h4>
                    <div style="font-size:0.7rem; color:var(--text-sub);">محتوى إضافي</div>
                </div>`;
            }
        });
        
        container.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 10px;">
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <div style="text-align: center; font-size: 0.85rem; font-weight: 900; color: var(--text-sub);">بنوك الأسئلة (تدريب)</div>
                ${banksHTML || '<div class="eng-bento-card" style="padding:15px; text-align:center; justify-content:center; border-color: var(--border-card);"><p style="font-size:0.75rem; color:var(--text-sub); margin:0;">لا يوجد</p></div>'}
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <div style="text-align: center; font-size: 0.85rem; font-weight: 900; color: #ef4444;">الاختبارات (تقييم)</div>
                ${examsHTML || '<div class="eng-bento-card" style="padding:15px; text-align:center; justify-content:center; border-color: rgba(239,68,68,0.3);"><p style="font-size:0.75rem; color:var(--text-sub); margin:0;">لا يوجد</p></div>'}
            </div>
        </div>`;
    } else {
        let html = '';
        items.forEach(item => {
            window.tempLessonContentStore[item.id] = item; 
            let actionBtnUI = ''; 
            let clickAction = '';
            const customEmoji = item.emoji || '📄';
            let extraDownloadBtn = '';

            if (item.formatType === 'qbank') {
                actionBtnUI = `<div class="dynamic-content-download" style="color:var(--accent-gold);">📚 اضغط لفتح بنك الأسئلة</div>`;
                clickAction = `onclick="openQBankMode('${item.id}')"`;
            } else if (item.formatType === 'exam') {
                actionBtnUI = `<div class="dynamic-content-download" style="color:#ef4444;">⏱️ اختبار: ${item.examTime} دقيقة</div>`;
                clickAction = `onclick="showExamRulesConfirmation('${item.id}')"`;
            } else if (item.formatType === 'content') {
                actionBtnUI = `<div class="dynamic-content-download" style="color:var(--accent-gold);">📖 اضغط لفتح الشرح التفاعلي</div>`;
                clickAction = `onclick="openLessonReader('${item.title}', '${item.id}')"`;
                
                if (item.url) {
                    extraDownloadBtn = `<button onclick="event.stopPropagation(); window.open('${item.url}', '_blank'); if(typeof playSuccessSound==='function')playSuccessSound();" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #fff; border: none; border-radius: 10px; padding: 8px 14px; font-size: 0.75rem; font-weight: 800; cursor: pointer; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3); z-index: 10; display: flex; align-items: center; gap: 4px;">تحميل الملف</button>`;
                }
            } else {
                actionBtnUI = item.url ? `<div class="dynamic-content-download">⬇️ اضغط لتحميل الملف</div>` : `<div class="dynamic-content-download" style="color:var(--text-sub);">قيد التجهيز ⏳</div>`;
                clickAction = item.url ? `onclick="window.open('${item.url}', '_blank'); if(typeof playSuccessSound==='function')playSuccessSound();"` : `onclick="showTopToast('المحتوى قيد التجهيز', 'info')"`;
            }
            
            html += `<div class="dynamic-content-card" ${clickAction}>
                        ${extraDownloadBtn}
                        <div class="dynamic-emoji-box">${customEmoji}</div>
                        <div class="dynamic-content-info" style="${item.formatType === 'content' && item.url ? 'padding-left: 80px;' : ''}">
                            <h4>${item.title}</h4>
                            ${actionBtnUI}
                        </div>
                        ${item.formatType === 'content' && item.url ? '' : '<div class="dynamic-arrow">←</div>'}
                    </div>`;
        });
        container.innerHTML = html;
    }
}
    // ================= محرك بنك الأسئلة (Study Mode) =================
    let currentBankQuestions = [];
    // متغير عام للتحكم في وضع عرض الإجابات
let isQBankAnswersRevealed = false;

function openQBankMode(itemId) {
    if (typeof playClickSound === 'function') playClickSound();
    const bankData = window.tempLessonContentStore[itemId];
    if(!bankData || !bankData.content) return showTopToast('لا توجد أسئلة', 'error');
    
    document.getElementById('qbank-title').innerText = bankData.title;
    currentBankQuestions = parseRawQuestions(bankData.content);
    isQBankAnswersRevealed = false; // تصفير الحالة مع كل فتحة جديدة
    
    const typesPresent = [...new Set(currentBankQuestions.map(q => q.type))];
    const filterBar = document.getElementById('qbank-filters');
    
    let filterHtml = `<div style="display: flex; gap: 6px; overflow-x: auto; flex: 1;">`;
    filterHtml += `<button class="qbank-filter-btn active" onclick="renderQBankList('all', this)">الكل</button>`;
    if(typesPresent.includes('اختر')) filterHtml += `<button class="qbank-filter-btn" onclick="renderQBankList('اختر', this)">اختر</button>`;
    if(typesPresent.includes('صح_وخطا')) filterHtml += `<button class="qbank-filter-btn" onclick="renderQBankList('صح_وخطا', this)">صح وخطأ</button>`;
    if(typesPresent.includes('اكمل')) filterHtml += `<button class="qbank-filter-btn" onclick="renderQBankList('اكمل', this)">أكمل</button>`;
    if(typesPresent.includes('مقالي')) filterHtml += `<button class="qbank-filter-btn" onclick="renderQBankList('مقالي', this)">مقالي</button>`;
    filterHtml += `</div>`;

    // زر تبديل وضع كشف الحل
    filterHtml += `
    <button id="btn-toggle-qbank-answers" class="admin-action-btn" style="padding: 6px 12px; font-size: 0.75rem; border-color: var(--accent-gold); color: var(--accent-gold); white-space: nowrap; flex-shrink: 0;" onclick="toggleQBankAllAnswers()">
        👁️ عرض الإجابات
    </button>`;

    filterBar.innerHTML = filterHtml;

    renderQBankList('all', filterBar.querySelector('.qbank-filter-btn'));
    navigateTo('view-qbank-reader', currentActiveSubject, bankData.title);
}

// ================= دالة معالجة النصوص وتحويلها لأسئلة =================
function parseRawQuestions(rawText) {
    if (!rawText) return [];
    const lines = rawText.split('\n');
    let questions = [];
    
    lines.forEach(line => {
        if (line.trim() === '') return;
        const parts = line.split('#').map(p => p.trim());
        
        // التأكد من أن السطر يحتوي على الأقل على: النوع # السؤال # الإجابة
        if (parts.length >= 3) {
            let qObj = {
                type: parts[0],
                qText: parts[1],
                correct: parts[2]
            };
            
            // إضافة الخيارات الخاطئة إن وجدت (لاسئلة اختر وصح وخطأ)
            if (parts[3]) qObj.opt1 = parts[3];
            if (parts[4]) qObj.opt2 = parts[4];
            if (parts[5]) qObj.opt3 = parts[5];
            
            questions.push(qObj);
        }
    });
    return questions;
}

function toggleQBankAllAnswers() {
    if (typeof playClickSound === 'function') playClickSound();
    isQBankAnswersRevealed = !isQBankAnswersRevealed;
    
    const toggleBtn = document.getElementById('btn-toggle-qbank-answers');
    if (toggleBtn) {
        if (isQBankAnswersRevealed) {
            toggleBtn.innerText = '🔒 وضع التدريب (إخفاء)';
            toggleBtn.style.background = 'rgba(239, 68, 68, 0.15)';
            toggleBtn.style.borderColor = '#ef4444';
            toggleBtn.style.color = '#ef4444';
            showTopToast('تم تفعيل وضع المراجعة السريعة (جميع الإجابات محلولة) 📖', 'info');
        } else {
            toggleBtn.innerText = '👁️ عرض الإجابات';
            toggleBtn.style.background = 'transparent';
            toggleBtn.style.borderColor = 'var(--accent-gold)';
            toggleBtn.style.color = 'var(--accent-gold)';
            showTopToast('تم العودة لوضع التدريب الفردي 🧠', 'info');
        }
    }

    // جلب نوع الفلتر النشط حالياً لإعادة الرسم بنفس الفلتر
    const activeFilterBtn = document.querySelector('.qbank-filter-btn.active');
    const currentFilter = activeFilterBtn ? activeFilterBtn.innerText.replace(' ', '_') : 'all';
    renderQBankList(currentFilter === 'الكل' ? 'all' : currentFilter, activeFilterBtn);
}

    function renderQBankList(filterType, btnElem) {
        // تحديث لون الزرار النشط في الفلتر
        if(btnElem) {
            document.querySelectorAll('.qbank-filter-btn').forEach(b => b.classList.remove('active'));
            btnElem.classList.add('active');
        }
        
        const container = document.getElementById('qbank-questions-container');
        let html = '';
        
        currentBankQuestions.forEach((q, idx) => {
            // فلترة الأسئلة حسب النوع
            if (filterType !== 'all' && q.type !== filterType) return;
            
            let typeBadge = `<span class="card-badge" style="background: rgba(212,175,55,0.15); color:var(--accent-gold); margin-bottom:8px; display:inline-block;">${q.type.replace('_', ' ')}</span>`;
            
            let interactiveArea = '';
            
            // 1. لو السؤال (اختر) أو (صح وخطأ)
            if (q.type === 'اختر' || q.type === 'صح_وخطا') {
                let opts = [q.correct];
                if(q.opt1) opts.push(q.opt1);
                if(q.opt2) opts.push(q.opt2);
                if(q.opt3) opts.push(q.opt3);
                opts = shuffleArray(opts); // خلط الخيارات عشوائياً
                
                let optsHtml = opts.map(opt => {
                    const isCorrect = (opt === q.correct);

                    // إذا كان وضع "عرض الإجابات" مفعلاً
                    if (isQBankAnswersRevealed) {
                        const style = isCorrect 
                            ? 'background: #10b981; border-color: #059669; color: #fff; opacity: 1; font-weight: 800;' 
                            : 'opacity: 0.45;';
                        const text = isCorrect ? '✅ ' + opt : opt;
                        return `<button class="quiz-option-btn" style="text-align: right; pointer-events: none; ${style}">${text}</button>`;
                    }

                    // وضع التدريب العادي (سؤال تفاعلي)
                    return `<button class="quiz-option-btn" style="text-align: right;" data-correct="${isCorrect}" onclick="checkQBankAns(this)">${opt}</button>`;
                }).join('');
                
                interactiveArea = `<div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">${optsHtml}</div>`;
            } 
            // 2. لو السؤال (أكمل) أو (مقالي)
            else {
                if (isQBankAnswersRevealed) {
                    // تظهر الإجابة مباشرة في وضع المراجعة
                    interactiveArea = `<div class="qbank-ans-box" style="display: block; margin-top: 10px;">✅ ${q.correct}</div>`;
                } else {
                    // يظهر زر كشف الإجابة في وضع التدريب
                    interactiveArea = `
                    <button class="admin-action-btn" style="width: 100%; border-color: var(--border-card); color: var(--text-sub); margin-top: 10px;" onclick="this.nextElementSibling.style.display='block'; this.style.display='none'; if(typeof playClickSound === 'function') playClickSound();">👁️ عرض الإجابة</button>
                    <div class="qbank-ans-box">✅ ${q.correct}</div>`;
                }
            }
            
            html += `
            <div class="qbank-item-card">
                ${typeBadge}
                <div class="qbank-q-text">${idx+1}. ${q.qText}</div>
                ${interactiveArea}
            </div>`;
        });
        
        if (html === '') {
            html = '<p style="text-align:center; color:var(--text-sub);">لا توجد أسئلة من هذا النوع.</p>';
        }
        container.innerHTML = html;
    }


    // دالة فحص الإجابة داخل بنك الأسئلة (بدون درجات، للتدريب فقط)
    function checkQBankAns(btn) {
        const parent = btn.parentElement;
        const allBtns = parent.querySelectorAll('.quiz-option-btn');
        
        // إيقاف الأزرار لمنع الضغط مرتين
        allBtns.forEach(b => {
            b.disabled = true;
            b.style.pointerEvents = 'none';
            b.style.opacity = '0.8';
        });

        const isCorrect = btn.getAttribute('data-correct') === 'true';

        if (isCorrect) {
            if (typeof playSuccessSound === 'function') playSuccessSound();
            btn.style.background = '#10b981';
            btn.style.borderColor = '#059669';
            btn.style.color = '#fff';
            btn.innerHTML = '✅ ' + btn.innerText;
            btn.style.opacity = '1';
        } else {
            if (typeof playErrorSound === 'function') playErrorSound();
            btn.style.background = '#ef4444';
            btn.style.borderColor = '#b91c1c';
            btn.style.color = '#fff';
            btn.innerHTML = '❌ ' + btn.innerText;
            btn.style.opacity = '1';
            
            // إظهار الإجابة الصحيحة تلقائياً
            const correctBtn = parent.querySelector('[data-correct="true"]');
            if (correctBtn) {
                correctBtn.style.background = '#10b981';
                correctBtn.style.borderColor = '#059669';
                correctBtn.style.color = '#fff';
                correctBtn.style.opacity = '1';
                correctBtn.innerHTML = '✅ ' + correctBtn.innerText;
            }
        }
    }
    // ================= محرك الاختبارات (Exam Mode) =================
    let examActiveQuestions = [];
    let examCurrentIdx = 0;
    let examUserAnswers = {};
    let examGlobalTimerInt = null;
    let examDataCache = null;

    function openExamMode(itemId) {
        if (typeof playClickSound === 'function') playClickSound();
        const examData = window.tempLessonContentStore[itemId];
        if(!examData || !examData.content) return showTopToast('لا توجد أسئلة', 'error');

        examDataCache = examData;
        // استبعاد المقالي من الاختبارات
        examActiveQuestions = parseRawQuestions(examData.content).filter(q => q.type !== 'مقالي');
        if(examActiveQuestions.length === 0) return showTopToast('لا توجد أسئلة تقييمية صالحة', 'error');

        examCurrentIdx = 0;
        examUserAnswers = {};
        
        // بناء شريط التنقل العلوي
        let navHtml = '';
        examActiveQuestions.forEach((_, i) => {
            navHtml += `<button class="exam-nav-btn ${i===0?'active-q':''}" id="exam-nav-btn-${i}" onclick="jumpToExamQ(${i})">${i+1}</button>`;
        });
        document.getElementById('exam-nav-bar').innerHTML = navHtml;
        
        document.getElementById('btn-exam-submit').style.display = 'none';

        // ضبط المؤقت
        let totalSeconds = (parseInt(examData.examTime) || 15) * 60;
        clearInterval(examGlobalTimerInt);
        updateExamTimerUI(totalSeconds);
        
        examGlobalTimerInt = setInterval(() => {
            totalSeconds--;
            updateExamTimerUI(totalSeconds);
            if(totalSeconds <= 0) {
                clearInterval(examGlobalTimerInt);
                submitFinalExam(true);
            }
        }, 1000);

        renderExamQuestion();
        navigateTo('view-exam-player', currentActiveSubject, examData.title);
    }

    function updateExamTimerUI(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        const el = document.getElementById('exam-global-timer');
        el.innerText = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        if (seconds < 60) { el.style.color = '#ef4444'; el.style.borderColor = '#ef4444'; el.style.background = 'rgba(239, 68, 68, 0.15)'; }
    }

    function jumpToExamQ(idx) {
        examCurrentIdx = idx;
        renderExamQuestion();
    }

    function examNavigate(dir) {
        const newIdx = examCurrentIdx + dir;
        if(newIdx >= 0 && newIdx < examActiveQuestions.length) {
            examCurrentIdx = newIdx;
            renderExamQuestion();
        }
    }

    function renderExamQuestion() {
        if (typeof playClickSound === 'function') playClickSound();
        const qData = examActiveQuestions[examCurrentIdx];
        
        document.querySelectorAll('.exam-nav-btn').forEach((b, i) => {
            b.classList.remove('active-q');
            if(i === examCurrentIdx) b.classList.add('active-q');
            if(examUserAnswers[i] !== undefined) b.classList.add('answered');
        });

        document.getElementById('exam-q-text').innerText = qData.qText;
        const optsContainer = document.getElementById('exam-options-container');
        optsContainer.innerHTML = '';

        if (qData.type === 'اكمل') {
            const savedAns = examUserAnswers[examCurrentIdx] || '';
            optsContainer.innerHTML = `<input type="text" class="form-input" style="text-align:center; font-size:1.1rem; font-weight:800;" placeholder="اكتب الكلمة هنا..." value="${savedAns}" onblur="saveExamAnswer(this.value)">`;
        } else {
            // اختر أو صح وخطأ (نخلط الخيارات لو مفيش إجابة محفوظة عشان نحافظ على الترتيب)
            if(!qData.shuffledOpts) {
                let opts = [qData.correct];
                if(qData.opt1) opts.push(qData.opt1);
                if(qData.opt2) opts.push(qData.opt2);
                if(qData.opt3) opts.push(qData.opt3);
                qData.shuffledOpts = shuffleArray(opts);
            }
            
            qData.shuffledOpts.forEach(opt => {
                const isSelected = examUserAnswers[examCurrentIdx] === opt;
                optsContainer.innerHTML += `<button class="exam-option-radio ${isSelected ? 'selected' : ''}" onclick="saveExamAnswer('${opt}')">${opt}</button>`;
            });
        }

        // التحكم في أزرار التالي والسابق والتسليم
        document.getElementById('btn-exam-prev').style.visibility = examCurrentIdx === 0 ? 'hidden' : 'visible';
        
        if (examCurrentIdx === examActiveQuestions.length - 1) {
            document.getElementById('btn-exam-next').style.display = 'none';
            document.getElementById('btn-exam-submit').style.display = 'block';
        } else {
            document.getElementById('btn-exam-next').style.display = 'block';
            document.getElementById('btn-exam-submit').style.display = 'none';
        }
    }

    function saveExamAnswer(val) {
        if(val.trim() !== '') {
            examUserAnswers[examCurrentIdx] = val.trim();
            document.getElementById(`exam-nav-btn-${examCurrentIdx}`).classList.add('answered');
            if(examActiveQuestions[examCurrentIdx].type !== 'اكمل') renderExamQuestion(); // تحديث لون الزرار
        }
    }

    function submitFinalExam(isTimeout = false) {
        clearInterval(examGlobalTimerInt);
        let correctCount = 0;
        let mistakesHtml = '';
        let currentMistakesToSave = []; // مصفوفة لجمع الأخطاء
        
        examActiveQuestions.forEach((q, i) => {
            const uAns = examUserAnswers[i] || '';
            if (uAns.toLowerCase() === q.correct.toLowerCase()) {
                correctCount++;
            } else {
                mistakesHtml += `
                <div class="mistake-card">
                    <div class="mistake-q">${i+1}. ${q.qText}</div>
                    <div class="mistake-user-ans">إجابتك: ${uAns === '' ? 'لم يتم الإجابة ⏳' : uAns}</div>
                    <div class="mistake-correct-ans">التصحيح: ${q.correct} ✅</div>
                </div>`;
                
                // حفظ الخطأ للمراجعة في الإحصائيات
                currentMistakesToSave.push({
                    subject: currentActiveSubject,
                    examTitle: examDataCache.title,
                    qText: q.qText,
                    uAns: uAns === '' ? 'لم يجب' : uAns,
                    correct: q.correct,
                    date: new Date().toLocaleDateString('ar-EG')
                });
            }
        });

        // لو فيه أخطاء، ابعتها تتحفظ في الهاتف
        if (currentMistakesToSave.length > 0) {
            saveLocalExamMistakes(currentMistakesToSave);
        }

        saveLocalQuizHistory(examDataCache.title, correctCount, examActiveQuestions.length, 'exam');

        const passRate = correctCount / examActiveQuestions.length;
        const isPassed = passRate >= 0.5; // معيار النجاح: 50% فما فوق
        const rewardedExams = (currentUser && currentUser.rewarded_exams) ? currentUser.rewarded_exams : [];
        const alreadyRewarded = rewardedExams.includes(examDataCache.id);
        
        let xpReward = Math.round((parseInt(examDataCache.examXP) || 0) * passRate);
xpReward = calculateXpWithBooster(xpReward);
        const coinsReward = Math.round((parseInt(examDataCache.examCoins) || 0) * passRate);

        let rewardMsgHtml = '';

        if (!alreadyRewarded && isPassed) {
            if (currentUser) {
                currentUser.xp = (currentUser.xp || currentUser.points || 0) + xpReward;
                currentUser.points = currentUser.xp;
                currentUser.coins = (currentUser.coins || 0) + coinsReward;
                
                rewardedExams.push(examDataCache.id);
                currentUser.rewarded_exams = rewardedExams;
                currentUser.passed_exams_count = rewardedExams.length;

                db.ref('users/' + currentUser.phone).update({ 
                    xp: currentUser.xp, 
                    points: currentUser.points, 
                    coins: currentUser.coins,
                    rewarded_exams: rewardedExams,
                    passed_exams_count: currentUser.passed_exams_count
                });
                if (typeof updateProfileUI === 'function') updateProfileUI();
            }
            rewardMsgHtml = `مكافأة الاختبار: +${xpReward} XP | +${coinsReward} عملة 💸`;
        } else if (alreadyRewarded) {
            rewardMsgHtml = `لقد حصلت على مكافأة هذا الاختبار مسبقاً (محاولة للتدريب)`;
        } else {
            rewardMsgHtml = `لم تجتز نسبة النجاح (50%). حاول مرة أخرى للحصول على المكافأة واحتساب الإنجاز!`;
        }

        const circleEl = document.getElementById('exam-score-circle');
        circleEl.innerText = `${correctCount}/${examActiveQuestions.length}`;
        
        const msgEl = document.getElementById('exam-result-msg');
        if (passRate === 1) {
            msgEl.innerText = "علامة كاملة! أداء أسطوري ومثالي 🏆";
            msgEl.style.color = "var(--accent-emerald)";
            circleEl.style.borderColor = "var(--accent-emerald)";
            circleEl.style.color = "var(--accent-emerald)";
            if (typeof playFlawlessVictorySound === 'function') playFlawlessVictorySound();
            if (typeof triggerConfetti === 'function') triggerConfetti();
        } else if (passRate >= 0.5) {
            msgEl.innerText = "أداء جيد، مبروك النجاح واحتساب الاختبار! 👍";
            msgEl.style.color = "var(--accent-gold)";
            circleEl.style.borderColor = "var(--accent-gold)";
            circleEl.style.color = "var(--accent-gold)";
            if (typeof playSuccessSound === 'function') playSuccessSound();
        } else {
            msgEl.innerText = isTimeout ? "انتهى الوقت! تحتاج لسرعة وتركيز أكبر ⏰" : "حاول مرة أخرى وركز أكثر في مراجعة المادة! ⚠️";
            msgEl.style.color = "#ef4444";
            circleEl.style.borderColor = "#ef4444";
            circleEl.style.color = "#ef4444";
            if (typeof playErrorSound === 'function') playErrorSound();
        }

        const rewardBox = document.getElementById('exam-reward-box');
        rewardBox.style.display = 'block';
        rewardBox.innerText = rewardMsgHtml;

        const mistakesContainer = document.getElementById('exam-mistakes-container');
        if (mistakesHtml === '') {
            mistakesContainer.innerHTML = '<div style="text-align:center; color:var(--accent-emerald); font-weight:900; margin-top:20px; font-size:1.1rem;">إجاباتك كلها مثالية ولا يوجد أي أخطاء! 🎉</div>';
        } else {
            mistakesContainer.innerHTML = '<h4 style="color:#ef4444; margin-bottom:15px; font-size:0.95rem; text-align:center;">مراجعة أخطائك في الاختبار 📝</h4>' + mistakesHtml;
        }

        navHistory.pop(); 
        navHistory.push({ viewId: 'view-exam-result', title: 'نتيجة الاختبار', subtitle: 'تقرير الأداء الشامل' });
        showViewSection('view-exam-result');
        updateHeader();
    }

    // ================= تعديلات الأدمن للمحتوى العلمي الشامل =================
    function toggleSciFormatType() {
        const format = document.getElementById('adm-sci-format').value;
        const urlContainer = document.getElementById('sci-url-container');
        const contentContainer = document.getElementById('sci-content-container');
        const examSettings = document.getElementById('sci-exam-settings');
        const qbankHint = document.getElementById('sci-qbank-hint');
        const lblContent = document.getElementById('lbl-sci-content');
        const builderBtns = document.getElementById('sci-builder-btns');

        if (format === 'url') {
            urlContainer.style.display = 'block';
            contentContainer.style.display = 'none';
            if (examSettings) examSettings.style.display = 'none';
        } else if (format === 'content') {
            urlContainer.style.display = 'block'; // 💡 أصبحت تظهر دائمًا لتمكين إضافة ملف PDF
            contentContainer.style.display = 'block';
            if (examSettings) examSettings.style.display = 'none';
            if (qbankHint) qbankHint.style.display = 'none';
            if (lblContent) lblContent.innerText = 'محتوى الشرح التفاعلي';
            if (builderBtns) builderBtns.style.display = 'flex';
        } else if (format === 'qbank' || format === 'exam') {
            urlContainer.style.display = 'none';
            contentContainer.style.display = 'block';
            if (examSettings) examSettings.style.display = format === 'exam' ? 'block' : 'none';
            if (qbankHint) qbankHint.style.display = 'block';
            if (lblContent) lblContent.innerText = 'الأسئلة (كل سؤال في سطر)';
            if (builderBtns) builderBtns.style.display = 'none';
        }
    }

    // 💡 إنشاء كاش في الذاكرة لتخزين المحتوى بأمان بعيداً عن أزرار الـ HTML
    window.adminScienceCache = {}; 

    function loadAdminScienceContent() {
        const subject = document.getElementById('adm-sci-subject').value;
        const type = document.getElementById('adm-sci-type').value;
        const category = document.getElementById('adm-sci-category').value;
        const list = document.getElementById('admin-science-list');
        
        if (!list) return;
        list.innerHTML = '<p style="text-align: center; color: var(--text-sub);">جاري التحميل... ⏳</p>';

        const safeKey = getSafeSubjectKey(subject);
        const path = `scientific_content/${safeKey}/${type}/${category}`;

        db.ref(path).once('value').then(snap => {
            list.innerHTML = '';
            window.adminScienceCache = {}; // تصفير الذاكرة مع كل تحميل
            
            if (!snap.exists()) {
                list.innerHTML = '<p style="text-align: center; color: var(--text-sub);">لا يوجد محتوى مضاف هنا حتى الآن.</p>';
                return;
            }

            let html = '';
            snap.forEach(child => {
                const id = child.key;
                const data = child.val();
                
                // 💡 حفظ الكارت بالكامل في الذاكرة لتمرير الـ ID فقط للزر
                window.adminScienceCache[id] = data; 
                
                let typeBadge = data.formatType === 'content' ? '📖 شرح مدمج' : 
                                data.formatType === 'qbank' ? '📚 بنك أسئلة' : 
                                data.formatType === 'exam' ? '⏱️ اختبار' : '🔗 رابط خارجي';

                html += `
                <div class="admin-item-card">
                    <div class="admin-item-info">
                        <div class="admin-item-name">${data.emoji || '📄'} ${data.title}</div>
                        <div class="admin-item-sub" style="direction: rtl; text-align: right; font-size: 0.75rem; color: var(--accent-gold); font-weight: 800; margin-top: 4px;">
                            ${typeBadge}
                        </div>
                    </div>
                    <div style="display: flex; gap: 6px; flex-direction: column; flex-shrink: 0;">
                        <!-- الزرار الآن أصبح نظيف تماماً ومستحيل يعطل -->
                        <button class="admin-action-btn" style="padding: 4px 8px; font-size: 0.7rem;" onclick="editAdminScienceContent('${id}')">تعديل ✏️</button>
                        <button class="admin-action-btn danger" style="padding: 4px 8px; font-size: 0.7rem;" onclick="deleteAdminScienceContent('${id}')">حذف 🗑️</button>
                    </div>
                </div>`;
            });
            list.innerHTML = html;
        });
    }

    function saveAdminScienceContent() {
        playClickSound();
        const idField = document.getElementById('adm-sci-id').value.trim();
        const finalId = idField !== '' ? idField : 'sci_' + Date.now();
        
        const subject = document.getElementById('adm-sci-subject').value;
        const type = document.getElementById('adm-sci-type').value;
        const category = document.getElementById('adm-sci-category').value;
        
        const formatType = document.getElementById('adm-sci-format').value;
        const emoji = document.getElementById('adm-sci-emoji').value.trim();
        const title = document.getElementById('adm-sci-title').value.trim();
        const url = document.getElementById('adm-sci-url').value.trim();
        const content = document.getElementById('adm-sci-content').value.trim();

        if (!title) { showTopToast('يرجى كتابة عنوان الكارت!', 'error'); return; }

        let itemData = { title, formatType, emoji };

        if (formatType === 'url') {
            if (!url) { showTopToast('يرجى وضع الرابط!', 'error'); return; }
            itemData.url = url;
        } else if (formatType === 'content') {
            if (!content) { showTopToast('يرجى كتابة الشرح!', 'error'); return; }
            itemData.content = content;
            if (url) itemData.url = url; // 💡 يحفظ الرابط في الداتا بيز لو الأدمن أضافه
        } else if (formatType === 'qbank' || formatType === 'exam') {
            if (!content) { showTopToast('يرجى إدخال الأسئلة!', 'error'); return; }
            itemData.content = content;
            if (formatType === 'exam') {
                itemData.examTime = parseInt(document.getElementById('adm-sci-time').value) || 15;
                itemData.examXP = parseInt(document.getElementById('adm-sci-xp').value) || 50;
                itemData.examCoins = parseInt(document.getElementById('adm-sci-coins').value) || 10;
            }
        }

        const safeKey = getSafeSubjectKey(subject);
        db.ref(`scientific_content/${safeKey}/${type}/${category}/${finalId}`).update(itemData).then(() => {
            db.ref(`content_markers/${safeKey}_${type}_${category}`).set(Date.now());
            showTopToast('تم حفظ الكارت بنجاح! ✅', 'success');
            resetScienceAdminForm();
            loadAdminScienceContent();
        });
    }

    function editAdminScienceContent(id) {
        if (typeof playClickSound === 'function') playClickSound();
        
        // 💡 سحب البيانات النظيفة بالكامل من الذاكرة
        const data = window.adminScienceCache[id];
        if (!data) {
            showTopToast('حدث خطأ في جلب البيانات!', 'error');
            return;
        }

        document.getElementById('adm-sci-id').value = id;
        document.getElementById('adm-sci-title').value = data.title || '';
        document.getElementById('adm-sci-emoji').value = data.emoji || '📄';
        document.getElementById('adm-sci-format').value = data.formatType || 'url';
        toggleSciFormatType(); // دي بتظهر وتخفي الخانات حسب النوع
        
        document.getElementById('adm-sci-url').value = data.url || '';
        document.getElementById('adm-sci-content').value = data.content || '';
        
        if (data.formatType === 'exam') {
            document.getElementById('adm-sci-time').value = data.examTime || 15;
            document.getElementById('adm-sci-xp').value = data.examXP || 0;
            document.getElementById('adm-sci-coins').value = data.examCoins || 0;
        }
        
        document.getElementById('btn-save-sci').innerText = 'حفظ التعديلات 💾';
        window.scrollTo({top: 0, behavior: 'smooth'});
        showTopToast('تم جلب البيانات بنجاح، يمكنك التعديل الآن.', 'info');
    }

    function deleteAdminScienceContent(id) {
        if(confirm('هل أنت متأكد من الحذف؟')) {
            const safeKey = getSafeSubjectKey(document.getElementById('adm-sci-subject').value);
            const type = document.getElementById('adm-sci-type').value;
            const cat = document.getElementById('adm-sci-category').value;
            db.ref(`scientific_content/${safeKey}/${type}/${cat}/${id}`).remove().then(() => {
                showTopToast('تم الحذف بنجاح.', 'info');
                loadAdminScienceContent();
                localStorage.removeItem(`cache_${safeKey}_${type}_${cat}`);
            });
        }
    }

    function resetScienceAdminForm() {
        document.getElementById('adm-sci-id').value = '';
        document.getElementById('adm-sci-title').value = '';
        document.getElementById('adm-sci-url').value = '';
        document.getElementById('adm-sci-content').value = '';
        document.getElementById('adm-sci-time').value = '';
        document.getElementById('adm-sci-xp').value = '';
        document.getElementById('adm-sci-coins').value = '';
        document.getElementById('btn-save-sci').innerText = 'إضافة للمحتوى 💾';
    }
    
        function insertScienceBlock(type) {
        const textarea = document.getElementById('adm-sci-content');
        let snippet = '';
        
        if (type === 'title') snippet = `\n<h3 style="color: var(--accent-gold); margin: 20px 0 10px; border-bottom: 1px dashed var(--border-card); padding-bottom: 8px;">عنوان رئيسي هنا</h3>\n`;
        else if (type === 'note') snippet = `\n<div class="reader-note-box">💡 <b>ملحوظة ذهبية:</b> اكتب الملاحظة هنا...</div>\n`;
        else if (type === 'warning') snippet = `\n<div class="reader-warn-box">⚠️ <b>تحذير:</b> اكتب التحذير هنا...</div>\n`;
        else if (type === 'def') snippet = `\n<div class="reader-def-box">📌 <b>المصطلح:</b> اكتب التعريف هنا...</div>\n`;
        else if (type === 'interactive') snippet = `\n<div class="interactive-q-box">\n    <div class="interactive-q-text">❓ سؤال: اكتب السؤال التفاعلي هنا...</div>\n    <button class="btn-reveal-ans" onclick="if(typeof playClickSound==='function')playClickSound(); this.nextElementSibling.style.display='block'; this.style.display='none';">👁️ عرض الإجابة</button>\n    <div class="interactive-ans-text">✅ الإجابة: الشرح التفصيلي للإجابة هنا...</div>\n</div>\n`;
        else if (type === 'mcq') snippet = `\n<div class="interactive-q-box" style="border-color: #f59e0b;">\n    <div class="interactive-q-text">🎯 اختبر نفسك: اكتب السؤال هنا...</div>\n    <div style="display: flex; flex-direction: column; gap: 8px;">\n        <button class="quiz-option-btn" style="text-align: right;" data-correct="true" onclick="checkInAppAns(this, true)">الخيار الصحيح</button>\n        <button class="quiz-option-btn" style="text-align: right;" data-correct="false" onclick="checkInAppAns(this, false)">خيار خاطئ 1</button>\n        <button class="quiz-option-btn" style="text-align: right;" data-correct="false" onclick="checkInAppAns(this, false)">خيار خاطئ 2</button>\n    </div>\n</div>\n`;
        else if (type === 'table') snippet = `\n<div style="overflow-x:auto; margin: 15px 0;">\n<table class="haccp-professional-table">\n<tr><th>وجه المقارنة</th><th>أ</th><th>ب</th></tr>\n<tr><td>النقطة 1</td><td>تفاصيل أ</td><td>تفاصيل ب</td></tr>\n</table>\n</div>\n`;
        else if (type === 'reveal') snippet = `\n<div class="reader-accordion-card">\n    <div class="reader-accordion-header" onclick="if(typeof playClickSound==='function')playClickSound(); this.parentElement.classList.toggle('open'); const body = this.nextElementSibling; body.style.display = body.style.display === 'block' ? 'none' : 'block';">\n        <div class="reader-accordion-title">العنوان </div>\n        <div class="reader-accordion-arrow">▼</div>\n    </div>\n    <div class="reader-accordion-body">الشرح</div>\n</div>\n`;
        else if (type === 'mindmap') snippet = `\n<div class="magic-mindmap">\n    <div class="mindmap-node">\n        <div class="mindmap-title">الخطوة الأولى</div>\n        <div class="mindmap-desc">شرح الخطوة الأولى...</div>\n    </div>\n    <div class="mindmap-node">\n        <div class="mindmap-title">الخطوة الثانية</div>\n        <div class="mindmap-desc">شرح الخطوة الثانية...</div>\n    </div>\n</div>\n`;
else if (type === 'image') {
    snippet = `\n<div style="text-align: center; margin: 15px 0;">\n    <img src="https://example.com/image.jpg" style="width: 100%; max-width: 450px; border-radius: 14px; border: 1px solid var(--border-card);" alt="شرح">\n    <span style="display: block; font-size: 0.75rem; color: var(--text-sub); margin-top: 5px;">اكتب وصف الصورة هنا...</span>\n</div>\n`;
}

        const startPos = textarea.selectionStart;
        const endPos = textarea.selectionEnd;
        textarea.value = textarea.value.substring(0, startPos) + snippet + textarea.value.substring(endPos, textarea.value.length);
        textarea.focus();
    }

    // دالة فحص سؤال "اختبر نفسك" المدمج داخل الشروحات
function checkInAppAns(btn, isCorrect) {
    const parent = btn.parentElement;
    const allBtns = parent.querySelectorAll('.quiz-option-btn');
    
    // إيقاف جميع الأزرار عشان الطالب ميجاوبش مرتين
    allBtns.forEach(b => {
        b.disabled = true;
        b.style.pointerEvents = 'none';
        b.style.opacity = '0.8';
    });

    if (isCorrect) {
        if (typeof playSuccessSound === 'function') playSuccessSound();
        if (typeof shootStars === 'function') shootStars();
        btn.style.background = '#10b981';
        btn.style.borderColor = '#059669';
        btn.style.color = '#fff';
        btn.innerHTML = '✅ إجابة صحيحة!';
        btn.style.opacity = '1';
    } else {
        if (typeof playErrorSound === 'function') playErrorSound();
        btn.style.background = '#ef4444';
        btn.style.borderColor = '#b91c1c';
        btn.style.color = '#fff';
        btn.innerHTML = '❌ خطأ!';
        btn.style.opacity = '1';
        
        // إظهار الإجابة الصحيحة باللون الأخضر تلقائياً للطالب
        const correctBtn = parent.querySelector('[data-correct="true"]');
        if (correctBtn) {
            correctBtn.style.background = '#10b981';
            correctBtn.style.borderColor = '#059669';
            correctBtn.style.color = '#fff';
            correctBtn.style.opacity = '1';
        }
    }
}

// دالة حفظ الإحصائيات في هاتف الطالب فقط (صفر استهلاك انترنت)
function saveLocalQuizHistory(quizTitle, correct, total, type) {
    let history = JSON.parse(localStorage.getItem('my_detailed_stats') || '[]');
    
    // إضافة الكويز الجديد في بداية القائمة
    history.unshift({
        title: quizTitle,
        score: correct,
        total: total,
        type: type, // 'exam' أو 'classic'
        date: new Date().toLocaleDateString('ar-EG')
    });

    // الاحتفاظ بآخر 15 اختبار فقط لتوفير مساحة الهاتف
    if (history.length > 15) history.pop();
    
    localStorage.setItem('my_detailed_stats', JSON.stringify(history));
}

// ================= نظام التثبيت المخصص (PWA) للأندرويد =================
let deferredPrompt;
const installBtn = document.getElementById('custom-install-btn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); 
    deferredPrompt = e; 
    if(installBtn) installBtn.style.display = 'block'; 
});

if(installBtn) {
    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt(); 
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                installBtn.style.display = 'none'; 
            }
            deferredPrompt = null;
        }
    });
}

window.addEventListener('appinstalled', () => {
    if(installBtn) installBtn.style.display = 'none';
    deferredPrompt = null;
});

// ================= محرك تحدي ريسك الشامل (Risk Engine) =================
let riskMatchData = {
    t1: { name: '', score: 0, hasTime: true, hasSteal: true },
    t2: { name: '', score: 0, hasTime: true, hasSteal: true },
    currentTurn: 1, board: [], activeQ: null, isStealDeclared: false, stealStageActive: false, timer: null, timeLeft: 45,
    rerollsUsed: 0,
    validCategoriesPool: [] // لحفظ التصنيفات المتبقية عشان لو حبينا نغير تصنيف
};

function openRiskSetupModal() {
    if (typeof playClickSound === 'function') playClickSound();
    openModal('modal-risk-setup');
}

async function startRiskMatchAction() {
    playClickSound();
    const t1Name = document.getElementById('risk-name-t1').value.trim() || 'الفريق الأول';
    const t2Name = document.getElementById('risk-name-t2').value.trim() || 'الفريق الثاني';

    riskMatchData.t1 = { name: t1Name, score: 0, hasTime: true, hasSteal: true };
    riskMatchData.t2 = { name: t2Name, score: 0, hasTime: true, hasSteal: true };
    riskMatchData.currentTurn = 1;
    riskMatchData.rerollsUsed = 0;

    showTopToast('جاري تجهيز لوحة الأسئلة... ⏳', 'info');

    // 1. سحب الأسئلة من الكاش الذكي
    let rawQuestions = await getQuestionsWithCache('risk_questions');
    if (!rawQuestions || rawQuestions.length === 0) {
        showTopToast('لا توجد أسئلة كافية في السيرفر، يرجى رفع الأسئلة من لوحة التحكم!', 'error'); 
        return;
    }

    // 2. تجميع الأسئلة حسب التصنيفات والنقاط
    let grouped = {};
    rawQuestions.forEach(q => {
        if (!grouped[q.category]) grouped[q.category] = { 5:[], 10:[], 20:[], 40:[] };
        if (grouped[q.category][q.points]) grouped[q.category][q.points].push(q);
    });

    // 3. فلترة التصنيفات الصالحة (سؤال من كل وزن على الأقل)
    let validCats = [];
    Object.keys(grouped).forEach(cat => {
        if (grouped[cat][5].length > 0 && grouped[cat][10].length > 0 && grouped[cat][20].length > 0 && grouped[cat][40].length > 0) {
            validCats.push({ category: cat, data: grouped[cat] });
        }
    });

    if (validCats.length < 4) {
        showTopToast('الأسئلة المتوفرة لا تكفي لعمل 4 تصنيفات كاملة (5،10،20،40)!', 'error'); 
        return;
    }

    // 4. نظام منع التكرار الصارم
    let seenCats = JSON.parse(localStorage.getItem('risk_seen_cats') || '[]');
    let unseenPool = validCats.filter(c => !seenCats.includes(c.category));

    let selectedCats = [];

    if (unseenPool.length >= 4) {
        // إذا كان المتبقي 4 أو أكثر، نختار منهم مباشرة
        unseenPool = shuffleArray(unseenPool);
        selectedCats = unseenPool.slice(0, 4);
        riskMatchData.validCategoriesPool = unseenPool.slice(4);
    } else {
        // إذا انتهت كل التصنيفات أو تبقى أقل من 4: نأخذ المتبقي أولاً ثم نصفّر ونكمل الباقي
        let leftovers = [...unseenPool];
        seenCats = []; // تصفير الذاكرة لبدء دورة جديدة
        
        let freshPool = shuffleArray(validCats.filter(c => !leftovers.some(l => l.category === c.category)));
        let needed = 4 - leftovers.length;
        
        selectedCats = [...leftovers, ...freshPool.slice(0, needed)];
        riskMatchData.validCategoriesPool = freshPool.slice(needed);
        showTopToast('تم إكمال جميع التصنيفات وتجديد الدورة بالكامل 🔄', 'info');
    }

    // حفظ كل ما تم اختياره في الذاكرة لمنع ظهوره حتى تنتهي الدورة القادمة
    selectedCats.forEach(c => {
        if (!seenCats.includes(c.category)) seenCats.push(c.category);
    });
    localStorage.setItem('risk_seen_cats', JSON.stringify(seenCats));

    // 5. بناء اللوحة وبدء الماتش
    riskMatchData.board = buildRiskColumns(selectedCats);
    assignRandomDoubleQuestion();

    closeModal('modal-risk-setup');
    navigateTo('view-risk-game', 'تحدي ريسك', 'مواجهة الفرق مع الحكم');
    renderRiskScoreboard();
    renderRiskGrid();
}

function buildRiskColumns(selectedCatsArray) {
    let board = [];
    selectedCatsArray.forEach(catItem => {
        // نختار سؤال عشوائي من كل وزن
        let q5 = shuffleArray(catItem.data[5])[0];
        let q10 = shuffleArray(catItem.data[10])[0];
        let q20 = shuffleArray(catItem.data[20])[0];
        let q40 = shuffleArray(catItem.data[40])[0];
        
        board.push({
            category: catItem.category,
            questions: [
                { points: 5, q: q5.q, a: q5.a, answered: false, isDouble: false },
                { points: 10, q: q10.q, a: q10.a, answered: false, isDouble: false },
                { points: 20, q: q20.q, a: q20.a, answered: false, isDouble: false },
                { points: 40, q: q40.q, a: q40.a, answered: false, isDouble: false }
            ]
        });
    });
    return board;
}

function assignRandomDoubleQuestion() {
    // تصفير أي دوبل قديم
    riskMatchData.board.forEach(c => c.questions.forEach(q => q.isDouble = false));
    
    // اختيار عشوائي (عمود من 0 لـ 3) و (صف من 0 لـ 3)
    const randCol = Math.floor(Math.random() * 4);
    const randRow = Math.floor(Math.random() * 4);
    riskMatchData.board[randCol].questions[randRow].isDouble = true;
}

function rerollRiskCategory(colIndex) {
    const hasAnyQuestionStarted = riskMatchData.board.some(c => c.questions.some(q => q.answered));
    if (hasAnyQuestionStarted) {
        showTopToast('لا يمكن تغيير التصنيف بعد بدء المباراة والإجابة على الأسئلة!', 'error'); 
        return;
    }

    if (riskMatchData.rerollsUsed >= 1) {
        showTopToast('لقد استخدمت فرصة تغيير التصنيف الوحيدة المتاحة لك!', 'error'); 
        return;
    }
    if (!riskMatchData.validCategoriesPool || riskMatchData.validCategoriesPool.length === 0) {
        showTopToast('لا توجد تصنيفات إضافية متاحة حالياً للتغيير.', 'error'); 
        return;
    }

    playClickSound();
    let newCatItem = riskMatchData.validCategoriesPool.pop();
    
    let newCol = buildRiskColumns([newCatItem])[0];
    riskMatchData.board[colIndex] = newCol;
    riskMatchData.rerollsUsed++;

    // تسجيل التصنيف البديل الجديد في الـ seen_cats حتى لا يظهر مجدداً
    let seenCats = JSON.parse(localStorage.getItem('risk_seen_cats') || '[]');
    if (!seenCats.includes(newCatItem.category)) {
        seenCats.push(newCatItem.category);
        localStorage.setItem('risk_seen_cats', JSON.stringify(seenCats));
    }

    let hasDouble = false;
    riskMatchData.board.forEach(c => c.questions.forEach(q => { if(q.isDouble) hasDouble = true; }));
    if (!hasDouble) assignRandomDoubleQuestion();

    showTopToast('تم تغيير التصنيف بنجاح 🔄', 'success');
    renderRiskGrid();
}

function renderRiskGrid() {
    const container = document.getElementById('risk-board-container');
    container.innerHTML = '';

    // التحقق هل بدأت المباراة وتمت الإجابة على أي سؤال في أي تصنيف
    const hasAnyQuestionStarted = riskMatchData.board.some(c => c.questions.some(q => q.answered));

    riskMatchData.board.forEach((cat, catIdx) => {
        let colHtml = `<div style="display: flex; flex-direction: column; gap: 8px;">`;
        
        // إظهار زر التغيير فقط إذا لم تبدأ المباراة ولم يُستخدم التغيير مسبقاً
        let rerollBtn = (!hasAnyQuestionStarted && riskMatchData.rerollsUsed === 0) 
            ? `<button class="admin-action-btn" style="padding: 2px 6px; font-size: 0.65rem; margin-top: 4px;" onclick="rerollRiskCategory(${catIdx})">تغيير 🔄</button>` 
            : '';

        colHtml += `
        <div style="background: var(--bg-secondary); border: 1px solid var(--border-card); border-radius: 10px; padding: 8px 4px; text-align: center; font-size: 0.7rem; font-weight: 900; color: var(--accent-gold); min-height: 55px; display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1.2;">
            ${cat.category}
            ${rerollBtn}
        </div>`;

        cat.questions.forEach((q, qIdx) => {
            if (q.answered) {
                colHtml += `<div style="background: rgba(255,255,255,0.02); border: 1px dashed var(--border-card); border-radius: 10px; padding: 12px 0; text-align: center; color: var(--text-sub); opacity: 0.3; font-weight: 900; font-size: 0.9rem;">✓</div>`;
            } else {
                colHtml += `<div class="schedule-neo-card" style="padding: 14px 0; border-radius: 12px;" onclick="openRiskQuestion(${catIdx}, ${qIdx})">
                    <span style="font-size: 1.1rem; font-weight: 900; color: var(--accent-emerald);">${q.points}</span>
                </div>`;
            }
        });

        colHtml += `</div>`;
        container.innerHTML += colHtml;
    });
}

function openRiskQuestion(catIdx, qIdx) {
    if (typeof playClickSound === 'function') playClickSound();
    
    const cat = riskMatchData.board[catIdx];
    const q = cat.questions[qIdx];
    
    // إذا كان دوبل، نضاعف النقاط في المتغير المؤقت فقط
    let actualPoints = q.isDouble ? q.points * 2 : q.points;

    riskMatchData.activeQ = { catIdx, qIdx, points: actualPoints, qText: q.q, ansText: q.a, catName: cat.category, isDouble: q.isDouble };
    riskMatchData.isStealDeclared = false;
    riskMatchData.stealStageActive = false;

    document.getElementById('risk-q-cat-tag').innerText = cat.category;
    document.getElementById('risk-q-points-tag').innerText = `${actualPoints} نقطة`;
    document.getElementById('risk-q-text').innerText = q.q;

    // إظهار شارة الدوبل للحكم فقط لو السؤال دوبل
    const doubleBadge = document.getElementById('risk-double-badge');
    if (q.isDouble) {
        doubleBadge.style.display = 'block';
        if (typeof triggerConfetti === 'function') triggerConfetti();
        if (typeof playSuccessSound === 'function') playSuccessSound();
    } else {
        doubleBadge.style.display = 'none';
    }

    const ansBox = document.getElementById('risk-q-ans-box');
    ansBox.style.display = 'none';
    ansBox.innerText = `✅ ${q.a}`;
    document.getElementById('btn-risk-reveal-ans').style.display = 'block';

    document.getElementById('risk-steal-banner').style.display = 'none';
    document.getElementById('risk-steal-resolution-box').style.display = 'none';
    document.getElementById('risk-scoring-actions').style.display = 'flex';

    const activeTeam = riskMatchData.currentTurn === 1 ? riskMatchData.t1 : riskMatchData.t2;
    const opponentTeam = riskMatchData.currentTurn === 1 ? riskMatchData.t2 : riskMatchData.t1;

    document.getElementById('btn-risk-use-time').style.display = activeTeam.hasTime ? 'block' : 'none';
    document.getElementById('btn-risk-use-steal').style.display = opponentTeam.hasSteal ? 'block' : 'none';

    startRiskQuestionTimer(45);
    openModal('modal-risk-question');
}

// ====================== استكمال باقي دوال ريسك كما كانت ======================
function renderRiskScoreboard() {
    document.getElementById('risk-board-t1-name').innerText = riskMatchData.t1.name;
    document.getElementById('risk-board-t1-score').innerText = riskMatchData.t1.score;
    document.getElementById('risk-board-t2-name').innerText = riskMatchData.t2.name;
    document.getElementById('risk-board-t2-score').innerText = riskMatchData.t2.score;
    document.getElementById('risk-t1-card-time').style.opacity = riskMatchData.t1.hasTime ? '1' : '0.2';
    document.getElementById('risk-t1-card-steal').style.opacity = riskMatchData.t1.hasSteal ? '1' : '0.2';
    document.getElementById('risk-t2-card-time').style.opacity = riskMatchData.t2.hasTime ? '1' : '0.2';
    document.getElementById('risk-t2-card-steal').style.opacity = riskMatchData.t2.hasSteal ? '1' : '0.2';
    const turnTeam = riskMatchData.currentTurn === 1 ? riskMatchData.t1.name : riskMatchData.t2.name;
    const turnColor = riskMatchData.currentTurn === 1 ? 'var(--accent-gold)' : '#3b82f6';
    document.getElementById('risk-turn-indicator').innerHTML = `الدور الآن على: <span style="color:${turnColor}">${turnTeam}</span> 🎯`;
}

function startRiskQuestionTimer(seconds) {
    clearInterval(riskMatchData.timer);
    riskMatchData.timeLeft = seconds;
    const timerBox = document.getElementById('risk-q-timer-box');
    timerBox.innerText = `⏱️ ${riskMatchData.timeLeft}`;
    timerBox.style.color = 'var(--text-main)';

    riskMatchData.timer = setInterval(() => {
        riskMatchData.timeLeft--;
        timerBox.innerText = `⏱️ ${riskMatchData.timeLeft}`;
        if (riskMatchData.timeLeft <= 10) timerBox.style.color = '#ef4444';
        if (riskMatchData.timeLeft <= 0) {
            clearInterval(riskMatchData.timer);
            if (typeof playErrorSound === 'function') playErrorSound();
        }
    }, 1000);
}

function useRiskExtraTime() {
    const activeTeam = riskMatchData.currentTurn === 1 ? riskMatchData.t1 : riskMatchData.t2;
    if (!activeTeam.hasTime) return;
    if (typeof playSuccessSound === 'function') playSuccessSound();
    activeTeam.hasTime = false;
    document.getElementById('btn-risk-use-time').style.display = 'none';
    renderRiskScoreboard();
    riskMatchData.timeLeft += 45;
    document.getElementById('risk-q-timer-box').innerText = `⏱️ ${riskMatchData.timeLeft}`;
    showTopToast('تم استخدام كارت +45 ثانية إضافية! ⏱️', 'info');
}

function flagRiskStealIntent() {
    const opponentTeam = riskMatchData.currentTurn === 1 ? riskMatchData.t2 : riskMatchData.t1;
    if (!opponentTeam.hasSteal) return;
    if (typeof playClickSound === 'function') playClickSound();
    opponentTeam.hasSteal = false; 
    riskMatchData.isStealDeclared = true;
    document.getElementById('btn-risk-use-steal').style.display = 'none';
    document.getElementById('risk-steal-banner').style.display = 'block';
    renderRiskScoreboard();
    showTopToast(`فريق [${opponentTeam.name}] طلب سرقة السؤال!`, 'info');
}

function revealRiskAnswer() {
    if (typeof playClickSound === 'function') playClickSound();
    document.getElementById('risk-q-ans-box').style.display = 'block';
    document.getElementById('btn-risk-reveal-ans').style.display = 'none';
}

function submitRiskQuestionResult(isCorrect) {
    clearInterval(riskMatchData.timer);
    const activeTeam = riskMatchData.currentTurn === 1 ? riskMatchData.t1 : riskMatchData.t2;

    if (isCorrect) {
        if (typeof playSuccessSound === 'function') playSuccessSound();
        activeTeam.score += riskMatchData.activeQ.points;
        closeRiskQuestionModal();
    } else {
        if (typeof playErrorSound === 'function') playErrorSound();
        if (riskMatchData.isStealDeclared) {
            riskMatchData.stealStageActive = true;
            document.getElementById('risk-scoring-actions').style.display = 'none';
            document.getElementById('risk-steal-banner').style.display = 'none';
            document.getElementById('risk-steal-resolution-box').style.display = 'block';
            startRiskQuestionTimer(45);
        } else {
            closeRiskQuestionModal();
        }
    }
}

function resolveStealResult(stealSuccess) {
    clearInterval(riskMatchData.timer);
    const stealingTeam = riskMatchData.currentTurn === 1 ? riskMatchData.t2 : riskMatchData.t1;

    if (stealSuccess) {
        if (typeof playSuccessSound === 'function') playSuccessSound();
        stealingTeam.score += riskMatchData.activeQ.points;
        showTopToast(`سرقة ناجحة! +${riskMatchData.activeQ.points} نقطة لـ ${stealingTeam.name} 🥷`, 'success');
    } else {
        if (typeof playErrorSound === 'function') playErrorSound();
        showTopToast('فشلت محاولة السرقة! ❌', 'error');
    }
    closeRiskQuestionModal();
}

function closeRiskQuestionModal() {
    clearInterval(riskMatchData.timer);
    closeModal('modal-risk-question');

    const { catIdx, qIdx } = riskMatchData.activeQ;
    riskMatchData.board[catIdx].questions[qIdx].answered = true;
    riskMatchData.currentTurn = riskMatchData.currentTurn === 1 ? 2 : 1;

    renderRiskScoreboard();
    renderRiskGrid();

    let remaining = 0;
    riskMatchData.board.forEach(c => c.questions.forEach(q => { if (!q.answered) remaining++; }));
    if (remaining === 0) setTimeout(endRiskMatchConfirm, 500);
}

function endRiskMatchConfirm() {
    clearInterval(riskMatchData.timer);
    
    let t1 = riskMatchData.t1;
    let t2 = riskMatchData.t2;

    const emojiEl = document.getElementById('risk-result-emoji');
    const titleEl = document.getElementById('risk-result-title');
    const scoreEl = document.getElementById('risk-result-score');
    const teamsEl = document.getElementById('risk-result-teams');
    const banterEl = document.getElementById('risk-result-banter');

    // قوالب الهزار المتغيرة في حالة الفوز
    const winTemplates = [
        "اكتساح تام! فريق <b>{W}</b> علم على <b>{L}</b> واداهم درس قاسي في فنون الريسك! 💥",
        "فريق <b>{W}</b> مسح بفريق <b>{L}</b> الأرض.. هارد لك يا خاسرين، روحوا ذاكروا وتعالوا تاني! 🤣",
        "لا تراجع ولا استسلام! بس فريق <b>{W}</b> قرر ينهي طموحات <b>{L}</b> بلا رحمة.. فرق مستوى يا جدعان! 🚀",
        "فريق <b>{W}</b> عمل جلاشة لفريق <b>{L}</b>.. ماتش للتاريخ ونتيجة تقيلة، نشوفكم في المواجهة الجاية! 🏆",
        "انتهى الدرس! فريق <b>{W}</b> سيطر بالطول والعرض وخلى فريق <b>{L}</b> يلف حوالين نفسه! 🌪️"
    ];

    let winner, loser;

    if (t1.score > t2.score) {
        winner = t1; loser = t2;
    } else if (t2.score > t1.score) {
        winner = t2; loser = t1;
    }

    teamsEl.innerText = `${t1.name} (ضد) ${t2.name}`;
    scoreEl.innerText = `${t1.score} - ${t2.score}`;

    if (winner) {
        // حالة فوز أحد الفريقين
        titleEl.innerText = `مبروك يا ${winner.name}! 🎉`;
        titleEl.style.color = "var(--accent-emerald)";
        emojiEl.innerText = "🏆";
        
        // اختيار قالب عشوائي وتبديل الأسماء
        const randomBanter = winTemplates[Math.floor(Math.random() * winTemplates.length)];
        banterEl.innerHTML = randomBanter.replace('{W}', winner.name).replace('{L}', loser.name);
        
        if (typeof playSuccessSound === 'function') playSuccessSound();
        if (typeof triggerConfetti === 'function') triggerConfetti();
    } else {
        // حالة التعادل
        titleEl.innerText = "تعادل أسطوري! 🤝";
        titleEl.style.color = "var(--accent-gold)";
        emojiEl.innerText = "⚖️";
        banterEl.innerHTML = `مفيش حد قدر يحط على التاني! الفريقين طلعوا حبايب ومستواهم متقارب جداً.. لازم ماتش فاصل! 🔥`;
        
        if (typeof playSuccessSound === 'function') playSuccessSound();
    }

    openModal('modal-risk-result');
}

// دالة لإنهاء الماتش وإغلاق النافذة والعودة للصفحة السابقة
function finishRiskMatchFully() {
    if (typeof playClickSound === 'function') playClickSound();
    closeModal('modal-risk-result');
    navigateBack();
}

// ==========================================
// ====== تحدي تخمين الصورة 📱 ======
// ==========================================
let allGuessData = {}; 
let allCategoryItems = []; // هيشيل كل صور التصنيف ويتحذف منه اللي تلعب لمنع التكرار
let currentRoundItems = []; // هيشيل الـ 5 صور بتوع الجولة الحالية بس
let gScore = 0;
let gIndex = 0;

async function openGuessGame() {
    navigateTo('view-guess-game', 'تخمين الصورة 📱', 'تحدي الشلة');
    showGuessScreen('categories');

    const CACHE_KEY = 'cache_guess_game_data';
    const VERSION_KEY = 'cache_guess_version';

    try {
        // 1. فحص رقم الإصدار فقط (~20 بايت)
        const verSnap = await firebase.database().ref('guess_game_version').once('value');
        const serverVersion = verSnap.val() || 1;
        const localVersion = parseInt(localStorage.getItem(VERSION_KEY) || '0');
        const cachedData = localStorage.getItem(CACHE_KEY);

        // 2. إذا كان الإصدار متطابقاً والبيانات موجودة، لا تسحب شيئاً من فايربيز (0 بايت)
        if (cachedData && localVersion === serverVersion) {
            allGuessData = JSON.parse(cachedData);
            renderGuessCats();
            return;
        }

        // 3. إذا كان هناك تحديث أو أول فتح، نسحب البيانات لمرة واحدة ونخزنها
        const snapshot = await firebase.database().ref('guess_game').once('value');
        allGuessData = snapshot.val() || {};
        localStorage.setItem(CACHE_KEY, JSON.stringify(allGuessData));
        localStorage.setItem(VERSION_KEY, serverVersion.toString());
        renderGuessCats();

    } catch (err) {
        console.error("خطأ في جلب بيانات التخمين:", err);
        // في حال عدم وجود اتصال، نفتح من الكاش القديم إن وجد
        const fallback = localStorage.getItem(CACHE_KEY);
        if (fallback) {
            allGuessData = JSON.parse(fallback);
            renderGuessCats();
        } else {
            alert("فشل التحميل، يرجى التأكد من اتصال الإنترنت");
        }
    }
}

function showGuessScreen(screenId) {
    document.getElementById('guess-categories-screen').style.display = screenId === 'categories' ? 'block' : 'none';
    document.getElementById('guess-countdown-screen').style.display = screenId === 'countdown' ? 'block' : 'none';
    document.getElementById('guess-play-screen').style.display = screenId === 'play' ? 'block' : 'none';
    document.getElementById('guess-result-screen').style.display = screenId === 'result' ? 'block' : 'none';
}

function renderGuessCats() {
    const list = document.getElementById('guess-categories-list');
    if(!list) return;
    list.innerHTML = '';
    
    Object.keys(allGuessData).forEach(cat => {
        if (Object.keys(allGuessData[cat]).length > 0) {
            let btn = document.createElement('button');
            btn.className = 'btn-submit';
            btn.style.background = 'var(--card-gradient)';
            btn.style.border = '1px solid var(--accent-emerald)';
            btn.style.color = 'var(--text-main)';
            btn.style.padding = '18px 10px';
            btn.innerText = cat;
            // لما يختار التصنيف، بننادي دالة تحضير التصنيف
            btn.onclick = () => selectGuessCategory(cat); 
            list.appendChild(btn);
        }
    });
}

// 1. خلط المصفوفة عشوائياً
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 2. التحميل المسبق للصور (Preloading) عشان تظهر في لحظتها
function preloadImages(items) {
    items.forEach(item => {
        if (item.imgUrl && item.imgUrl.trim() !== "") {
            const img = new Image();
            img.src = item.imgUrl;
        }
    });
}

// 3. تحضير التصنيف المختار وسحب كل الصور
function selectGuessCategory(cat) {
    const itemsObj = allGuessData[cat] || {};
    // بنسحب كل العناصر ما عدا الترحيبي ونخلطهم عشوائياً
    allCategoryItems = Object.values(itemsObj).filter(item => item.name !== "عنصر ترحيبي");
    allCategoryItems = shuffleArray(allCategoryItems);
    
    document.getElementById('guess-current-category').innerText = cat;
    
    // نبدأ أول جولة
    startNewGuessRound();
}

// 4. بدء جولة جديدة (5 صور)
function startNewGuessRound() {
    // لو المصفوفة فضيت، يبقى خلصوا كل الصور اللي في التصنيف
    if (allCategoryItems.length === 0) {
        alert("عاش يا وحوش! خلصتوا كل الصور اللي في التصنيف ده 🏆");
        openGuessGame(); // نرجعهم لشاشة التصنيفات
        return;
    }

    // نسحب أول 5 صور ونحذفهم من المصفوفة الأساسية (لمنع التكرار)
    currentRoundItems = allCategoryItems.splice(0, 5);
    
    gScore = 0; 
    gIndex = 0;
    document.getElementById('guess-score').innerText = gScore;

    // نحمل الـ 5 صور في الخلفية قبل ما الجولة تبدأ
    preloadImages(currentRoundItems);
    
    // نعرض شاشة الفاصل لأول صورة
    showGuessTransitionScreen();
}

// 5. شاشة الفاصل الزمني (5 ثواني للتبديل)
function showGuessTransitionScreen() {
    showGuessScreen('countdown');
    
    let count = 5;
    document.getElementById('guess-countdown-number').innerText = count;
    
    let cntInt = setInterval(() => {
        count--;
        if(count > 0) {
            document.getElementById('guess-countdown-number').innerText = count;
        } else {
            clearInterval(cntInt);
            loadNextGuessWord(); // بعد الـ 5 ثواني نظهر الصورة
        }
    }, 1000);
}

// 6. عرض الصورة والكلمة
function loadNextGuessWord() {
    showGuessScreen('play');
    const currentItem = currentRoundItems[gIndex];
    document.getElementById('guess-current-word').innerText = currentItem.name;
    const imgEl = document.getElementById('guess-current-img');
    
    if (currentItem.imgUrl && currentItem.imgUrl.trim() !== "") {
        imgEl.src = currentItem.imgUrl;
        imgEl.style.display = 'block';
    } else {
        imgEl.style.display = 'none';
    }
}

// 7. التقليب للسؤال التالي
function nextGuessWord(isCorrect) {
    if(isCorrect) {
        gScore++;
        document.getElementById('guess-score').innerText = gScore;
    }
    
    gIndex++;

    // هل خلصنا الـ 5 صور بتوع الجولة؟
    if(gIndex >= currentRoundItems.length) {
        finishGuessRound();
    } else {
        // لو لسه الجولة شغالة، نعرض فاصل الـ 5 ثواني عشان يلفوا الموبايل
        showGuessTransitionScreen();
    }
}

// 8. إنهاء الجولة الحالية
function finishGuessRound() {
    showGuessScreen('result');
    document.getElementById('guess-final-score').innerText = gScore;
}

// 9. دالة لعب جولة إضافية من نفس التصنيف
function playAnotherGuessRound() {
    startNewGuessRound();
}

// ================= الأدمن =================
function loadAdminGuessCategories() {
    firebase.database().ref('guess_game').once('value').then((snapshot) => {
        const data = snapshot.val() || {};
        
        // 1. القائمة المفردة القديمة
        const select = document.getElementById('admin-guess-cat-select');
        if(select) {
            select.innerHTML = '<option value="">اختر التصنيف...</option>';
            Object.keys(data).forEach(cat => {
                let opt = document.createElement('option'); opt.value = cat; opt.innerText = cat;
                select.appendChild(opt);
            });
        }

        // 2. القائمة الجماعية الجديدة (نفس الكود عشان تظهر معاهم)
        const bulkSelect = document.getElementById('admin-bulk-guess-cat-select');
        if(bulkSelect) {
            bulkSelect.innerHTML = '<option value="">اختر التصنيف أولاً...</option>';
            Object.keys(data).forEach(cat => {
                let opt = document.createElement('option'); opt.value = cat; opt.innerText = cat;
                bulkSelect.appendChild(opt);
            });
        }
    });
}

function addNewGuessCategory() {
    const inputEl = document.getElementById('new-guess-cat-name');
    const catName = inputEl.value.trim();
    if(!catName) return alert('اكتب اسم القسم!');
    
    firebase.database().ref('guess_game/' + catName).push({ name: "عنصر ترحيبي", imgUrl: "" }).then(() => {
        alert('تمت إضافة القسم!'); inputEl.value = ''; loadAdminGuessCategories();
    });
}

function addGuessItem() {
    const cat = document.getElementById('admin-guess-cat-select').value;
    const name = document.getElementById('new-guess-item-name').value.trim();
    const url = document.getElementById('new-guess-item-url').value.trim();
    if (!cat || !name) return alert('اختر قسم واكتب اسم!');

    firebase.database().ref('guess_game/' + cat).push({ name: name, imgUrl: url }).then(() => {
        // زيادة الإصدار تلقائياً لتحديث هواتف الطلاب
        firebase.database().ref('guess_game_version').transaction(v => (v || 1) + 1);
        alert('تم الحفظ!');
        document.getElementById('new-guess-item-name').value = '';
        document.getElementById('new-guess-item-url').value = '';
        loadAdminCategoryItems(); 
    });
}

function loadAdminCategoryItems() {
    const cat = document.getElementById('admin-guess-cat-select').value;
    const list = document.getElementById('admin-guess-items-list');
    if(!cat) return list.innerHTML = '';
    
    list.innerHTML = 'جاري التحميل...';
    firebase.database().ref('guess_game/' + cat).once('value').then(snapshot => {
        const items = snapshot.val() || {}; list.innerHTML = '';
        Object.keys(items).forEach(key => {
            const item = items[key];
            if (item.name !== "عنصر ترحيبي") {
                list.innerHTML += `
                    <div style="display: flex; justify-content: space-between; background: var(--bg-primary); padding: 10px; border-radius: 8px; border: 1px solid var(--border-card);">
                        <span>${item.name} ${item.imgUrl ? '🖼️' : ''}</span>
                        <button onclick="deleteGuessItem('${cat}', '${key}')" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: none; padding: 5px 10px; border-radius: 6px;">حذف</button>
                    </div>`;
            }
        });
    });
}

function deleteGuessItem(cat, key) {
    if (confirm('حذف هذا العنصر نهائياً؟')) {
        firebase.database().ref(`guess_game/${cat}/${key}`).remove().then(() => {
            // زيادة الإصدار تلقائياً بعد الحذف
            firebase.database().ref('guess_game_version').transaction(v => (v || 1) + 1);
            loadAdminCategoryItems();
        });
    }
}

async function uploadBulkGuessItems() {
    const catId = document.getElementById('admin-bulk-guess-cat-select').value;
    const rawText = document.getElementById('admin-bulk-guess-input').value.trim();

    if (!catId) return alert("برجاء اختيار التصنيف أولاً ⚠️");
    if (!rawText) return alert("برجاء كتابة العناصر بصيغة (الاسم # الرابط) ⚠️");

    const lines = rawText.split('\n');
    const uploadPromises = [];
    let validCount = 0;

    lines.forEach(line => {
        const parts = line.split('#');
        if (parts.length >= 2) {
            const name = parts[0].trim();
            const imageUrl = parts[1].trim();

            if (name && imageUrl) {
                validCount++;
                const promise = firebase.database().ref(`guess_game/${catId}`).push({
                    name: name,
                    imgUrl: imageUrl,
                    createdAt: Date.now()
                });
                uploadPromises.push(promise);
            }
        }
    });

    if (uploadPromises.length === 0) {
        return alert("تأكد من الصيغة الصحيحة: الاسم # الرابط ❌");
    }

    try {
        // انتظار انتهاء رفع كافة العناصر في السيرفر
        await Promise.all(uploadPromises);

        // زيادة رقم الإصدار في فايربيز ليتم تحديث هواتف كل الطلاب فوراً
        await firebase.database().ref('guess_game_version').transaction(v => (v || 1) + 1);

        alert(`تم رفع ${validCount} عنصر بنجاح وتحديث إصدار اللعبة! 🚀`);
        document.getElementById('admin-bulk-guess-input').value = '';

        if (typeof loadAdminCategoryItems === 'function') {
            loadAdminCategoryItems();
        }
    } catch (err) {
        console.error(err);
        alert("حدث خطأ أثناء الرفع للسيرفر");
    }
}

// ==========================================
// ====== تحدي التوقيت الداخلي (الأطوار المتعددة) ======
// ==========================================
let currentTimeMode = 'random'; // 'random', 'custom', 'safezone'
let targetSeconds = 3.0; 
let startTime = 0;
let isTimingRunning = false;

// متغيرات طور الـ Safe Zone التراكمي
let safeZoneLimit = 30.0;
let safeZoneAccumulated = 0.0;
let safeZonePlayerCount = 1;

// 1. التبديل بين الأطوار
function switchTimeMode(mode) {
    currentTimeMode = mode;
    isTimingRunning = false;

    // تحديث أزرار التبويب
    document.querySelectorAll('#view-time-challenge .auth-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-mode-${mode}`).classList.add('active');

    // تصفير الزر والنتائج
    const btn = document.getElementById('time-btn');
    btn.classList.remove('running');
    btn.innerText = "ابدأ 🚀";
    document.getElementById('time-result-box').style.visibility = 'hidden';

    // التحكم في العناصر حسب الطور
    const customBox = document.getElementById('custom-time-input-box');
    const safeZoneBox = document.getElementById('safezone-status-box');
    const badgeEl = document.getElementById('time-mode-badge');
    const labelEl = document.getElementById('time-target-label');
    const displayEl = document.getElementById('target-time-display');

    if (mode === 'random') {
        customBox.style.display = 'none';
        safeZoneBox.style.display = 'none';
        badgeEl.innerText = "طور العشوائي 🎲";
        labelEl.innerText = "اضغط بعد مرور:";
        initNewTimeRound();
    } 
    else if (mode === 'custom') {
        customBox.style.display = 'block';
        safeZoneBox.style.display = 'none';
        badgeEl.innerText = "طور التحدي اليدوي 🎯";
        labelEl.innerText = "الهدف المحدد يدوياً:";
        targetSeconds = 5.0;
        displayEl.innerText = "5 ثواني";
    } 
    else if (mode === 'safezone') {
        customBox.style.display = 'none';
        safeZoneBox.style.display = 'block';
        badgeEl.innerText = "طور منطقة الأمان (Safe Zone) 💣";
        labelEl.innerText = "القنبلة هتفرقع بعد:";
        initSafeZoneRound();
    }
}

// 2. توليد أوقات الطور الفردي العشوائي
function generateTargetTime() {
    let baseNumber = (Math.random() < 0.90) 
        ? Math.floor(Math.random() * 10) + 1 
        : Math.floor(Math.random() * 10) + 11;

    let finalTime = baseNumber;
    if (Math.random() < 0.15 && baseNumber < 15) finalTime += 0.5;
    return finalTime;
}

function initNewTimeRound() {
    if (currentTimeMode === 'random') {
        targetSeconds = generateTargetTime();
        document.getElementById('target-time-display').innerText = `${targetSeconds} ثانية`;
    }
}

// 3. ضبط الوقت اليدوي
function setCustomTargetTime() {
    const val = parseFloat(document.getElementById('custom-seconds-input').value);
    if (!val || val <= 0) {
        showTopToast("اكتب رقم ثواني صحيح يا بطل! ⏱️", "error");
        return;
    }
    targetSeconds = val;
    document.getElementById('target-time-display').innerText = `${targetSeconds} ثانية`;
    showTopToast(`تم تثبيت الهدف على ${targetSeconds} ثانية 🎯`, "success");
}

// 4. تجهيز جولة Safe Zone جديدة
function initSafeZoneRound() {
    safeZoneLimit = Math.floor(Math.random() * 36) + 15; 
    safeZoneAccumulated = 0.0;

    document.getElementById('target-time-display').innerText = `${safeZoneLimit} ثانية`;
    document.getElementById('safezone-limit-display').innerText = safeZoneLimit;
}

// 5. الضغط والتحكم بالزر
function handleTimeClick() {
    const btn = document.getElementById('time-btn');
    const resultBox = document.getElementById('time-result-box');

    // الضغطة الأولى: البداية
    if (!isTimingRunning) {
        isTimingRunning = true;
        startTime = performance.now();
        
        resultBox.style.visibility = 'hidden';
        btn.classList.add('running');
        btn.innerText = (currentTimeMode === 'safezone') ? "وقف واديه للي بعدك! " : "احسب ودوس! ";
    } 
    // الضغطة الثانية: الإيقاف
    else {
        isTimingRunning = false;
        const endTime = performance.now();
        const turnSeconds = parseFloat(((endTime - startTime) / 1000).toFixed(2));
        
        btn.classList.remove('running');
        btn.innerText = "ابدأ 🚀";

        if (currentTimeMode === 'safezone') {
            handleSafeZoneTurn(turnSeconds);
        } else {
            showTimingResults(turnSeconds);
            if (currentTimeMode === 'random') initNewTimeRound();
        }
    }
}

// معالجة طور الـ Safe Zone التراكمي (أعمى بدون كشف الوقت المحروق)
function handleSafeZoneTurn(turnSeconds) {
    safeZoneAccumulated = parseFloat((safeZoneAccumulated + turnSeconds).toFixed(2));
    
    const resultBox = document.getElementById('time-result-box');
    const userScoreEl = document.getElementById('user-time-score');
    const badgeEl = document.getElementById('time-rank-badge');
    const subTitleEl = document.getElementById('user-time-subtitle');

    resultBox.style.visibility = 'visible';

    // تم تجاوز الحد (انفجار القنبلة وخسارة اللاعب)
    if (safeZoneAccumulated >= safeZoneLimit) {
        // تشغيل الاهتزاز والصوت فوراً
        triggerBombExplosionEffects();

        subTitleEl.innerText = "فرقعت في إيدك! 💥";
        userScoreEl.innerText = `${safeZoneAccumulated} ثانية`;
        
        badgeEl.innerText = `💥 بوم! الوقت عدا الـ ${safeZoneLimit} ثانية.. أنت الخسران! 😂`;
        badgeEl.style.background = "rgba(239, 68, 68, 0.25)";
        badgeEl.style.color = "#ef4444";
        
        // إعادة تهيئة جولة جديدة بعد 4 ثوانٍ
        setTimeout(initSafeZoneRound, 4000);
    } 
    // لسه في منطقة الأمان (SAFE)
    else {
        subTitleEl.innerText = "النتيجة:";
        userScoreEl.innerText = `SAFE 🟢`;
        
        badgeEl.innerText = "أنت في أمان! جات سليمة.. باصي الموبايل للي بعدك 🔄";
        badgeEl.style.background = "rgba(16, 185, 129, 0.2)";
        badgeEl.style.color = "#10b981";
    }
}

// تقييم النتيجة للأطوار العادية
function showTimingResults(actual) {
    const resultBox = document.getElementById('time-result-box');
    const userScoreEl = document.getElementById('user-time-score');
    const badgeEl = document.getElementById('time-rank-badge');
    const subTitleEl = document.getElementById('user-time-subtitle');
    
    resultBox.style.visibility = 'visible';
    subTitleEl.innerText = "أنت ضغطت بعد:";
    userScoreEl.innerText = `${actual} ثانية`;

    const diff = Math.abs(actual - targetSeconds);

    if (diff <= 0.08) {
        badgeEl.innerText = "خارق! ساعة ذرية 🤯🔥";
        badgeEl.style.background = "rgba(16, 185, 129, 0.2)";
        badgeEl.style.color = "#10b981";
    } else if (diff <= 0.25) {
        badgeEl.innerText = "أسطورة! قريب جداً 🎯";
        badgeEl.style.background = "rgba(59, 130, 246, 0.2)";
        badgeEl.style.color = "#3b82f6";
    } else if (diff <= 0.6) {
        badgeEl.innerText = "محاولة كويسة، ركز أكتر ⏱️";
        badgeEl.style.background = "rgba(245, 158, 11, 0.2)";
        badgeEl.style.color = "#f59e0b";
    } else {
        badgeEl.innerText = "بعيد خالص! محتاج تدريب 😴😂";
        badgeEl.style.background = "rgba(239, 68, 68, 0.2)";
        badgeEl.style.color = "#ef4444";
    }
}

function openTimeChallengeGame() {
    navigateTo('view-time-challenge', 'الساعة البيولوجية ⏱️', 'تحدي الشلة');
    switchTimeMode('random');
}
// تعريف كائن الصوت الخاص بانفجار السيف زون
const bombExplodeSound = new Audio('explosion.mp3');

// دالة تشغيل المؤثرات (اهتزاز + صوت)
function triggerBombExplosionEffects() {
    if (navigator.vibrate) {
        navigator.vibrate([300, 100, 500]);
    }

    if (typeof isMuted === 'undefined' || !isMuted) {
        bombExplodeSound.currentTime = 0;
        bombExplodeSound.play().catch(err => {
            console.log("Audio play error:", err);
        });
    }
}

// ================= محرك النقطة الحمراء (صفر استهلاك داتا) =================
let globalContentMarkers = {};

function listenToContentMarkers() {
    db.ref('content_markers').on('value', snap => {
        globalContentMarkers = snap.val() || {};
        updateAllRedDots();
    });
}

function hasUnseenContent(subKey = null, typ = null, cat = null) {
    for (let key in globalContentMarkers) {
        let match = true;
        if (subKey && !key.startsWith(subKey)) match = false;
        if (typ && !key.includes(`_${typ}_`)) match = false;
        if (cat && !key.endsWith(`_${cat}`)) match = false;

        if (match) {
            const markerTime = globalContentMarkers[key];
            const lastSeen = localStorage.getItem('seen_marker_' + key) || 0;
            if (markerTime > parseInt(lastSeen)) return true;
        }
    }
    return false;
}

function updateAllRedDots() {
    // 1. النقطة على كارت المحتوى العلمي في الرئيسية
    const homeCard = document.querySelector('[onclick*="view-term-subjects"]');
    if (homeCard) {
        let dot = document.getElementById('home-science-dot');
        if (!dot) {
            dot = document.createElement('span');
            dot.id = 'home-science-dot';
            dot.style.cssText = 'position:absolute; top:12px; left:12px; width:12px; height:12px; background:#ef4444; border-radius:50%; box-shadow:0 0 8px #ef4444; z-index:10;';
            homeCard.appendChild(dot);
        }
        dot.style.display = hasUnseenContent() ? 'block' : 'none';
    }

    // 2. النقطة على كروت المواد (مع تأمين فحص السمة)
    document.querySelectorAll('.subject-card').forEach(card => {
        const onclickAttr = card.getAttribute('onclick');
        if (onclickAttr) {
            const match = onclickAttr.match(/openSubject\(['"]([^'"]+)['"]\)/);
            if (match && match[1]) {
                const safeKey = getSafeSubjectKey(match[1]);
                let dot = card.querySelector('.subject-dot');
                if (!dot) {
                    dot = document.createElement('span'); 
                    dot.className = 'subject-dot';
                    dot.style.cssText = 'position:absolute; top:12px; left:12px; width:12px; height:12px; background:#ef4444; border-radius:50%; box-shadow:0 0 8px #ef4444; z-index:10;';
                    card.appendChild(dot);
                }
                dot.style.display = hasUnseenContent(safeKey) ? 'block' : 'none';
            }
        }
    });

    // 3. النقطة على النظري والعملي والأقسام
    if (currentActiveSubject) {
        const safeKey = getSafeSubjectKey(currentActiveSubject);
        
        ['theory', 'practical'].forEach(t => {
            const btn = document.querySelector(`[onclick="openSubjectTypeDetails('${t}')"]`);
            if (btn) {
                let dot = btn.querySelector('.type-dot');
                if (!dot) {
                    dot = document.createElement('span'); 
                    dot.className = 'type-dot';
                    dot.style.cssText = 'position:absolute; top:10px; left:10px; width:12px; height:12px; background:#ef4444; border-radius:50%; box-shadow:0 0 8px #ef4444; z-index:10;';
                    btn.style.position = 'relative'; 
                    btn.appendChild(dot);
                }
                dot.style.display = hasUnseenContent(safeKey, t) ? 'block' : 'none';
            }
        });

        if (currentActiveType) {
            ['lectures', 'summaries', 'quizzes'].forEach(c => {
                const btn = document.querySelector(`[onclick="openDynamicContentList('${c}')"]`);
                if (btn) {
                    let dot = btn.querySelector('.cat-dot');
                    if (!dot) {
                        dot = document.createElement('span'); 
                        dot.className = 'cat-dot';
                        dot.style.cssText = 'position:absolute; top:10px; left:10px; width:12px; height:12px; background:#ef4444; border-radius:50%; box-shadow:0 0 8px #ef4444; z-index:10;';
                        btn.style.position = 'relative'; 
                        btn.appendChild(dot);
                    }
                    dot.style.display = hasUnseenContent(safeKey, currentActiveType, c) ? 'block' : 'none';
                }
            });
        }
    }
}

// ================= محرك النقطة الحمراء للمحتوى العلمي (المؤمن) =================
function updateAllRedDots() {
    const homeCard = document.querySelector('[onclick*="view-term-subjects"]');
    if (homeCard) {
        let dot = document.getElementById('home-science-dot');
        if (!dot) {
            dot = document.createElement('span');
            dot.id = 'home-science-dot';
            dot.style.cssText = 'position:absolute; top:12px; left:12px; width:12px; height:12px; background:#ef4444; border-radius:50%; box-shadow:0 0 8px #ef4444; z-index:10;';
            homeCard.appendChild(dot);
        }
        dot.style.display = hasUnseenContent() ? 'block' : 'none';
    }

    document.querySelectorAll('.subject-card').forEach(card => {
        const onclickAttr = card.getAttribute('onclick');
        if (onclickAttr) {
            const match = onclickAttr.match(/openSubject\(['"]([^'"]+)['"]\)/);
            if (match && match[1]) {
                const safeKey = getSafeSubjectKey(match[1]);
                let dot = card.querySelector('.subject-dot');
                if (!dot) {
                    dot = document.createElement('span');
                    dot.className = 'subject-dot';
                    dot.style.cssText = 'position:absolute; top:12px; left:12px; width:12px; height:12px; background:#ef4444; border-radius:50%; box-shadow:0 0 8px #ef4444; z-index:10;';
                    card.appendChild(dot);
                }
                dot.style.display = hasUnseenContent(safeKey) ? 'block' : 'none';
            }
        }
    });

    if (currentActiveSubject) {
        const safeKey = getSafeSubjectKey(currentActiveSubject);
        
        ['theory', 'practical'].forEach(t => {
            const btn = document.querySelector(`[onclick="openSubjectTypeDetails('${t}')"]`);
            if (btn) {
                let dot = btn.querySelector('.type-dot');
                if (!dot) {
                    dot = document.createElement('span');
                    dot.className = 'type-dot';
                    dot.style.cssText = 'position:absolute; top:10px; left:10px; width:12px; height:12px; background:#ef4444; border-radius:50%; box-shadow:0 0 8px #ef4444; z-index:10;';
                    btn.style.position = 'relative';
                    btn.appendChild(dot);
                }
                dot.style.display = hasUnseenContent(safeKey, t) ? 'block' : 'none';
            }
        });

        if (currentActiveType) {
            ['lectures', 'summaries', 'quizzes'].forEach(c => {
                const btn = document.querySelector(`[onclick="openDynamicContentList('${c}')"]`);
                if (btn) {
                    let dot = btn.querySelector('.cat-dot');
                    if (!dot) {
                        dot = document.createElement('span');
                        dot.className = 'cat-dot';
                        dot.style.cssText = 'position:absolute; top:10px; left:10px; width:12px; height:12px; background:#ef4444; border-radius:50%; box-shadow:0 0 8px #ef4444; z-index:10;';
                        btn.style.position = 'relative';
                        btn.appendChild(dot);
                    }
                    dot.style.display = hasUnseenContent(safeKey, currentActiveType, c) ? 'block' : 'none';
                }
            });
        }
    }
}

// ================= محرك النقطة الحمراء للمنظم الأكاديمي =================
let globalAcademicMarkers = {};

function listenToAcademicMarkers() {
    db.ref('academic_markers').on('value', snap => {
        globalAcademicMarkers = snap.val() || {};
        updateAcademicRedDots();
    });
}

function hasUnseenAcademicContent(tabKey = null) {
    if (tabKey) {
        const markerTime = globalAcademicMarkers[tabKey] || 0;
        const lastSeen = localStorage.getItem('seen_acad_marker_' + tabKey) || 0;
        return markerTime > parseInt(lastSeen);
    }
    for (let key of ['tasks', 'schedules', 'alerts']) {
        const markerTime = globalAcademicMarkers[key] || 0;
        const lastSeen = localStorage.getItem('seen_acad_marker_' + key) || 0;
        if (markerTime > parseInt(lastSeen)) return true;
    }
    return false;
}

function updateAcademicRedDots() {
    const acadHomeCard = document.querySelector('[onclick*="openAcademicHub()"]');
    if (acadHomeCard) {
        let dot = document.getElementById('home-acad-dot');
        if (!dot) {
            dot = document.createElement('span');
            dot.id = 'home-acad-dot';
            dot.style.cssText = 'position:absolute; top:12px; left:12px; width:12px; height:12px; background:#ef4444; border-radius:50%; box-shadow:0 0 8px #ef4444; z-index:10;';
            acadHomeCard.style.position = 'relative'; 
            acadHomeCard.appendChild(dot);
        }
        dot.style.display = hasUnseenAcademicContent() ? 'block' : 'none';
    }

    ['tasks', 'schedules', 'alerts'].forEach(tab => {
        const tabBtn = document.getElementById(`tab-acad-${tab}`);
        if (tabBtn) {
            let dot = tabBtn.querySelector('.acad-tab-dot');
            if (!dot) {
                dot = document.createElement('span');
                dot.className = 'acad-tab-dot';
                dot.style.cssText = 'width:8px; height:8px; background:#ef4444; border-radius:50%; display:inline-block; margin-right:4px; box-shadow:0 0 6px #ef4444; vertical-align: middle;';
                tabBtn.appendChild(dot);
            }
            dot.style.display = hasUnseenAcademicContent(tab) ? 'inline-block' : 'none';
        }
    });
}

// ================= محرك الإشعارات الذكي (استهلاك صفر داتا) =================
let cachedNotificationsList = [];

// استدعاء المراقبة برقم الإصدار فقط (خفيف جداً)
function listenToAppNotifications() {
    db.ref('settings/notifications_version').on('value', async (snap) => {
        const serverVersion = snap.val() || 1;
        const localVersion = localStorage.getItem('local_notif_version');
        const localData = localStorage.getItem('local_notifications_data');

        // لو رقم الإصدار متطابق والداتا متخزنة محلياً، لا يسحب من السيرفر نهائياً
        if (localData && String(localVersion) === String(serverVersion)) {
            cachedNotificationsList = JSON.parse(localData);
            updateNotificationsBadgeUI();
            return;
        }

        // لو نزل إشعار جديد أو أول مرة يفتح، نسحب آخر 20 إشعار فقط لمرة واحدة
        try {
            const notifsSnap = await db.ref('app_notifications').limitToLast(20).once('value');
            let list = [];
            if (notifsSnap.exists()) {
                notifsSnap.forEach(child => {
                    list.push({ id: child.key, ...child.val() });
                });
            }
            list.reverse(); // من الأحدث للأقدم
            cachedNotificationsList = list;
            localStorage.setItem('local_notifications_data', JSON.stringify(list));
            localStorage.setItem('local_notif_version', serverVersion);
            updateNotificationsBadgeUI();
        } catch (e) {
            console.error("Error loading notifications:", e);
        }
    });
}

// حساب عدد الإشعارات التي لم يرها الطالب وتحديث رقم البادج
function updateNotificationsBadgeUI() {
    const badge = document.getElementById('notif-unread-badge');
    if (!badge) return;

    const seenIds = JSON.parse(localStorage.getItem('seen_notif_ids') || '[]');
    // استخراج الإشعارات غير المقروءة
    const unreadList = cachedNotificationsList.filter(n => !seenIds.includes(n.id));
    const unreadCount = unreadList.length;

    if (unreadCount > 0) {
        badge.innerText = unreadCount > 9 ? '+9' : unreadCount;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}

// فتح شاشة الإشعارات وتحديد الكل كمقروء محلياً
function openNotificationsCenter() {
    if (typeof playClickSound === 'function') playClickSound();
    navigateTo('view-notifications', 'مركز الإشعارات 🔔', 'التنبيهات والتحديثات الجديدة');
    renderNotificationsListDOM();

    // حفظ جميع المعرفات الحالية كمقروءة فوراً في جهاز الطالب
    const allIds = cachedNotificationsList.map(n => n.id);
    localStorage.setItem('seen_notif_ids', JSON.stringify(allIds));
    
    // إخفاء العداد فوراً
    const badge = document.getElementById('notif-unread-badge');
    if (badge) badge.style.display = 'none';
}

// بناء كروت الإشعارات في الواجهة
function renderNotificationsListDOM() {
    const container = document.getElementById('notifications-container');
    if (!container) return;

    if (cachedNotificationsList.length === 0) {
        container.innerHTML = `
        <div class="acad-glass-card" style="text-align: center; padding: 30px 15px;">
            <span style="font-size: 2.5rem; display: block; margin-bottom: 8px;">📭</span>
            <p style="color: var(--text-sub); font-weight: 800;">لا توجد إشعارات جديدة حالياً.</p>
        </div>`;
        return;
    }

    let html = '';
    cachedNotificationsList.forEach(n => {
        const dateStr = n.timestamp ? new Date(n.timestamp).toLocaleString('ar-EG', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : 'الآن';

        html += `
        <div class="acad-glass-card" style="margin-bottom: 0; padding: 14px; text-align: right;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="color: var(--accent-gold); font-size: 0.95rem; font-weight: 900;">🔔 ${n.title}</span>
                <span style="font-size: 0.72rem; color: var(--text-sub); font-weight: 700;">${dateStr}</span>
            </div>
            <p style="font-size: 0.85rem; color: var(--text-main); line-height: 1.6; margin: 0 0 8px 0; font-weight: 600;">${n.body}</p>
            ${n.url ? `
                <button class="btn-action-glow btn-download-file" style="padding: 5px 12px; font-size: 0.75rem;" onclick="window.open('${n.url}', '_blank')">
                    فتح الرابط المرفق 🔗
                </button>
            ` : ''}
        </div>`;
    });

    container.innerHTML = html;
}

// ================= إدارة الإشعارات (لوحة الأدمن) =================

// عرض الإشعارات السابقة في لوحة الأدمن
function loadAdminNotificationsHistory() {
    const container = document.getElementById('admin-notifs-history-list');
    if (!container) return;

    container.innerHTML = '<p style="text-align: center; color: var(--text-sub); font-size: 0.85rem;">جاري تحميل الإشعارات... ⏳</p>';

    db.ref('app_notifications').limitToLast(30).once('value', (snap) => {
        if (!snap.exists()) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-sub); font-size: 0.85rem;">لا توجد إشعارات سابقة حتى الآن.</p>';
            return;
        }

        let list = [];
        snap.forEach(child => {
            list.push({ id: child.key, ...child.val() });
        });
        list.reverse(); // من الأحدث للأقدم

        let html = '';
        list.forEach(n => {
            const dateStr = n.timestamp ? new Date(n.timestamp).toLocaleString('ar-EG', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            }) : 'حديث';

            const safeTitle = (n.title || '').replace(/'/g, "\\'");
            const safeBody = (n.body || '').replace(/'/g, "\\'").replace(/\n/g, ' ');
            const safeUrl = (n.url || '').replace(/'/g, "\\'");

            html += `
            <div class="admin-item-card" style="flex-direction: column; align-items: flex-start; gap: 8px;">
                <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                    <span style="color: var(--accent-gold); font-weight: 900; font-size: 0.95rem;">🔔 ${n.title}</span>
                    <span style="font-size: 0.72rem; color: var(--text-sub);">${dateStr}</span>
                </div>
                <p style="font-size: 0.85rem; color: var(--text-main); margin: 0; line-height: 1.5;">${n.body}</p>
                ${n.url ? `<a href="${n.url}" target="_blank" style="font-size: 0.75rem; color: var(--accent-emerald); text-decoration: underline;">🔗 رابط المرفق</a>` : ''}
                
                <div style="display: flex; gap: 8px; width: 100%; justify-content: flex-end; border-top: 1px dashed var(--border-card); padding-top: 8px; margin-top: 4px;">
                    <button class="admin-action-btn" style="padding: 4px 12px; font-size: 0.75rem;" onclick="editAdminNotification('${n.id}', '${safeTitle}', '${safeBody}', '${safeUrl}')">تعديل ✏️</button>
                    <button class="admin-action-btn danger" style="padding: 4px 12px; font-size: 0.75rem;" onclick="deleteAdminNotification('${n.id}')">حذف 🗑️</button>
                </div>
            </div>`;
        });

        container.innerHTML = html;
    });
}

// تجهيز الحقول للتعديل
function editAdminNotification(id, title, body, url) {
    if (typeof playClickSound === 'function') playClickSound();

    document.getElementById('adm-notif-id').value = id;
    document.getElementById('adm-notif-title').value = title;
    document.getElementById('adm-notif-body').value = body;
    document.getElementById('adm-notif-url').value = url;

    document.getElementById('adm-notif-form-title').innerText = 'تعديل الإشعار ✏️';
    document.getElementById('btn-save-notif').innerText = 'حفظ التعديلات ✅';
    document.getElementById('btn-cancel-notif').style.display = 'block';

    window.scrollTo({ top: document.getElementById('adm-notif-title').offsetTop - 100, behavior: 'smooth' });
}

// إلغاء التعديل والرجوع لحالة النشر الجديد
function cancelEditNotification() {
    document.getElementById('adm-notif-id').value = '';
    document.getElementById('adm-notif-title').value = '';
    document.getElementById('adm-notif-body').value = '';
    document.getElementById('adm-notif-url').value = '';

    document.getElementById('adm-notif-form-title').innerText = 'نشر إشعار جديد للطلاب 🔔';
    document.getElementById('btn-save-notif').innerText = 'نشر الإشعار للجميع 🚀';
    document.getElementById('btn-cancel-notif').style.display = 'none';
}

// نشر أو حفظ تعديل الإشعار
function adminPublishNotification() {
    if (typeof playClickSound === 'function') playClickSound();
    const editId = document.getElementById('adm-notif-id').value.trim();
    const title = document.getElementById('adm-notif-title').value.trim();
    const body = document.getElementById('adm-notif-body').value.trim();
    const url = document.getElementById('adm-notif-url').value.trim();

    if (!title || !body) {
        showTopToast('يرجى كتابة العنوان وتفاصيل الإشعار!', 'error');
        return;
    }

    const notifData = {
        title,
        body,
        url: url || '',
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    if (editId) {
        // حالة التعديل
        db.ref('app_notifications/' + editId).update(notifData).then(() => {
            db.ref('settings/notifications_version').transaction(v => (v || 1) + 1);
            showTopToast('تم تعديل الإشعار بنجاح! ✏️✨', 'success');
            cancelEditNotification();
            loadAdminNotificationsHistory();
        });
    } else {
        // حالة نشر إشعار جديد
        db.ref('app_notifications').push(notifData).then(() => {
            db.ref('settings/notifications_version').transaction(v => (v || 1) + 1);
            showTopToast('تم إرسال الإشعار للجميع بنجاح! 🔔🚀', 'success');
            cancelEditNotification();
            loadAdminNotificationsHistory();
        });
    }
}

// حذف الإشعار
function deleteAdminNotification(id) {
    if (typeof playClickSound === 'function') playClickSound();
    if (!confirm('هل تريد حذف هذا الإشعار نهائياً؟')) return;

    db.ref('app_notifications/' + id).remove().then(() => {
        db.ref('settings/notifications_version').transaction(v => (v || 1) + 1);
        showTopToast('تم حذف الإشعار بنجاح 🗑️', 'info');
        loadAdminNotificationsHistory();
    });
}

// =========================================================
// منظومة كارت الاقتباسات والمعلومات الديناميكي المحدثة
// =========================================================
let appQuotesList = [];
let currentQuoteActiveIndex = 0;
let quoteAutoSlideTimer = null;
let quoteScrollDebounceTimer = null;
let editingQuoteId = null;

// نصوص افتراضية تظهر فوراً لضمان عدم بقاء الكارت فارغاً تحت أي ظرف
const defaultQuotesFallback = [
    {
        category: 'عبرة وحكمة',
        title: 'تيسير وتوفيق',
        text: 'إِذَا وَضَعَكَ اللَّهُ فِي مَكَانٍ تَسْتَطِيعُ مِنْ خِلَالِهِ التَّيْسِيرَ عَلَى النَّاسِ، فَيَسِّرْ عَلَيْهِمْ.'
    },
    {
        category: 'معلومة عامة',
        title: 'سلامة الغذاء',
        text: 'نظام الهاسب (HACCP) هو نظام وقائي لضمان سلامة الغذاء من البداية وحتى المنتج النهائي.'
    }
];

function initDynamicQuotesFeed() {
    // 1. عرض فوري إما من الكاش المحلي أو من المحتوى الافتراضي فور فتح التطبيق
    const cached = localStorage.getItem('local_app_quotes');
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
                appQuotesList = parsed;
            } else {
                appQuotesList = [...defaultQuotesFallback];
            }
        } catch(e) {
            appQuotesList = [...defaultQuotesFallback];
        }
    } else {
        appQuotesList = [...defaultQuotesFallback];
    }

    // رسم المحتوى فوراً واستعادة آخر شريحة كان واقف عندها الطالب
    renderQuotesTrackContent();

    // 2. المزامنة المباشرة مع Firebase في الخلفية
    try {
        db.ref('daily_quotes').on('value', snap => {
            if (snap.exists()) {
                let fetched = [];
                snap.forEach(c => {
                    fetched.push({ id: c.key, ...c.val() });
                });
                fetched.reverse();
                appQuotesList = fetched;
                localStorage.setItem('local_app_quotes', JSON.stringify(appQuotesList));
            }
            renderQuotesTrackContent();
            startQuotesAutoTimer();
        });
    } catch(err) {
        console.log("Firebase Quotes Error:", err);
    }
}

// ريندر المحتوى الداخلي واستعادة مكان الوقوف السابق
function renderQuotesTrackContent() {
    const track = document.getElementById('quote-carousel-track');
    const dotsContainer = document.getElementById('quote-card-dots');
    if (!track) return;

    if (!appQuotesList || appQuotesList.length === 0) {
        appQuotesList = [...defaultQuotesFallback];
    }

    let trackHtml = '';
    appQuotesList.forEach((item, idx) => {
        trackHtml += `
        <div class="quote-content-slide" data-index="${idx}" onclick="openAllQuotesArchiveView()">
            ${item.title ? `<div class="quote-item-title">${item.title}</div>` : ''}
            <div class="quote-item-text">${item.text || ''}</div>
        </div>`;
    });

    track.innerHTML = trackHtml;

    // استعادة آخر شريحة كان المستخدم واقف عندها من ذاكرة الهاتف
    let savedIndex = parseInt(localStorage.getItem('last_active_quote_index')) || 0;
    if (savedIndex >= appQuotesList.length) savedIndex = 0;

    // التمرير مباشرة للشريحة المحفوظة بدون أنيميشن بطيء عند أول فتحة
    selectQuoteByIndex(savedIndex, false);
}

// تحديث رأس الكارت (التصنيف والأيقونة)
function updateQuoteHeaderInfo(category, customIcon) {
    const catEl = document.getElementById('quote-card-cat');
    const iconEl = document.getElementById('quote-card-icon');
    if (!catEl || !iconEl) return;

    let icon = customIcon || '💡';
    if (!customIcon) {
        if (category === 'عبرة وحكمة') icon = '🌱';
        else if (category === 'اقتباس') icon = '💬';
        else if (category === 'معلومة عامة') icon = '🌍';
        else if (category === 'راجع معايا') icon = '📝';
        else if (category === 'معلومة عالسريع') icon = '⚡';
    }

    catEl.innerText = category || 'معلومة';
    iconEl.innerText = icon;
}

// متابعة حركة التمرير باللمس على الموبايل وحفظ الموضع تلقائياً
function onQuoteTrackScroll() {
    const track = document.getElementById('quote-carousel-track');
    if (!track) return;

    clearTimeout(quoteScrollDebounceTimer);
    quoteScrollDebounceTimer = setTimeout(() => {
        const slideWidth = track.clientWidth;
        if (!slideWidth) return;

        const scrollOffset = Math.abs(track.scrollLeft);
        const closestIndex = Math.round(scrollOffset / slideWidth);

        if (closestIndex !== currentQuoteActiveIndex && closestIndex < appQuotesList.length) {
            currentQuoteActiveIndex = closestIndex;
            
            // 👈 حفظ رقم الشريحة الحالية محلياً فوراً
            localStorage.setItem('last_active_quote_index', closestIndex);
            
            updateQuoteHeaderInfo(appQuotesList[closestIndex].category);
            updateQuoteDotsUI(closestIndex);
        }
    }, 60);
}

// التنقل البرمجي لشريحة معينة مع حفظ الترتيب
function selectQuoteByIndex(index, smooth = true) {
    if (!appQuotesList || appQuotesList.length === 0) return;
    if (index >= appQuotesList.length) index = 0;

    const track = document.getElementById('quote-carousel-track');
    if (track) {
        const slideWidth = track.clientWidth;
        const scrollDirection = document.dir === 'rtl' ? -1 : 1;
        track.scrollTo({
            left: index * slideWidth * scrollDirection,
            behavior: smooth ? 'smooth' : 'auto'
        });
    }

    currentQuoteActiveIndex = index;
    
    // 👈 حفظ الشريحة في ذاكرة الهاتف
    localStorage.setItem('last_active_quote_index', index);

    if (appQuotesList[index]) {
        updateQuoteHeaderInfo(appQuotesList[index].category);
    }
    updateQuoteDotsUI(index);
    startQuotesAutoTimer();
}

// نظام نافذة الـ 5 نقاط
function updateQuoteDotsUI(activeIndex) {
    const dotsContainer = document.getElementById('quote-card-dots');
    if (!dotsContainer || !appQuotesList || appQuotesList.length <= 1) {
        if (dotsContainer) dotsContainer.innerHTML = '';
        return;
    }

    const total = appQuotesList.length;
    let dotsHtml = '';

    if (total <= 5) {
        for (let i = 0; i < total; i++) {
            dotsHtml += `<span class="q-dot ${i === activeIndex ? 'active' : ''}" onclick="selectQuoteByIndex(${i})"></span>`;
        }
    } else {
        let start = Math.max(0, activeIndex - 2);
        let end = Math.min(total - 1, start + 4);

        if (end - start < 4) {
            start = Math.max(0, end - 4);
        }

        for (let i = start; i <= end; i++) {
            let extraClass = '';
            if (i === start && start > 0) extraClass = 'edge-small';
            if (i === end && end < total - 1) extraClass = 'edge-small';

            dotsHtml += `<span class="q-dot ${i === activeIndex ? 'active' : ''} ${extraClass}" onclick="selectQuoteByIndex(${i})"></span>`;
        }
    }

    dotsContainer.innerHTML = dotsHtml;
}

// المؤقت التلقائي للتمرير
function startQuotesAutoTimer() {
    if (quoteAutoSlideTimer) clearInterval(quoteAutoSlideTimer);
    quoteAutoSlideTimer = setInterval(() => {
        if (appQuotesList && appQuotesList.length > 1) {
            const nextIdx = (currentQuoteActiveIndex + 1) % appQuotesList.length;
            selectQuoteByIndex(nextIdx, true);
        }
    }, 45000);
}

// نسخ الكارت المعروض حالياً مع معالجة آمنة للموبايل
function copyCurrentActiveQuote(event) {
    if (event) event.stopPropagation();
    if (!appQuotesList || appQuotesList.length === 0) return;
    const item = appQuotesList[currentQuoteActiveIndex];
    if (!item) return;

    const fullText = (item.title ? item.title + '\n' : '') + item.text;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fullText).then(() => {
            showTopToast('تم نسخ النص للحافظة بنجاح 📋', 'success');
        }).catch(() => fallbackCopyText(fullText));
    } else {
        fallbackCopyText(fullText);
    }
}

function fallbackCopyText(text) {
    const tempInput = document.createElement('textarea');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    showTopToast('تم نسخ النص للحافظة بنجاح 📋', 'success');
}

// مشاركة الكارت المعروض حالياً
function shareCurrentActiveQuote(event) {
    if (event) event.stopPropagation();
    if (!appQuotesList || appQuotesList.length === 0) return;
    const item = appQuotesList[currentQuoteActiveIndex];
    if (!item) return;

    const fullText = (item.title ? `*${item.title}*\n` : '') + item.text + '\n\n— تطبيق علوم الأغذية 🎓';
    if (navigator.share) {
        navigator.share({ title: item.title || 'مشاركة عبارة', text: fullText }).catch(() => {});
    } else {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(fullText)}`, '_blank');
    }
}

// الانتقال إلى واجهة الأرشيف المستقلة
function openAllQuotesArchiveView() {
    const listEl = document.getElementById('archive-quotes-list');
    if (!listEl) return;

    if (!appQuotesList || appQuotesList.length === 0) {
        listEl.innerHTML = '<p style="text-align:center; color:var(--text-sub); padding:20px;">لا توجد عناصر مضافة حالياً.</p>';
        navigateTo('view-quotes-archive', 'أرشيف الاقتباسات', 'استعراض جميع النصوص');
        return;
    }

    let html = '';
    appQuotesList.forEach(item => {
        html += `
        <div class="acad-glass-card" style="margin-bottom: 12px; padding: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span class="pill-badge badge-subject">${item.category || 'معلومة'}</span>
            </div>
            ${item.title ? `<h4 style="color: var(--accent-gold); font-size: 1rem; margin-bottom: 6px;">${item.title}</h4>` : ''}
            <p style="font-size: 0.88rem; color: var(--text-main); line-height: 1.6; white-space: pre-line;">${item.text || ''}</p>
        </div>`;
    });

    listEl.innerHTML = html;
    navigateTo('view-quotes-archive', 'أرشيف الاقتباسات', 'استعراض جميع النصوص');
}

// ================= دوال الأدمن (إضافة / تعديل / حذف) =================
function toggleCustomQuoteCatInput(val) {
    const group = document.getElementById('adm-custom-cat-group');
    if (group) group.style.display = (val === 'custom') ? 'block' : 'none';
}

function loadAdminQuotesList() {
    const list = document.getElementById('admin-quotes-list');
    if (!list) return;

    list.innerHTML = '<p style="text-align:center; color:var(--text-sub);">جاري تحميل النصوص... ⏳</p>';

    db.ref('daily_quotes').once('value', snap => {
        if (!snap.exists()) {
            list.innerHTML = '<p style="text-align:center; color:var(--text-sub);">لا توجد عناصر مضافة حتى الآن.</p>';
            return;
        }

        let html = '';
        snap.forEach(child => {
            const item = child.val();
            const id = child.key;
            html += `
            <div class="admin-item-card" style="flex-direction: column; align-items: flex-start; gap: 8px;">
                <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                    <span class="card-badge" style="background: rgba(212, 175, 55, 0.15); color: var(--accent-gold);">${item.category || 'عام'}</span>
                    <div style="display: flex; gap: 6px;">
                        <button class="admin-action-btn" style="padding: 2px 8px; font-size: 0.72rem;" onclick="adminEditQuote('${id}', '${encodeURIComponent(item.category || '')}', '${encodeURIComponent(item.title || '')}', '${encodeURIComponent(item.text || '')}')">تعديل ✏️</button>
                        <button class="admin-action-btn danger" style="padding: 2px 8px; font-size: 0.72rem;" onclick="adminDeleteQuote('${id}')">حذف 🗑️</button>
                    </div>
                </div>
                ${item.title ? `<div style="font-weight:900; color:var(--accent-emerald); font-size:0.9rem;">${item.title}</div>` : ''}
                <div style="font-size: 0.85rem; color: var(--text-main); font-weight: 600;">${item.text}</div>
            </div>`;
        });
        list.innerHTML = html;
    });
}

function adminEditQuote(id, cat, title, text) {
    editingQuoteId = id;
    const decodedCat = decodeURIComponent(cat);
    const decodedTitle = decodeURIComponent(title);
    const decodedText = decodeURIComponent(text);

    const catSelect = document.getElementById('adm-quote-cat-select');
    const customGroup = document.getElementById('adm-custom-cat-group');
    const customCatInput = document.getElementById('adm-quote-custom-cat');
    const titleInput = document.getElementById('adm-quote-title');
    const textInput = document.getElementById('adm-quote-text');

    let found = false;
    if (catSelect) {
        for (let opt of catSelect.options) {
            if (opt.value === decodedCat) {
                found = true;
                break;
            }
        }
        if (found) {
            catSelect.value = decodedCat;
            if (customGroup) customGroup.style.display = 'none';
        } else {
            catSelect.value = 'custom';
            if (customGroup) customGroup.style.display = 'block';
            if (customCatInput) customCatInput.value = decodedCat;
        }
    }

    if (titleInput) titleInput.value = decodedTitle;
    if (textInput) textInput.value = decodedText;

    const submitBtn = document.querySelector('#admin-section-quotes .btn-submit');
    if (submitBtn) {
        submitBtn.innerText = 'حفظ التعديلات ✅';
        submitBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        submitBtn.style.color = '#fff';
    }

    const formCard = document.querySelector('#admin-section-quotes .auth-card');
    if (formCard) formCard.scrollIntoView({ behavior: 'smooth' });
}

function adminSaveNewQuote() {
    playClickSound();
    const catSelect = document.getElementById('adm-quote-cat-select').value;
    const customCat = document.getElementById('adm-quote-custom-cat').value.trim();
    const finalCat = (catSelect === 'custom') ? (customCat || 'عام') : catSelect;

    const title = document.getElementById('adm-quote-title').value.trim();
    const text = document.getElementById('adm-quote-text').value.trim();

    if (!text) {
        showTopToast('يرجى كتابة نص الجملة أو الاقتباس أولاً!', 'error');
        return;
    }

    const quoteData = {
        category: finalCat,
        title: title,
        text: text,
        createdAt: Date.now()
    };

    if (editingQuoteId) {
        db.ref('daily_quotes/' + editingQuoteId).update(quoteData).then(() => {
            showTopToast('تم تعديل النص بنجاح ✅', 'success');
            resetQuoteAdminForm();
            loadAdminQuotesList();
        });
    } else {
        db.ref('daily_quotes').push(quoteData).then(() => {
            showTopToast('تم النشر في الواجهة بنجاح! 🚀', 'success');
            resetQuoteAdminForm();
            loadAdminQuotesList();
        });
    }
}

function resetQuoteAdminForm() {
    editingQuoteId = null;
    document.getElementById('adm-quote-title').value = '';
    document.getElementById('adm-quote-text').value = '';
    document.getElementById('adm-quote-custom-cat').value = '';
    document.getElementById('adm-quote-cat-select').selectedIndex = 0;

    const customGroup = document.getElementById('adm-custom-cat-group');
    if (customGroup) customGroup.style.display = 'none';

    const submitBtn = document.querySelector('#admin-section-quotes .btn-submit');
    if (submitBtn) {
        submitBtn.innerText = 'نشر في الواجهة 🚀';
        submitBtn.style.background = '';
        submitBtn.style.color = '';
    }
}

function adminDeleteQuote(id) {
    playErrorSound();
    if (confirm('هل تريد حذف هذه الجملة نهائياً؟')) {
        db.ref('daily_quotes/' + id).remove().then(() => {
            showTopToast('تم الحذف بنجاح 🗑️', 'info');
            loadAdminQuotesList();
        });
    }
}

// ================= نظام الرسائل الخاصة والهدايا الفردية =================

// 1. دالة الإرسال (للأدمن)
async function sendPrivateAlertAdmin() {
    playClickSound();
    const target = document.getElementById('admin-private-target').value.trim();
    const title = document.getElementById('admin-private-title').value.trim();
    const body = document.getElementById('admin-private-body').value.trim();
    const xpReward = parseInt(document.getElementById('admin-private-xp').value) || 0;
    const coinsReward = parseInt(document.getElementById('admin-private-coins').value) || 0;

    if (!target || !title || !body) {
        showTopToast('يرجى ملء الـ ID والعنوان والنص أولاً!', 'error');
        return;
    }

    let targetPhone = target;
    showTopToast('جاري البحث والإرسال...', 'info');

    if (target.length < 10) {
        try {
            const snap = await db.ref('users').orderByChild('student_id').equalTo(Number(target)).once('value');
            if (snap.exists()) {
                targetPhone = Object.keys(snap.val())[0];
            } else {
                showTopToast('لم يتم العثور على طالب بهذا الـ ID', 'error');
                return;
            }
        } catch(e) {
            showTopToast('حدث خطأ في البحث', 'error');
            return;
        }
    }

    const alertData = {
        title: title,
        body: body,
        xp: xpReward,
        coins: coinsReward,
        active: true,
        timestamp: Date.now()
    };

    db.ref(`users/${targetPhone}/personal_alert`).set(alertData).then(() => {
        showTopToast(xpReward > 0 || coinsReward > 0 ? 'تم إرسال الرسالة والهدية للطالب بنجاح! 🎁' : 'تم إرسال الرسالة للطالب بنجاح! 📨', 'success');
        document.getElementById('admin-private-target').value = '';
        document.getElementById('admin-private-title').value = '';
        document.getElementById('admin-private-body').value = '';
        document.getElementById('admin-private-xp').value = '';
        document.getElementById('admin-private-coins').value = '';
    }).catch(() => showTopToast('حدث خطأ أثناء الإرسال', 'error'));
}

// 2. دالة مراقبة الرسائل (للطالب)
function listenToPersonalAlerts() {
    if (!currentUser || !currentUser.phone) return;
    
    db.ref(`users/${currentUser.phone}/personal_alert`).on('value', snap => {
        if (snap.exists()) {
            const alertData = snap.val();
            if (alertData.active) {
                if (typeof playSuccessSound === 'function') playSuccessSound();
                
                document.getElementById('personal-alert-title').innerText = alertData.title;
                document.getElementById('personal-alert-body').innerText = alertData.body;
                
                const hasReward = alertData.xp > 0 || alertData.coins > 0;
                const rewardsBox = document.getElementById('personal-alert-rewards-box');
                const xpBadge = document.getElementById('personal-alert-xp-badge');
                const coinsBadge = document.getElementById('personal-alert-coins-badge');
                const actionBtn = document.getElementById('btn-personal-alert-action');
                const emojiIcon = document.getElementById('personal-alert-emoji');

                if (hasReward) {
                    emojiIcon.innerText = '🎁';
                    rewardsBox.style.display = 'block';
                    
                    if (alertData.xp > 0) {
                        xpBadge.innerText = `+${alertData.xp} XP ⚡`;
                        xpBadge.style.display = 'inline-flex';
                    } else { xpBadge.style.display = 'none'; }

                    if (alertData.coins > 0) {
                        coinsBadge.innerText = `+${alertData.coins} عملة 💸`;
                        coinsBadge.style.display = 'inline-flex';
                    } else { coinsBadge.style.display = 'none'; }

                    actionBtn.innerText = 'استلام الهدية 🎁';
                    actionBtn.style.background = 'linear-gradient(135deg, var(--accent-gold) 0%, #b38600 100%)';
                    actionBtn.onclick = () => claimPersonalAlert(alertData.xp, alertData.coins);
                    if(typeof shootStars === 'function') shootStars();
                } else {
                    emojiIcon.innerText = '📩';
                    rewardsBox.style.display = 'none';
                    actionBtn.innerText = 'حسناً، فهمت ✔️';
                    actionBtn.style.background = 'var(--accent-emerald)';
                    actionBtn.onclick = () => claimPersonalAlert(0, 0);
                }

                openModal('modal-personal-alert');
            }
        }
    });
}

// 3. استلام الرسالة/الهدية
function claimPersonalAlert(xpVal, coinsVal) {
    playClickSound();
    closeModal('modal-personal-alert');

    if (currentUser && currentUser.phone) {
        // لو فيه هدية، نضيفها للرصيد
        if (xpVal > 0 || coinsVal > 0) {
            currentUser.xp = (currentUser.xp || currentUser.points || 0) + xpVal;
            currentUser.points = currentUser.xp;
            currentUser.coins = (currentUser.coins || 0) + coinsVal;
            
            db.ref(`users/${currentUser.phone}`).update({
                xp: currentUser.xp,
                points: currentUser.xp,
                coins: currentUser.coins
            });

            updateProfileUI();
            if(typeof triggerConfetti === 'function') triggerConfetti();
            showTopToast(`مبروك! تم استلام الهدية بنجاح 🎁`, 'success');
        }

        // إغلاق التنبيه في الداتا بيز عشان ميظهرش تاني
        db.ref(`users/${currentUser.phone}/personal_alert/active`).set(false);
    }
}

// حفظ أخطاء الاختبارات في الهاتف (نحتفظ بآخر 50 خطأ لتوفير المساحة)
function saveLocalExamMistakes(newMistakes) {
    let history = JSON.parse(localStorage.getItem('my_exam_mistakes') || '[]');
    history = [...newMistakes, ...history];
    if (history.length > 50) history = history.slice(0, 50);
    localStorage.setItem('my_exam_mistakes', JSON.stringify(history));
}

// زرار تنظيف بنك الأخطاء
function clearLocalMistakes() {
    if (confirm('هل أنت متأكد من مسح جميع الأسئلة المحفوظة في بنك الأخطاء؟')) {
        playClickSound();
        localStorage.removeItem('my_exam_mistakes');
        updateStatsUI();
        showTopToast('تم تنظيف بنك الأخطاء بنجاح 🗑️', 'info');
    }
}



let pendingExamIdToStart = null;

// دالة إظهار نافذة القواعد وتجهيز البيانات
function showExamRulesConfirmation(examId) {
    if (typeof playClickSound === 'function') playClickSound();

    const examData = (window.tempLessonContentStore && window.tempLessonContentStore[examId]) ? window.tempLessonContentStore[examId] : null;

    if (!examData) {
        if (typeof showTopToast === 'function') showTopToast('تعذر العثور على بيانات الاختبار', 'error');
        return;
    }

    const duration = examData.examTime || 10;
    const xp = examData.examXP || 50;
    const title = examData.title || 'الاختبار التقييمي';
    const subject = currentActiveSubject || 'المادة الدراسية';

    // فحص ما إذا كان الطالب قد أتم هذا الاختبار مسبقاً
    const rewardedExams = (currentUser && currentUser.rewarded_exams) ? currentUser.rewarded_exams : [];
    const isCompleted = rewardedExams.includes(examId);

    // تجهيز كارت الحالة والمكافأة حسب إنجاز الطالب
    const statusCardHTML = isCompleted ? `
        <div style="background: rgba(16, 185, 129, 0.1); border: 1.5px solid var(--accent-emerald); border-radius: 12px; padding: 12px; margin-bottom: 15px; text-align: center;">
            <div style="font-size: 1.1rem; font-weight: 900; color: var(--accent-emerald); margin-bottom: 4px;">
                ✔️ الاختبار مكتمل سابقاً
            </div>
            <div style="font-size: 0.8rem; color: var(--text-sub); font-weight: 700;">
                (هذا الاختبار متاح للتدريب ومراجعة مستواك فقط، ولن تُضاف نقاط XP جديدة لرصيدك)
            </div>
        </div>
    ` : `
        <div style="display: flex; justify-content: space-around; background: rgba(255,255,255,0.03); border: 1px solid var(--border-card); border-radius: 12px; padding: 10px; margin-bottom: 15px;">
            <div style="text-align: center;">
                <span style="font-size: 0.75rem; color: var(--text-sub); display: block;">المدة المقررة</span>
                <b style="font-size: 0.95rem; color: #ef4444;">⏱️ ${duration} دقيقة</b>
            </div>
            <div style="text-align: center;">
                <span style="font-size: 0.75rem; color: var(--text-sub); display: block;">مكافأة الإنجاز</span>
                <b style="font-size: 0.95rem; color: var(--accent-gold);">⚡ +${xp} XP</b>
            </div>
        </div>
    `;

    // إزالة أي نافذة سابقة إن وجدت
    const existingModal = document.getElementById('examRulesModal');
    if (existingModal) existingModal.remove();

    const modalHTML = `
    <div id="examRulesModal" style="position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 99999; padding: 15px; animation: fadeIn 0.25s ease;">
        <div class="auth-card" style="max-width: 420px; width: 100%; border: 1.5px solid ${isCompleted ? 'var(--accent-emerald)' : 'rgba(239, 68, 68, 0.4)'}; box-shadow: 0 10px 30px rgba(0,0,0,0.6); text-align: right; position: relative;">
            
            <div style="text-align: center; margin-bottom: 12px;">
                <div style="font-size: 2.5rem; margin-bottom: 6px;">${isCompleted ? '📝' : '⏱️'}</div>
                <h3 style="font-size: 1.15rem; color: var(--text-main); margin: 0 0 4px 0;">${title}</h3>
                <span style="font-size: 0.8rem; color: var(--text-sub);">${subject}</span>
            </div>

            ${statusCardHTML}

            <div style="margin-bottom: 20px;">
                <h5 style="font-size: 0.85rem; color: var(--accent-gold); margin-bottom: 8px; font-weight: 800;">تعليمات وضوابط:</h5>
                <ul style="padding-right: 18px; margin: 0; font-size: 0.75rem; color: var(--text-sub); line-height: 1.8;">
                    <li>يبدأ احتساب وقت الاختبار فور الضغط على زر البدء.</li>
                    <li>يتم قفل الاختبار وتسليم الإجابات تلقائياً بمجرد انتهاء الوقت.</li>
                    <li>تجنب الخروج أو تحديث الصفحة أثناء الحل لتفادي فقدان الإجابات.</li>
                </ul>
            </div>

            <div style="display: flex; gap: 10px;">
                <button onclick="document.getElementById('examRulesModal').remove(); if(typeof playClickSound==='function')playClickSound();" 
                        class="btn-secondary" 
                        style="flex: 1; padding: 10px; font-size: 0.85rem; border-radius: 10px;">
                    إلغاء
                </button>
                <button onclick="document.getElementById('examRulesModal').remove(); openExamMode('${examId}');" 
                        style="flex: 2; padding: 10px; background: ${isCompleted ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'}; color: #fff; border: none; border-radius: 10px; font-weight: 900; font-size: 0.85rem; cursor: pointer; box-shadow: 0 4px 15px ${isCompleted ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'};">
                    ${isCompleted ? 'بدء التدريب الآن 🚀' : 'بدء الاختبار الآن 🚀'}
                </button>
            </div>

        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// دالة غلق النافذة إذا تراجع الطالب
function closeExamRulesModal() {
    if (typeof playClickSound === 'function') playClickSound();
    const modal = document.getElementById('exam-rules-modal');
    if (modal) modal.style.display = 'none';
    pendingExamIdToStart = null;
}

// دالة بدء الاختبار الفعلي بعد التأكيد
function startActualExamAfterConfirmation() {
    if (typeof playSuccessSound === 'function') playSuccessSound();
    const modal = document.getElementById('exam-rules-modal');
    if (modal) modal.style.display = 'none';

    if (pendingExamIdToStart) {
        openExamMode(pendingExamIdToStart);
        pendingExamIdToStart = null;
    }
}

function shareExamDeepLink(subject, type, examId) {
    if (typeof playClickSound === 'function') playClickSound();

    // اسم حزمة تطبيقك المعتمد من Median
    const medianPackageName = "co.median.android.rdopjak"; 

    const domain = window.location.host; 
    const path = window.location.pathname;
    const safeSub = encodeURIComponent(subject);
    const query = `openExam=${examId}&sub=${safeSub}&typ=${type}`;

    // رابط الويب الاحتياطي (إذا فُتح الرابط من كمبيوتر أو جهاز غير مثبت عليه التطبيق)
    const fallbackWebUrl = `https://${domain}${path}?${query}`;

    // رابط الـ Intent الإجباري لفتح تطبيق الـ APK على هواتف الطلاب
    const directIntentUrl = `intent://${domain}${path}?${query}#Intent;scheme=https;package=${medianPackageName};S.browser_fallback_url=${encodeURIComponent(fallbackWebUrl)};end`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(directIntentUrl).then(() => {
            showTopToast('تم نسخ الرابط المباشر لتطبيق الموبايل! 📱', 'success');
        });
    } else {
        prompt('انسخ الرابط لمشاركته مع الدفعة:', directIntentUrl);
    }
}

// ================= نظام مزامنة إعلانات المنظم بالصفحة الرئيسية =================
function listenToHomeAlertsTicker() {
    db.ref('college_alerts').limitToLast(4).on('value', snap => {
        const box = document.getElementById('home-alerts-ticker-box');
        const list = document.getElementById('home-alerts-ticker-list');
        if (!box || !list) return;

        if (!snap.exists()) {
            box.style.display = 'none';
            return;
        }

        let alerts = [];
        snap.forEach(c => {
            alerts.push({ id: c.key, ...c.val() });
        });
        alerts.reverse(); // من الأحدث للأقدم

        let html = '';
        alerts.forEach(a => {
            html += `
            <div style="background: var(--bg-primary); border: 1px solid var(--border-card); border-radius: 12px; padding: 10px 12px; text-align: right;">
                <div style="font-size: 0.88rem; font-weight: 800; color: var(--accent-gold); margin-bottom: 2px;">${a.title}</div>
                <div style="font-size: 0.78rem; color: var(--text-sub); line-height: 1.5; white-space: pre-line;">${a.body}</div>
            </div>`;
        });

        list.innerHTML = html;
        box.style.display = 'block';
    });
}

// استدعاء المزامنة عند بدء تشغيل التطبيق
// يمكنك وضع السطر التالي داخل الـ else في DOMContentLoaded:
// listenToHomeAlertsTicker();
if (typeof listenToDynamicPlacements === 'function') listenToDynamicPlacements();

// ================= نظام الفعاليات والمشغل الذكي (Events Hub) =================
function openEventsHub() {
    playClickSound();
    navigateTo('view-events-hub', 'الفعاليات والأنشطة', 'المسابقات والمهام التفاعلية');
    loadEventsForStudents();
}

function loadEventsForStudents() {
    const container = document.getElementById('events-cards-container');
    const runner = document.getElementById('event-runner-wrapper');
    if (runner) runner.style.display = 'none';
    if (!container) return;

    container.innerHTML = '<p style="text-align: center; color: var(--text-sub);">جاري تحميل الفعاليات... ⏳</p>';

    db.ref('events_hub').once('value', snap => {
        if (!snap.exists()) {
            container.innerHTML = `
            <div class="acad-glass-card" style="text-align: center; padding: 30px 15px;">
                <span style="font-size: 2.5rem; display: block; margin-bottom: 8px;">🌟</span>
                <h4 style="color: var(--text-main); margin-bottom: 4px;">لا توجد فعاليات نشطة حالياً</h4>
                <p style="font-size: 0.8rem; color: var(--text-sub);">ترقبوا إطلاق تحديات ومسابقات مميزة قريباً جداً!</p>
            </div>`;
            return;
        }

        let html = '';
        snap.forEach(c => {
            const ev = c.val();
            const id = c.key;
            const isActive = ev.status === 'active';

            html += `
            <div class="acad-glass-card" style="cursor: pointer; border-color: ${isActive ? 'var(--accent-gold)' : 'var(--border-card)'};" onclick="launchEventRunner('${id}')">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span class="pill-badge" style="background: ${isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; color: ${isActive ? 'var(--accent-emerald)' : '#ef4444'};">
                        ${isActive ? '🟢 نشطة الآن' : '⚪ منتهية'}
                    </span>
                    <span style="font-size: 0.78rem; font-weight: 800; color: var(--accent-gold);">${ev.badge || ''}</span>
                </div>
                <h3 style="font-size: 1rem; color: var(--text-main); margin-bottom: 4px;">${ev.title}</h3>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                    <span style="font-size: 0.75rem; color: var(--text-sub);">اضغط لبدء التحدي</span>
                    <span style="color: var(--accent-gold); font-weight: bold;">←</span>
                </div>
            </div>`;
        });

        container.innerHTML = html;
    });
}

function launchEventRunner(eventId) {
    playClickSound();
    db.ref('events_hub/' + eventId).once('value', snap => {
        if (!snap.exists()) return;
        const ev = snap.val();

        document.getElementById('events-cards-container').style.display = 'none';
        const runner = document.getElementById('event-runner-wrapper');
        const viewport = document.getElementById('event-runner-viewport');
        document.getElementById('active-event-header-badge').innerText = ev.badge || ev.title;

        runner.style.display = 'block';

        // تنظيف الواجهة وتطبيق كود الفعالية
        viewport.innerHTML = ev.customCode || '<p style="text-align:center;">لا يوجد محتوى في هذه الفعالية</p>';

        // تنفيذ أي كود JavaScript مدمج داخل وسوم <script>
        const scripts = viewport.getElementsByTagName('script');
        for (let i = 0; i < scripts.length; i++) {
            try {
                eval(scripts[i].innerText);
            } catch (err) {
                console.error("خطأ أثناء تشغيل كود الفعالية:", err);
            }
        }
    });
}

function closeActiveEventRunner() {
    playClickSound();
    const runner = document.getElementById('event-runner-wrapper');
    const container = document.getElementById('events-cards-container');
    const viewport = document.getElementById('event-runner-viewport');

    if (viewport) viewport.innerHTML = '';
    if (runner) runner.style.display = 'none';
    if (container) container.style.display = 'flex';
}

// دالة مساعدة لتوزيع المكافأة يستدعيها كود الفعالية مباشرة: awardEventReward(50, 10, 'اسم التحدي');
function awardEventReward(xp = 0, coins = 0, title = 'فعالية خاصة') {
    if (!currentUser) return;

xp = calculateXpWithBooster(xp);
    
    currentUser.xp = (currentUser.xp || 0) + xp;
    currentUser.points = currentUser.xp;
    currentUser.coins = (currentUser.coins || 0) + coins;

    db.ref('users/' + currentUser.phone).update({
        xp: currentUser.xp,
        points: currentUser.xp,
        coins: currentUser.coins
    }).then(() => {
        playSuccessSound();
        shootStars();
        triggerConfetti();
        showTopToast(`مبروك! أكملت [${title}] وحصلت على +${xp} XP و +${coins} عملة 🎉`, 'success');
        updateProfileUI();
    });
}

// ================= دوال الأدمن لإدارة الفعاليات =================
function adminSaveEvent() {
    playClickSound();
    const idField = document.getElementById('adm-event-id').value.trim();
    const finalId = idField !== '' ? idField : 'event_' + Date.now();

    const title = document.getElementById('adm-event-title').value.trim();
    const badge = document.getElementById('adm-event-badge').value.trim();
    const status = document.getElementById('adm-event-status').value;
    const placement = document.getElementById('adm-event-placement')?.value || 'hub_only';
    const customCode = document.getElementById('adm-event-code').value.trim();

    if (!title || !customCode) {
        showTopToast('يرجى كتابة عنوان الفعالية وإرفاق الكود الخاص بها!', 'error');
        return;
    }

    db.ref('events_hub/' + finalId).set({
        title, badge, status, placement, customCode,
        updatedAt: Date.now()
    }).then(() => {
        showTopToast('تم حفظ ونشر الفعالية في المكان المحدد بنجاح! 🚀', 'success');
        resetAdminEventForm();
        loadAdminEventsList();
    });
}

function loadAdminEventsList() {
    const list = document.getElementById('admin-events-list');
    if (!list) return;

    db.ref('events_hub').once('value', snap => {
        if (!snap.exists()) {
            list.innerHTML = '<p style="text-align: center; color: var(--text-sub);">لا توجد فعاليات مضافة حالياً.</p>';
            return;
        }

        let html = '';
        snap.forEach(c => {
            const ev = c.val();
            const id = c.key;
            html += `
            <div class="admin-item-card">
                <div class="admin-item-info">
                    <div class="admin-item-name">${ev.title}</div>
                    <div class="admin-item-sub">${ev.status === 'active' ? '🟢 نشطة' : '⚪ منتهية'} | ${ev.badge || 'بدون شارة'}</div>
                </div>
                <div style="display: flex; gap: 6px;">
                    <button class="admin-action-btn" style="padding: 4px 8px; font-size: 0.72rem;" onclick="editAdminEvent('${id}')">تعديل ✏️</button>
                    <button class="admin-action-btn danger" style="padding: 4px 8px; font-size: 0.72rem;" onclick="deleteAdminEvent('${id}')">حذف 🗑️</button>
                </div>
            </div>`;
        });
        list.innerHTML = html;
    });
}

function editAdminEvent(id) {
    playClickSound();
    db.ref('events_hub/' + id).once('value', snap => {
        if (!snap.exists()) return;
        const ev = snap.val();

        document.getElementById('adm-event-id').value = id;
        document.getElementById('adm-event-title').value = ev.title || '';
        document.getElementById('adm-event-badge').value = ev.badge || '';
        document.getElementById('adm-event-status').value = ev.status || 'active';
        if (document.getElementById('adm-event-placement')) {
            document.getElementById('adm-event-placement').value = ev.placement || 'hub_only';
        }
        document.getElementById('adm-event-code').value = ev.customCode || '';

        document.getElementById('btn-cancel-event-edit').style.display = 'block';
        showTopToast('تم جلب بيانات الفعالية للتعديل', 'info');
    });
}

function deleteAdminEvent(id) {
    if (confirm('هل أنت متأكد من حذف هذه الفعالية نهائياً؟')) {
        db.ref('events_hub/' + id).remove().then(() => {
            showTopToast('تم حذف الفعالية بنجاح 🗑️', 'info');
            loadAdminEventsList();
        });
    }
}

function resetAdminEventForm() {
    document.getElementById('adm-event-id').value = '';
    document.getElementById('adm-event-title').value = '';
    document.getElementById('adm-event-badge').value = '';
    document.getElementById('adm-event-status').value = 'active';
    document.getElementById('adm-event-code').value = '';
    document.getElementById('btn-cancel-event-edit').style.display = 'none';
}

// ================= محرك الحقن المباشر للفعاليات في أي مكان بالتطبيق =================
function listenToDynamicPlacements() {
    db.ref('events_hub').on('value', snap => {
        // تصفير وإخفاء كل الأماكن أولاً
        const slots = {
            home_top: document.getElementById('dynamic-slot-home-top'),
            home_bottom: document.getElementById('dynamic-slot-home-bottom'),
            challenges_hub: document.getElementById('dynamic-slot-challenges'),
            popup_modal: document.getElementById('dynamic-slot-popup-content')
        };

        Object.values(slots).forEach(s => {
            if (s) { s.innerHTML = ''; s.style.display = 'none'; }
        });

        if (!snap.exists()) return;

        snap.forEach(c => {
            const ev = c.val();
            const id = c.key;

            // لو الفعالية نشطة ولها مكان مخصص غير قسم الفعاليات
            if (ev.status === 'active' && ev.placement && ev.placement !== 'hub_only') {
                const targetSlot = slots[ev.placement];
                if (!targetSlot) return;

                // فحص خاص بالنافذة المنبثقة: لو شافها قبل كدا، نتخطاها تماماً
                if (ev.placement === 'popup_modal') {
                    const seenPopupId = localStorage.getItem('seen_popup_' + id);
                    if (seenPopupId) return; // شافها خلاص، متعملش أي حاجة

                    // تسجيل إنها اتشافت عشان متظهرش تاني أبداً
                    localStorage.setItem('seen_popup_' + id, 'true');
                }

                // إظهار المكان وحقن الكود
                targetSlot.style.display = 'block';
                targetSlot.innerHTML = ev.customCode;

                // تشغيل أي سكريبت JS موجود بداخل الكود
                const scripts = targetSlot.getElementsByTagName('script');
                for (let i = 0; i < scripts.length; i++) {
                    try {
                        eval(scripts[i].innerText);
                    } catch (err) {
                        console.error("خطأ في تشغيل كود الفعالية:", err);
                    }
                }

                // فتح المودال بعد ثانية لو كان نوعها نافذة منبثقة
                if (ev.placement === 'popup_modal') {
                    setTimeout(() => {
                        openModal('modal-dynamic-popup');
                    }, 1000);
                }
            }
        });
    });
}

// ============================================================================
// =================== محرك إيفنت ملحمة العبور (6 أكتوبر) ========================
// ============================================================================

let octoberCachedImages = [];
let octoberEventData = null;
let currentOctLevel = 1;
let currentOctQIndex = 0;
let currentOctLevelQuestions = [];
let octCorrectAnswersInLevel = 0; // عداد الإجابات الصحيحة في المستوى
let octTimerInterval = null;
let octTimeLeft = 15;
let isOctAnswerLocked = false;

// 1. فتح واجهة الإيفنت
function openOctoberEventHub() {
    playClickSound();
    if (!currentUser) {
        showTopToast('يرجى تسجيل الدخول أولاً للمشاركة في الإيفنت!', 'error');
        return;
    }
    navigateTo('view-october-event', 'ملحمة العبور 🎖️', 'تحدي نصر أكتوبر 1973');
    loadOctoberEventUserView();
}

// 2. تحميل البيانات والتحميل المسبق للصور
function loadOctoberEventUserView() {
    db.ref('october_event').once('value', snap => {
        octoberEventData = snap.val() || { config: { badgeTitle: "بطل العبور 🎖️" }, levels: {}, levels_rewards: {} };
        preloadOctoberEventImages();
        renderOctoberLevelsGrid();
    });
}

function preloadOctoberEventImages() {
    octoberCachedImages = [];
    if (!octoberEventData || !octoberEventData.levels) return;
    
    Object.keys(octoberEventData.levels).forEach(lvl => {
        const questions = octoberEventData.levels[lvl];
        if (questions) {
            Object.values(questions).forEach(q => {
                if (q.type === 'hero_image' && q.imageUrl) {
                    const img = new Image();
                    img.src = q.imageUrl;
                    octoberCachedImages.push(img);
                }
            });
        }
    });
}

// 3. عرض خريطة المستويات الستة
function renderOctoberLevelsGrid() {
    clearInterval(octTimerInterval);
    const container = document.getElementById('october-levels-grid');
    const playBox = document.getElementById('october-question-play-box');
    if (container) container.style.display = 'grid';
    if (playBox) playBox.style.display = 'none';

    const completedEvents = currentUser.completed_custom_events || [];
    const isEventFinishedAll = completedEvents.includes('event_october_73');
    const userOctProgress = (currentUser.october_progress !== undefined) ? currentUser.october_progress : (isEventFinishedAll ? 6 : 1);

    let html = '';
    for (let i = 1; i <= 6; i++) {
        let isUnlocked = (i <= userOctProgress);
        let isDone = (i < userOctProgress || isEventFinishedAll);

        let stateClass = isDone ? 'completed' : (isUnlocked ? 'unlocked' : 'locked');
        let iconOrNum = isUnlocked ? `<span class="level-number">${i}</span>` : `<span class="level-lock-icon" style="display:block;">🔒</span>`;
        let textBadge = isDone ? 'عبرت بنجاح 🎖️' : (isUnlocked ? 'متاح للعب ⚔️' : 'مغلق 🔒');

        html += `
        <div class="level-node ${stateClass}" onclick="startOctoberLevel(${i}, ${isUnlocked})">
            ${iconOrNum}
            <div class="level-stars" style="font-size: 0.75rem; font-weight: 800; color: var(--accent-gold); margin-top: 5px;">
                ${textBadge}
            </div>
        </div>`;
    }
    if (container) container.innerHTML = html;
}

// 4. بدء المستوى المختار (مع استرجاع السؤال المتوقف عنده)
function startOctoberLevel(levelNum, isUnlocked) {
    if (!isUnlocked) {
        playErrorSound();
        showTopToast('يجب عبور المستويات السابقة أولاً يا بطل!', 'error');
        return;
    }

    // 👈 فحص: هل الطالب رسب في هذا المستوى سابقاً ولم يدفع رسوم الإعادة؟
    const failedLevels = currentUser.october_failed_levels || {};
    if (failedLevels[levelNum]) {
        currentOctLevel = levelNum;
        // إظهار نافذة تطلب منه دفع الـ 100 عملة أولاً
        handleOctoberLevelFail(
            (octoberEventData.levels && octoberEventData.levels[levelNum] ? Object.keys(octoberEventData.levels[levelNum]).length : 0),
            1
        );
        showTopToast('لقد رسبت في هذا المستوى سابقاً! يلزم دفع 100 عملة لإعادة المحاولة 🪙', 'error');
        return;
    }

    const questionsObj = (octoberEventData.levels && octoberEventData.levels[levelNum]) || {};
    currentOctLevelQuestions = Object.values(questionsObj);

    if (currentOctLevelQuestions.length === 0) {
        showTopToast(`لا توجد أسئلة مضافة في المستوى ${levelNum} بعد.`, 'info');
        return;
    }

    playClickSound();
    currentOctLevel = levelNum;

    // استعادة الجلسة المحفوظة
    const savedSession = JSON.parse(localStorage.getItem(`oct_session_${currentUser.phone}_lvl_${levelNum}`) || 'null');
    if (savedSession && savedSession.qIndex < currentOctLevelQuestions.length) {
        currentOctQIndex = savedSession.qIndex;
        octCorrectAnswersInLevel = savedSession.correctCount || 0;
        showTopToast(`تم استئناف المستوى من السؤال (${currentOctQIndex + 1}) 🚀`, 'info');
    } else {
        currentOctQIndex = 0;
        octCorrectAnswersInLevel = 0;
    }

    const grid = document.getElementById('october-levels-grid');
    const playBox = document.getElementById('october-question-play-box');
    if (grid) grid.style.display = 'none';
    if (playBox) playBox.style.display = 'block';

    renderOctoberCurrentQuestion();
}

// حفظ تقدم السؤال الحالي محلياً
function saveOctoberCurrentSession() {
    if (!currentUser) return;
    localStorage.setItem(`oct_session_${currentUser.phone}_lvl_${currentOctLevel}`, JSON.stringify({
        qIndex: currentOctQIndex,
        correctCount: octCorrectAnswersInLevel
    }));
}

// مسح تقدم المستوى بعد الانتهاء
function clearOctoberCurrentSession() {
    if (!currentUser) return;
    localStorage.removeItem(`oct_session_${currentUser.phone}_lvl_${currentOctLevel}`);
}

// 5. عرض السؤال الحالي بحسب نوعه وبدء تايمر الـ 15 ثانية
function renderOctoberCurrentQuestion() {
    isOctAnswerLocked = false;
    clearInterval(octTimerInterval);

    const q = currentOctLevelQuestions[currentOctQIndex];
    const rewardInfo = getOctoberLevelReward(currentOctLevel);
    
    document.getElementById('october-q-counter').innerText = `المستوى ${currentOctLevel} - سؤال (${currentOctQIndex + 1} / ${currentOctLevelQuestions.length})`;
    const ptsBadge = document.getElementById('october-q-points-badge');
    if (ptsBadge) ptsBadge.innerText = `جائزة المستوى: +${rewardInfo.xp} XP و +${rewardInfo.coins} 💸`;

    document.getElementById('october-q-text').innerText = q.question;
    const fbText = document.getElementById('october-feedback-text');
    if (fbText) fbText.style.display = 'none';

    const imgContainer = document.getElementById('october-image-container');
    const optContainer = document.getElementById('october-options-container');
    const numContainer = document.getElementById('october-number-container');

    if (q.type === 'hero_image') {
        imgContainer.style.display = 'flex';
        const heroImg = document.getElementById('october-hero-img-display');
        heroImg.src = q.imageUrl;
        // تقييد أبعاد الصورة برمجياً لضمان عدم تمددها على أي شاشة
        heroImg.style.maxWidth = '100%';
        heroImg.style.maxHeight = '230px';
        heroImg.style.objectFit = 'contain';

        optContainer.style.display = 'flex';
        numContainer.style.display = 'none';
        renderOctoberOptions(q);
    } else if (q.type === 'mcq') {
        imgContainer.style.display = 'none';
        optContainer.style.display = 'flex';
        numContainer.style.display = 'none';
        renderOctoberOptions(q);
    } else if (q.type === 'number') {
        imgContainer.style.display = 'none';
        optContainer.style.display = 'none';
        numContainer.style.display = 'block';
        const numInput = document.getElementById('october-numeric-input');
        if (numInput) {
            numInput.value = '';
            numInput.disabled = false;
            numInput.focus();
        }
    }

    startOctoberQuestionTimer();
}

function startOctoberQuestionTimer() {
    const q = currentOctLevelQuestions[currentOctQIndex];
    // أخذ وقت السؤال المخصص من لوحة الأدمن، أو 15 ثانية افتراضياً لو لم يتم تحديده
    octTimeLeft = (q && q.timer) ? parseInt(q.timer) : 15;

    const timerEl = document.getElementById('october-q-timer');
    if (timerEl) {
        timerEl.innerText = `⏱️ ${octTimeLeft}ث`;
        timerEl.style.color = '#fff';
    }

    clearInterval(octTimerInterval);
    octTimerInterval = setInterval(() => {
        octTimeLeft--;
        if (timerEl) {
            timerEl.innerText = `⏱️ ${octTimeLeft}ث`;
            if (octTimeLeft <= 5) timerEl.style.color = '#ef4444';
        }

        if (octTimeLeft <= 0) {
            clearInterval(octTimerInterval);
            handleOctoberTimeout();
        }
    }, 1000);
}

// في حالة انتهاء الـ 15 ثانية دون إجابة
function handleOctoberTimeout() {
    if (isOctAnswerLocked) return;
    isOctAnswerLocked = true;
    playErrorSound();

    const allBtns = document.querySelectorAll('#october-options-container .quiz-option-btn');
    allBtns.forEach(b => b.disabled = true);
    const numInput = document.getElementById('october-numeric-input');
    if (numInput) numInput.disabled = true;

    const q = currentOctLevelQuestions[currentOctQIndex];
    const totalTime = (q && q.timer) ? q.timer : 15;

    showTopToast(`انتهى الوقت (${totalTime} ثانية)! الانتقال للسؤال التالي... ⏳`, 'error');
    setTimeout(() => advanceOctoberQuestion(), 1200);
}

function renderOctoberOptions(q) {
    const optContainer = document.getElementById('october-options-container');
    optContainer.innerHTML = '';

    const correctText = q.options[q.answer || 0];
    const shuffled = shuffleArray([...q.options]);

    shuffled.forEach(optText => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option-btn';
        btn.innerText = optText;
        btn.onclick = () => handleOctoberMcqAnswer(btn, optText, correctText);
        optContainer.appendChild(btn);
    });
}

// التعامل مع إجابة سؤال الاختيارات / البطل (الانتقال مباشرة عند الخطأ)
function handleOctoberMcqAnswer(btn, selected, correct) {
    if (isOctAnswerLocked) return;
    isOctAnswerLocked = true;
    clearInterval(octTimerInterval);

    const allBtns = document.querySelectorAll('#october-options-container .quiz-option-btn');
    allBtns.forEach(b => b.disabled = true);

    if (selected === correct) {
        octCorrectAnswersInLevel++;
        playSuccessSound();
        shootStars();
        btn.classList.add('correct-choice');
        showTopToast('إجابة صحيحة ومحكمة! 🎖️', 'success');
        setTimeout(() => advanceOctoberQuestion(), 1000);
    } else {
        playErrorSound();
        btn.classList.add('wrong-choice');
        allBtns.forEach(b => { if (b.innerText === correct) b.classList.add('correct-choice'); });
        showTopToast('إجابة خاطئة! الانتقال للسؤال التالي... ❌', 'error');
        // الانتقال للسؤال التالي مباشرة بعد إظهار الحل لمدة ثانية واحدة
        setTimeout(() => advanceOctoberQuestion(), 1200);
    }
}

// 6. التحقق من أسئلة الأرقام والتواريخ (الانتقال مباشرة أيضاً عند الخطأ)
function submitOctoberNumericAnswer() {
    if (isOctAnswerLocked) return;
    const inputEl = document.getElementById('october-numeric-input');
    const userVal = parseFloat(inputEl.value);
    const q = currentOctLevelQuestions[currentOctQIndex];
    const target = q.correctNumber;

    if (isNaN(userVal)) {
        showTopToast('يرجى كتابة رقم أو سنة أولاً!', 'error');
        return;
    }

    isOctAnswerLocked = true;
    clearInterval(octTimerInterval);
    inputEl.disabled = true;

    const diff = Math.abs(userVal - target);
    const percentError = (diff / target) * 100;
    const fbText = document.getElementById('october-feedback-text');
    fbText.style.display = 'block';

    if (userVal === target) {
        octCorrectAnswersInLevel++;
        playExactMatchSound();
        shootStars();
        fbText.style.color = 'var(--accent-emerald)';
        fbText.innerHTML = `🎯 إجابة دقيقة 100%! الرقم هو (${target}) بالمللي!`;
        setTimeout(() => advanceOctoberQuestion(), 1200);
    } else if (percentError <= 10) {
        octCorrectAnswersInLevel++; // احتساب التقريب المقبول كإجابة صحيحة
        playSuccessSound();
        fbText.style.color = 'var(--accent-gold)';
        fbText.innerHTML = `👏 إجابة قريبة جداً ومقبولة! الرقم الصحيح: (${target})`;
        setTimeout(() => advanceOctoberQuestion(), 1400);
    } else {
        playErrorSound();
        fbText.style.color = '#ef4444';
        fbText.innerHTML = `❌ إجابة خاطئة! الرقم الصحيح كان (${target}).`;
        setTimeout(() => advanceOctoberQuestion(), 1400);
    }
}

function advanceOctoberQuestion() {
    if (currentOctQIndex + 1 < currentOctLevelQuestions.length) {
        currentOctQIndex++;
        saveOctoberCurrentSession(); // حفظ السؤال الجديد للاستئناف
        renderOctoberCurrentQuestion();
    } else {
        // انتهت أسئلة المستوى: فحص شرط الـ 50%
        evaluateLevelResult();
    }
}

// 7. تقييم نتيجة المستوى واشتراط أكثر من نصف الإجابات صحيحة
function evaluateLevelResult() {
    clearInterval(octTimerInterval);
    clearOctoberCurrentSession(); // مسح الجلسة المؤقتة بعد اكتمال المستوى

    const totalQuestions = currentOctLevelQuestions.length;
    const passingThreshold = Math.floor(totalQuestions / 2) + 1; // أكثر من النصف تماماً

    if (octCorrectAnswersInLevel >= passingThreshold) {
        // نجح في المستوى
        completeOctoberLevelSuccess(totalQuestions);
    } else {
        // رسب في المستوى: إظهار نافذة الرسوب المنبثقة مع زر إعادة المحاولة بـ 100 عملة
        handleOctoberLevelFail(totalQuestions, passingThreshold);
    }
}

// معالجة رسوب المستوى وعرض النافذة المنبثقة
function handleOctoberLevelFail(totalQuestions, passingThreshold) {
    playErrorSound();

    // 👈 تسجيل أن الطالب رسب في هذا المستوى ويحتاج لدفع رسوم لإعادة فتحه
    if (!currentUser.october_failed_levels) currentUser.october_failed_levels = {};
    currentUser.october_failed_levels[currentOctLevel] = true;
    db.ref('users/' + currentUser.phone + '/october_failed_levels').set(currentUser.october_failed_levels);

    const modal = document.getElementById('modal-october-result');
    const icon = document.getElementById('oct-res-icon');
    const title = document.getElementById('oct-res-title');
    const desc = document.getElementById('oct-res-desc');
    const rewardBox = document.getElementById('oct-res-reward-box');
    const retryBtn = document.getElementById('btn-oct-retry');
    const primaryBtn = document.getElementById('btn-oct-res-primary');

    if (icon) icon.src = "https://img.icons8.com/fluency/96/cancel.png";
    if (title) {
        title.innerText = `لم تعبر المستوى ${currentOctLevel}! ❌`;
        title.style.color = "#ef4444";
    }
    if (desc) {
        desc.innerHTML = `أجبت على <b>(${octCorrectAnswersInLevel} من ${totalQuestions})</b> إجابات صحيحة.<br>شرط العبور هو إجابة أكثر من نصف الأسئلة (على الأقل ${passingThreshold} صح).<br><br><span style="color: var(--accent-gold); font-size: 0.8rem; font-weight: 700;">رسوم إعادة المحاولة: 100 عملة.</span>`;
    }

    if (rewardBox) rewardBox.style.display = 'none';
    if (retryBtn) retryBtn.style.display = 'block';
    if (primaryBtn) {
        primaryBtn.innerText = 'العودة للخريطة 🗺️';
        primaryBtn.onclick = function() {
            closeOctoberResultModal();
        };
    }

    if (modal) modal.classList.add('show');
}

// إعادة محاولة المستوى بخصم 100 عملة
function retryOctoberLevelWithFee() {
    playClickSound();
    const RETRY_COST = 100;

    if (!currentUser || (currentUser.coins || 0) < RETRY_COST) {
        showTopToast(`عفواً! رصيدك لا يكفي لإعادة المحاولة (تحتاج ${RETRY_COST} عملة) 🪙`, 'error');
        return;
    }

    // خصم العملات
    currentUser.coins = (currentUser.coins || 0) - RETRY_COST;
    
    // 👈 مسح علامة الرسوب حتى يتمكن من الدخول الآن
    if (currentUser.october_failed_levels) {
        delete currentUser.october_failed_levels[currentOctLevel];
    }

    db.ref('users/' + currentUser.phone).update({
        coins: currentUser.coins,
        october_failed_levels: currentUser.october_failed_levels || null
    });

    recordUserTransaction(`إعادة محاولة المستوى ${currentOctLevel} (إيفنت أكتوبر)`, 0, -RETRY_COST, 'purchase');
    
    updateProfileUI();
    closeOctoberResultModal();

    showTopToast(`تم خصم ${RETRY_COST} عملة.. بالتوفيق في المحاولة الجديدة! ⚔️`, 'info');

    setTimeout(() => {
        startOctoberLevel(currentOctLevel, true);
    }, 400);
}

function getOctoberLevelReward(levelNum) {
    if (octoberEventData && octoberEventData.levels_rewards && octoberEventData.levels_rewards[levelNum]) {
        return {
            xp: parseInt(octoberEventData.levels_rewards[levelNum].xp) || 0,
            coins: parseInt(octoberEventData.levels_rewards[levelNum].coins) || 0
        };
    }
    return { xp: levelNum * 100, coins: levelNum * 20 };
}

// 8. صرف الجوائز وتحديث التقدم عند اجتياز المستوى بنجاح وعرض النافذة المنبثقة
function completeOctoberLevelSuccess(totalQuestions) {
    playSuccessSound();
    triggerConfetti();

    let claimedRewards = currentUser.october_claimed_levels || [];
    let rewards = getOctoberLevelReward(currentOctLevel);
rewards.xp = calculateXpWithBooster(rewards.xp);
    let isAlreadyClaimed = claimedRewards.includes(currentOctLevel);

    let updates = {};

    // 1. مسح علامة الرسوب لهذا المستوى فور النجاح
    if (currentUser.october_failed_levels && currentUser.october_failed_levels[currentOctLevel]) {
        delete currentUser.october_failed_levels[currentOctLevel];
        updates.october_failed_levels = currentUser.october_failed_levels;
    }

    // 2. صرف المكافأة إن لم تكن مستلمة مسبقاً
    if (!isAlreadyClaimed) {
        claimedRewards.push(currentOctLevel);
        currentUser.october_claimed_levels = claimedRewards;
        currentUser.xp = (currentUser.xp || 0) + rewards.xp;
        currentUser.points = currentUser.xp;
        currentUser.coins = (currentUser.coins || 0) + rewards.coins;

        updates.xp = currentUser.xp;
        updates.points = currentUser.xp;
        updates.coins = currentUser.coins;
        updates.october_claimed_levels = claimedRewards;

        recordUserTransaction(`مكافأة اجتياز المستوى ${currentOctLevel} (إيفنت أكتوبر)`, rewards.xp, rewards.coins, 'reward');
    }

    // 3. فتح المستوى التالي
    let userProgress = currentUser.october_progress || 1;
    if (currentOctLevel >= userProgress && currentOctLevel < 6) {
        userProgress = currentOctLevel + 1;
        currentUser.october_progress = userProgress;
        updates.october_progress = userProgress;
    }

    db.ref('users/' + currentUser.phone).update(updates).then(() => {
        updateProfileUI();

        const modal = document.getElementById('modal-october-result');
        const icon = document.getElementById('oct-res-icon');
        const title = document.getElementById('oct-res-title');
        const desc = document.getElementById('oct-res-desc');
        const rewardBox = document.getElementById('oct-res-reward-box');
        const rewardText = document.getElementById('oct-res-reward-text');
        const retryBtn = document.getElementById('btn-oct-retry');
        const primaryBtn = document.getElementById('btn-oct-res-primary');

        if (icon) icon.src = "https://img.icons8.com/fluency/96/trophy.png";
        if (title) {
            title.innerText = `عبرت المستوى ${currentOctLevel} بنجاح! 🎖️`;
            title.style.color = "var(--accent-emerald)";
        }
        if (desc) desc.innerHTML = `أداء بطولي! جاوبت <b>(${octCorrectAnswersInLevel} من ${totalQuestions})</b> إجابات صحيحة.`;

        if (retryBtn) retryBtn.style.display = 'none';

        if (!isAlreadyClaimed) {
            if (rewardBox) rewardBox.style.display = 'block';
            if (rewardText) rewardText.innerText = `+${rewards.xp} XP ⚡ | +${rewards.coins} عملة 💸`;
        } else {
            if (rewardBox) rewardBox.style.display = 'none';
            if (desc) desc.innerHTML += `<br><span style="color: var(--text-sub); font-size: 0.78rem;">(المكافأة استُلمت مسبقاً)</span>`;
        }

        if (currentOctLevel < 6) {
            if (primaryBtn) {
                primaryBtn.innerText = `المتابعة للمستوى ${currentOctLevel + 1} ⬅️`;
                primaryBtn.onclick = function() {
                    closeOctoberResultModal();
                    startOctoberLevel(currentOctLevel + 1, true);
                };
            }
        } else {
            if (primaryBtn) {
                primaryBtn.innerText = 'استلام النصر العظيم 🏆';
                primaryBtn.onclick = function() {
                    closeOctoberResultModal();
                    finalizeOctoberGrandVictory();
                };
            }
        }

        if (modal) modal.classList.add('show');
    });
}

// 9. النصر النهائي باللقب
function finalizeOctoberGrandVictory() {
    const config = (octoberEventData && octoberEventData.config) ? octoberEventData.config : { badgeTitle: "بطل العبور 🎖️" };
    let completedEvents = currentUser.completed_custom_events || [];
    let claimedAchievements = currentUser.claimed_achievements || [];

    if (!completedEvents.includes('event_october_73')) {
        completedEvents.push('event_october_73');
    }

    // إضافة اللقب لقائمة الإنجازات المكتسبة ليظهر دائماً في الخزانة
    if (!claimedAchievements.includes('october_hero')) {
        claimedAchievements.push('october_hero');
    }

    currentUser.active_title = config.badgeTitle;
    currentUser.active_title_rarity = 'mythic';
    currentUser.completed_custom_events = completedEvents;
    currentUser.claimed_achievements = claimedAchievements;

    db.ref('users/' + currentUser.phone).update({
        active_title: config.badgeTitle,
        active_title_rarity: 'mythic',
        completed_custom_events: completedEvents,
        claimed_achievements: claimedAchievements,
        october_progress: 6
    }).then(() => {
        playFlawlessVictorySound();
        shootStars();
        triggerConfetti();
        updateProfileUI();
        showVictoryPopup(config.badgeTitle);
    });
}

function showVictoryPopup(badgeTitle, isAlreadyDone = false) {
    const modal = document.getElementById('modal-october-result');
    const icon = document.getElementById('oct-res-icon');
    const title = document.getElementById('oct-res-title');
    const desc = document.getElementById('oct-res-desc');
    const rewardBox = document.getElementById('oct-res-reward-box');
    const retryBtn = document.getElementById('btn-oct-retry');
    const primaryBtn = document.getElementById('btn-oct-res-primary');

    if (icon) icon.src = "https://img.icons8.com/fluency/96/medal.png";
    if (title) {
        title.innerText = "ملحمة العبور اكتملت! 🏆";
        title.style.color = "var(--accent-gold)";
    }

    if (desc) {
        desc.innerHTML = isAlreadyDone 
            ? `أنت بطل العبور بالفعل وأكملت كافة المستويات بنجاح!` 
            : `مبروك يا بطل! أتممت الـ 6 مستويات كاملة وحصلت على اللقب الشرفي:<br><br><span class="pill-badge" style="background: rgba(245, 158, 11, 0.2); color: var(--accent-gold); font-size: 0.95rem; font-weight: 900;">${badgeTitle}</span>`;
    }

    if (rewardBox) rewardBox.style.display = 'none';
    if (retryBtn) retryBtn.style.display = 'none';
    if (primaryBtn) {
        primaryBtn.innerText = 'إغلاق، عودة للخريطة 🗺️';
        primaryBtn.onclick = function() {
            closeOctoberResultModal();
        };
    }

    if (modal) modal.classList.add('show');
}

function closeOctoberResultModal() {
    playClickSound();
    const modal = document.getElementById('modal-october-result');
    if (modal) modal.classList.remove('show');
    loadOctoberEventUserView();
}

// 10. دوال تحكم الأدمن
function loadAdminOctoberConfig() {
    loadAdminSingleLevelReward(document.getElementById('adm-oct-reward-level').value || "1");
    db.ref('october_event/config').once('value', snap => {
        if (snap.exists()) {
            const cfg = snap.val();
            document.getElementById('adm-oct-title').value = cfg.badgeTitle || "بطل العبور 🎖️";
        }
    });
}

function loadAdminSingleLevelReward(levelNum) {
    db.ref(`october_event/levels_rewards/${levelNum}`).once('value', snap => {
        if (snap.exists()) {
            const rew = snap.val();
            document.getElementById('adm-oct-level-xp').value = rew.xp !== undefined ? rew.xp : 150;
            document.getElementById('adm-oct-level-coins').value = rew.coins !== undefined ? rew.coins : 25;
        } else {
            document.getElementById('adm-oct-level-xp').value = levelNum * 100;
            document.getElementById('adm-oct-level-coins').value = levelNum * 20;
        }
    });
}

function saveAdminOctoberLevelReward() {
    playClickSound();
    const levelNum = document.getElementById('adm-oct-reward-level').value;
    const xp = parseInt(document.getElementById('adm-oct-level-xp').value) || 0;
    const coins = parseInt(document.getElementById('adm-oct-level-coins').value) || 0;
    const badge = document.getElementById('adm-oct-title').value.trim() || "بطل العبور 🎖️";

    const updates = {};
    updates[`october_event/levels_rewards/${levelNum}`] = { xp: xp, coins: coins };
    updates[`october_event/config/badgeTitle`] = badge;

    db.ref().update(updates).then(() => {
        showTopToast(`تم حفظ مكافأة المستوى ${levelNum} واللقب بنجاح! 💾`, 'success');
    });
}

function toggleAdminOctoberTypeInputs(type) {
    document.getElementById('adm-oct-img-box').style.display = (type === 'hero_image') ? 'block' : 'none';
    document.getElementById('adm-oct-options-box').style.display = (type === 'number') ? 'none' : 'block';
    document.getElementById('adm-oct-numeric-box').style.display = (type === 'number') ? 'block' : 'none';
}

function saveAdminOctoberQuestion() {
    playClickSound();
    const level = document.getElementById('adm-oct-level-select').value;
    const type = document.getElementById('adm-oct-type-select').value;
    const question = document.getElementById('adm-oct-q-text').value.trim();
    const timerVal = parseInt(document.getElementById('adm-oct-timer').value) || 15; // قراءة التايمر المخصص
    const editId = document.getElementById('adm-oct-q-id').value;
    const qId = editId ? editId : 'oct_q_' + Date.now();

    if (!question) {
        showTopToast('يرجى كتابة نص السؤال أولاً!', 'error');
        return;
    }

    let payload = { 
        id: qId, 
        type: type, 
        question: question,
        timer: timerVal // حفظ مدة التايمر مع بيانات السؤال
    };

    if (type === 'number') {
        const numVal = parseFloat(document.getElementById('adm-oct-correct-number').value);
        if (isNaN(numVal)) {
            showTopToast('يرجى تحديد الرقم الصحيح للسؤال!', 'error');
            return;
        }
        payload.correctNumber = numVal;
    } else {
        const opt0 = document.getElementById('adm-oct-opt0').value.trim();
        const opt1 = document.getElementById('adm-oct-opt1').value.trim();
        const opt2 = document.getElementById('adm-oct-opt2').value.trim();
        const opt3 = document.getElementById('adm-oct-opt3').value.trim();

        if (!opt0 || !opt1 || !opt2 || !opt3) {
            showTopToast('يرجى كتابة جميع الاختيارات الأربعة!', 'error');
            return;
        }
        payload.options = [opt0, opt1, opt2, opt3];
        payload.answer = 0;

        if (type === 'hero_image') {
            const imgUrl = document.getElementById('adm-oct-img-url').value.trim();
            if (!imgUrl) {
                showTopToast('يرجى وضع رابط الصورة المباشر من PostImage!', 'error');
                return;
            }
            payload.imageUrl = imgUrl;
        }
    }

    db.ref(`october_event/levels/${level}/${qId}`).set(payload).then(() => {
        showTopToast('تم حفظ السؤال مع مدة التايمر بنجاح! 🚀', 'success');
        resetAdminOctoberForm();
        loadAdminOctoberQuestions(level);
    });
}

function loadAdminOctoberQuestions(level) {
    const container = document.getElementById('admin-october-questions-list');
    if (!container) return;
    container.innerHTML = '<p style="text-align: center; color: var(--text-sub);">جاري التحميل...</p>';

    db.ref(`october_event/levels/${level}`).once('value', snap => {
        if (!snap.exists()) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-sub);">لا توجد أسئلة مضافة في هذا المستوى بعد.</p>';
            return;
        }

        let html = '';
        snap.forEach(c => {
            const q = c.val();
            const id = c.key;
            const qTime = q.timer || 15;
            html += `
            <div class="admin-item-card" style="padding: 10px 12px;">
                <div class="admin-item-info">
                    <div class="admin-item-name" style="font-size: 0.88rem;">[${q.type}] ${q.question}</div>
                    <div style="font-size: 0.75rem; color: var(--accent-gold); margin-top: 2px;">⏱️ المدة: ${qTime} ثانية</div>
                    ${q.type === 'hero_image' ? `<div style="margin-top: 4px;"><img src="${q.imageUrl}" style="width: 35px; height: 35px; border-radius: 6px; object-fit: cover;"></div>` : ''}
                </div>
                <div style="display: flex; gap: 6px; align-items: center;">
                    <button class="admin-action-btn" style="padding: 3px 8px; font-size: 0.72rem;" onclick='editAdminOctoberQuestion(${JSON.stringify(q)}, "${level}")'>تعديل ✏️</button>
                    <button class="admin-action-btn danger" style="padding: 3px 8px; font-size: 0.72rem;" onclick="deleteAdminOctoberQuestion('${id}', '${level}')">حذف 🗑️</button>
                </div>
            </div>`;
        });
        container.innerHTML = html;
    });
}

function editAdminOctoberQuestion(q, level) {
    playClickSound();
    document.getElementById('adm-oct-form-title').innerText = 'تعديل السؤال المختار ✏️';
    document.getElementById('adm-oct-q-id').value = q.id;
    document.getElementById('adm-oct-level-select').value = level;
    document.getElementById('adm-oct-type-select').value = q.type;
    document.getElementById('adm-oct-q-text').value = q.question;
    
    // وضع وقت السؤال المخصص في الخانة، أو 15 لو لم يكن مسجلاً
    const timerInput = document.getElementById('adm-oct-timer');
    if (timerInput) timerInput.value = q.timer || 15;

    toggleAdminOctoberTypeInputs(q.type);

    if (q.type === 'number') {
        document.getElementById('adm-oct-correct-number').value = q.correctNumber || '';
    } else {
        document.getElementById('adm-oct-opt0').value = (q.options && q.options[0]) || '';
        document.getElementById('adm-oct-opt1').value = (q.options && q.options[1]) || '';
        document.getElementById('adm-oct-opt2').value = (q.options && q.options[2]) || '';
        document.getElementById('adm-oct-opt3').value = (q.options && q.options[3]) || '';
        if (q.type === 'hero_image') {
            document.getElementById('adm-oct-img-url').value = q.imageUrl || '';
        }
    }

    document.getElementById('btn-cancel-oct-edit').style.display = 'block';
    document.getElementById('btn-save-oct-q').innerText = 'تحديث السؤال 🔄';
}

function resetAdminOctoberForm() {
    document.getElementById('adm-oct-form-title').innerText = 'إضافة سؤال جديد للتحدي ⚔️';
    document.getElementById('adm-oct-q-id').value = '';
    document.getElementById('adm-oct-q-text').value = '';
    document.getElementById('adm-oct-img-url').value = '';
    document.getElementById('adm-oct-opt0').value = '';
    document.getElementById('adm-oct-opt1').value = '';
    document.getElementById('adm-oct-opt2').value = '';
    document.getElementById('adm-oct-opt3').value = '';
    document.getElementById('adm-oct-correct-number').value = '';
    
    const timerInput = document.getElementById('adm-oct-timer');
    if (timerInput) timerInput.value = '15'; // إعادة تعيين القيمة الافتراضية

    document.getElementById('btn-cancel-oct-edit').style.display = 'none';
    document.getElementById('btn-save-oct-q').innerText = 'حفظ السؤال بالسيرفر 🚀';
}

function deleteAdminOctoberQuestion(qId, level) {
    playErrorSound();
    if (confirm('هل أنت متأكد من حذف هذا السؤال؟')) {
        db.ref(`october_event/levels/${level}/${qId}`).remove().then(() => {
            showTopToast('تم حذف السؤال بنجاح.', 'info');
            loadAdminOctoberQuestions(level);
        });
    }
}

// ============================================================================
// ================= نظام إحصائيات الاختبارات المباشر للأدمن =====================
// ============================================================================

let realtimeExamStatsActive = false;
let globalRawExamsData = [];
let currentExamFilterSubject = 'all';

function initAdminExamStatsRealtime() {
    if (realtimeExamStatsActive) return;
    realtimeExamStatsActive = true;

    db.ref('scientific_content').on('value', sciSnap => {
        const sciData = sciSnap.val() || {};
        
        db.ref('users').on('value', usersSnap => {
            const usersData = usersSnap.val() || {};
            processExamsData(sciData, usersData);
        });
    });
}

function processExamsData(sciData, usersData) {
    const totalStudents = Object.keys(usersData).length || 0;
    let allExams = [];
    let totalCompletions = 0;

    Object.keys(sciData).forEach(subjectKey => {
        const subject = sciData[subjectKey];
        ['theory', 'practical'].forEach(partKey => {
            if (subject[partKey] && subject[partKey].quizzes) {
                const quizzes = subject[partKey].quizzes;
                Object.keys(quizzes).forEach(qKey => {
                    const item = quizzes[qKey];
                    if (item.formatType === 'exam') {
                        let completedCount = 0;

                        // حساب عدد التسليمات بالأرقام فقط
                        Object.values(usersData).forEach(user => {
                            if (user.rewarded_exams && Array.isArray(user.rewarded_exams)) {
                                if (user.rewarded_exams.includes(qKey)) {
                                    completedCount++;
                                }
                            }
                        });

                        totalCompletions += completedCount;

                        allExams.push({
                            id: qKey,
                            title: item.title || 'اختبار بدون عنوان',
                            subjectName: decodeURIComponent(subjectKey),
                            part: partKey === 'theory' ? 'نظري' : 'عملي',
                            time: item.examTime || 0,
                            completedCount: completedCount,
                            remainingCount: Math.max(0, totalStudents - completedCount)
                        });
                    }
                });
            }
        });
    });

    globalRawExamsData = allExams;

    const totalCountEl = document.getElementById('stat-exams-total-count');
    const totalCompEl = document.getElementById('stat-exams-total-completions');

    if (totalCountEl) totalCountEl.innerText = allExams.length;
    if (totalCompEl) totalCompEl.innerText = totalCompletions;

    applyExamStatsFilters();
}

function setExamStatsFilterSubject(subject, btn) {
    playClickSound();
    currentExamFilterSubject = subject;
    
    const pills = document.querySelectorAll('#exam-stats-subject-pills .qbank-filter-btn');
    pills.forEach(p => p.classList.remove('active'));
    if (btn) btn.classList.add('active');

    applyExamStatsFilters();
}

function applyExamStatsFilters() {
    const listContainer = document.getElementById('admin-exams-metrics-list');
    if (!listContainer) return;

    if (globalRawExamsData.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: var(--text-sub); font-size: 0.85rem;">لا توجد اختبارات مضافة بنوع (Exam) حتى الآن.</p>';
        return;
    }

    const searchTerm = (document.getElementById('exam-stats-search-input')?.value || '').trim().toLowerCase();
    const sortType = document.getElementById('exam-stats-sort-select')?.value || 'high';

    let filtered = globalRawExamsData.filter(exam => {
        const matchesSubject = (currentExamFilterSubject === 'all') || (exam.subjectName === currentExamFilterSubject);
        const matchesSearch = exam.title.toLowerCase().includes(searchTerm) || 
                              exam.subjectName.toLowerCase().includes(searchTerm) || 
                              exam.part.toLowerCase().includes(searchTerm);
        return matchesSubject && matchesSearch;
    });

    if (sortType === 'high') {
        filtered.sort((a, b) => b.completedCount - a.completedCount);
    } else if (sortType === 'low') {
        filtered.sort((a, b) => a.completedCount - b.completedCount);
    }

    if (filtered.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: var(--text-sub); font-size: 0.85rem;">لا توجد نتائج مطابقة لشروط البحث والفلترة.</p>';
        return;
    }

    let cardsHtml = '';
    filtered.forEach(exam => {
        cardsHtml += `
        <div class="acad-glass-card" style="margin-bottom: 0; padding: 14px 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div>
                    <h4 style="font-size: 0.95rem; font-weight: 900; margin-bottom: 2px;">${exam.title}</h4>
                    <span style="font-size: 0.74rem; color: var(--accent-gold); font-weight: 700;">${exam.subjectName} (${exam.part})</span>
                </div>
                <span class="pill-badge badge-subject" style="font-size: 0.7rem;">⏱️ ${exam.time} دقيقة</span>
            </div>

            <!-- أرقام الإحصائيات المباشرة -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; text-align: center; background: var(--bg-primary); padding: 10px; border-radius: 12px; border: 1px solid var(--border-card);">
                <div>
                    <div style="font-size: 1.3rem; font-weight: 900; color: var(--accent-emerald);">${exam.completedCount}</div>
                    <div style="font-size: 0.7rem; color: var(--text-sub); font-weight: 700;">الطلاب المجتازين</div>
                </div>
                <div>
                    <div style="font-size: 1.3rem; font-weight: 900; color: #ef4444;">${exam.remainingCount}</div>
                    <div style="font-size: 0.7rem; color: var(--text-sub); font-weight: 700;">المتبقي لم يؤدوه</div>
                </div>
            </div>
        </div>`;
    });

    listContainer.innerHTML = cardsHtml;
}

// دالة لجلب تاريخ اليوم الحقيقي المعتمد من خادم Firebase
function getServerDate(callback) {
    db.ref('.info/serverTimeOffset').once('value', function(offsetSnap) {
        const offset = offsetSnap.val() || 0;
        const serverTime = Date.now() + offset;
        const d = new Date(serverTime);
        
        // تحويل التاريخ لصيغة YYYY-MM-DD
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const todayDate = `${year}-${month}-${day}`;
        
        callback(todayDate, serverTime);
    });
}

// ============================================================================
// ================= محرك المستويات المظلمة الإضافية (Extra Levels) ============
// ============================================================================

let currentExtraLevelNum = 1;
let currentExtraLevelQuestions = [];
let currentExtraQIndex = 0;
let extraCorrectAnswersCount = 0;
let extraTimerInterval = null;
let extraTimeLeft = 10; // مضبوط على 10 ثوانٍ
let isExtraAnswerLocked = false;
let extraCooldownTicker = null;

// 1. فتح الخريطة وجلب المستويات
function openExtraLevelsMap() {
    playClickSound();
    if (!currentUser) { 
        showTopToast('يرجى تسجيل الدخول أولاً!', 'error'); 
        return; 
    }
    navigateTo('view-extra-levels-map', 'المستويات المظلمة ☠️', 'تحدي الهاردكور');
    loadAndRenderExtraLevels();
}

function loadAndRenderExtraLevels() {
    const container = document.getElementById('extra-levels-grid-container');
    if (!container) return;
    container.innerHTML = '<p style="text-align: center; color: var(--text-sub); grid-column: span 3;">جاري فحص المستويات... ⏳</p>';

    // قراءة تكوين المستويات الإضافية من فايربيز
    db.ref('extra_levels_config').once('value', (snap) => {
        const levelsConfig = snap.val() || {};
        let levelKeys = Object.keys(levelsConfig).map(Number).sort((a, b) => a - b);

        // إذا كان هناك مستوى تم رفعه ولم يظهر في config لأي سبب، نقرأ من extra_levels_data أيضاً كاحتياط
        if (levelKeys.length === 0) {
            db.ref('extra_levels_data').once('value', (dataSnap) => {
                const dataVal = dataSnap.val() || {};
                const fallbackKeys = Object.keys(dataVal).map(k => parseInt(k.replace('level_', ''))).filter(n => !isNaN(n)).sort((a, b) => a - b);
                
                if (fallbackKeys.length === 0) {
                    container.innerHTML = '<div class="acad-glass-card" style="text-align: center; grid-column: span 3; padding: 25px;"><span style="font-size: 2.5rem;">☠️</span><h4 style="color:#ef4444; margin: 10px 0;">لا توجد مستويات مظلمة منشورة</h4><p style="color:var(--text-sub); font-size:0.85rem;">ارفع المستوى 1 من لوحة التحكم لتظهر الكروت فوراً.</p></div>';
                    return;
                }
                renderExtraLevelCards(fallbackKeys, levelsConfig, container);
            });
            return;
        }

        renderExtraLevelCards(levelKeys, levelsConfig, container);
    });
}

function renderExtraLevelCards(levelKeys, levelsConfig, container) {
    const userExtraProgress = (currentUser && currentUser.extra_levels_progress) ? currentUser.extra_levels_progress : {};
    let html = '';

    levelKeys.forEach((lvl, idx) => {
        const userLvl = userExtraProgress[lvl] || { passed: false, score: 0, cooldown: 0 };
        const prevLvl = levelKeys[idx - 1];
        
        // المستوى الأول متاح دائماً، أو متاح للمطور 01061032507 مباشرة للتجربة
        const isDev = (currentUser && currentUser.phone === "01061032507");
        const isUnlocked = isDev || (idx === 0) || (userExtraProgress[prevLvl] && userExtraProgress[prevLvl].passed);
        
        let isCooldown = userLvl.cooldown && userLvl.cooldown > Date.now();
        let stateClass = 'locked';
        let statusBadge = '<span style="color: var(--text-sub);">🔒 مغلق</span>';

        if (isCooldown) {
            stateClass = 'cooldown-locked';
            statusBadge = '<span style="color: #ef4444;">⏱️ راحة 12 ساعة</span>';
        } else if (userLvl.passed) {
            stateClass = 'completed';
            statusBadge = `<span style="color: #10b981;">🏆 مكتمل (${userLvl.score}/10)</span>`;
        } else if (isUnlocked) {
            stateClass = 'unlocked';
            statusBadge = '<span style="color: #ef4444; font-weight: 900;">⚔️ ابدأ التحدي</span>';
        }

        html += `
        <div class="level-node ${stateClass}" style="border-color: ${isUnlocked ? '#ef4444' : 'var(--border-card)'}; background: ${isUnlocked ? 'linear-gradient(145deg, #2b0b10, #120306)' : 'rgba(0,0,0,0.5)'};" onclick="startExtraLevelNode(${lvl}, '${stateClass}', ${userLvl.cooldown || 0})">
            <div class="level-number" style="color: #fff; font-size: 2.2rem; text-shadow: 0 0 12px #ef4444;">${lvl}</div>
            <div class="level-lock-icon">${isCooldown ? '⏱️' : '🔒'}</div>
            <div class="level-stars" style="font-size: 0.72rem; font-weight: 800; margin-top: 6px;">
                ${statusBadge}
            </div>
        </div>`;
    });

    container.innerHTML = html;
}

// 2. فحص الدخول للمستوى
function startExtraLevelNode(levelNum, state, cooldownTime) {
    playClickSound();

    if (state === 'cooldown-locked') {
        openExtraCooldownModal(levelNum, cooldownTime);
        return;
    }

    if (state === 'locked') {
        showTopToast('أكمل المستوى السابق بنجاح أولاً لفتح هذا المستوى 🔒', 'error');
        return;
    }

    const userExtraProgress = (currentUser && currentUser.extra_levels_progress) ? currentUser.extra_levels_progress : {};
    const userLvl = userExtraProgress[levelNum];

    if (userLvl && userLvl.passed) {
        showTopToast(`لقد اجتزت هذا المستوى مسبقاً بنتيجة (${userLvl.score}/10). لا يوجد تحسين في هذا الطور! 🔒`, 'info');
        return;
    }

    showTopToast(`جاري تجهيز المستوى الإضافي ${levelNum}... ⏳`, 'info');
    
    db.ref(`extra_levels_data/level_${levelNum}`).once('value', (snap) => {
        if (!snap.exists()) {
            showTopToast('لم يتم رفع أسئلة لهذا المستوى بعد!', 'error');
            return;
        }

        let questions = snap.val() || [];
        if (questions.length < 10) {
            showTopToast(`الأسئلة المتوفرة ${questions.length} فقط (مطلوب 10)!`, 'error');
            return;
        }

        currentExtraLevelNum = levelNum;
        currentExtraLevelQuestions = shuffleArray([...questions]).slice(0, 10);
        currentExtraQIndex = 0;
        extraCorrectAnswersCount = 0;

        navigateTo('view-quiz-game', `المستوى المظلم ${levelNum} ☠️`, 'لا تهاون | 10 ثوانٍ');
        renderExtraLevelQuestion();
    });
}

// 3. عرض السؤال بالوقت الصارم (10 ثوانٍ)
function renderExtraLevelQuestion() {
    isExtraAnswerLocked = false;
    clearInterval(extraTimerInterval);

    const container = document.getElementById('quiz-container');
    const qData = currentExtraLevelQuestions[currentExtraQIndex];

    if (!qData || currentExtraQIndex >= 10) {
        concludeExtraLevel();
        return;
    }

    let options = shuffleArray([...qData.a]);
    const correctText = qData.a[qData.correct || 0];

    let html = `
        <div class="section-label" style="justify-content: space-between; align-items: center; border-color: #ef4444;">
            <span style="color: #ef4444; font-weight: 900;">السؤال ${currentExtraQIndex + 1} / 10</span>
            <span style="color: var(--accent-gold); font-size: 0.8rem;">صحيح: ${extraCorrectAnswersCount}</span>
        </div>
        <div class="quiz-card" style="border-color: rgba(239, 68, 68, 0.4); background: linear-gradient(145deg, #180507, #0a0203);">
            <div id="extra-quiz-timer" class="quiz-timer-box" style="border-color: #ef4444; color: #fff; font-size: 1.3rem;">⏱️ 10</div>
            <h3 style="font-size: 1.05rem; margin-bottom: 20px; line-height: 1.5; color: var(--text-main);">${qData.q}</h3>
            <div id="options-list" style="display: flex; flex-direction: column; gap: 8px;">`;
            
    options.forEach(opt => { 
        html += `<button class="quiz-option-btn" onclick="handleExtraLevelAnswer(this, '${opt}', '${correctText}')">${opt}</button>`; 
    });
    
    html += `</div>
        </div>`;

    container.innerHTML = html;
    startExtraTimer();
}

function startExtraTimer() {
    extraTimeLeft = 10;
    const timerEl = document.getElementById('extra-quiz-timer');
    if (timerEl) {
        timerEl.innerText = `⏱️ ${extraTimeLeft}`;
        timerEl.style.color = '#fff';
    }

    extraTimerInterval = setInterval(() => {
        extraTimeLeft--;
        if (timerEl) {
            timerEl.innerText = `⏱️ ${extraTimeLeft}`;
            if (extraTimeLeft <= 3) timerEl.style.color = '#ef4444';
        }

        if (extraTimeLeft <= 0) {
            clearInterval(extraTimerInterval);
            handleExtraLevelAnswer(null, '', 'TIMEOUT');
        }
    }, 1000);
}

function handleExtraLevelAnswer(btn, selected, correct) {
    if (isExtraAnswerLocked) return;
    isExtraAnswerLocked = true;
    clearInterval(extraTimerInterval);

    const isCorrect = (selected === correct);
    const allBtns = document.querySelectorAll('#options-list .quiz-option-btn');
    allBtns.forEach(b => b.disabled = true);

    if (isCorrect) {
        extraCorrectAnswersCount++;
        playSuccessSound();
        if (btn) btn.classList.add('correct-choice');
    } else {
        playErrorSound();
        if (btn) btn.classList.add('wrong-choice');
        allBtns.forEach(b => {
            if (b.innerText === correct) b.classList.add('correct-choice');
        });
    }

    setTimeout(() => {
        currentExtraQIndex++;
        if (currentExtraQIndex < 10) {
            renderExtraLevelQuestion();
        } else {
            concludeExtraLevel();
        }
    }, 1100);
}

// 4. تقييم المستوى (شرط 6 من 10)
function concludeExtraLevel() {
    clearInterval(extraTimerInterval);

    const isPassed = (extraCorrectAnswersCount >= 6);
    let userExtraProgress = (currentUser && currentUser.extra_levels_progress) ? currentUser.extra_levels_progress : {};

    if (isPassed) {
        playSuccessSound();
        shootStars();
        triggerConfetti();

        db.ref(`extra_levels_config/${currentExtraLevelNum}`).once('value', (snap) => {
            const cfg = snap.val() || { xp: 150, coins: 30 };
            const earnedXp = calculateXpWithBooster(parseInt(cfg.xp) || 150);
            const earnedCoins = parseInt(cfg.coins) || 30;

            userExtraProgress[currentExtraLevelNum] = {
                passed: true,
                score: extraCorrectAnswersCount,
                cooldown: 0
            };

            currentUser.extra_levels_progress = userExtraProgress;
            currentUser.xp = (currentUser.xp || 0) + earnedXp;
            currentUser.points = currentUser.xp;
            currentUser.coins = (currentUser.coins || 0) + earnedCoins;

            db.ref('users/' + currentUser.phone).update({
                extra_levels_progress: userExtraProgress,
                xp: currentUser.xp,
                points: currentUser.xp,
                coins: currentUser.coins
            });

            recordUserTransaction(`اجتياز المستوى المظلم ${currentExtraLevelNum}`, earnedXp, earnedCoins, 'reward');
            updateProfileUI();

            showTopToast(`عاش يا بطل! عبرت المستوى بنتيجة ${extraCorrectAnswersCount}/10 (+${earnedXp} XP و +${earnedCoins} عملة) 🏆`, 'success');
            setTimeout(() => {
                openExtraLevelsMap();
            }, 1200);
        });

    } else {
        playErrorSound();
        const cooldownTime = Date.now() + (12 * 60 * 60 * 1000);

        userExtraProgress[currentExtraLevelNum] = {
            passed: false,
            score: extraCorrectAnswersCount,
            cooldown: cooldownTime
        };

        currentUser.extra_levels_progress = userExtraProgress;
        db.ref(`users/${currentUser.phone}/extra_levels_progress`).set(userExtraProgress);

        showTopToast(`سقطت في المستوى! أجبت ${extraCorrectAnswersCount}/10 فقط (المطلوب 6). تم قفل المستوى 12 ساعة! ❌`, 'error');
        setTimeout(() => {
            openExtraCooldownModal(currentExtraLevelNum, cooldownTime);
        }, 800);
    }
}

// 5. إدارة كول داون الـ 12 ساعة والدفع بـ 200 عملة
function openExtraCooldownModal(lvlNum, cooldownTime) {
    currentExtraLevelNum = lvlNum;
    openModal('modal-extra-cooldown');

    if (extraCooldownTicker) clearInterval(extraCooldownTicker);

    extraCooldownTicker = setInterval(() => {
        const diff = cooldownTime - Date.now();
        if (diff <= 0) {
            clearInterval(extraCooldownTicker);
            let userExtraProgress = currentUser.extra_levels_progress || {};
            if (userExtraProgress[lvlNum]) {
                userExtraProgress[lvlNum].cooldown = 0;
                db.ref(`users/${currentUser.phone}/extra_levels_progress`).set(userExtraProgress);
            }
            closeModal('modal-extra-cooldown');
            openExtraLevelsMap();
        } else {
            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            const timerEl = document.getElementById('extra-cooldown-timer-display');
            if (timerEl) {
                timerEl.innerText = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
            }
        }
    }, 1000);
}

function payToSkipExtraCooldown() {
    playClickSound();
    const COST = 200;

    if ((currentUser.coins || 0) < COST) {
        showTopToast(`رصيدك لا يكفي! تحتاج ${COST} عملة للدفع فوراً 🪙`, 'error');
        return;
    }

    currentUser.coins -= COST;
    let userExtraProgress = currentUser.extra_levels_progress || {};
    if (userExtraProgress[currentExtraLevelNum]) {
        userExtraProgress[currentExtraLevelNum].cooldown = 0;
    }

    db.ref('users/' + currentUser.phone).update({
        coins: currentUser.coins,
        extra_levels_progress: userExtraProgress
    });

    recordUserTransaction(`فك قفل المستوى المظلم ${currentExtraLevelNum}`, 0, -COST, 'purchase');
    updateProfileUI();

    clearInterval(extraCooldownTicker);
    closeModal('modal-extra-cooldown');
    showTopToast('تم خصم 200 عملة وإلغاء القفل.. ابدأ التحدي فوراً! ⚡', 'success');

    setTimeout(() => {
        openExtraLevelsMap();
    }, 400);
}

// 6. لوحة تحكم الأدمن: رفع وحفظ المستويات الإضافية
function uploadAdminExtraLevel() {
    playClickSound();
    const lvlNum = parseInt(document.getElementById('adm-extra-lvl-num').value);
    const xpReward = parseInt(document.getElementById('adm-extra-lvl-xp').value) || 150;
    const coinsReward = parseInt(document.getElementById('adm-extra-lvl-coins').value) || 30;
    const rawText = document.getElementById('adm-extra-lvl-bulk').value.trim();

    if (!lvlNum || lvlNum < 1 || !rawText) {
        showTopToast('يرجى تحديد رقم المستوى ولصق الأسئلة!', 'error');
        return;
    }

    const lines = rawText.split('\n');
    let questions = [];

    lines.forEach(line => {
        if (!line.trim()) return;
        const parts = line.split('#').map(p => p.trim());
        if (parts.length >= 6) {
            const [cat, qText, correct, opt1, opt2, opt3] = parts;
            questions.push({
                q: qText,
                a: [correct, opt1, opt2, opt3],
                correct: 0,
                categoryName: cat
            });
        }
    });

    if (questions.length < 10) {
        showTopToast(`تم استخراج ${questions.length} أسئلة فقط! المطلوب 10 أسئلة بالصيغة المحددة.`, 'error');
        return;
    }

    const updates = {};
    updates[`extra_levels_config/${lvlNum}`] = { xp: xpReward, coins: coinsReward };
    updates[`extra_levels_data/level_${lvlNum}`] = questions.slice(0, 10);

    db.ref().update(updates).then(() => {
        showTopToast(`تم نشر المستوى المظلم (${lvlNum}) بنجاح في السيرفر! ☠️🚀`, 'success');
        document.getElementById('adm-extra-lvl-bulk').value = '';
    });
}

function loadPinnedReviewCard() {
    const slot = document.getElementById('pinned-home-review-card');
    if (!slot) return;
    
    // بنسحب الكارت أو التلخيص المميز من مساره الطبيعي في المحتوى العلمي
    db.ref('scientific_content/dairy_chemistry_review').once('value', snap => {
        if (!snap.exists()) {
            slot.style.display = 'none';
            return;
        }
        const data = snap.val();
        slot.style.display = 'block';
        slot.innerHTML = `
        <div class="acad-glass-card" style="border: 2px solid var(--accent-gold); cursor: pointer; padding: 16px; background: linear-gradient(145deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95));" onclick="openScientificLecture('${data.id}')">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span class="pill-badge badge-subject">🌟 مراجعة مثبتة</span>
                <span class="pill-badge" style="background: rgba(16, 185, 129, 0.2); color: var(--accent-emerald);">جوائز فورية 🎁</span>
            </div>
            <h3 style="color: var(--accent-gold); font-size: 1rem; margin-bottom: 4px;">${data.title}</h3>
            <p style="color: var(--text-sub); font-size: 0.78rem; margin: 0;">اضغط للبدء في المراجعة وحل الأسئلة 🚀</p>
        </div>`;
    });
}

// ============================================================================
// ============ محرك الشات والزر العائم الذكي والإشعارات اللحظية ===============
// ============================================================================

let studentDirectListener = null;
let studentBroadcastListener = null;
let localChatMessagesMap = new Map();
let currentAdminChatTargetPhone = null;
let adminThreadListener = null;
let adminAllThreadsListener = null;

// متغيرات الرد النشط
let currentActiveReply = {
    student: null, // { id, senderName, text }
    admin: null
};

// تفعيل وضع الرد
function setChatReply(targetRole, msgId, senderName, text) {
    if (typeof playClickSound === 'function') playClickSound();
    currentActiveReply[targetRole] = { id: msgId, senderName: senderName, text: text };

    const previewBar = document.getElementById(`${targetRole}-reply-preview`);
    const senderEl = document.getElementById(`${targetRole}-reply-sender`);
    const textEl = document.getElementById(`${targetRole}-reply-text`);
    const inputEl = document.getElementById(targetRole === 'student' ? 'student-chat-input' : 'admin-reply-chat-input');

    if (previewBar && senderEl && textEl) {
        senderEl.innerText = `رد على ${senderName}:`;
        textEl.innerText = text;
        previewBar.style.display = 'flex';
    }

    if (inputEl) inputEl.focus();
}

// إلغاء الرد
function cancelChatReply(targetRole) {
    currentActiveReply[targetRole] = null;
    const previewBar = document.getElementById(`${targetRole}-reply-preview`);
    if (previewBar) previewBar.style.display = 'none';
}

// تهيئة حركة التمرير السريع (Swipe to reply) مثل الواتساب
function attachSwipeToReply(element, targetRole, msgId, senderName, text) {
    let startX = 0;
    let currentTranslate = 0;
    const threshold = 55; // المسافة المطلوبة لتفعيل الرد
    const icon = element.parentElement.querySelector('.chat-swipe-reply-icon');

    element.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        element.style.transition = 'none';
    }, { passive: true });

    element.addEventListener('touchmove', (e) => {
        const currentX = e.touches[0].clientX;
        const diffX = currentX - startX;

        // السحب لليسار فقط (في الواجهة العربية)
        if (diffX < 0 && diffX > -90) {
            currentTranslate = diffX;
            element.style.transform = `translateX(${currentTranslate}px)`;
            if (icon) {
                icon.style.opacity = Math.min(1, Math.abs(diffX) / threshold);
                icon.style.left = '10px';
            }
        }
    }, { passive: true });

    element.addEventListener('touchend', () => {
        element.style.transition = 'transform 0.2s ease-out';
        element.style.transform = 'translateX(0px)';
        if (icon) icon.style.opacity = '0';

        if (Math.abs(currentTranslate) >= threshold) {
            setChatReply(targetRole, msgId, senderName, text);
            if (navigator.vibrate) navigator.vibrate(30); // اهتزاز خفيف لتأكيد السحب
        }
        currentTranslate = 0;
    });
}

// هل المستخدم الحالي أدمن؟
function isCurrentLoggedUserAdmin() {
    if (!currentUser) return false;
    return (currentUser.phone === "01061032507" || (currentUser.admin_roles && currentUser.admin_roles.includes('chat')));
}

// ضغطة الزر العائم: يوجه الطالب لشاته، ويوجه الأدمن للوحة شات الإدارة فوراً
function handleFloatingChatClick() {
    if (typeof playClickSound === 'function') playClickSound();

    if (!currentUser || !currentUser.phone) {
        showTopToast('يرجى تسجيل الدخول أولاً!', 'error');
        return;
    }

    const studentScreen = document.getElementById('inbox-student-screen');
    const adminScreen = document.getElementById('inbox-admin-screen');

    if (isCurrentLoggedUserAdmin()) {
        // حسابك كأدمن: يفتح لوحة الشات الإدارية مباشرة
        if (studentScreen) studentScreen.style.display = 'none';
        if (adminScreen) adminScreen.style.display = 'block';
        navigateTo('view-inbox', 'إدارة الرسائل والدعم', 'مراسلة جميع الطلاب');
        initAdminRealtimeChatHub();
        
        // تصفير بادج الأدمن عند الفتح
        updateFloatingChatBadge(0);
    } else {
        // حساب الطالب العادي: يفتح شات الدعم المباشر
        if (adminScreen) adminScreen.style.display = 'none';
        if (studentScreen) studentScreen.style.display = 'block';
        openStudentInbox();
    }
}

function openStudentInbox() {
    navigateTo('view-inbox', 'المحادثة والدعم', 'تواصل مباشر مع الإدارة');

    const container = document.getElementById('student-chat-box');
    if (container) {
        container.innerHTML = '<div style="text-align: center; color: var(--text-sub); font-size: 0.82rem; margin-top: 140px;">جاري تحميل المحادثة... ⏳</div>';
    }
    localChatMessagesMap.clear();

    // تصفير إشعار الرسائل للطالب
    localStorage.setItem('student_last_read_chat_time', Date.now().toString());
    updateFloatingChatBadge(0);

    // 👈 تحديث مؤشر القراءة: إخبار السيرفر بأن الطالب فتح الشات وقرأ رسائل الأدمن
    db.ref(`chats/direct/${currentUser.phone}`).once('value', snap => {
        if (!snap.exists()) return;
        const updates = {};
        snap.forEach(c => {
            const m = c.val();
            if (m.sender === 'admin' && !m.seen) {
                updates[`chats/direct/${currentUser.phone}/${c.key}/seen`] = true;
            }
        });
        if (Object.keys(updates).length > 0) {
            db.ref().update(updates);
        }
    });

    if (studentDirectListener) studentDirectListener.off();
    if (studentBroadcastListener) studentBroadcastListener.off();

    // استماع لحظي ومباشر للرسائل الثنائية (مع التحديث التلقائي لو تغيرت الحالة)
    studentDirectListener = db.ref(`chats/direct/${currentUser.phone}`).limitToLast(50);
    studentDirectListener.on('child_added', snap => {
        localChatMessagesMap.set(snap.key, { id: snap.key, isBroadcast: false, ...snap.val() });
        renderUnifiedStudentChat();
    });
    studentDirectListener.on('child_changed', snap => {
        localChatMessagesMap.set(snap.key, { id: snap.key, isBroadcast: false, ...snap.val() });
        renderUnifiedStudentChat();
    });

    // استماع لحظي ومباشر للتعميمات العامة
    studentBroadcastListener = db.ref('chats/broadcast').limitToLast(25);
    studentBroadcastListener.on('child_added', snap => {
        localChatMessagesMap.set(snap.key, { id: snap.key, isBroadcast: true, ...snap.val() });
        renderUnifiedStudentChat();
    });
}

function renderUnifiedStudentChat() {
    const container = document.getElementById('student-chat-box');
    if (!container) return;

    const messages = Array.from(localChatMessagesMap.values()).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    if (messages.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: var(--text-sub); margin-top: 130px; font-size: 0.85rem; line-height: 1.7;">
                لا توجد رسائل سابقة.<br>
                اكتب أي استفسار أو مشكلة تواجهك وسيتم الرد عليك هنا مباشرة 💬
            </div>`;
        return;
    }

    let html = '';
    messages.forEach(msg => {
        const isMe = (msg.sender === 'student');
        const isBroadcast = !!msg.isBroadcast;

        const align = isMe ? 'flex-end' : 'flex-start';
        const bg = isMe 
            ? 'linear-gradient(135deg, var(--accent-emerald), #059669)' 
            : (isBroadcast ? 'linear-gradient(135deg, #4c1d95, #2e1065)' : 'var(--bg-secondary)');
        const border = isBroadcast 
            ? 'border: 1px solid #a855f7;' 
            : (isMe ? 'border: 1px solid var(--accent-emerald);' : 'border: 1px solid var(--border-card);');
        const titleColor = isBroadcast ? '#fde047' : (isMe ? '#fff' : 'var(--accent-gold)');
        const senderTag = isMe ? 'أنت' : (isBroadcast ? '📢 Broadcast Message' : '🛡️ Admin');

        const timeStr = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '';

        // جزء الاقتباس لو الرسالة معمولة كرد
        let quoteHtml = '';
        if (msg.replyTo) {
            quoteHtml = `
                <div class="chat-quoted-box">
                    <div class="chat-quoted-sender">${msg.replyTo.senderName}</div>
                    <div class="chat-quoted-text">${msg.replyTo.text}</div>
                </div>`;
        }

        const safeText = (msg.text || '').replace(/'/g, "\\'");
        const safeSender = senderTag.replace(/'/g, "\\'");

        html += `
            <div class="chat-bubble-wrapper" style="justify-content: ${align};">
                <span class="chat-swipe-reply-icon">↩️</span>
                <div class="chat-swipe-msg" id="msg-bubble-${msg.id}" 
                     style="max-width: 82%; background: ${bg}; color: #fff; padding: 10px 14px; border-radius: 14px; font-size: 0.88rem; word-break: break-word; ${border} box-shadow: 0 3px 10px rgba(0,0,0,0.25);">
                    ${quoteHtml}
                    <div style="font-size: 0.72rem; color: ${titleColor}; font-weight: 900; margin-bottom: 4px;">
                        ${senderTag}
                    </div>
                    <div style="line-height: 1.5; font-weight: 600;">${msg.text}</div>
                    <div style="font-size: 0.65rem; color: rgba(255,255,255,0.65); text-align: left; margin-top: 4px; direction: ltr;">
                        ${timeStr}
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;

    // ربط إيماءة التمرير بكل الرسائل
    messages.forEach(msg => {
        const bubble = document.getElementById(`msg-bubble-${msg.id}`);
        if (bubble) {
            const senderTag = (msg.sender === 'student') ? 'أنت' : (msg.isBroadcast ? 'تعميم إداري' : 'الإدارة');
            attachSwipeToReply(bubble, 'student', msg.id, senderTag, msg.text);
        }
    });
}

// إرسال الطالب للرسالة
function sendStudentMessage() {
    const input = document.getElementById('student-chat-input');
    const text = input ? input.value.trim() : '';
    if (!text || !currentUser || !currentUser.phone) return;

    const payload = {
        sender: 'student',
        senderName: currentUser.name || 'طالب',
        senderPhone: currentUser.phone,
        text: text,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    // لو فيه ريبلاي
    if (currentActiveReply.student) {
        payload.replyTo = {
            id: currentActiveReply.student.id,
            senderName: currentActiveReply.student.senderName,
            text: currentActiveReply.student.text
        };
    }

    db.ref(`chats/direct/${currentUser.phone}`).push(payload).then(() => {
        localStorage.setItem('student_last_read_chat_time', Date.now().toString());

        db.ref(`chats/threads_meta/${currentUser.phone}`).set({
            name: currentUser.name || 'طالب',
            phone: currentUser.phone,
            lastMessage: text,
            lastSender: 'student',
            lastTimestamp: firebase.database.ServerValue.TIMESTAMP,
            unreadByAdmin: true
        });

        input.value = '';
        cancelChatReply('student');
        if (typeof playClickSound === 'function') playClickSound();
    });
}

// ================= نظام المراقبة اللحظية في الخلفية (Background Watcher) =================
let isChatWatcherInitialized = false;

function initRealtimeChatWatchers() {
    if (!currentUser || !currentUser.phone || isChatWatcherInitialized) return;
    isChatWatcherInitialized = true;

    // إظهار الزر العائم فور تسجيل الدخول
    const floatingBtn = document.getElementById('main-floating-chat-btn');
    if (floatingBtn) floatingBtn.style.display = 'flex';

    if (isCurrentLoggedUserAdmin()) {
        // 👈 الأدمن: استماع لحظي لأي محادثة يرسل فيها أي طالب
        db.ref('chats/threads_meta').on('value', snap => {
            if (!snap.exists()) {
                updateFloatingChatBadge(0);
                return;
            }

            let unreadCount = 0;
            let lastStudentName = '';
            let lastMsgText = '';

            snap.forEach(child => {
                const thread = child.val();
                if (thread.unreadByAdmin === true && thread.lastSender === 'student') {
                    unreadCount++;
                    lastStudentName = thread.name;
                    lastMsgText = thread.lastMessage;
                }
            });

            updateFloatingChatBadge(unreadCount);

            const currentView = (navHistory && navHistory[navHistory.length - 1]) ? navHistory[navHistory.length - 1].viewId : '';
            if (unreadCount > 0 && currentView !== 'view-inbox') {
                if (typeof playSuccessSound === 'function') playSuccessSound();
                showTopToast(`📩 رسالة جديدة من ${lastStudentName}: "${lastMsgText}"`, 'info');
            }
        });
    } else {
        // 👈 الطالب: استماع فقط للرسائل القادمة من الأدمن وتجاهل رسائل الطالب نفسه
        let lastReadDirectTime = parseInt(localStorage.getItem('student_last_read_chat_time') || '0');
        let lastReadBroadcastTime = parseInt(localStorage.getItem('student_last_read_broadcast_time') || '0');
        let unreadDirectCount = 0;
        let unreadBroadcastCount = 0;

        function refreshStudentBadgeTotal() {
            const currentView = (navHistory && navHistory[navHistory.length - 1]) ? navHistory[navHistory.length - 1].viewId : '';
            if (currentView === 'view-inbox') {
                unreadDirectCount = 0;
                unreadBroadcastCount = 0;
                localStorage.setItem('student_last_read_chat_time', Date.now().toString());
                localStorage.setItem('student_last_read_broadcast_time', Date.now().toString());
            }

            const totalUnread = unreadDirectCount + unreadBroadcastCount;
            updateFloatingChatBadge(totalUnread);
        }

        // 1. مراقبة الرسائل المباشرة (فقط القادمة من admin)
        db.ref(`chats/direct/${currentUser.phone}`).on('value', snap => {
            if (!snap.exists()) {
                unreadDirectCount = 0;
                refreshStudentBadgeTotal();
                return;
            }

            unreadDirectCount = 0;
            let hasNewAdminMsg = false;

            snap.forEach(c => {
                const msg = c.val();
                // الشرط الحاسم: فقط لو المرسل هو الأدمن ووقتها بعد آخر قراءة
                if (msg.sender === 'admin' && (msg.timestamp || 0) > lastReadDirectTime) {
                    unreadDirectCount++;
                    hasNewAdminMsg = true;
                }
            });

            const currentView = (navHistory && navHistory[navHistory.length - 1]) ? navHistory[navHistory.length - 1].viewId : '';
            if (hasNewAdminMsg && currentView !== 'view-inbox') {
                if (typeof playSuccessSound === 'function') playSuccessSound();
                showTopToast('📩 وصلك رد جديد من إدارة المنصة في الشات!', 'info');
            }

            refreshStudentBadgeTotal();
        });

        // 2. مراقبة التعميمات الجماعية
        db.ref('chats/broadcast').on('value', snap => {
            if (!snap.exists()) {
                unreadBroadcastCount = 0;
                refreshStudentBadgeTotal();
                return;
            }

            unreadBroadcastCount = 0;
            let hasNewBroadcast = false;

            snap.forEach(c => {
                const msg = c.val();
                if ((msg.timestamp || 0) > lastReadBroadcastTime) {
                    unreadBroadcastCount++;
                    hasNewBroadcast = true;
                }
            });

            const currentView = (navHistory && navHistory[navHistory.length - 1]) ? navHistory[navHistory.length - 1].viewId : '';
            if (hasNewBroadcast && currentView !== 'view-inbox') {
                if (typeof playSuccessSound === 'function') playSuccessSound();
                showTopToast('📢 تعميم جديد في الشات!', 'info');
            }

            refreshStudentBadgeTotal();
        });
    }
}

// تحديث رقم البادج على الدائرة العائمة
function updateFloatingChatBadge(count) {
    const badge = document.getElementById('floating-chat-badge');
    if (!badge) return;

    if (count > 0) {
        badge.innerText = count > 9 ? '+9' : count;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}

// ================= دوال الأدمن وإدارة الرسائل اللحظية =================

function initAdminRealtimeChatHub() {
    const container = document.getElementById('admin-chat-threads-list');
    if (!container) return;

    if (adminAllThreadsListener) adminAllThreadsListener.off();

    // استماع لحظي مستمر لكل المحادثات بدون الحاجة للضغط على زر تحديث
    adminAllThreadsListener = db.ref('chats/threads_meta').orderByChild('lastTimestamp');
    adminAllThreadsListener.on('value', snap => {
        if (!snap.exists()) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-sub); font-size: 0.8rem;">لا توجد محادثات واردة حتى الآن.</p>';
            return;
        }

        let threads = [];
        snap.forEach(c => {
            threads.push({ phone: c.key, ...c.val() });
        });
        threads.reverse(); // أحدث محادثة في الأعلى

        let html = '';
        threads.forEach(t => {
            const hasUnread = (t.unreadByAdmin === true && t.lastSender === 'student');
            const unreadDot = hasUnread ? '<span style="width: 8px; height: 8px; background: #ef4444; border-radius: 50%; display: inline-block; box-shadow: 0 0 6px #ef4444;"></span>' : '';
            const borderStyle = hasUnread ? 'border: 1.5px solid #ef4444;' : 'border: 1px solid var(--border-card);';

            html += `
            <div class="admin-item-card" style="cursor: pointer; padding: 10px 12px; margin-bottom: 2px; ${borderStyle}" onclick="openAdminChatWithStudent('${t.phone}', '${t.name}')">
                <div class="admin-item-info">
                    <div class="admin-item-name" style="font-size: 0.88rem; display: flex; align-items: center; gap: 6px;">
                        ${unreadDot} 👤 ${t.name} (${t.phone})
                    </div>
                    <div class="admin-item-sub" style="font-size: 0.75rem; color: var(--text-sub); margin-top: 2px;">${t.lastMessage || ''}</div>
                </div>
                <button class="admin-action-btn" style="padding: 4px 10px; font-size: 0.72rem;">رد 💬</button>
            </div>`;
        });

        container.innerHTML = html;
    });
}

// بدء الأدمن لمحادثة مع أي طالب من الصفر برقم هاتفه
function adminStartChatWithNewStudent() {
    const phoneInput = document.getElementById('adm-manual-student-phone');
    const nameInput = document.getElementById('adm-manual-student-name');
    const msgInput = document.getElementById('adm-manual-first-msg');

    const phone = phoneInput ? phoneInput.value.trim() : '';
    const name = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : 'طالب';
    const text = msgInput ? msgInput.value.trim() : '';

    if (!phone || phone.length < 10) {
        showTopToast('يرجى إدخال رقم هاتف صحيح للطالب!', 'error');
        return;
    }
    if (!text) {
        showTopToast('يرجى كتابة نص الرسالة الافتتاحية!', 'error');
        return;
    }

    if (typeof playClickSound === 'function') playClickSound();

    const payload = {
        sender: 'admin',
        senderName: 'Admin',
        text: text,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    db.ref(`chats/direct/${phone}`).push(payload).then(() => {
        db.ref(`chats/threads_meta/${phone}`).set({
            name: name,
            phone: phone,
            lastMessage: `الإدارة: ${text}`,
            lastSender: 'admin',
            lastTimestamp: firebase.database.ServerValue.TIMESTAMP,
            unreadByAdmin: false
        });

        phoneInput.value = '';
        if (nameInput) nameInput.value = '';
        msgInput.value = '';

        showTopToast(`تم بدء الشات وإرسال الرسالة للطالب (${phone}) بنجاح! 🚀`, 'success');
        openAdminChatWithStudent(phone, name);
    });
}

// فتح محادثة الطالب المختار للأدمن
function openAdminChatWithStudent(phone, name) {
    currentAdminChatTargetPhone = phone;
    const box = document.getElementById('admin-active-thread-box');
    const title = document.getElementById('admin-chat-target-title');
    const msgContainer = document.getElementById('admin-thread-messages');

    if (box) box.style.display = 'block';
    if (title) title.innerText = `المحادثة مع: ${name} (${phone})`;
    if (msgContainer) msgContainer.innerHTML = '<p style="text-align: center; color: var(--text-sub); font-size: 0.8rem;">جاري تحميل الرسائل... ⏳</p>';

    // مسح إشعار غير مقروء عن هذه المحادثة للأدمن
    db.ref(`chats/threads_meta/${phone}/unreadByAdmin`).set(false);

    if (adminThreadListener) adminThreadListener.off();

    adminThreadListener = db.ref(`chats/direct/${phone}`).limitToLast(50);
    adminThreadListener.on('value', snap => {
        if (!snap.exists()) {
            msgContainer.innerHTML = '<p style="text-align: center; color: var(--text-sub); font-size: 0.8rem;">لا توجد رسائل سابقة.</p>';
            return;
        }

        let html = '';
        snap.forEach(c => {
            const m = c.val();
            const msgId = c.key;
            const isAdmin = (m.sender === 'admin');
            const align = isAdmin ? 'flex-end' : 'flex-start';
            const bg = isAdmin ? 'var(--accent-emerald)' : 'var(--bg-secondary)';

            // 👈 مؤشر القراءة للأدمن فقط: صح رمادي لو موصلتش/ماتفتحتش، وصحين زرق لو الطالب فتح الشات
            let seenStatusHtml = '';
            if (isAdmin) {
                if (m.seen === true) {
                    seenStatusHtml = `<span class="admin-msg-seen-status seen-double-check" title="تمت القراءة من الطالب">✓✓</span>`;
                } else {
                    seenStatusHtml = `<span class="admin-msg-seen-status unseen-single-check" title="تم الإرسال (لم يفتح الشات بعد)">✓</span>`;
                }
            }

            // عرض الاقتباس لو الرسالة رد
            let quoteHtml = '';
            if (m.replyTo) {
                quoteHtml = `
                    <div class="chat-quoted-box">
                        <div class="chat-quoted-sender">${m.replyTo.senderName}</div>
                        <div class="chat-quoted-text">${m.replyTo.text}</div>
                    </div>`;
            }

            html += `
                <div class="chat-bubble-wrapper" style="justify-content: ${align};">
                    <span class="chat-swipe-reply-icon">↩️</span>
                    <div class="chat-swipe-msg" id="admin-bubble-${msgId}" 
                         style="max-width: 82%; background: ${bg}; color: #fff; padding: 7px 12px; border-radius: 12px; font-size: 0.82rem; word-break: break-word;">
                        ${quoteHtml}
                        <div style="font-size: 0.68rem; font-weight: bold; opacity: 0.8; margin-bottom: 2px;">${isAdmin ? 'أنت (الإدارة)' : name}</div>
                        <div style="line-height: 1.4;">${m.text}</div>
                        <div style="font-size: 0.65rem; color: rgba(255,255,255,0.7); text-align: left; margin-top: 3px; direction: ltr;">
                            ${seenStatusHtml}
                            ${m.timestamp ? new Date(m.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                    </div>
                </div>`;
        });

        msgContainer.innerHTML = html;
        msgContainer.scrollTop = msgContainer.scrollHeight;

        // تفعيل التمرير السريع للرد في شات الأدمن أيضاً
        snap.forEach(c => {
            const m = c.val();
            const bubble = document.getElementById(`admin-bubble-${c.key}`);
            if (bubble) {
                const sName = (m.sender === 'admin') ? 'أنت' : name;
                attachSwipeToReply(bubble, 'admin', c.key, sName, m.text);
            }
        });
    });

    box.scrollIntoView({ behavior: 'smooth' });
}

function adminSendReplyToActiveStudent() {
    const input = document.getElementById('admin-reply-chat-input');
    const text = input ? input.value.trim() : '';
    if (!text || !currentAdminChatTargetPhone) return;

    const payload = {
        sender: 'admin',
        senderName: 'Admin',
        text: text,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        seen: false // تبدأ كـ false حتى يفتحها الطالب
    };

    // لو الأدمن عامل ريبلاي
    if (currentActiveReply.admin) {
        payload.replyTo = {
            id: currentActiveReply.admin.id,
            senderName: currentActiveReply.admin.senderName,
            text: currentActiveReply.admin.text
        };
    }

    db.ref(`chats/direct/${currentAdminChatTargetPhone}`).push(payload).then(() => {
        db.ref(`chats/threads_meta/${currentAdminChatTargetPhone}`).update({
            lastMessage: `الإدارة: ${text}`,
            lastSender: 'admin',
            lastTimestamp: firebase.database.ServerValue.TIMESTAMP,
            unreadByAdmin: false
        });
        input.value = '';
        cancelChatReply('admin');
        if (typeof playClickSound === 'function') playClickSound();
    });
}

// إرسال تعميم الأدمن للجميع
function adminSendBroadcastChat() {
    const input = document.getElementById('adm-broadcast-chat-input');
    const text = input ? input.value.trim() : '';
    if (!text) {
        showTopToast('اكتب نص التعميم أولاً!', 'error');
        return;
    }

    if (typeof playClickSound === 'function') playClickSound();
    db.ref('chats/broadcast').push({
        sender: 'admin',
        senderName: 'Admin',
        text: text,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        input.value = '';
        showTopToast('تم إرسال التعميم للجميع في الشات بنجاح 📢✨', 'success');
    });
}