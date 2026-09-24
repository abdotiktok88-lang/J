let cloudQuestionsCache = null;
let ehbedQuestionsCache = null;

// ================= نظام القفل والفيدباك =================
let finaleSelectedRating = 0;
let isAppLockedForMaintenance = false;

document.addEventListener("DOMContentLoaded", () => {
    const finaleScreen = document.getElementById('grand-finale-screen');
    const allowedPhones = ["01061032507", "01061032508"]; // أرقامك المستثناة
    const currentPhone = localStorage.getItem('active_user_phone');
    
    // موعد العودة الجديد: 19 سبتمبر 2026 الساعة 11:00 مساءً
    const unlockDate = new Date("2026-09-19T23:00:00").getTime();
    const now = Date.now();

    // تشغيل القفل إذا كان الوقت لم يحن بعد والمستخدم ليس من المستثنين
    if (now < unlockDate && !allowedPhones.includes(currentPhone)) {
        isAppLockedForMaintenance = true;

        if (finaleScreen) {
            finaleScreen.style.setProperty('display', 'block', 'important'); // إظهار الشاشة بشكل إجباري ومضمون
        }
        
        // إخفاء عناصر التطبيق
        const mainContainer = document.querySelector('.container');
        if (mainContainer) mainContainer.style.display = 'none';

        const mainHeader = document.querySelector('header');
        if (mainHeader) mainHeader.style.display = 'none';

        const bottomNav = document.getElementById('main-bottom-nav');
        if (bottomNav) bottomNav.style.display = 'none';

        startFinaleCountdown(unlockDate);
        initFinaleStars();
        return; 
    } else {
        // فك القفل لحساب المطور
        isAppLockedForMaintenance = false;

        if (finaleScreen) finaleScreen.style.display = 'none';
        updateSoundUI();
        checkAppEntryFlow();
        checkBroadcastAlerts();
        initUserTicketRepliesListener();
        listenToCountdowns();
        if (typeof listenToContentMarkers === 'function') listenToContentMarkers();
if (typeof listenToAcademicMarkers === 'function') listenToAcademicMarkers();
listenToAppNotifications();
initDynamicQuotesFeed();
    }
});

function initFinaleStars() {
    const stars = document.querySelectorAll('.fb-star');
    stars.forEach(star => {
        star.style.cursor = 'pointer';
        star.onclick = function() {
            if (typeof playClickSound === 'function') playClickSound();
            finaleSelectedRating = parseInt(this.getAttribute('data-val'));
            stars.forEach(s => {
                if (parseInt(s.getAttribute('data-val')) <= finaleSelectedRating) {
                    s.style.filter = 'grayscale(0) opacity(1)';
                    s.style.transform = 'scale(1.1)';
                } else {
                    s.style.filter = 'grayscale(1) opacity(0.35)';
                    s.style.transform = 'scale(1)';
                }
            });
        };
    });
}

function startFinaleCountdown(targetTime) {
    const cdDiv = document.getElementById('finale-countdown');
    if (!cdDiv) return;
    
    function update() {
        const diff = targetTime - Date.now();
        if (diff <= 0) { 
            cdDiv.innerHTML = '<span style="grid-column: span 4; color:var(--accent-emerald); font-weight:900; font-size:1.1rem;">حان وقت العودة! أعد تحميل الصفحة 🚀</span>'; 
            return; 
        }
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        
        cdDiv.innerHTML = `
            <div style="background: var(--bg-primary); border: 1px solid var(--border-card); padding: 12px 6px; border-radius: 14px;"><div style="font-size: 1.35rem; font-weight: 900; color: var(--text-main);">${s}</div><div style="font-size: 0.7rem; color: var(--text-sub); font-weight: 700; margin-top: 2px;">ثانية</div></div>
            <div style="background: var(--bg-primary); border: 1px solid var(--border-card); padding: 12px 6px; border-radius: 14px;"><div style="font-size: 1.35rem; font-weight: 900; color: var(--text-main);">${m}</div><div style="font-size: 0.7rem; color: var(--text-sub); font-weight: 700; margin-top: 2px;">دقيقة</div></div>
            <div style="background: var(--bg-primary); border: 1px solid var(--border-card); padding: 12px 6px; border-radius: 14px;"><div style="font-size: 1.35rem; font-weight: 900; color: var(--text-main);">${h}</div><div style="font-size: 0.7rem; color: var(--text-sub); font-weight: 700; margin-top: 2px;">ساعة</div></div>
            <div style="background: var(--bg-primary); border: 1px solid var(--border-card); padding: 12px 6px; border-radius: 14px;"><div style="font-size: 1.35rem; font-weight: 900; color: var(--accent-gold);">${d}</div><div style="font-size: 0.7rem; color: var(--text-sub); font-weight: 700; margin-top: 2px;">يوم</div></div>
        `;
    }
    update();
    setInterval(update, 1000);
}

function submitFinaleFeedback() {
    if (finaleSelectedRating === 0) { alert('حدد تقييمك بالنجوم الأول يا هندسة!'); return; }
    
    const text = document.getElementById('finale-feedback-text').value.trim();
    if (!text) { alert('اكتب رأيك أو اقتراحك الأول!'); return; }
    
    if(typeof playClickSound === 'function') playClickSound();
    document.getElementById('btn-submit-feedback').innerText = 'جاري الإرسال... ⏳';
    
    const cachedUser = JSON.parse(localStorage.getItem('cached_user_data') || '{}');
    const phone = localStorage.getItem('active_user_phone') || 'غير مسجل';
    const name = cachedUser.name || 'طالب غير معروف';

    db.ref('beta_feedback').push({
        phone: phone,
        name: name,
        rating: finaleSelectedRating,
        feedback: text,
        submittedAt: new Date().toISOString()
    }).then(() => {
        if(typeof playSuccessSound === 'function') playSuccessSound();
        if(typeof triggerConfetti === 'function') triggerConfetti();
        document.getElementById('feedback-section').style.display = 'none';
        document.getElementById('feedback-success-msg').style.display = 'block';
    }).catch(() => {
        document.getElementById('btn-submit-feedback').innerText = 'إرسال التقييم 📤';
        alert('حدث خطأ في الاتصال، حاول مجدداً!');
    });
}

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
// ================= محرك الكاش الذكي المطور (يدعم أسئلة ريسك والاختبارات) =================
async function getQuestionsWithCache(dbNodeName) {
    try {
        const versionSnap = await db.ref('settings/' + dbNodeName + '_version').once('value');
        const serverVersion = versionSnap.val() || 1;
        const localVersion = localStorage.getItem('version_' + dbNodeName);

        // لو الإصدار متطابق، يتم الجلب من ذاكرة الهاتف فوراً
        if (localVersion == serverVersion) {
            const cachedString = localStorage.getItem('cache_' + dbNodeName);
            if (cachedString) {
                return JSON.parse(cachedString);
            }
        }

        // لو الإصدار اتغير أو مفيش كاش، بنسحب من فايربيز مباشرة
        const dataSnap = await db.ref(dbNodeName).once('value');
        let questionsArr = [];

        if (dataSnap.exists()) {
            dataSnap.forEach(child => {
                let item = child.val();
                if (!item) return;

                // لو كانت أسئلة ريسك (تحتوي على points و category)
                if (dbNodeName === 'risk_questions') {
                    if (item.q && item.a && item.category && item.points !== undefined) {
                        questionsArr.push({
                            id: child.key,
                            category: item.category,
                            points: parseInt(item.points),
                            q: item.q,
                            a: item.a
                        });
                    }
                } 
                // لباقي الأسئلة العادية (تحديات الكلاسيك)
                else {
                    if (item.q && item.a) {
                        questionsArr.push({
                            id: `custom_${child.key}`,
                            q: item.q,
                            a: Array.isArray(item.a) ? [...item.a] : [item.a],
                            correct: item.correct || 0,
                            categoryName: item.category || "أسئلة إضافية"
                        });
                    }
                }
            });
        }

        // حفظ الداتا الجديدة ورقم الإصدار محلياً
        localStorage.setItem('cache_' + dbNodeName, JSON.stringify(questionsArr));
        localStorage.setItem('version_' + dbNodeName, serverVersion);

        return questionsArr;
    } catch (error) {
        const cachedString = localStorage.getItem('cache_' + dbNodeName);
        return cachedString ? JSON.parse(cachedString) : [];
    }
}

// دالة للإدارة لرفع رقم الإصدار أوتوماتيكياً عند إضافة أو حذف أسئلة
function incrementQuestionsVersion(dbNodeName) {
    db.ref('settings/' + dbNodeName + '_version').transaction(currentVal => {
        return (currentVal || 1) + 1;
    });
}
    // ================= إعدادات فايربيز =================
    const firebaseConfig = {
        apiKey: "AIzaSyAt-e7RSQ_nGWDARMuktaVOY5_mCXCKVmQ",
        authDomain: "foodscienceapp.firebaseapp.com",
        projectId: "foodscienceapp",
        storageBucket: "foodscienceapp.firebasestorage.app",
        messagingSenderId: "713983239462",
        appId: "1:713983239462:web:0c70ceb39a1c3a1be58de7",
        measurementId: "G-LWZYWRQSHB"
    };

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.database();
    const auth = firebase.auth();

    // دالة تجلب الوقت الحقيقي بالملي ثانية من سيرفر جوجل
    function getRealTimeMs() {
        return Date.now() + serverTimeOffset;
    }

    // دالة تجلب تاريخ اليوم الحقيقي الموحد (YYYY-MM-DD)
    function getRealDateString() {
        const d = new Date(getRealTimeMs());
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
// ================= محرك مزامنة وقت السيرفر والتحديث التلقائي =================
let serverTimeOffset = 0;
const CURRENT_APP_VERSION = "2.0.3";

// 👈 دي الدالة اللي هتشغلهم وقت ما نحب بس (نادينا عليها في الـ else فوق)
function initGlobalFirebaseListeners() {
    db.ref('.info/serverTimeOffset').on('value', function(snap) {
        serverTimeOffset = snap.val() || 0;
    });

    db.ref('app_version').on('value', (snapshot) => {
        if (snapshot.exists()) {
            const cloudVersion = snapshot.val();
            if (cloudVersion !== CURRENT_APP_VERSION) {
                if ('caches' in window) {
                    caches.keys().then(names => {
                        names.forEach(name => caches.delete(name));
                    });
                }
                window.location.reload(true);
            }
        }
    });
}

    // ================= دوال المنظم الأكاديمي والمنصة =================
    function openAcademicHub() {
    playClickSound();
    localStorage.setItem('seen_acad_marker_tasks', Date.now().toString());
    navigateTo('view-academic-hub', 'المنظم الأكاديمي', 'المنصة والتكليفات والجداول');
    loadAcademicTasks();
    setTimeout(updateAcademicRedDots, 50);
}

function switchAcademicTab(tab) {
    playClickSound();
    if (['tasks', 'schedules', 'alerts'].includes(tab)) {
        localStorage.setItem(`seen_acad_marker_${tab}`, Date.now().toString());
    }

    ['tasks', 'schedules', 'exams', 'alerts'].forEach(t => {
        const b = document.getElementById(`tab-acad-${t}`);
        const s = document.getElementById(`acad-sub-${t}`);
        if (b) b.classList.remove('active');
        if (s) s.style.display = 'none';
    });
    document.getElementById(`tab-acad-${tab}`).classList.add('active');
    document.getElementById(`acad-sub-${tab}`).style.display = 'block';

    if (tab === 'tasks') loadAcademicTasks();
    if (tab === 'alerts') loadAcademicAlerts();

    setTimeout(updateAcademicRedDots, 50);
}

    function loadAcademicTasks() {
    const list = document.getElementById('acad-tasks-list');
    const localTasks = localStorage.getItem('local_acad_tasks');
    
    // عرض المحفوظ في الموبايل فوراً
    if (localTasks) {
        renderTasksToDOM(JSON.parse(localTasks), list);
    }

    // جلب التحديث في الخلفية مرة واحدة فقط وحفظه
    db.ref('academic_tasks').once('value', (snap) => {
        let tasksObj = {};
        if (snap.exists()) tasksObj = snap.val();
        localStorage.setItem('local_acad_tasks', JSON.stringify(tasksObj));
        renderTasksToDOM(tasksObj, list);
    });
}

function renderTasksToDOM(tasksObj, list) {
    if (!tasksObj || Object.keys(tasksObj).length === 0) {
        list.innerHTML = `
        <div class="acad-glass-card" style="text-align: center; padding: 25px 15px;">
            <img src="https://img.icons8.com/fluency/96/ok.png" style="width: 55px; height: 55px; margin-bottom: 8px;" alt="Empty">
            <p style="color: #0f172a; font-weight: 800; font-size: 0.95rem;">لا توجد تكليفات مطلوبة حالياً 🎉</p>
        </div>`;
        return;
    }
    let html = '';
    const myCompletedTasks = (currentUser && currentUser.completed_tasks) ? currentUser.completed_tasks : JSON.parse(localStorage.getItem('completed_tasks_' + (currentUser ? currentUser.phone : 'guest')) || '[]');

    Object.keys(tasksObj).forEach(taskId => {
        const task = tasksObj[taskId];
        const isDone = myCompletedTasks.includes(taskId);
        const deadlineDate = new Date(task.deadline);
        const now = new Date();
        const diffHours = Math.round((deadlineDate - now) / (1000 * 60 * 60));
        
        let deadlineText = diffHours > 0 ? `⏳ متبقي: ${Math.floor(diffHours / 24)} يوم و ${diffHours % 24} س` : 'انتهى موعد التسليم ⏰';
        let isUrgent = diffHours > 0 && diffHours <= 48;
        let badgeClass = isDone ? 'pill-badge badge-done' : (isUrgent ? 'pill-badge badge-timer-urgent' : 'pill-badge badge-timer-active');
        let badgeText = isDone ? 'تم التسليم بنجاح ✔️' : deadlineText;

        html += `
        <div class="acad-glass-card ${isDone ? 'completed' : ''}" id="task-${taskId}">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <span class="pill-badge badge-subject">
                    <img src="https://img.icons8.com/fluency/48/open-book.png" style="width: 14px;"> ${task.subject}
                </span>
                <span class="${badgeClass}">${badgeText}</span>
            </div>
            <h4 style="font-size: 0.96rem; margin-bottom: 12px; line-height: 1.5;">${task.title}</h4>
            <div style="display: flex; gap: 8px; align-items: center;">
                ${task.url ? `
                    <button class="btn-action-glow btn-download-file" onclick="window.open('${task.url}', '_blank')">
                        <img src="https://img.icons8.com/fluency/48/google-drive--v2.png" style="width: 16px;"> تحميل الملف
                    </button>` : ''}
                <button class="btn-action-glow btn-check-task ${isDone ? 'done' : ''}" style="flex: 1;" onclick="toggleTaskComplete('${taskId}')">
                    <img src="https://img.icons8.com/fluency/48/${isDone ? 'checked-checkbox.png' : 'checkmark--v1.png'}" style="width: 16px;">
                    ${isDone ? 'تم الإنجاز بنجاح' : 'تحديد كـ مكتمل'}
                </button>
                ${currentUser && currentUser.phone === '01061032507' ? `
                    <button class="admin-action-btn danger" style="padding: 7px 10px; border-radius: 10px;" onclick="adminDeleteTask('${taskId}')">
                        <img src="https://img.icons8.com/fluency/48/delete-trash.png" style="width: 16px;">
                    </button>` : ''}
            </div>
        </div>`;
    });
    list.innerHTML = html;
}

    function toggleTaskComplete(taskId) {
        playClickSound();
        if (!currentUser) return;
        
        let completed = currentUser.completed_tasks || [];
        if (completed.includes(taskId)) {
            completed = completed.filter(id => id !== taskId);
            showTopToast('تم إلغاء تحديد التكليف', 'info');
        } else {
            completed.push(taskId);
            playSuccessSound();
            shootStars();
            showTopToast('عاش يا بطل! تم إنجاز المهمة بنجاح ✅', 'success');
        }
        
        currentUser.completed_tasks = completed;
        localStorage.setItem('completed_tasks_' + currentUser.phone, JSON.stringify(completed));
        db.ref('users/' + currentUser.phone + '/completed_tasks').set(completed);
        
        loadAcademicTasks();
        renderHomeCountdowns(); // تحديث فوري لحذف أو إعادة إظهار المؤقت في الواجهة الرئيسية
    }

    async function viewScheduleInApp(secKey, secTitle) {
    const container = document.getElementById('schedule-viewer-container');
    const titleEl = document.getElementById('schedule-view-title');
    if (titleEl) titleEl.innerText = 'جدول ' + secTitle;

    navigateTo('view-schedule-detail', 'جدول ' + secTitle, 'عرض جدول السكشن');

    const offlineImgData = localStorage.getItem('offline_schedule_img_' + secKey);
    const cachedUrl = localStorage.getItem('cached_schedule_' + secKey);

    if (offlineImgData) {
        renderScheduleImage(container, offlineImgData, secTitle);
        checkAndUpdateScheduleIfOnline(secKey, secTitle, container);
        return;
    }

    container.innerHTML = `
        <div style="text-align: center; padding: 30px 10px;">
            <div style="font-size: 2.2rem; animation: pulseLevel 1s infinite;">⏳</div>
            <p style="color: var(--accent-gold); font-weight: 800; margin-top: 10px;">جاري تحميل الجدول وتثبيته على هاتفك...</p>
        </div>
    `;

    try {
        // تم تصحيح database إلى db
        const snap = await db.ref('schedules_config/' + secKey).once('value');
        const onlineUrl = snap.val();

        if (onlineUrl && onlineUrl.trim() !== '') {
            localStorage.setItem('cached_schedule_' + secKey, onlineUrl);
            saveImageForOfflineUse(onlineUrl, secKey, secTitle, container);
        } else {
            showEmptySchedulePlaceholder(container);
        }
    } catch (err) {
        if (cachedUrl) {
            renderScheduleImage(container, cachedUrl, secTitle);
        } else {
            showEmptySchedulePlaceholder(container);
        }
    }
}

function checkAndUpdateScheduleIfOnline(secKey, secTitle, container) {
    if (!navigator.onLine) return;
    // تم تصحيح database إلى db
    db.ref('schedules_config/' + secKey).once('value').then(snap => {
        const latestUrl = snap.val();
        const currentCachedUrl = localStorage.getItem('cached_schedule_' + secKey);
        if (latestUrl && latestUrl !== currentCachedUrl) {
            localStorage.setItem('cached_schedule_' + secKey, latestUrl);
            saveImageForOfflineUse(latestUrl, secKey, secTitle, container);
        }
    }).catch(() => {});
}

function showEmptySchedulePlaceholder(container) {
    container.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 25px 10px;">
            <img src="https://img.icons8.com/fluency/96/calendar.png" style="width: 65px; height: 65px; margin-bottom: 10px;" alt="Calendar">
            <h4 style="color: var(--text-main); font-size: 0.95rem; margin-bottom: 4px;">الجدول غير متاح حالياً</h4>
            <p style="color: var(--text-sub); font-size: 0.8rem;">سيتم إتاحة جدول هذا السكشن رسمياً هنا فور اعتماده ⏳</p>
        </div>
    `;
}

function saveImageForOfflineUse(url, secKey, secTitle, container) {
    fetch(url)
        .then(response => response.blob())
        .then(blob => {
            const reader = new FileReader();
            reader.onloadend = function () {
                const base64data = reader.result;
                try {
                    // حفظ ملف الصورة الفعلي في ذاكرة التخزين
                    localStorage.setItem('offline_schedule_img_' + secKey, base64data);
                } catch (e) {
                    console.warn("حجم الصورة كبير على localStorage، سيتم الاعتماد على الكاش الافتراضي");
                }
                renderScheduleImage(container, base64data, secTitle);
            };
            reader.readAsDataURL(blob);
        })
        .catch(() => {
            // لو كان هناك حظر CORS للتحويل، نعرض الصورة برابطها العادي
            renderScheduleImage(container, url, secTitle);
        });
}

    function renderScheduleImage(container, src, title) {
    container.innerHTML = `
        <div style="width: 100%; display: flex; flex-direction: column; align-items: center;">
            <img src="${src}" alt="${title}" style="width: 100%; max-height: 70vh; object-fit: contain; border-radius: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); background: var(--bg-primary);">
            <div style="margin-top: 12px; display: flex; gap: 8px; width: 100%;">
                <a href="${src}" download="${title}.jpg" class="admin-action-btn" style="flex: 1; text-align: center; text-decoration: none; padding: 10px; border-color: var(--accent-emerald); color: var(--accent-emerald);">حفظ في الاستوديو 💾</a>
            </div>
        </div>
    `;
}

    function loadAcademicAlerts() {
        const list = document.getElementById('acad-alerts-list');
        db.ref('college_alerts').once('value', snap => {
            if (!snap.exists()) {
                list.innerHTML = `
                <div class="acad-glass-card" style="text-align: center; padding: 25px 15px;">
                    <img src="https://img.icons8.com/fluency/96/megaphone.png" style="width: 50px; height: 50px; margin-bottom: 8px;">
                    <p style="color: var(--text-sub); font-size: 0.85rem;">لا توجد إعلانات رسمية حالياً.</p>
                </div>`;
                return;
            }
            let html = '';
            snap.forEach(c => {
                const a = c.val();
                const alertId = c.key;
                const safeDate = a.date ? new Date(a.date).toLocaleDateString('ar-EG') : 'حديث';
                html += `
                <div class="acad-glass-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <span class="pill-badge" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3);">
                            <img src="https://img.icons8.com/fluency/48/high-priority.png" style="width: 14px;"> تنبيه رسمي
                        </span>
                        <span style="font-size: 0.72rem; color: var(--text-sub); font-weight: 700;">${safeDate}</span>
                    </div>
                    <h4 style="color: var(--accent-gold) !important; font-size: 0.98rem; margin-bottom: 6px;">${a.title}</h4>
                    <p style="font-size: 0.86rem; color: var(--text-main) !important; line-height: 1.6; margin-bottom: 10px;">${a.body}</p>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        ${a.url ? `
                            <button class="btn-action-glow btn-download-file" style="flex: 1;" onclick="window.open('${a.url}', '_blank')">
                                <img src="https://img.icons8.com/fluency/48/link.png" style="width: 16px;"> فتح الرابط / المرفق
                            </button>` : ''}
                        ${currentUser && currentUser.phone === '01061032507' ? `
                            <button class="admin-action-btn danger" style="padding: 7px 10px; border-radius: 10px;" onclick="adminDeleteCollegeAlert('${alertId}')">
                                <img src="https://img.icons8.com/fluency/48/delete-trash.png" style="width: 16px;">
                            </button>` : ''}
                    </div>
                </div>`;
            });
            list.innerHTML = html;
        });
    }

    function adminPublishTask() {
    playClickSound();
    const subject = document.getElementById('adm-task-subject').value.trim();
    const title = document.getElementById('adm-task-title').value.trim();
    const deadline = document.getElementById('adm-task-deadline').value;
    const url = document.getElementById('adm-task-url').value.trim();

    if (!subject || !title || !deadline) {
        showTopToast('يرجى كتابة المادة، العنوان، وموعد التسليم!', 'error');
        return;
    }
    db.ref('academic_tasks').push({ subject, title, deadline, url, createdAt: Date.now() }).then(() => {
        db.ref('academic_markers/tasks').set(Date.now());
        showTopToast('تم نشر التكليف للدفعة بنجاح! 🚀', 'success');
        document.getElementById('adm-task-subject').value = '';
        document.getElementById('adm-task-title').value = '';
        document.getElementById('adm-task-deadline').value = '';
        document.getElementById('adm-task-url').value = '';
    });
}

    function adminDeleteTask(id) {
        if (confirm('هل تريد حذف هذا التكليف نهائياً؟')) {
            db.ref('academic_tasks/' + id).remove().then(() => showTopToast('تم حذف التكليف بنجاح.'));
        }
    }

    function adminPublishCollegeAlert() {
    playClickSound();
    const title = document.getElementById('adm-alert-title').value.trim();
    const body = document.getElementById('adm-alert-body').value.trim();
    const url = document.getElementById('adm-alert-url').value.trim();

    if (!title || !body) {
        showTopToast('يرجى كتابة العنوان والتفاصيل!', 'error');
        return;
    }
    db.ref('college_alerts').push({ title, body, url, date: Date.now() }).then(() => {
        db.ref('academic_markers/alerts').set(Date.now());
        showTopToast('تم نشر التنبيه بنجاح! 📢', 'success');
        document.getElementById('adm-alert-title').value = '';
        document.getElementById('adm-alert-body').value = '';
        document.getElementById('adm-alert-url').value = '';
    });
}

    function adminDeleteCollegeAlert(alertId) {
        if (confirm('هل أنت متأكد من رغبتك في حذف هذا الإعلان نهائياً؟')) {
            db.ref('college_alerts/' + alertId).remove().then(() => {
                showTopToast('تم حذف الإعلان بنجاح 🗑️', 'info');
            });
        }
    }

    function adminSaveScheduleUrl() {
    playClickSound();
    const sec = document.getElementById('adm-schedule-sec').value;
    const url = document.getElementById('adm-schedule-url').value.trim();
    if (!url) {
        showTopToast('يرجى إدخال الرابط أولاً!', 'error');
        return;
    }
    // تم تصحيح المسار ليكون schedules_config
    db.ref('schedules_config/' + sec).set(url).then(() => {
        db.ref('academic_markers/schedules').set(Date.now());
        showTopToast('تم حفظ وتحديث الجدول بنجاح! 🗓️', 'success');
        document.getElementById('adm-schedule-url').value = '';
    });
}

    // ================= قاعة المشاهير (Hall of Fame) =================
    function openHallOfFame() {
        playClickSound();
        navigateTo('view-hall-of-fame', 'قاعة المشاهير', 'أبرز 6 أبطال في الدفعة');
        loadHallOfFameData();
    }

    async function loadHallOfFameData() {
        // لو الداتا مسحوبة قبل كده في نفس الجلسة، اعرضها فوراً ووفر النت
        if (cachedFameData) {
            setFameCard(1, cachedFameData.xp, `${cachedFameData.xp.xp || 0} XP`);
            setFameCard(2, cachedFameData.streak, `${cachedFameData.streak.daily_streak || 0} يوم متتالي 🔥`);
            setFameCard(3, cachedFameData.quiz, `${cachedFameData.quiz.quizCorrect || 0} إجابة صحيحة`);
            setFameCard(4, cachedFameData.acc, `دقة ${cachedFameData.accValue}% 🎯`);
            setFameCard(5, cachedFameData.derby, `${cachedFameData.derby.derby_wins || 0} فوز ديربي ⚔️`);
            setFameCard(6, cachedFameData.coins, `${cachedFameData.coins.coins || 0} عملة 💸`);
            return;
        }

        try {
            cachedFameData = {};
            const xpSnap = await db.ref('users').orderByChild('xp').limitToLast(1).once('value');
            xpSnap.forEach(c => cachedFameData.xp = c.val());

            const streakSnap = await db.ref('users').orderByChild('daily_streak').limitToLast(1).once('value');
            streakSnap.forEach(c => cachedFameData.streak = c.val());

            const quizSnap = await db.ref('users').orderByChild('quizCorrect').limitToLast(1).once('value');
            quizSnap.forEach(c => cachedFameData.quiz = c.val());

            const accSnap = await db.ref('users').orderByChild('quizCorrect').limitToLast(15).once('value');
            let topAccUser = null; let maxAcc = -1;
            accSnap.forEach(c => {
                const u = c.val();
                if ((u.quizPlayed || 0) >= 3) {
                    const acc = Math.round((u.quizCorrect / (u.quizPlayed * 5)) * 100);
                    if (acc > maxAcc) { maxAcc = acc; topAccUser = u; }
                }
            });
            cachedFameData.acc = topAccUser;
            cachedFameData.accValue = maxAcc;

            const derbySnap = await db.ref('users').orderByChild('derby_wins').limitToLast(1).once('value');
            derbySnap.forEach(c => cachedFameData.derby = c.val());

            const coinsSnap = await db.ref('users').orderByChild('coins').limitToLast(1).once('value');
            coinsSnap.forEach(c => cachedFameData.coins = c.val());

            // استدعاء الدالة نفسها مرة أخرى لعرض الداتا بعد حفظها في الكاش
            loadHallOfFameData();

        } catch (e) { console.log("Error loading Hall of Fame:", e); }
    }

    function setFameCard(index, user, statText) {
        if (!user) return;
        const nameEl = document.getElementById(`fame-p${index}-name`);
        const statEl = document.getElementById(`fame-p${index}-stat`);
        const avatarEl = document.getElementById(`fame-p${index}-avatar`);

        if (nameEl) nameEl.innerText = user.name.split(' ').slice(0, 2).join(' ');
        if (statEl) statEl.innerText = statText;
        if (avatarEl) avatarEl.src = user.avatar || 'https://img.icons8.com/fluency/96/user-male.png';
    }

    // ================= إعدادات المتجر =================
    const defaultStorePrices = {
"theme_spiderman": { 
            price: 700, 
            name: "ثيم سبايدر مان 🕷️", 
            category: "profile", 
            desc: "أبطال خارقين" 
        },
        "theme_classic_vintage": { 
            price: 600, 
            name: "الثيم الكلاسيكي القديم 📜", 
            category: "profile", 
            desc: "فخم" 
        },
        "theme_doctor_doom": { 
            price: 700, 
            name: "ثيم دكتور دوم 🟢", 
            category: "profile", 
            desc: "الباشا اللي هينفخ الأفنجرز" 
        },
"theme_cyberpunk": { price: 450, name: "ثيم السايبر نيون ⚡", category: "profile", desc: "عصري" },
        "theme_royal_gold": { price: 400, name: "ثيم الذهب الملكي 👑", category: "profile", desc: "تحسه عدس مش دهب" },
        "frame_gold": { price: 150, name: "إطار ذهبي ملكي ✨", category: "frames", desc: "إطار مذهب متوهج للبروفايل" },
        "frame_fire": { price: 200, name: "إطار ناري متوهج 🔥", category: "frames", desc: "لهب متوهج ومتحرك حول صورتك" },
        "frame_cyber": { price: 220, name: "إطار سايبر نيون ⚡", category: "frames", desc: "تأثير نيون أزرق وبنفسجي لافت" },
        "frame_cosmic": { price: 250, name: "إطار كوني متدرج 🌌", category: "frames", desc: "تدرج كوني أسطوري يعكس هيبتك" },
"frame_ring_inferno": { price: 260, name: "إطار التنين الناري الدائري 🔥", category: "frames", desc: "حلقة لهب بركانية دوارة ثلاثية الأبعاد" },
        "frame_ring_cyber": { price: 280, name: "إطار السايبر نيون الدوار ⚡", category: "frames", desc: "حلقة ألوان نيون RGB مستقبلية تدور حول صورتك" },
        "frame_ring_celestial": { price: 320, name: "إطار الملاك المذهب الأسطوري 👑", category: "frames", desc: "هالة ذهبية مقدسة تشع ببريق ملكي ناصع" },
        "frame_ring_nebula": { price: 290, name: "إطار السديم الكوني الدائري 🌌", category: "frames", desc: "تدرج بلوري من غبار المجرات يلتف حول الأفتار" },
        "hat_grad": { price: 70, name: "قبعة تخرج أكاديمية 🎓", category: "frames", desc: "إكسسوار قبعة التخرج فوق صورتك" },
        "hat_crown": { price: 70, name: "تاج ملكي مذهب 👑", category: "frames", desc: "تاج الملوك والأبطال فوق صورتك" },
        "hat_bow": { price: 70, name: "فيونكة وردية لطيفة 🎀", category: "frames", desc: "فيونكة مائلة للبنات أعلى الصورة" },
        "hat_band": { price: 70, name: "عصبة رأس رياضية 🔴", category: "frames", desc: "شريط رأس رياضي حول صورتك" },
        "hat_flowers": { price: 70, name: "طوق ورد طبيعي 🌸", category: "frames", desc: "طوق أزهار ملونة يزين الأفتار" },
        "hat_cap": { price: 70, name: "كاب كاجوال شبابي 🧢", category: "frames", desc: "كاب شبابي مائل فوق الرأس" },
        "hat_horns": { price: 70, name: "قرون نيون مضيئة 😈", category: "frames", desc: "قرون مضيئة بتوهج نيون بنفسجي" },
        "hat_headphones": { price: 70, name: "سماعات رأس جيمنج 🎧", category: "frames", desc: "سماعات محيطية على جانبي الأفتار" },
        "hat_wizard": { price: 70, name: "قبعة العبقري الساحر 🎩", category: "frames", desc: "قبعة ساحر كلاسيكية فخمة" },
        "hat_halo": { price: 70, name: "هالة نورانية طافية 😇", category: "frames", desc: "هالة نور تطفو وتشع فوق الرأس" },
        "vip_profile": { price: 350, name: "باقة VIP بروفايل الأسطوري 👑", category: "profile", desc: "خلفية فخمة ومتحركة + شارة VIP" },
        "top_card": { price: 180, name: "بطاقة متصدرين متحركة 🃏", category: "profile", desc: "تمييز بطاقتك في قائمة المتصدرين بأنيميشن نيون" },
        "glow_name": { price: 120, name: "اسم بلون متوهج ولامع 🌈", category: "profile", desc: "تدرج ضوئي متحرك لاسمك بالتطبيق" },
        "user_bio": { price: 80, name: "تفعيل كتابة بايو شخصي ✍️", category: "profile", desc: "اكتب جملتك في البروفايل والمتصدرين" },
        "double_xp": { price: 100, name: "مضاعف نقاط 24 ساعة (2x XP) 🚀", category: "boosters", desc: "ضاعف نقاط كل تحدي لمدة 24 ساعة" },
        "hint_5050": { price: 40, name: "تلميح المستويات (حذف إجابتين) 💡", category: "boosters", desc: "يحذف إجابتين خطأ في تحدي المستويات" },
        "hint_time": { price: 35, name: "وقت إضافي للمستويات (+15 ثانية) ⏱️", category: "boosters", desc: "إضافة 15 ثانية للتفكير في سؤال المستوى" },
        "booster_skip": { price: 60, name: "تخطي السؤال مع 3 نجوم 🚀", category: "boosters", desc: "تخطي السؤال الحالي واحتسابه صحيحاً بـ 3 نجوم كاملة" },
        "freeze": { price: 90, name: "تجميد السلسلة (Streak Freeze) 🛡️", category: "boosters", desc: "حماية سلسلة دخولك اليومي من الضياع" }
    };

    let currentStoreConfig = { ...defaultStorePrices };

        // ================= الصوت والمؤثرات =================
    let audioCtx;
    function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }

    let isMuted = localStorage.getItem('app-sound-muted') === 'true';

    function toggleMuteSound() {
        isMuted = !isMuted;
        localStorage.setItem('app-sound-muted', isMuted);
        updateSoundUI();
        if (!isMuted) playClickSound();
    }

    function updateSoundUI() {
        const soundIcon = document.getElementById('sidebar-sound-icon');
        const soundText = document.getElementById('sidebar-sound-text');
        if (soundIcon && soundText) {
            if (isMuted) {
                soundIcon.src = "https://img.icons8.com/fluency/96/mute.png";
                soundText.innerText = "صوت المؤثرات: كتم";
            } else {
                soundIcon.src = "https://img.icons8.com/fluency/96/high-volume.png";
                soundText.innerText = "صوت المؤثرات: تفعيل";
            }
        }
    }

    function playSound(type) {
        if (isMuted) return;
        try {
            initAudio(); if (audioCtx.state === 'suspended') audioCtx.resume();
            const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain(); const now = audioCtx.currentTime;
            osc.connect(gain); gain.connect(audioCtx.destination);
            if (type === 'click') {
                osc.type = 'sine'; osc.frequency.setValueAtTime(540, now); osc.frequency.exponentialRampToValueAtTime(820, now + 0.05);
                gain.gain.setValueAtTime(0.12, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
                osc.start(now); osc.stop(now + 0.05);
            } else if (type === 'back') {
                osc.type = 'triangle'; osc.frequency.setValueAtTime(450, now); osc.frequency.exponentialRampToValueAtTime(280, now + 0.06);
                gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
                osc.start(now); osc.stop(now + 0.06);
            } else if (type === 'success') {
                osc.type = 'sine'; osc.frequency.setValueAtTime(523.25, now); osc.frequency.setValueAtTime(1046.50, now + 0.3);
                gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                osc.start(now); osc.stop(now + 0.5);
            } else if (type === 'error') {
                osc.type = 'sawtooth'; osc.frequency.setValueAtTime(180, now); osc.frequency.setValueAtTime(100, now + 0.2);
                gain.gain.setValueAtTime(0.25, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                osc.start(now); osc.stop(now + 0.4);
            }
        } catch (e) {}
    }
    function playClickSound() { playSound('click'); } 
function playExactMatchSound() {
        if (isMuted) return;
        try {
            // اسم ملف الصوت اللي هيشتغل (تقدر تغيره براحتك)
            const exactAudio = new Audio('exact-match.mp3'); 
            exactAudio.volume = 1.0;
            exactAudio.play().catch(e => {
                // لو الملف مش موجود في الفولدر، هيشغل الصوت العادي كبديل عشان اللعبة ماتعلقش
                playSound('success');
                setTimeout(() => playSound('success'), 150);
            });
        } catch (e) {
            playSound('success');
        }
    }
    function playBackSound() { playSound('back'); } 
    function playSuccessSound() { playSound('success'); } 
    function playErrorSound() { playSound('error'); }
    function playFlawlessVictorySound() {
        playSound('success');
        setTimeout(() => playSound('success'), 150); // بيعمل نغمتين ورا بعض للانتصار
    }

    // ================= الإشعارات =================
    let toastTimeout;
    function showTopToast(msg, type = 'info') {
        const toast = document.getElementById('top-toast');
        const toastText = document.getElementById('top-toast-text');
        const toastIcon = document.getElementById('top-toast-icon');

        toast.className = ''; 
        if (type === 'error') {
            toast.classList.add('toast-error');
            toastIcon.src = 'https://img.icons8.com/fluency/96/error.png';
            playErrorSound();
        } else if (type === 'success') {
            toast.classList.add('toast-success');
            toastIcon.src = 'https://img.icons8.com/fluency/96/ok.png';
            playSuccessSound();
        } else {
            toastIcon.src = 'https://img.icons8.com/fluency/96/info.png';
            playClickSound();
        }

        toastText.innerText = msg;
        toast.classList.add('show');

        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => { toast.classList.remove('show'); }, 3000);
    }

    function shootStars() {
        const container = document.createElement('div'); container.className = 'stars-container'; document.body.appendChild(container);
        for (let i = 0; i < 25; i++) {
            const star = document.createElement('div'); star.className = 'falling-star'; star.innerHTML = '⭐';
            star.style.left = '50%'; star.style.top = '50%'; star.style.fontSize = Math.random() * 20 + 15 + 'px';
            star.style.transition = 'all 0.8s cubic-bezier(0.1, 0.8, 0.3, 1)'; container.appendChild(star);
            setTimeout(() => { const angle = Math.random() * Math.PI * 2; const radius = Math.random() * 200 + 50; star.style.transform = `translate(${Math.cos(angle) * radius}px, ${Math.sin(angle) * radius}px) rotate(${Math.random() * 360}deg) scale(${Math.random() * 1.5 + 0.5})`; star.style.opacity = '0'; }, 10);
        }
        setTimeout(() => container.remove(), 850);
    }

    function triggerConfetti() {
        const container = document.createElement('div'); container.className = 'stars-container'; document.body.appendChild(container);
        const colors = ['#10b981', '#d4af37', '#3b82f6', '#ef4444', '#a855f7'];
        for (let i = 0; i < 80; i++) {
            const piece = document.createElement('div'); piece.className = 'confetti-piece'; piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            piece.style.left = Math.random() * 100 + 'vw'; piece.style.top = '-10px'; piece.style.opacity = '1'; piece.style.transform = `rotate(${Math.random() * 360}deg)`;
            piece.style.transition = `all ${Math.random() * 2 + 1}s cubic-bezier(0.25, 0.46, 0.45, 0.94)`; container.appendChild(piece);
            setTimeout(() => { piece.style.top = '100vh'; piece.style.transform = `rotate(${Math.random() * 720}deg)`; piece.style.opacity = '0'; }, 50);
        }
        setTimeout(() => container.remove(), 3200);
    }

    function openThemeModal() {
        playClickSound();
        updateThemeSelectorUI();
        openModal('modal-theme-selector');
    }

    function selectThemeMode(mode) {
        playClickSound();
        setAppTheme(mode);
        updateThemeSelectorUI();
        showTopToast('تم تغيير مظهر التطبيق بنجاح ✨', 'success');
        setTimeout(() => closeModal('modal-theme-selector'), 300);
    }

    function updateThemeSelectorUI() {
        const currentPref = localStorage.getItem('app-theme') || 'dark';
        ['dark', 'light', 'auto'].forEach(m => {
            const btn = document.getElementById(`theme-btn-${m}`);
            const check = document.getElementById(`check-${m}`);
            if (btn) btn.classList.toggle('active', m === currentPref);
            if (check) check.innerText = (m === currentPref) ? '✓' : '';
        });
    }

    function closeBroadcastBanner() {
        playClickSound();
        const banner = document.getElementById('broadcast-msg-modal');
        if (banner) banner.classList.remove('show');
        db.ref('broadcast_message').once('value').then(snap => {
            if (snap.exists() && snap.val().id) {
                localStorage.setItem('last_seen_broadcast', snap.val().id);
            }
        });
    }

    // ================= المظهر =================
    function toggleTheme() {
        playClickSound(); 
        const currentTheme = document.documentElement.getAttribute('data-theme'); 
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setAppTheme(newTheme);
// جوه دالة تبديل الوضع (الليلي / النهاري) عندك، أضف السطر ده في النهاية:
applyUserCustomTheme(localStorage.getItem('active_custom_theme'));
    }

    function setAppTheme(theme) {
        if (theme === 'system' || theme === 'auto') {
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
            const themeIcon = document.getElementById('theme-icon');
            if(themeIcon) themeIcon.innerText = prefersDark ? '☀️' : '🌙';
        } else {
            document.documentElement.setAttribute('data-theme', theme);
            const themeIcon = document.getElementById('theme-icon');
            if(themeIcon) themeIcon.innerText = theme === 'light' ? '🌙' : '☀️';
        }
        localStorage.setItem('app-theme', theme);
        localStorage.setItem('app_theme_preference', theme);
    }

    (function loadSavedTheme() {
    const savedTheme = localStorage.getItem('app-theme') || localStorage.getItem('app_theme_preference') || 'dark';
    setAppTheme(savedTheme);

    // تطبيق الثيم المخصص مباشرة بدون استدعاء دوال خارجية تسبب خطأ
    const savedCustomTheme = localStorage.getItem('active_custom_theme');
    if (savedCustomTheme && savedCustomTheme !== 'none' && savedCustomTheme !== 'default') {
        document.documentElement.setAttribute('data-custom-theme', savedCustomTheme);
    }
})();

    // ================= التنقل (Navigation) =================
    let navHistory = [{ viewId: 'view-home', title: 'برنامج علوم الأغذية', subtitle: 'الفرقة الرابعة - دفعة 28' }];
    let currentActiveSubject = '';
    let currentActiveType = 'theory';

    function updateNavState(activeId) {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        if(activeId && document.getElementById(activeId)) {
            document.getElementById(activeId).classList.add('active');
        }
    }

    function goHomeDirectly(force = false) {
    if (force) {
        isClassicQuizActive = false; isLevelBossActive = false; isPenaltyGameActive = false;
        navHistory = [{ viewId: 'view-home', title: 'برنامج علوم الأغذية', subtitle: 'الفرقة الرابعة - دفعة 28' }];
        showViewSection('view-home'); updateHeader(); updateNavState('nav-home');
        return;
    }

    if (currentBattleId || currentEhbedRoomId) {
        if (confirm('⚠️ تحذير: خروجك الآن سيعتبر انسحاباً لأن المنافس في انتظارك!\n\nهل أنت متأكد من الخروج؟')) {
            if (currentBattleId) cancelBattleLobby();
            if (currentEhbedRoomId) cancelEhbedLobby();
        }
        return;
    }
    
    // فحص ما إذا كان المستخدم قادماً بالفعل من شاشة التحدي الحية
    const currentView = navHistory[navHistory.length - 1]?.viewId;
    const isInsideQuizScreen = ['view-quiz-game', 'view-penalty-arena', 'view-boss-bomb', 'view-boss-monster'].includes(currentView);

    if (isClassicQuizActive || isPenaltyGameActive || isLevelBossActive) {
        pauseAllActiveTimers();
        
        // حفظ تقدم جلسة المستوى في الـ LocalStorage لمنع ضياعها عند الخروج أو التحديث
        saveActiveQuizSession();
        
        // إظهار التنبيه فقط إذا كان الخروج من داخل شاشة التحدي نفسها
        if (isInsideQuizScreen) {
            showTopToast('تم إيقاف التحدي مؤقتاً ⏸️. يمكنك العودة لاستكماله لاحقاً بدون خسارة.', 'info');
        }
        
        playClickSound();
        navHistory = [{ viewId: 'view-home', title: 'برنامج علوم الأغذية', subtitle: 'الفرقة الرابعة - دفعة 28' }];
        showViewSection('view-home');
        updateHeader();
        updateNavState('nav-home');
        return;
    }

    // التنقل الطبيعي في حالة عدم وجود أي تحدٍ نشط
    playClickSound();
    navHistory = [{ viewId: 'view-home', title: 'برنامج علوم الأغذية', subtitle: 'الفرقة الرابعة - دفعة 28' }];
    showViewSection('view-home');
    updateHeader();
    updateNavState('nav-home');
}

        function navigateTo(viewId, title, subtitle) {
        playClickSound();
        showViewSection(viewId);
        navHistory.push({ viewId, title, subtitle });
        updateHeader();
        
        if(viewId === 'view-home') updateNavState('nav-home');
        else if(viewId === 'view-stats') updateNavState('nav-stats');
        else if(viewId === 'view-leaderboard') updateNavState('nav-leaderboard');
        else if(viewId === 'view-profile') updateNavState('nav-profile');
        else updateNavState(null);

        window.history.pushState({ viewId: viewId }, "");
    }

    function navigateBack() {
    if (currentBattleId || currentEhbedRoomId) {
        if (confirm('⚠️ تحذير: خروجك الآن سيعتبر انسحاباً لأن المنافس في انتظارك!\n\nهل أنت متأكد من الخروج؟')) {
            if (currentBattleId) cancelBattleLobby();
            if (currentEhbedRoomId) cancelEhbedLobby();
        }
        return;
    }
    
    // الخروج الآمن عند الرجوع
    if (isClassicQuizActive || isPenaltyGameActive || isLevelBossActive) {
        pauseAllActiveTimers();
saveActiveQuizSession(); // حفظ الجلسة هنا أيضاً
        showTopToast('تم إيقاف التحدي مؤقتاً ⏸️. يمكنك العودة لاستكماله لاحقاً.', 'info');
        playBackSound();
        window.history.back(); 
        return;
    }

    if (navHistory.length > 1) {
        playBackSound();
        window.history.back(); 
    }
}

window.addEventListener('popstate', function (event) {
    if (navHistory.length > 1) {
        navHistory.pop();
        const previous = navHistory[navHistory.length - 1];
        
        // إيقاف التايمر لو رجع من زرار الموبايل نفسه
        if (previous.viewId !== 'view-quiz-game' && previous.viewId !== 'view-penalty-arena' && previous.viewId !== 'view-boss-bomb' && previous.viewId !== 'view-boss-monster') {
            if (isClassicQuizActive || isPenaltyGameActive || isLevelBossActive) {
                pauseAllActiveTimers();
                showTopToast('تم إيقاف التحدي مؤقتاً ⏸️.', 'info');
            }
        }

        showViewSection(previous.viewId);
        updateHeader();
        
        if(previous.viewId === 'view-home') updateNavState('nav-home');
        else if(previous.viewId === 'view-stats') updateNavState('nav-stats');
        else if(previous.viewId === 'view-leaderboard') updateNavState('nav-leaderboard');
        else if(previous.viewId === 'view-profile') updateNavState('nav-profile');
        else updateNavState(null);
    }
});

function openChallengesHub() {
        playClickSound();
        navigateTo('view-challenges-hub', 'التحديات والترفيه', 'اختبر معلوماتك ونافس زملائك');
    }

    function showViewSection(viewId) {
        const activeSection = document.querySelector('.view-section.active');
        if (activeSection) activeSection.classList.remove('active');
        
        const menuBtn = document.querySelector('.header-menu-btn');
        const btnBack = document.getElementById('btn-back');
        const bottomNav = document.getElementById('main-bottom-nav');

        if (viewId === 'view-auth' || viewId === 'view-battle-arena') {
            if (menuBtn) menuBtn.style.display = 'none';
            if (btnBack) btnBack.style.display = 'none';
            if (bottomNav) bottomNav.style.display = 'none';
        } else {
            if (menuBtn) menuBtn.style.display = 'flex';
            if (bottomNav && currentUser) bottomNav.style.display = 'flex';
        }

        setTimeout(() => {
            document.querySelectorAll('.view-section').forEach(sec => sec.style.display = 'none');
            const nextSection = document.getElementById(viewId);
            if (nextSection) {
                nextSection.style.display = 'block';
                
                // 🚀 السطر السحري عشان الشاشة تفتح من فوق دايماً
                window.scrollTo(0, 0); 
                
                setTimeout(() => nextSection.classList.add('active'), 20);
            }
        }, 100);
    }

    function updateHeader() {
        const current = navHistory[navHistory.length - 1];
        document.getElementById('top-title').innerText = current.title;
        document.getElementById('top-subtitle').innerText = current.subtitle;
        const btnBack = document.getElementById('btn-back');
        const mainViews = ['view-home', 'view-stats', 'view-leaderboard', 'view-profile', 'view-auth'];
        
        if (btnBack) {
            if(mainViews.includes(current.viewId)) {
                btnBack.style.display = 'none';
            } else {
                btnBack.style.display = 'flex';
            }
        }
    }

    window.history.replaceState({ viewId: 'view-home' }, "");

        // ================= القوائم والنوافذ =================
    function openSidebar() { 
        if (!currentUser) {
            showTopToast('يرجى تسجيل الدخول أولاً للوصول للقائمة!', 'error');
            return;
        }
        playClickSound(); 
        document.getElementById('sidebar-overlay').classList.add('active'); 
        document.getElementById('sidebar').classList.add('active'); 
    }
    function closeSidebar() { playBackSound(); document.getElementById('sidebar-overlay').classList.remove('active'); document.getElementById('sidebar').classList.remove('active'); }

    function openDeveloperModal() { playClickSound(); document.getElementById('developer-modal').classList.add('show'); }
    const DAILY_QUIZ_LIMIT = 10;

        function closeModal(id) { playBackSound(); document.getElementById(id).classList.remove('show'); }
    function openModal(id) { document.getElementById(id).classList.add('show'); }

    // ================= الرتب والإكسسوارات =================
    function getUserRank(points) {
        const pts = points || 0;
        if (pts >= 100000) return "🌌 أسطورة";
        if (pts >= 70000)  return "👑 النخبة";
        if (pts >= 45000)  return "💎 أستاذ";
        if (pts >= 25000)  return "🏆 خبير";
        if (pts >= 12000)  return "⚙️ محترف";
        if (pts >= 5000)   return "🔬 واعد";
        if (pts >= 1000)   return "⚡ متقدم";
        return "🌱 مبتدئ";
    }
    
    function getNextLevelXP(currentXp) {
        const xp = currentXp || 0;
        if (xp < 1000)   return 1000;
        if (xp < 5000)   return 5000;
        if (xp < 12000)  return 12000;
        if (xp < 25000)  return 25000;
        if (xp < 45000)  return 45000;
        if (xp < 70000)  return 70000;
        if (xp < 100000) return 100000;
        return 100000; // الحد الأقصى
    }

    function getHatHtml(hatKey) {
        if (!hatKey || hatKey === 'none') return '';
        if (hatKey === 'hat_grad') return '<div class="hat-accessory hat-grad">🎓</div>';
        if (hatKey === 'hat_crown') return '<div class="hat-accessory hat-crown">👑</div>';
        if (hatKey === 'hat_bow') return '<div class="hat-accessory hat-bow">🎀</div>';
        if (hatKey === 'hat_band') return '<div class="hat-accessory hat-band"></div>';
        if (hatKey === 'hat_flowers') return '<div class="hat-accessory hat-flowers">🌸</div>';
        if (hatKey === 'hat_cap') return '<div class="hat-accessory hat-cap">🧢</div>';
        if (hatKey === 'hat_horns') return '<div class="hat-accessory hat-horns">😈</div>';
        if (hatKey === 'hat_headphones') return '<div class="hat-accessory hat-headphones">🎧</div>';
        if (hatKey === 'hat_wizard') return '<div class="hat-accessory hat-wizard">🎩</div>';
        if (hatKey === 'hat_halo') return '<div class="hat-accessory hat-halo">😇</div>';
        return '';
    }
// دالة إرجاع الإطار الرسومي الخارجي
// دالة إرجاع الإطار الدائري المفرغ
function getAvatarFrameOverlayHtml(frameKey) {
        if (!frameKey || frameKey === 'none') return '';
        
        const key = frameKey.startsWith('frame_') ? frameKey : 'frame_' + frameKey;
        
        if (key === 'frame_ring_inferno' || key === 'ring_inferno') return '<div class="avatar-ring-frame ring-inferno"></div>';
        if (key === 'frame_ring_cyber' || key === 'ring_cyber') return '<div class="avatar-ring-frame ring-cyber"></div>';
        if (key === 'frame_ring_celestial' || key === 'ring_celestial') return '<div class="avatar-ring-frame ring-celestial"></div>';
        if (key === 'frame_ring_nebula' || key === 'ring_nebula') return '<div class="avatar-ring-frame ring-nebula"></div>';
        
        return '';
    }

// ================= فحص رسائل البث العامة =================
    function checkBroadcastAlerts() {
        db.ref('broadcast_message').on('value', (snap) => {
            if (snap.exists() && snap.val()) {
                const data = snap.val();
                const lastSeenId = localStorage.getItem('last_seen_broadcast');
                if (data.active && data.id !== lastSeenId) {
                    document.getElementById('broadcast-msg-title').innerText = data.title || "تنبيه عام 📢";
                    document.getElementById('broadcast-msg-body').innerText = data.body || "";
                    
                    const banner = document.getElementById('broadcast-msg-modal');
                    if (banner) {
                        banner.classList.add('show');
                        if (typeof playSuccessSound === 'function') playSuccessSound();
                    }
                }
            }
        });
    }

    // ================= تهيئة المستخدم =================
    let currentUser = null; 
let cachedFameData = null;
    let editSelectedAvatar = 'https://img.icons8.com/fluency/96/user-male.png';
let hasCheckedDailyLoginSession = false;

        function checkAppEntryFlow() {
        const loggedInPhone = localStorage.getItem('active_user_phone');
        const cachedUserData = localStorage.getItem('cached_user_data');

        if (loggedInPhone) {
            const bottomNav = document.getElementById('main-bottom-nav');
            if (bottomNav) bottomNav.style.display = 'flex';

            if (cachedUserData) {
                try {
                    currentUser = JSON.parse(cachedUserData);
                    updateProfileUI();
                } catch (e) {}
            }

            db.ref('users/' + loggedInPhone).once('value').then((snapshot) => {
                if (snapshot.exists()) {
                    currentUser = snapshot.val();

                    if (currentUser.transactions) {
                        db.ref('users/' + loggedInPhone + '/transactions').remove();
                        delete currentUser.transactions;
                    }

                    if (!currentUser.student_id) {
                        currentUser.student_id = Math.floor(10000 + Math.random() * 90000);
                        db.ref('users/' + loggedInPhone + '/student_id').set(currentUser.student_id);
                    }

                    if (currentUser.xp === undefined) currentUser.xp = currentUser.points || 100;
                    if (currentUser.coins === undefined) currentUser.coins = 0;
                    if (currentUser.quizPlayed === undefined) currentUser.quizPlayed = 0;
                    if (currentUser.quizCorrect === undefined) currentUser.quizCorrect = 0;
                    if (currentUser.daily_streak === undefined) currentUser.daily_streak = 0;
                    if (currentUser.total_login_days === undefined) currentUser.total_login_days = 0;
                    if (currentUser.derby_wins === undefined) currentUser.derby_wins = 0;
                    if (currentUser.hintsCount === undefined) currentUser.hintsCount = 0;
                    if (currentUser.hintTimeCount === undefined) currentUser.hintTimeCount = 0;
                    if (currentUser.skipCount === undefined) currentUser.skipCount = 0;
                    if (currentUser.has_streak_freeze === undefined) currentUser.has_streak_freeze = false;
                    if (currentUser.active_frame === undefined) currentUser.active_frame = 'none';
                    if (currentUser.owned_frames === undefined) currentUser.owned_frames = [];
                    if (currentUser.active_hat === undefined) currentUser.active_hat = 'none';
                    if (currentUser.owned_hats === undefined) currentUser.owned_hats = [];
                    if (currentUser.owned_vip === undefined) currentUser.owned_vip = false;
                    if (currentUser.is_vip === undefined) currentUser.is_vip = false;
                    if (currentUser.owned_top_card === undefined) currentUser.owned_top_card = false;
                    if (currentUser.has_top_card === undefined) currentUser.has_top_card = false;
                    if (currentUser.owned_glow_name === undefined) currentUser.owned_glow_name = false;
                    if (currentUser.has_glow_name === undefined) currentUser.has_glow_name = false;
                    if (currentUser.owned_bio === undefined) currentUser.owned_bio = false;
                    if (currentUser.can_edit_bio === undefined) currentUser.can_edit_bio = false;
                    if (currentUser.completed_tasks === undefined) currentUser.completed_tasks = [];

                    localStorage.setItem('cached_user_data', JSON.stringify(currentUser));

                    updateProfileUI();
                    initUserTicketRepliesListener();
                    listenToPersonalAlerts();

                    if (navHistory[navHistory.length - 1].viewId === 'view-auth') {
                        goHomeDirectly();
                    }

                    if (!hasCheckedDailyLoginSession) {
                        checkDailyLoginCloudSync();
                        hasCheckedDailyLoginSession = true;
                    }

                    // 👈 فحص الرابط المباشر وفتح الامتحان فوراً إن وجد
                    if (typeof checkExamDeepLinkOnStartup === 'function') {
                        checkExamDeepLinkOnStartup();
                    }

                } else {
                    logoutUserLocally();
                    showAuthGateDirectly();
                }
            }).catch(() => {
                if (!currentUser && cachedUserData) {
                    currentUser = JSON.parse(cachedUserData);
                    updateProfileUI();
                }
            });
        } else {
            const seenSplash = localStorage.getItem('seen_splash_v28');
            if (seenSplash) {
                showAuthGateDirectly();
            } else {
                const splash = document.getElementById('full-splash-screen');
                splash.style.display = 'flex';
                setTimeout(() => {
                    splash.style.opacity = '0';
                    setTimeout(() => {
                        splash.style.display = 'none';
                        document.getElementById('full-onboarding-screen').style.display = 'flex';
                    }, 500);
                }, 2500);
            }
        }
    }

    function finishOnboardingFlow() {
        playClickSound();
        localStorage.setItem('seen_splash_v28', 'true');
        const onb = document.getElementById('full-onboarding-screen');
        onb.style.opacity = '0';
        setTimeout(() => {
            onb.style.display = 'none';
            showAuthGateDirectly();
        }, 400);
    }

    function showAuthGateDirectly() {
        navHistory = [{ viewId: 'view-auth', title: 'منطقة الطلاب', subtitle: 'يرجى تسجيل الدخول أو إنشاء حساب' }];
        showViewSection('view-auth');
        updateHeader();
    }

    // ================= تسجيل الدخول اليومي السحابي السريع =================
    function checkDailyLoginCloudSync() {
        if (!currentUser) return;
        
        const todayDate = getRealDateString();
        const lastLoginDate = currentUser.last_login_date || '';
        let currentStreak = currentUser.daily_streak || 0;

        if (lastLoginDate !== todayDate) {
            if (lastLoginDate) {
                const lastDate = new Date(lastLoginDate);
                const today = new Date(todayDate);
                const diffTime = Math.abs(today - lastDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                
                if (diffDays > 1) {
                    if (currentUser.has_streak_freeze) {
                        db.ref('users/' + currentUser.phone + '/has_streak_freeze').set(false);
                        showTopToast('تم استخدام "تجميد السلسلة" وحماية أيامك المتتالية بنجاح! 🛡️', 'info');
                    } else {
                        currentStreak = 0;
                        db.ref('users/' + currentUser.phone + '/daily_streak').set(0);
                    }
                }
            }
            
            const streakText = document.getElementById('daily-popup-streak');
            const claimBtn = document.getElementById('btn-claim-daily-popup');
            
            if (streakText) streakText.innerText = `سلسلة الأيام الحالية: ${currentStreak}/7 أيام 🔥`;
            if (claimBtn) {
                claimBtn.disabled = false;
                claimBtn.innerText = currentStreak === 6 ? 'استلم المكافأة الكبرى (+285 XP و +70 عملة) 🏆' : 'استلم +35 XP و +20 عملة الآن ✨';
            }

            setTimeout(() => {
                openModal('modal-daily-reward');
                playSuccessSound();
            }, 500);
        }
    }

    function claimDailyRewardFast() {
        if (!currentUser) return;
        
        const todayDate = getRealDateString();
        const lastLoginDate = currentUser.last_login_date || '';
        
        if (lastLoginDate === todayDate) {
            closeModal('modal-daily-reward');
            showTopToast('لقد استلمت مكافأة اليوم بالفعل!', 'info');
            return;
        }

        closeModal('modal-daily-reward');
        playSuccessSound();
        shootStars();

        let currentStreak = (currentUser.daily_streak || 0) + 1;
        let totalDays = (currentUser.total_login_days || 0) + 1;
        
        let xpReward = 35;
        let coinReward = 20;

        if (currentStreak === 7) {
            xpReward += 250;
            coinReward += 50;
            currentStreak = 0;
        }

        // تسجيل الحركة في السجل بعد حساب القيم
        recordUserTransaction('مكافأة الدخول اليومي', xpReward, coinReward, 'reward');

        currentUser.xp = (currentUser.xp || 0) + xpReward;
        currentUser.points = currentUser.xp;
        currentUser.coins = (currentUser.coins || 0) + coinReward;
        currentUser.daily_streak = currentStreak;
        currentUser.total_login_days = totalDays;
        currentUser.last_login_date = todayDate;

        updateProfileUI();
        updateStatsUI();
        showTopToast(`تم استلام مكافأة اليوم (+${xpReward} XP و +${coinReward} عملة) فوراً! 🎉`, 'success');

        db.ref('users/' + currentUser.phone).update({
            xp: currentUser.xp,
            points: currentUser.xp,
            coins: currentUser.coins,
            daily_streak: currentStreak,
            total_login_days: totalDays,
            last_login_date: todayDate
        });
    }

    function updateStatsUI() {
    if (!currentUser) return;
    document.getElementById('stat-total-days').innerText = currentUser.total_login_days || '0';
    document.getElementById('stat-max-streak').innerText = (currentUser.daily_streak || '0') + ' 🔥';
    
    const played = currentUser.quizPlayed || 0;
    const correct = currentUser.quizCorrect || 0;
    const totalQuestionsAnswered = played * 5;
    const accuracy = totalQuestionsAnswered > 0 ? Math.round((correct / totalQuestionsAnswered) * 100) : 0;
    
    document.getElementById('stat-quiz-played').innerText = played;
    document.getElementById('stat-quiz-correct').innerText = correct;
    document.getElementById('stat-quiz-accuracy').innerText = `${accuracy}% 🎯`;

    // 💡 1. جلب السجل المحلي وعرضه بدون أي طلبات للسيرفر
    const historyContainer = document.getElementById('local-stats-history-list');
    if (historyContainer) {
        const localHistory = JSON.parse(localStorage.getItem('my_detailed_stats') || '[]');
        if (localHistory.length === 0) {
            historyContainer.innerHTML = '<div class="eng-bento-card" style="padding: 15px; text-align: center;"><p style="font-size: 0.8rem; color: var(--text-sub); margin: 0;">لم تقم بإجراء أي اختبارات حتى الآن.</p></div>';
        } else {
            let histHtml = '';
            localHistory.forEach(item => {
                const passRate = item.score / item.total;
                const color = passRate === 1 ? 'var(--accent-emerald)' : (passRate >= 0.5 ? 'var(--accent-gold)' : '#ef4444');
                const icon = item.type === 'exam' ? '⏱️' : '🧠';
                
                histHtml += `
                <div class="eng-bento-card" style="padding: 12px 14px; flex-direction: row; justify-content: space-between; align-items: center; border-color: rgba(255,255,255,0.05);">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 1.4rem;">${icon}</span>
                        <div>
                            <h4 style="font-size: 0.85rem; margin-bottom: 2px; color: var(--text-main);">${item.title}</h4>
                            <span style="font-size: 0.7rem; color: var(--text-sub);">${item.date}</span>
                        </div>
                    </div>
                    <div style="font-size: 1.1rem; font-weight: 900; color: ${color};">
                        ${item.score}/${item.total}
                    </div>
                </div>`;
            });
            historyContainer.innerHTML = histHtml;
        }
    }

    // 💡 2. جلب الأخطاء المحلية وعرضها في قسم "بنك الأخطاء"
    const mistakesContainer = document.getElementById('local-mistakes-history-list');
    if (mistakesContainer) {
        const localMistakes = JSON.parse(localStorage.getItem('my_exam_mistakes') || '[]');
        if (localMistakes.length === 0) {
            mistakesContainer.innerHTML = '<div class="eng-bento-card" style="padding: 15px; text-align: center;"><p style="font-size: 0.8rem; color: var(--text-sub); margin: 0;">ممتاز! لا توجد أخطاء مسجلة حالياً 🎉.</p></div>';
        } else {
            let mistHtml = '';
            localMistakes.forEach(m => {
                mistHtml += `
                <div class="mistake-card" style="background: var(--bg-secondary); border: 1px solid var(--border-card); border-right: 4px solid #ef4444; border-radius: 12px; padding: 12px; margin-bottom: 8px; text-align: right;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <span style="font-size: 0.7rem; color: var(--text-sub); background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 6px;">${m.subject} - ${m.examTitle}</span>
                        <span style="font-size: 0.65rem; color: var(--text-sub);">${m.date}</span>
                    </div>
                    <div class="mistake-q" style="font-size: 0.85rem; font-weight: 800; color: var(--text-main); margin-bottom: 6px;">${m.qText}</div>
                    <div class="mistake-user-ans" style="font-size: 0.75rem; color: #ef4444; text-decoration: line-through; margin-bottom: 2px;">إجابتك: ${m.uAns}</div>
                    <div class="mistake-correct-ans" style="font-size: 0.8rem; color: #10b981; font-weight: 900;">التصحيح: ${m.correct} ✅</div>
                </div>`;
            });
            mistakesContainer.innerHTML = mistHtml;
        }
    }
}

    // ================= تسجيل الخروج والدخول =================
    function logoutUser() {
        playClickSound();
        openModal('modal-logout-confirm');
    }

    function confirmLogoutAction() {
        closeModal('modal-logout-confirm');
        localStorage.removeItem('active_user_phone');
        localStorage.removeItem('cached_user_data');
        currentUser = null;
        if (auth) {
            auth.signOut().catch(e => console.log(e));
        }
        showTopToast('تم تسجيل الخروج بنجاح 👋', 'info');
        showAuthGateDirectly();
    }

    function switchAuthTab(tab) {
        playClickSound();
        if (tab === 'login') {
            document.getElementById('tab-login').classList.add('active'); document.getElementById('tab-register').classList.remove('active');
            document.getElementById('form-login').style.display = 'block'; document.getElementById('form-register').style.display = 'none';
        } else {
            document.getElementById('tab-register').classList.add('active'); document.getElementById('tab-login').classList.remove('active');
            document.getElementById('form-register').style.display = 'block'; document.getElementById('form-login').style.display = 'none';
        }
    }

    function registerUser() {
        playClickSound();
        const name = document.getElementById('reg-name').value.trim();
        const phone = document.getElementById('reg-phone').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const pass = document.getElementById('reg-password').value;
        const confirmPass = document.getElementById('reg-confirm-password').value;

        // 1. التحقق من أن الحقول غير فارغة
        if (!name || !phone || !email || !pass || !confirmPass) { 
            showTopToast('يرجى ملء جميع الحقول بما فيها البريد الإلكتروني!', 'error'); 
            return; 
        }

        // 2. التحقق من صيغة البريد الإلكتروني
        if (!email.includes('@') || !email.includes('.')) {
            showTopToast('يرجى كتابة بريد إلكتروني صالح (يحتوي على @ و .)!', 'error');
            return;
        }

        if (pass !== confirmPass) { 
            showTopToast('كلمة المرور غير متطابقة، تأكد منها وحاول مرة أخرى!', 'error'); 
            return; 
        }
        if (pass.length < 6) {
            showTopToast('كلمة المرور يجب ألا تقل عن 6 أحرف أو أرقام!', 'error');
            return;
        }

        const userRef = db.ref('users/' + phone);
        userRef.once('value', (snapshot) => {
            if (snapshot.exists()) { 
                showTopToast('هذا الرقم مسجل بالفعل في النظام! يرجى تسجيل الدخول.', 'error'); 
                switchAuthTab('login'); 
            } else {
                auth.createUserWithEmailAndPassword(email, pass)
                    .then((userCredential) => {
                        const newStudentId = Math.floor(10000 + Math.random() * 90000);
                        const newUser = { 
                            name: name, 
                            phone: phone, 
                            email: email, 
                            password: pass, 
                            student_id: newStudentId,
                            avatar: 'https://img.icons8.com/fluency/96/user-male.png', 
                            xp: 100,
                            points: 100,
                            coins: 0,
                            quizPlayed: 0,
                            quizCorrect: 0,
                            daily_streak: 0,
                            total_login_days: 0,
                            derby_wins: 0,
                            hintsCount: 0,
                            hintTimeCount: 0,
                            has_streak_freeze: false,
                            active_frame: 'none',
                            owned_frames: [],
                            active_hat: 'none',
                            owned_hats: [],
                            owned_vip: false,
                            is_vip: false,
                            owned_top_card: false,
                            has_top_card: false,
                            owned_glow_name: false,
                            has_glow_name: false,
                            owned_bio: false,
                            can_edit_bio: false,
                            completed_tasks: [],
                            bio: '',
                            createdAt: new Date().toISOString()
                        };

                        return userRef.set(newUser).then(() => {
                            localStorage.setItem('active_user_phone', phone);
                            localStorage.setItem('cached_user_data', JSON.stringify(newUser));
                            currentUser = newUser; 
                            updateProfileUI(); 
                            document.getElementById('main-bottom-nav').style.display = 'flex';
                            showTopToast('تم إنشاء الحساب بنجاح مرحبًا بك ✉️', 'success');
                            goHomeDirectly();
                        });
                    })
                    .catch((authError) => {
                        if (authError.code === 'auth/email-already-in-use') {
                            showTopToast('هذا البريد مستخدم بالفعل لحساب آخر!', 'error');
                        } else if (authError.code === 'auth/invalid-email') {
                            showTopToast('صيغة البريد الإلكتروني غير صحيحة!', 'error');
                        } else {
                            showTopToast('خطأ أثناء إنشاء الحساب: ' + authError.message, 'error');
                        }
                    });
            }
        });
    }

    function loginUser() {
        playClickSound();
        const inputVal = document.getElementById('login-phone').value.trim();
        const pass = document.getElementById('login-password').value;
        if (!inputVal || !pass) { 
            showTopToast('يرجى إدخال رقم الهاتف أو البريد وكلمة المرور لتسجيل الدخول.', 'error'); 
            return; 
        }

        const isEmail = inputVal.includes('@');
        
        if (!isEmail) {
            // بحث مباشر برقم الهاتف (سحب بيانات شخص واحد فقط = صفر استهلاك)
            db.ref('users/' + inputVal).once('value', (snapshot) => {
                finalizeLogin(snapshot.val(), pass);
            });
        } else {
            // بحث بالبريد الإلكتروني باستخدام Query ذكي
            db.ref('users').orderByChild('email').equalTo(inputVal.toLowerCase()).once('value', (snapshot) => {
                if (snapshot.exists()) {
                    const userData = Object.values(snapshot.val())[0];
                    finalizeLogin(userData, pass);
                } else {
                    finalizeLogin(null, pass);
                }
            });
        }
    }

    function finalizeLogin(foundUser, pass) {
        if (!foundUser) {
            showTopToast('هذا الحساب غير موجود! برجاء إنشاء حساب جديد.', 'error');
            return;
        }
        if (foundUser.password !== pass) {
            showTopToast('كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى.', 'error');
            return;
        }

        localStorage.setItem('active_user_phone', foundUser.phone);
        localStorage.setItem('cached_user_data', JSON.stringify(foundUser));
        currentUser = foundUser;
        updateProfileUI();
        document.getElementById('login-password').value = '';
        const bottomNav = document.getElementById('main-bottom-nav');
        if(bottomNav) bottomNav.style.display = 'flex';
        showTopToast('تم تسجيل الدخول بنجاح ✨', 'success');
        goHomeDirectly();
    }
    
    function logoutUserLocally() {
        localStorage.removeItem('active_user_phone');
        localStorage.removeItem('cached_user_data');
        currentUser = null; 
        hasCheckedDailyLoginSession = false; // 👈 ضيف السطر ده هنا
        document.getElementById('sidebar-avatar').src = 'https://img.icons8.com/fluency/96/user-male.png'; 
        document.getElementById('sidebar-name').innerText = 'غير مسجل';
        document.getElementById('sidebar-stats-box').style.display = 'none'; 
        document.getElementById('sidebar-logout').style.display = 'none';
        document.getElementById('sidebar-admin-panel').style.display = 'none';
        document.getElementById('main-bottom-nav').style.display = 'none';
        document.getElementById('home-balance-bar').style.display = 'none';
    }

    let isStoreFetched = false;
    let isAchievementsFetched = false;

    function switchProfileTab(tab) {
        playClickSound();
        ['main', 'store', 'badges'].forEach(t => {
            const btn = document.getElementById(`tab-prof-${t}`);
            const sec = document.getElementById(`prof-section-${t}`);
            if(btn) btn.classList.remove('active');
            if(sec) sec.style.display = 'none';
        });
        document.getElementById(`tab-prof-${tab}`).classList.add('active');
        document.getElementById(`prof-section-${tab}`).style.display = 'block';
        
        if (tab === 'store') {
            if (!isStoreFetched) {
                db.ref('store_config').once('value', (snap) => {
                    if (snap.exists()) {
                        currentStoreConfig = { ...defaultStorePrices, ...snap.val() };
                    }
                    renderStoreCatalog();
                });
                isStoreFetched = true;
            } else {
                renderStoreCatalog();
            }
        }
        
        if (tab === 'badges') {
            if (!isAchievementsFetched) {
                db.ref('achievements_config').once('value', snap => {
                    if (snap.exists()) {
                        activeAchievementsConfig = { ...defaultAchievementsConfig, ...snap.val() };
                    }
                    renderAchievementsTabUI();
                });
                isAchievementsFetched = true;
            } else {
                renderAchievementsTabUI();
            }
        }
    }

    function switchStoreSubTab(subTab) {
        playClickSound();
        ['frames', 'profile', 'boosters'].forEach(s => {
            const btn = document.getElementById(`store-cat-${s}`);
            const sec = document.getElementById(`store-sub-${s}`);
            if(btn) btn.classList.remove('active');
            if(sec) sec.style.display = 'none';
        });
        document.getElementById(`store-cat-${subTab}`).classList.add('active');
        document.getElementById(`store-sub-${subTab}`).style.display = 'block';
    }

    function renderStoreCatalog() {
        if (!currentUser) return;

        const framesList = document.getElementById('store-list-frames');
        const profileList = document.getElementById('store-list-profile');
        const boostersList = document.getElementById('store-list-boosters');
        if (!framesList || !profileList || !boostersList) return;

        framesList.innerHTML = '';
        profileList.innerHTML = '';
        boostersList.innerHTML = '';

        const ownedFrames = currentUser.owned_frames || [];
        const ownedHats = currentUser.owned_hats || [];

        if (currentUser.active_frame && currentUser.active_frame !== 'none') {
            framesList.innerHTML += `
                <div class="store-item" style="border-color: rgba(239, 68, 68, 0.3);">
                    <div class="store-item-details">
                        <div class="store-preview-circle">❌</div>
                        <div class="store-item-info">
                            <h4>إزالة الإطار المرتدى</h4>
                            <p>الرجوع إلى المظهر الطبيعي بدون فريم</p>
                        </div>
                    </div>
                    <button class="store-btn danger-toggle" onclick="toggleFeatureStatus('active_frame', 'none')">خلع الإطار 🔄</button>
                </div>
            `;
        }

        if (currentUser.active_hat && currentUser.active_hat !== 'none') {
            framesList.innerHTML += `
                <div class="store-item" style="border-color: rgba(239, 68, 68, 0.3);">
                    <div class="store-item-details">
                        <div class="store-preview-circle">❌</div>
                        <div class="store-item-info">
                            <h4>خلع إكسسوار الرأس</h4>
                            <p>إزالة القبعة أو الإكسسوار الحالي من فوق الصورة</p>
                        </div>
                    </div>
                    <button class="store-btn danger-toggle" onclick="toggleFeatureStatus('active_hat', 'none')">خلع الإكسسوار 🔄</button>
                </div>
            `;
        }

        Object.keys(currentStoreConfig).forEach(itemId => {
            const item = currentStoreConfig[itemId];
            const activePrice = item.salePrice !== undefined && item.salePrice !== '' ? parseInt(item.salePrice) : item.price;
            const isSale = item.salePrice !== undefined && item.salePrice !== '' && parseInt(item.salePrice) < item.price;
            
            let previewCircleHtml = '';
            if (itemId === 'frame_gold') previewCircleHtml = `<div class="store-preview-circle frame-gold">👑</div>`;
else if (itemId === 'theme_spiderman') previewCircleHtml = `<div class="store-preview-circle" style="background:#0f172a; border:2px solid #ef4444;">🕷️</div>`;
            else if (itemId === 'theme_classic_vintage') previewCircleHtml = `<div class="store-preview-circle" style="background:#1c1917; border:2px solid #d97706;">📜</div>`;
            else if (itemId === 'theme_doctor_doom') previewCircleHtml = `<div class="store-preview-circle" style="background:#022c22; border:2px solid #34d399;">🟢</div>`;
            else if (itemId === 'frame_fire') previewCircleHtml = `<div class="store-preview-circle frame-fire">🔥</div>`;
            else if (itemId === 'frame_cyber') previewCircleHtml = `<div class="store-preview-circle frame-cyber">⚡</div>`;
            else if (itemId === 'frame_cosmic') previewCircleHtml = `<div class="store-preview-circle frame-cosmic">🌌</div>`;
            else if (itemId === 'frame_ring_inferno') previewCircleHtml = `<div class="store-preview-circle" style="position:relative;"><div class="avatar-ring-frame ring-inferno"></div>🔥</div>`;
            else if (itemId === 'frame_ring_cyber') previewCircleHtml = `<div class="store-preview-circle" style="position:relative;"><div class="avatar-ring-frame ring-cyber"></div>⚡</div>`;
            else if (itemId === 'frame_ring_celestial') previewCircleHtml = `<div class="store-preview-circle" style="position:relative;"><div class="avatar-ring-frame ring-celestial"></div>👑</div>`;
            else if (itemId === 'frame_ring_nebula') previewCircleHtml = `<div class="store-preview-circle" style="position:relative;"><div class="avatar-ring-frame ring-nebula"></div>🌌</div>`;
            else if (itemId === 'hat_grad') previewCircleHtml = `<div class="store-preview-circle"><div class="hat-accessory hat-grad" style="font-size:1.6rem; top:-6px;">🎓</div></div>`;
            else if (itemId === 'hat_crown') previewCircleHtml = `<div class="store-preview-circle"><div class="hat-accessory hat-crown" style="font-size:1.6rem; top:-8px;">👑</div></div>`;
            else if (itemId === 'hat_bow') previewCircleHtml = `<div class="store-preview-circle"><div class="hat-accessory hat-bow" style="font-size:1.5rem; top:-4px; right:2px;">🎀</div></div>`;
            else if (itemId === 'hat_band') previewCircleHtml = `<div class="store-preview-circle"><div class="hat-accessory hat-band" style="width:70%; height:6px; top:18px;"></div></div>`;
            else if (itemId === 'hat_flowers') previewCircleHtml = `<div class="store-preview-circle"><div class="hat-accessory hat-flowers" style="font-size:1.5rem; top:-4px;">🌸</div></div>`;
            else if (itemId === 'hat_cap') previewCircleHtml = `<div class="store-preview-circle"><div class="hat-accessory hat-cap" style="font-size:1.5rem; top:-6px;">🧢</div></div>`;
            else if (itemId === 'hat_horns') previewCircleHtml = `<div class="store-preview-circle"><div class="hat-accessory hat-horns" style="font-size:1.5rem; top:-6px;">😈</div></div>`;
            else if (itemId === 'hat_headphones') previewCircleHtml = `<div class="store-preview-circle"><div class="hat-accessory hat-headphones" style="font-size:1.8rem; top:-2px;">🎧</div></div>`;
            else if (itemId === 'hat_wizard') previewCircleHtml = `<div class="store-preview-circle"><div class="hat-accessory hat-wizard" style="font-size:1.6rem; top:-8px;">🎩</div></div>`;
            else if (itemId === 'hat_halo') previewCircleHtml = `<div class="store-preview-circle"><div class="hat-accessory hat-halo" style="font-size:1.6rem; top:-10px;">😇</div></div>`;
            else if (itemId === 'vip_profile') previewCircleHtml = `<div class="store-preview-circle" style="border: 2px solid #ffd700;">💎</div>`;
            else if (itemId === 'top_card') previewCircleHtml = `<div class="store-preview-circle" style="border: 2px dashed #a855f7;">🃏</div>`;
            else if (itemId === 'glow_name') previewCircleHtml = `<div class="store-preview-circle glow-name-effect">Aa</div>`;
            else if (itemId === 'user_bio') previewCircleHtml = `<div class="store-preview-circle">✍️</div>`;
else if (itemId === 'theme_cyberpunk') previewCircleHtml = `<div class="store-preview-circle" style="background:#0b001a; border:2px solid #00f0ff;">⚡</div>`;
else if (itemId === 'theme_royal_gold') previewCircleHtml = `<div class="store-preview-circle" style="background:#12100e; border:2px solid #ffd700;">👑</div>`;
            else if (itemId === 'double_xp') previewCircleHtml = `<div class="store-preview-circle" style="color: #ef4444; font-weight: 900;">2X</div>`;
            else if (itemId === 'hint_5050') previewCircleHtml = `<div class="store-preview-circle">💡</div>`;
            else if (itemId === 'hint_time') previewCircleHtml = `<div class="store-preview-circle">⏱️</div>`;
            else if (itemId === 'booster_skip') previewCircleHtml = `<div class="store-preview-circle">🚀</div>`;
            else if (itemId === 'freeze') previewCircleHtml = `<div class="store-preview-circle">🛡️</div>`;

            let countBadge = '';
            if (itemId === 'hint_5050') countBadge = ` (لديك: ${currentUser.hintsCount || 0})`;
            if (itemId === 'hint_time') countBadge = ` (لديك: ${currentUser.hintTimeCount || 0})`;
            if (itemId === 'booster_skip') countBadge = ` (لديك: ${currentUser.skipCount || 0})`;

            const priceDisplay = isSale ? 
                `<div class="store-price-tag"><span class="store-old-price">${item.price}</span> <span>${activePrice} عملة 💸</span> <span class="store-limited-badge">${item.badgeText || 'عرض خاص'}</span></div>` : 
                `<div class="store-price-tag"><span>${activePrice} عملة 💸</span></div>`;

            let btnHtml = '';

            if (itemId.startsWith('frame_')) {
                const cleanItemId = itemId.replace('frame_', '');
                const cleanActive = (currentUser.active_frame || '').replace('frame_', '');
                
                const isEquipped = (cleanActive === cleanItemId || currentUser.active_frame === itemId);
                const isOwned = ownedFrames.includes(itemId) || ownedFrames.includes(cleanItemId);

                if (isEquipped) {
                    btnHtml = `<button class="store-btn active-item">مُرتدى الآن ✅</button>`;
                } else if (isOwned) {
                    btnHtml = `<button class="store-btn owned-item" onclick="equipOwnedFrame('${itemId}')">تفعيل الإطار 🔄</button>`;
                } else {
                    btnHtml = `<button class="store-btn" onclick="directBuyItem('${itemId}', ${activePrice})">شراء الآن 🛍️</button>`;
                }
            } else if (itemId.startsWith('hat_')) {
                const isEquipped = (currentUser.active_hat === itemId);
                const isOwned = ownedHats.includes(itemId);

                if (isEquipped) {
                    btnHtml = `<button class="store-btn active-item">مُرتدى الآن ✅</button>`;
                } else if (isOwned) {
                    btnHtml = `<button class="store-btn owned-item" onclick="equipOwnedHat('${itemId}')">ارتداء الإكسسوار 🔄</button>`;
                } else {
                    btnHtml = `<button class="store-btn" onclick="directBuyItem('${itemId}', ${activePrice})">شراء الآن 🛍️</button>`;
                }
            } else if (itemId === 'vip_profile') {
                if (currentUser.owned_vip || currentUser.is_vip) {
                    btnHtml = currentUser.is_vip ? 
                        `<button class="store-btn danger-toggle" onclick="toggleFeatureStatus('is_vip', false)">إلغاء التفعيل ❌</button>` : 
                        `<button class="store-btn owned-item" onclick="toggleFeatureStatus('is_vip', true)">تفعيل VIP 🔄</button>`;
                } else {
                    btnHtml = `<button class="store-btn" onclick="directBuyItem('${itemId}', ${activePrice})">شراء الآن 🛍️</button>`;
                }
            } else if (itemId === 'top_card') {
                if (currentUser.owned_top_card || currentUser.has_top_card) {
                    btnHtml = currentUser.has_top_card ? 
                        `<button class="store-btn danger-toggle" onclick="toggleFeatureStatus('has_top_card', false)">إلغاء التفعيل ❌</button>` : 
                        `<button class="store-btn owned-item" onclick="toggleFeatureStatus('has_top_card', true)">تفعيل البطاقة 🔄</button>`;
                } else {
                    btnHtml = `<button class="store-btn" onclick="directBuyItem('${itemId}', ${activePrice})">شراء الآن 🛍️</button>`;
                }
            } else if (itemId === 'glow_name') {
                if (currentUser.owned_glow_name || currentUser.has_glow_name) {
                    btnHtml = currentUser.has_glow_name ? 
                        `<button class="store-btn danger-toggle" onclick="toggleFeatureStatus('has_glow_name', false)">إلغاء التفعيل ❌</button>` : 
                        `<button class="store-btn owned-item" onclick="toggleFeatureStatus('has_glow_name', true)">تفعيل اللمعان 🔄</button>`;
                } else {
                    btnHtml = `<button class="store-btn" onclick="directBuyItem('${itemId}', ${activePrice})">شراء الآن 🛍️</button>`;
                }
            } else if (itemId === 'user_bio') {
                if (currentUser.owned_bio || currentUser.can_edit_bio) {
                    btnHtml = currentUser.can_edit_bio ? 
                        `<button class="store-btn danger-toggle" onclick="toggleFeatureStatus('can_edit_bio', false)">إخفاء البايو ❌</button>` : 
                        `<button class="store-btn owned-item" onclick="toggleFeatureStatus('can_edit_bio', true)">تفعيل البايو 🔄</button>`;
                } else {
                    btnHtml = `<button class="store-btn" onclick="directBuyItem('${itemId}', ${activePrice})">شراء الآن 🛍️</button>`;
                }
            } else if (itemId === 'freeze') {
                btnHtml = currentUser.has_streak_freeze ? `<button class="store-btn active-item">مُفعل (لديك درع) ✅</button>` : `<button class="store-btn" onclick="directBuyItem('${itemId}', ${activePrice})">شراء الآن 🛍️</button>`;
            }
else if (itemId.startsWith('theme_')) {
    const themeKey = itemId.replace('theme_', '');
    const ownedThemes = currentUser.owned_themes || [];
    const isOwned = ownedThemes.includes(themeKey);
    const isActive = (currentUser.active_custom_theme === themeKey);

    if (isActive) {
        btnHtml = `<button class="store-btn danger-toggle" onclick="toggleCustomTheme('${themeKey}')">إلغاء التفعيل ❌</button>`;
    } else if (isOwned) {
        btnHtml = `<button class="store-btn owned-item" onclick="toggleCustomTheme('${themeKey}')">تفعيل المظهر ✨</button>`;
    } else {
        btnHtml = `<button class="store-btn" onclick="directBuyItem('${itemId}', ${activePrice})">شراء الآن 🛍️</button>`;
    }
} else {
                btnHtml = `<button class="store-btn" onclick="directBuyItem('${itemId}', ${activePrice})">شراء +1 🛍️</button>`;
            }

            const cardHtml = `
                <div class="store-item">
                    <div class="store-item-details">
                        ${previewCircleHtml}
                        <div class="store-item-info">
                            <h4>${item.name}</h4>
                            <p>${item.desc}${countBadge}</p>
                            ${priceDisplay}
                        </div>
                    </div>
                    ${btnHtml}
                </div>
            `;

            if (item.category === 'frames') framesList.innerHTML += cardHtml;
            else if (item.category === 'profile') profileList.innerHTML += cardHtml;
            else if (item.category === 'boosters') boostersList.innerHTML += cardHtml;
        });
    }

    function directBuyItem(itemId, cost) {
        playClickSound();
        const currentCoins = currentUser.coins || 0;

        if (currentCoins < cost) {
            showTopToast(`عذراً، رصيدك غير كافٍ. تحتاج إلى ${cost} عملة!`, 'error');
            return;
        }

        recordUserTransaction(`شراء عنصر من المتجر: ${currentStoreConfig[itemId]?.name || itemId}`, 0, -cost, 'purchase');

        let updates = { coins: currentCoins - cost };

        if (itemId.startsWith('frame_') || itemId.startsWith('ring_')) {
            const frameKey = itemId;
            let owned = [...(currentUser.owned_frames || [])];
            if (!owned.includes(frameKey)) owned.push(frameKey);
            updates.owned_frames = owned;
            updates.active_frame = frameKey;
        } else if (itemId.startsWith('hat_')) {
            let owned = [...(currentUser.owned_hats || [])];
            if (!owned.includes(itemId)) owned.push(itemId);
            updates.owned_hats = owned;
            updates.active_hat = itemId;
        } else if (itemId === 'vip_profile') {
            updates.owned_vip = true;
            updates.is_vip = true;
        } else if (itemId === 'top_card') {
            updates.owned_top_card = true;
            updates.has_top_card = true;
        } else if (itemId === 'glow_name') {
            updates.owned_glow_name = true;
            updates.has_glow_name = true;
        } else if (itemId === 'user_bio') {
            updates.owned_bio = true;
            updates.can_edit_bio = true;
        } else if (itemId === 'double_xp') {
            updates.double_xp_until = Date.now() + (24 * 60 * 60 * 1000);
        } else if (itemId === 'hint_5050') {
            updates.hintsCount = (currentUser.hintsCount || 0) + 1;
        } else if (itemId === 'hint_time') {
            updates.hintTimeCount = (currentUser.hintTimeCount || 0) + 1;
        } else if (itemId === 'booster_skip') {
            updates.skipCount = (currentUser.skipCount || 0) + 1;
        } else if (itemId === 'freeze') {
            updates.has_streak_freeze = true;
} else if (itemId.startsWith('theme_')) {
            const themeKey = itemId.replace('theme_', '');
            let owned = [...(currentUser.owned_themes || [])];
            if (!owned.includes(themeKey)) owned.push(themeKey);
            updates.owned_themes = owned;
            updates.active_custom_theme = themeKey;
            applyUserCustomTheme(themeKey);
        }

        // دمج التعديلات في كائن المستخدم المحلي فوراً
        Object.assign(currentUser, updates);

        // تحديث الواجهات والمؤثرات فوراً
        playSuccessSound();
        shootStars();
        triggerConfetti();
        showTopToast(`تم الشراء والتفعيل بنجاح! خصم ${cost} عملة 🛍️✨`, 'success');
        updateProfileUI();

        // المزامنة مع Firebase في الخلفية
        db.ref('users/' + currentUser.phone).update(updates).catch(err => {
            console.error("فشل حفظ الشراء على السيرفر:", err);
            showTopToast("تعذر مزامنة الشراء مع السيرفر!", "error");
        });
    }

// تطبيق الستايل الخاص بالثيم فورياً على عنصر الـ html
function applyUserCustomTheme(themeKey) {
    if (!themeKey || themeKey === 'none' || themeKey === 'default') {
        document.documentElement.removeAttribute('data-custom-theme');
        document.body.style.backgroundImage = ''; 
        localStorage.removeItem('active_custom_theme');
        return;
    }

    let activeKey = themeKey;
    // توحيد اسم الكلاسيك ليتطابق مع المتجر
    if (activeKey === 'classic_vintage') {
        activeKey = 'classic';
    }

    document.documentElement.setAttribute('data-custom-theme', activeKey === 'classic' ? 'classic_vintage' : activeKey);
    localStorage.setItem('active_custom_theme', activeKey === 'classic' ? 'classic_vintage' : activeKey);

    const isLight = document.documentElement.getAttribute('data-theme') === 'light' || 
                    document.body.classList.contains('light-mode') ||
                    window.matchMedia('(prefers-color-scheme: light)').matches;

    const themeBgMap = {
        'spiderman': 'spiderman-bg.jpg',
        'doctor_doom': 'doom-bg.jpg',
        'royal_gold': 'gold-bg.jpg',
        'classic': 'classic-bg.jpg'
    };

    const bgImage = themeBgMap[activeKey];

    if (bgImage) {
        if (isLight) {
            document.body.style.backgroundImage = `linear-gradient(rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0.75)), url('${bgImage}')`;
        } else {
            document.body.style.backgroundImage = `linear-gradient(rgba(7, 13, 29, 0.70), rgba(7, 13, 29, 0.70)), url('${bgImage}')`;
        }
        
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundAttachment = "fixed";
        document.body.style.backgroundPosition = "center";
    } else {
        document.body.style.backgroundImage = '';
    }
}

// دالة زرار التفعيل / إلغاء التفعيل للثيمات المملوكة
function toggleCustomTheme(themeKey) {
    playClickSound();
    if (!currentUser) return;

    let nextTheme = (currentUser.active_custom_theme === themeKey) ? 'none' : themeKey;
    currentUser.active_custom_theme = nextTheme;
    applyUserCustomTheme(nextTheme);

    showTopToast(nextTheme !== 'none' ? 'تم تفعيل مظهر التطبيق الجديد بنجاح! ✨' : 'تم العودة للمظهر الافتراضي', 'info');
    renderStoreCatalog();

    db.ref('users/' + currentUser.phone + '/active_custom_theme').set(nextTheme);
}

    function toggleFeatureStatus(field, status) {
    playClickSound();
    let updates = {};
    updates[field] = status;

    // تحديث محلي لحظي
    Object.assign(currentUser, updates);
    showTopToast(status && status !== 'none' ? 'تم تفعيل الميزة بنجاح! ✨' : 'تم إيقاف الميزة بنجاح.', 'info');
    updateProfileUI();

    // حفظ في السيرفر في الخلفية
    db.ref('users/' + currentUser.phone).update(updates).catch(err => {
        console.error("فشل تعديل الحالة:", err);
    });
}

    function equipOwnedFrame(frameKey) {
    playClickSound();
    let fullKey = frameKey;
    if (!frameKey.startsWith('frame_') && !frameKey.startsWith('ring_')) {
        fullKey = 'frame_' + frameKey;
    }

    // تحديث محلي لحظي
    currentUser.active_frame = fullKey;
    showTopToast('تم تفعيل وارتداء الإطار بنجاح! ✨', 'success');
    updateProfileUI();

    // حفظ في السيرفر
    db.ref('users/' + currentUser.phone + '/active_frame').set(fullKey).catch(err => {
        console.error("فشل تفعيل الإطار:", err);
    });
}

function equipOwnedHat(hatKey) {
    playClickSound();

    // تحديث محلي لحظي
    currentUser.active_hat = hatKey;
    showTopToast('تم ارتداء إكسسوار الرأس بنجاح! ✨', 'success');
    updateProfileUI();

    // حفظ في السيرفر
    db.ref('users/' + currentUser.phone + '/active_hat').set(hatKey).catch(err => {
        console.error("فشل ارتداء الإكسسوار:", err);
    });
}

    function updateProfileUI() {
    if (currentUser) {
        if (currentUser.active_custom_theme && typeof applyUserCustomTheme === 'function') {
            applyUserCustomTheme(currentUser.active_custom_theme);
        }

        const avatarSrc = currentUser.avatar || 'https://img.icons8.com/fluency/96/user-male.png';
        const xp = currentUser.xp || currentUser.points || 0;
        const coins = currentUser.coins || 0;
        const rnk = getUserRank(xp);
        const nextXp = getNextLevelXP(xp);
        const progressPercent = Math.min((xp / nextXp) * 100, 100);
        
        const isVipActive = (currentUser.is_vip === true || currentUser.is_vip === 'true');
        const vipBadgeEl = document.getElementById('pro-vip-badge-tag');
        if (vipBadgeEl) vipBadgeEl.style.display = isVipActive ? 'inline-flex' : 'none';

        const avatarContainer = document.getElementById('profile-avatar-container');
        if (avatarContainer) {
            avatarContainer.className = 'profile-avatar';
            if (currentUser.active_frame && currentUser.active_frame !== 'none') {
                const cleanKey = currentUser.active_frame.replace('frame_', '');
                if (['gold', 'fire', 'cyber', 'cosmic'].includes(cleanKey)) {
                    avatarContainer.classList.add('frame-' + cleanKey);
                }
            }
        }

        const hatContainer = document.getElementById('profile-hat-container');
        if (hatContainer) hatContainer.innerHTML = getHatHtml(currentUser.active_hat) + getAvatarFrameOverlayHtml(currentUser.active_frame);

        const profileCard = document.getElementById('main-profile-header-card');
        if (profileCard) {
            if (isVipActive) profileCard.classList.add('vip-profile-card');
            else profileCard.classList.remove('vip-profile-card');
        }

        const dispName = document.getElementById('display-name');
        if (dispName) {
            dispName.innerText = currentUser.name;
            const dispTitle = document.getElementById('display-equipped-title');
            if (dispTitle) {
                if (currentUser.active_title && currentUser.active_title !== 'none') {
                    dispTitle.style.display = 'block';
                    dispTitle.innerHTML = getTitleBadgeHtml(currentUser.active_title, currentUser.active_title_rarity);
                } else {
                    dispTitle.style.display = 'none';
                }
            }
            if (currentUser.has_glow_name) dispName.classList.add('glow-name-effect');
            else dispName.classList.remove('glow-name-effect');
        }

        const idEl = document.getElementById('display-student-id');
        if (idEl) idEl.innerText = currentUser.student_id || '-----';

        const dispBio = document.getElementById('display-bio');
        if (dispBio) {
            if (currentUser.can_edit_bio && currentUser.bio && currentUser.bio.trim() !== '') {
                dispBio.style.display = 'block';
                dispBio.innerText = `"${currentUser.bio}"`;
            } else {
                dispBio.style.display = 'none';
            }
        }

        const dXpBadge = document.getElementById('home-double-xp-badge');
        if (dXpBadge) dXpBadge.style.display = (currentUser.double_xp_until && currentUser.double_xp_until > Date.now()) ? 'inline-block' : 'none';

        const groupBio = document.getElementById('group-edit-bio');
        if (groupBio) {
            groupBio.style.display = (currentUser.owned_bio || currentUser.can_edit_bio) ? 'block' : 'none';
            document.getElementById('edit-bio-input').value = currentUser.bio || '';
        }

        document.getElementById('sidebar-avatar').src = avatarSrc;
        document.getElementById('sidebar-name').innerText = currentUser.name.split(' ').slice(0, 2).join(' ');
        document.getElementById('sidebar-stats-box').style.display = 'flex';
        document.getElementById('sidebar-badge').innerText = rnk;
        document.getElementById('sidebar-points').innerText = xp + ' XP';
        document.getElementById('sidebar-logout').style.display = 'flex';
        
        document.getElementById('home-balance-bar').style.display = 'flex';
        document.getElementById('home-xp').innerText = `${xp} XP`;
        document.getElementById('home-coins').innerText = coins;

        document.getElementById('display-avatar-img').src = avatarSrc;
        const phoneEl = document.getElementById('display-phone');
        if (phoneEl) phoneEl.innerText = currentUser.phone;
        
        document.getElementById('display-points').innerText = xp;
        document.getElementById('display-coins').innerText = coins;
        document.getElementById('display-rank-badge').innerText = rnk;
        
        document.getElementById('profile-xp-bar').style.width = `${progressPercent}%`;
        document.getElementById('profile-xp-text').innerText = `${xp} / ${nextXp} XP للترقية`;

        document.getElementById('edit-name-input').value = currentUser.name;
        document.getElementById('edit-avatar-preview').src = avatarSrc;
        
        document.getElementById('sub-view-name-input').value = currentUser.name || '';
        document.getElementById('sub-view-phone-input').value = currentUser.phone || '';
        document.getElementById('sub-view-email-input').value = currentUser.email || '';

        selectEditAvatar(avatarSrc, null, true);
        updateStatsUI();
        renderStoreCatalog();
        renderAchievementsTabUI();

        // 👈 التعديل السحري هنا: لو أنت المطور الأساسي أو لو معاك صلاحيات مساعد أدمن، يظهرلك الزرار
        if (currentUser.phone === "01061032507" || (currentUser.admin_roles && currentUser.admin_roles.length > 0)) {
            document.getElementById('sidebar-admin-panel').style.display = 'flex';
        } else {
            document.getElementById('sidebar-admin-panel').style.display = 'none';
        }
    }
}

    function handleProfileClick() { closeSidebar(); if (currentUser) navigateTo('view-profile', 'الملف الشخصي', 'بيانات حسابك'); else showAuthGateDirectly(); }

    function selectEditAvatar(avatarUrl, element, isInit = false) {
        if (!isInit) playClickSound(); 
        editSelectedAvatar = avatarUrl;
        document.getElementById('edit-avatar-preview').src = avatarUrl;
        document.querySelectorAll('.avatar-option').forEach(opt => { 
            opt.classList.remove('selected'); 
            if (opt.querySelector('img') && opt.querySelector('img').src === avatarUrl) opt.classList.add('selected'); 
        });
    }

    function handleCustomPhotoUpload(event) {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showTopToast('يرجى اختيار صورة بحجم أقل من 5 ميجابايت!', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    // تصغير وضغط الصورة برمجياً قبل الحفظ
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 250;
                    const MAX_HEIGHT = 250;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                    } else {
                        if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // تحويل الصورة المضغوطة لتأخذ مساحة خفيفة جداً (أقل من 20kb)
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);

                    editSelectedAvatar = compressedBase64;
                    document.getElementById('edit-avatar-preview').src = compressedBase64;
                    document.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('selected'));
                    playSuccessSound();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    function saveProfileChanges() {
        playClickSound(); 
        const newName = document.getElementById('edit-name-input').value.trim();
        const newBio = document.getElementById('edit-bio-input').value.trim();

        if (!newName) { showTopToast('الاسم لا يمكن أن يكون فارغاً!', 'error'); return; }
        if (currentUser) { 
            let updateData = { name: newName, avatar: editSelectedAvatar };
            if (currentUser.can_edit_bio || currentUser.owned_bio) {
                updateData.bio = newBio;
            }
            db.ref('users/' + currentUser.phone).update(updateData).then(() => { 
                showTopToast('تم حفظ التعديلات بنجاح ✨', 'success'); 
                navigateBack(); 
            }); 
        }
    }

    function saveSettingNameDirectly() {
        playClickSound();
        const val = document.getElementById('sub-view-name-input').value.trim();
        if (!val) { showTopToast('يرجى كتابة الاسم بشكل صحيح!', 'error'); return; }
        db.ref('users/' + currentUser.phone).update({ name: val }).then(() => {
            showTopToast('تم تحديث الاسم بنجاح ✅', 'success');
            navigateBack();
        });
    }

    function saveSettingPhoneDirectly() {
        playClickSound();
        const newPhone = document.getElementById('sub-view-phone-input').value.trim();
        if (!newPhone || newPhone.length < 11) { showTopToast('يرجى كتابة رقم هاتف صحيح!', 'error'); return; }
        if (newPhone === currentUser.phone) { navigateBack(); return; }

        db.ref('users/' + newPhone).once('value', (snap) => {
            if (snap.exists()) {
                showTopToast('هذا الرقم مستخدم بالفعل لحساب آخر!', 'error');
            } else {
                let updatedUser = { ...currentUser, phone: newPhone };
                db.ref('users/' + newPhone).set(updatedUser).then(() => {
                    db.ref('users/' + currentUser.phone).remove();
                    localStorage.setItem('active_user_phone', newPhone);
                    currentUser = updatedUser;
                    showTopToast('تم تغيير رقم الهاتف بنجاح!', 'success');
                    updateProfileUI();
                    navigateBack();
                });
            }
        });
    }

    function saveSettingEmailDirectly() {
        playClickSound();
        const newEmail = document.getElementById('sub-view-email-input').value.trim();
        if (!newEmail || !newEmail.includes('@')) { 
            showTopToast('يرجى كتابة بريد إلكتروني صالح!', 'error'); 
            return; 
        }

        if (!currentUser || !currentUser.password) {
            showTopToast('حدث خطأ في جلب بيانات الحساب!', 'error');
            return;
        }

        const currentEmail = currentUser.email;
        const userPass = currentUser.password;

        if (currentEmail && currentEmail.includes('@')) {
            auth.signInWithEmailAndPassword(currentEmail, userPass)
                .then((userCredential) => {
                    return userCredential.user.updateEmail(newEmail);
                })
                .then(() => {
                    return db.ref('users/' + currentUser.phone).update({ email: newEmail });
                })
                .then(() => {
                    currentUser.email = newEmail;
                    showTopToast('تم تحديث البريد الإلكتروني بنجاح ✉️', 'success');
                    navigateBack();
                })
                .catch((error) => {
                    if (error.code === 'auth/user-not-found') {
                        createNewAuthAccount(newEmail, userPass);
                    } else if (error.code === 'auth/email-already-in-use') {
                        showTopToast('هذا البريد مستخدم بالفعل لحساب آخر!', 'error');
                    } else {
                        showTopToast('خطأ: ' + error.message, 'error');
                    }
                });
        } else {
            createNewAuthAccount(newEmail, userPass);
        }
    }

    function createNewAuthAccount(email, password) {
        auth.createUserWithEmailAndPassword(email, password)
            .then(() => {
                return db.ref('users/' + currentUser.phone).update({ email: email });
            })
            .then(() => {
                currentUser.email = email;
                showTopToast('تم ربط وحفظ البريد الإلكتروني بنجاح ✉️', 'success');
                navigateBack();
            })
            .catch((err) => {
                if (err.code === 'auth/email-already-in-use') {
                    showTopToast('هذا البريد مستخدم بالفعل لحساب آخر!', 'error');
                } else {
                    showTopToast('حدث خطأ أثناء حفظ البريد: ' + err.message, 'error');
                }
            });
    }
function recordUserTransaction(title, xpChange = 0, coinsChange = 0, type = 'reward') {
    // تم إيقاف تسجيل المعاملات نهائياً لتوفير الاستهلاك 🚀
    return;
}

// دالة فتح وعرض سجل المعاملات
function openWalletHistory() {
    playClickSound();
    navigateTo('view-wallet-history', 'سجل المعاملات', 'حركة النقاط والعملات');
    loadWalletHistoryUI();
}

function loadWalletHistoryUI() {
    const container = document.getElementById('wallet-history-list');
    if (!container || !currentUser) return;

    container.innerHTML = '<p style="text-align: center; color: var(--text-sub); font-size: 0.85rem;">جاري تحميل السجل... ⏳</p>';

    // تم تغيير المسار واستخدام once بدلاً من on
    db.ref('user_transactions/' + currentUser.phone).limitToLast(40).once('value', snap => {
        if (!snap.exists()) {
            container.innerHTML = `
                <div class="acad-glass-card" style="text-align: center; padding: 25px 15px;">
                    <img src="https://img.icons8.com/fluency/96/box.png" style="width: 50px; height: 50px; margin-bottom: 8px;">
                    <p style="color: var(--text-sub); font-size: 0.85rem;">لا توجد معاملات مسجلة حتى الآن.</p>
                </div>`;
            return;
        }

        let logs = [];
        snap.forEach(c => {
            logs.push({ id: c.key, ...c.val() });
        });

        // ترتيب من الأحدث للأقدم
        logs.reverse();

        let html = '';
        logs.forEach(item => {
            const timeStr = item.timestamp ? new Date(item.timestamp).toLocaleString('ar-EG', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            }) : 'الآن';

            let xpBadge = '';
            if (item.xp !== 0 && item.xp !== undefined) {
                const isPos = item.xp > 0;
                xpBadge = `<span style="color: ${isPos ? 'var(--accent-emerald)' : '#ef4444'}; font-weight: 800; font-size: 0.82rem;">${isPos ? '+' + item.xp : item.xp} XP</span>`;
            }

            let coinBadge = '';
            if (item.coins !== 0 && item.coins !== undefined) {
                const isPos = item.coins > 0;
                coinBadge = `<span style="color: ${isPos ? 'var(--accent-gold)' : '#ef4444'}; font-weight: 800; font-size: 0.82rem;">${isPos ? '+' + item.coins : item.coins} 💸</span>`;
            }

            let icon = '🎁';
            if (item.type === 'purchase') icon = '🛍️';
            else if (item.type === 'penalty') icon = '⚠️';
            else if (item.type === 'quiz') icon = '🧠';
            else if (item.type === 'derby') icon = '⚔️';
            else if (item.type === 'penalty_game') icon = '⚽';

            html += `
            <div class="acad-glass-card" style="margin-bottom: 0; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.3rem;">${icon}</span>
                    <div style="text-align: right;">
                        <h4 style="font-size: 0.88rem; margin: 0; color: var(--text-main);">${item.title}</h4>
                        <span style="font-size: 0.7rem; color: var(--text-sub);">${timeStr}</span>
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 2px;">
                    ${xpBadge}
                    ${coinBadge}
                </div>
            </div>`;
        });

        container.innerHTML = html;
    });
}

    function sendResetPasswordLink() {
        playClickSound();
        const email = document.getElementById('sub-view-forgot-email').value.trim();
        if (!email || !email.includes('@')) { showTopToast('يرجى كتابة بريد إلكتروني صالح!', 'error'); return; }

        auth.sendPasswordResetEmail(email).then(() => {
            showTopToast('تم إرسال رابط إعادة التعيين لبريدك المسجل!', 'success');
            setTimeout(() => navigateBack(), 2000);
        }).catch(err => {
            showTopToast('حدث خطأ أو البريد غير موجود: ' + err.message, 'error');
        });
    }

    function clearAppDataAndCache() {
        playClickSound();
        if (confirm('هل تريد مسح البيانات المؤقتة لتحديث محتوى ومذكرات التطبيق؟')) {
            if ('caches' in window) {
                caches.keys().then(names => {
                    names.forEach(name => caches.delete(name));
                });
            }
            showTopToast('تم تنظيف الذاكرة المؤقتة بنجاح، جاري إعادة التحميل...');
            setTimeout(() => window.location.reload(true), 1200);
        }
    }

    function toggleFaq(el) {
        playClickSound();
        const ans = el.nextElementSibling;
        const isOpen = ans.style.display === 'block';
        document.querySelectorAll('.faq-answer').forEach(a => a.style.display = 'none');
        ans.style.display = isOpen ? 'none' : 'block';
    }

    function submitTicket(type) {
        playClickSound();
        if (!currentUser) { showAuthGateDirectly(); return; }

        const title = type === 'مشكلة' ? document.getElementById('report-title-input').value.trim() : document.getElementById('suggest-title-input').value.trim();
        const desc = type === 'مشكلة' ? document.getElementById('report-desc-input').value.trim() : document.getElementById('suggest-desc-input').value.trim();

        if (!title || !desc) {
            showTopToast('يرجى كتابة العنوان والوصف بالكامل!', 'error');
            return;
        }

        const ticketData = {
            type: type,
            title: title,
            desc: desc,
            senderPhone: currentUser.phone,
            senderName: currentUser.name,
            sentAt: new Date().toISOString()
        };

        db.ref('user_tickets').push(ticketData).then(() => {
            if (type === 'مشكلة') {
                document.getElementById('report-title-input').value = '';
                document.getElementById('report-desc-input').value = '';
            } else {
                document.getElementById('suggest-title-input').value = '';
                document.getElementById('suggest-desc-input').value = '';
            }
            showTopToast(`تم استلام ال${type} وسيتم فحصها فوراً من قبل المطور ✨`, 'success');
            navigateBack();
        });
    }

    function redeemPromoCodeSidebar() {
    playClickSound();
    if (!currentUser) {
        showTopToast('يجب تسجيل الدخول أولاً لشحن الأكواد!', 'error');
        return;
    }
    const input = document.getElementById('sidebar-promo-input');
    const code = input.value.trim().toUpperCase();
    if (!code) {
        showTopToast('يرجى كتابة الكود أولاً!', 'error');
        return;
    }

    const codeRef = db.ref('promo_codes/' + code);
    codeRef.once('value').then(snapshot => {
        if (!snapshot.exists()) {
            showTopToast('عذراً، هذا الكود غير موجود!', 'error');
            return;
        }

        const codeData = snapshot.val();
        const isGlobal = codeData.scope === 'global';
        const isXp = codeData.type !== 'coins';
        const rewardAmount = codeData.amount || codeData.points || 50;

        // التحقق من صلاحية الكود الفردي
        if (!isGlobal && codeData.used) {
            showTopToast('عذراً، تم استخدام هذا الكود من قبل!', 'error');
            return;
        }

        // التحقق من استخدام الطالب للكود الجماعي مسبقاً
        if (isGlobal && codeData.usedByList && codeData.usedByList[currentUser.phone]) {
            showTopToast('لقد قمت بشحن هذا الكود مسبقًا!', 'error');
            return;
        }

        // ⚡ 1. إظهار الإشعار والاحتفال فوراً وتفريغ الحقل بدون انتظار السيرفر
        input.value = '';
        closeSidebar();
        playSuccessSound();
        shootStars();
        triggerConfetti();
        showTopToast(`تم شحن +${rewardAmount} ${isXp ? 'XP ⚡' : 'عملة 💸'} بنجاح 🎉`, 'success');

        // تحديث الرصيد محلياً في الواجهة فوراً
        if (isXp) {
            currentUser.xp = (currentUser.xp || currentUser.points || 0) + rewardAmount;
            currentUser.points = currentUser.xp;
        } else {
            currentUser.coins = (currentUser.coins || 0) + rewardAmount;
        }
        if (typeof updateHeaderCoinsDisplay === 'function') updateHeaderCoinsDisplay();

        // ⚡ 2. إرسال التحديثات للسحابة في الخلفية بهدوء
        const updates = {};
        if (isGlobal) {
            updates[`promo_codes/${code}/usedByList/${currentUser.phone}`] = {
                name: currentUser.name,
                claimedAt: new Date().toISOString()
            };
        } else {
            updates[`promo_codes/${code}/used`] = true;
            updates[`promo_codes/${code}/usedBy`] = currentUser.phone;
            updates[`promo_codes/${code}/usedByName`] = currentUser.name;
            updates[`promo_codes/${code}/usedAt`] = new Date().toISOString();
        }

        if (isXp) {
            updates[`users/${currentUser.phone}/xp`] = currentUser.xp;
            updates[`users/${currentUser.phone}/points`] = currentUser.points;
        } else {
            updates[`users/${currentUser.phone}/coins`] = currentUser.coins;
        }

        db.ref().update(updates);
        recordUserTransaction(`شحن كود مكافأة: ${code}`, isXp ? rewardAmount : 0, !isXp ? rewardAmount : 0, 'reward');
    });
}

    function openLeaderboard() { 
    navigateTo('view-leaderboard', 'لوحة المتصدرين', 'أبطال ورتب الدفعة'); 
    renderLeaderboard(); 
}

// 1. تحميل البيانات مسبقاً وتخزينها محلياً
let cachedLeaderboardData = JSON.parse(localStorage.getItem('local_top_10') || 'null');

// 2. عرض الليدربورد الذكي
function renderLeaderboard() {
    const container = document.getElementById('leaderboard-content');
    container.innerHTML = '<p style="text-align: center; color: var(--text-sub); margin-top: 30px; font-weight: 800;">جاري التحقق... ⏳</p>';

    // 1. التحقق من حالة اللوحة (مقفلة أم مفتوحة)
    db.ref('settings/leaderboard_locked').once('value').then(lockSnap => {
        const isLocked = lockSnap.exists() ? lockSnap.val() : false;

        // 2. إذا كانت اللوحة مقفلة، نعرض رسالة الغموض ولا نحمل أي بيانات أخرى
        if (isLocked) {
            container.innerHTML = `
                <div class="auth-card" style="text-align: center; padding: 40px 20px; border-color: #ef4444; margin-top: 20px;">
                    <span style="font-size: 4.5rem; display: block; margin-bottom: 15px;">🤫</span>
                    <h3 style="color: #ef4444; margin-bottom: 10px; font-size: 1.4rem;">الترتيب سري حالياً!</h3>
                    <p style="color: var(--text-main); font-size: 0.95rem; line-height: 1.8; font-weight: 700;">
                        لوحة المتصدرين مغلقة لزيادة الحماس والمنافسة.<br>استمر في جمع النقاط وإنجاز التحديات، وسيتم الكشف عن المراكز الأولى قريباً جداً! 🔥
                    </p>
                </div>`;
            return;
        }

        // 3. إذا كانت مفتوحة، نحمل قائمة الأبطال كالمعتاد
        db.ref('users').orderByChild('xp').limitToLast(10).once('value').then(snapshot => {
            let usersArr = [];
            snapshot.forEach(child => {
                let u = child.val();
                u.id = child.key;
                u.xp = u.xp || u.points || 0;
                usersArr.push(u);
            });
            usersArr.reverse();
            buildLeaderboardDOM(usersArr, container);
        }).catch(() => {
            container.innerHTML = '<p style="text-align: center; color: #ef4444; margin-top: 30px;">حدث خطأ في تحميل البيانات.</p>';
        });
    });
}

// 3. بناء الواجهة (بعد حذف الترتيب الشخصي)
function buildLeaderboardDOM(usersArr, container) {
    if (!usersArr || usersArr.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-sub); margin-top: 30px; font-weight: bold;">لا يوجد لاعبين مسجلين حتى الآن. كن أول المنضمين! 🚀</p>';
        return;
    }

    const top10Users = usersArr.slice(0, 10);
    const verifiedGoldSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" style="vertical-align: middle; margin-bottom: 2px; margin-right: 4px; filter: drop-shadow(0 2px 4px rgba(212,175,55,0.6));"><defs><linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ffe55c" /><stop offset="50%" stop-color="#f59e0b" /><stop offset="100%" stop-color="#b38600" /></linearGradient></defs><path fill="url(#goldGrad)" d="M22.5 12l-2.09-2.38.31-3.15-3.09-.76-1.55-2.8-3.08 1.05L12 2 10.99 3.96l-3.08-1.05-1.55 2.8-3.09.76.31 3.15L1.5 12l2.09 2.38-.31 3.15 3.09.76 1.55 2.8 3.08-1.05L12 22l1.01-1.96 3.08 1.05 1.55-2.8 3.09-.76-.31-3.15L22.5 12z"/><path fill="#ffffff" d="M10 15.5l-4-4 1.5-1.5 2.5 2.5 7-7 1.5 1.5-8.5 8.5z"/></svg>`;

    let html = '<div class="podium">';
    const top3 = [top10Users[1] || null, top10Users[0] || null, top10Users[2] || null];
    const classes = ['step-2', 'step-1', 'step-3'];
    const medals = ['🥈', '🥇', '🥉'];

    top3.forEach((u, i) => {
        if (u) {
            const avatar = u.avatar || 'https://img.icons8.com/fluency/96/user-male.png';
            const isMeBorder = (currentUser && (u.id === currentUser.phone || u.phone === currentUser.phone)) ? 'border-color: var(--accent-emerald);' : '';
            const frameClass = u.active_frame && u.active_frame !== 'none' ? 'frame-' + u.active_frame.replace('frame_', '') : '';
            const nameGlowClass = u.has_glow_name ? 'glow-name-effect' : '';
            const hasTopCardClass = u.has_top_card ? 'podium-animated-step' : '';
            const vipBadgePodium = u.is_vip ? verifiedGoldSvg : '';
            const bioHtml = (u.can_edit_bio && u.bio) ? `<div class="podium-bio">"${u.bio}"</div>` : '';
            const hatHtml = typeof getHatHtml === 'function' ? getHatHtml(u.active_hat) : '';
            const frameOverlay = typeof getAvatarFrameOverlayHtml === 'function' ? getAvatarFrameOverlayHtml(u.active_frame) : '';

            html += `
            <div class="podium-place ${hasTopCardClass}">
                <div class="podium-name ${nameGlowClass}">${u.name ? u.name.split(' ')[0] : 'طالب'}${vipBadgePodium}</div>
                ${bioHtml}
                <div class="podium-pts">${u.xp || 0} XP</div>
                <div class="avatar-box-wrapper">
                    ${hatHtml}${frameOverlay}
                    <img src="${avatar}" class="profile-avatar ${frameClass}" style="${isMeBorder}" loading="lazy">
                </div>
                <div class="podium-step ${classes[i]}">${medals[i]}</div>
            </div>`;
        } else {
            html += `
            <div class="podium-place">
                <div class="podium-name" style="opacity: 0.3;">-</div>
                <div class="podium-pts" style="opacity: 0.3;">0 XP</div>
                <div class="avatar-box-wrapper" style="opacity: 0.2;">
                    <img src="https://img.icons8.com/fluency/96/user-male.png" class="profile-avatar">
                </div>
                <div class="podium-step ${classes[i]}" style="opacity: 0.2;">${medals[i]}</div>
            </div>`;
        }
    });

    html += '</div><div class="leaderboard-list">';

    for (let i = 3; i < top10Users.length; i++) {
        const u = top10Users[i];
        if (!u) continue;
        const actualRank = i + 1;
        const isMe = currentUser && (u.id === currentUser.phone || u.phone === currentUser.phone);
        const avatar = u.avatar || 'https://img.icons8.com/fluency/96/user-male.png';
        const rankStr = typeof getUserRank === 'function' ? getUserRank(u.xp) : 'طالب';
        const frameClass = u.active_frame && u.active_frame !== 'none' ? 'frame-' + u.active_frame.replace('frame_', '') : '';
        const animatedCardClass = u.has_top_card ? 'animated-top-card' : '';
        const nameGlowClass = u.has_glow_name ? 'glow-name-effect' : '';
        const vipBadgeList = u.is_vip ? verifiedGoldSvg : '';
        const bioText = (u.can_edit_bio && u.bio) ? `<span style="font-size: 0.72rem; color: var(--accent-gold); display: block; font-style: italic;">"${u.bio}"</span>` : '';
        const hatHtml = typeof getHatHtml === 'function' ? getHatHtml(u.active_hat) : '';
        const frameOverlay = typeof getAvatarFrameOverlayHtml === 'function' ? getAvatarFrameOverlayHtml(u.active_frame) : '';

        html += `
        <div class="lb-item ${isMe ? 'is-me' : ''} ${animatedCardClass}">
            <div class="lb-rank">${actualRank}</div>
            <div class="avatar-box-wrapper">
                ${hatHtml}${frameOverlay}
                <img src="${avatar}" class="profile-avatar ${frameClass}" loading="lazy">
            </div>
            <div class="lb-details">
                <div class="lb-name ${nameGlowClass}">${u.name ? u.name.split(' ').slice(0, 2).join(' ') : 'طالب'} ${isMe ? '(أنت)' : ''}${vipBadgeList}</div>
                <div class="lb-badge">${rankStr}</div>
                ${bioText}
            </div>
            <div class="lb-points">${u.xp || 0}</div>
        </div>`;
    }
    html += '</div>';
    container.innerHTML = html;
}

    function openSubject(subjectName) {
        playClickSound(); currentActiveSubject = subjectName;
        document.getElementById('selected-subject-label').innerText = 'محتوى مادة: ' + subjectName;
        navigateTo('view-subject-content', subjectName, 'اختر نوع المحتوى');
        setTimeout(updateAllRedDots, 50); // 👈 إضافة النقطة الحمراء
    }

                function updateBookRewardBadgeUI() {
        const badgeEl = document.getElementById('book-reward-status-badge');
        if (!badgeEl) return;

        const safeKey = getSafeSubjectKey(currentActiveSubject);
        const bookIdentifier = `${safeKey}_${currentActiveType}`;
        const rewardedList = (currentUser && currentUser.rewarded_books) ? currentUser.rewarded_books : [];

        if (rewardedList.includes(bookIdentifier)) {
            badgeEl.innerText = 'تم الحصول على المكافأة ✔️';
            badgeEl.style.color = 'var(--accent-emerald)';
        } else {
            badgeEl.innerText = '+15 XP 🎁';
            badgeEl.style.color = 'var(--accent-gold)';
        }
    }

    function getSafeSubjectKey(name) {
        return encodeURIComponent(name).replace(/\./g, '%2E');
    }

    function handleBookDownloadClick() {
    playClickSound();
    const safeKey = getSafeSubjectKey(currentActiveSubject);
    const bookIdentifier = `${safeKey}_${currentActiveType}`;
    
    // احتساب المكافأة فوراً
    rewardUserForBookSilent(bookIdentifier);

    // 1. فحص وجود الرابط محلياً أولاً
    const cachedLink = localStorage.getItem('cached_book_url_' + bookIdentifier);

    // 🚀 إذا كان الرابط محفوظاً مسبقاً، نزل فوراً بدون لمس فايربيز نهائياً
    if (cachedLink) {
        downloadBookFromDrive(cachedLink, `${currentActiveSubject}_${currentActiveType}.pdf`);
        return;
    }

    // 2. إذا لم يكن محفوظاً (أول مرة فقط)، اطلبه من فايربيز واحفظه للأبد
    showTopToast('جاري تجهيز رابط التحميل... ⏳', 'info');
    db.ref(`subject_files/${safeKey}/${currentActiveType}`).once('value').then((snapshot) => {
        if (snapshot.exists() && snapshot.val()) {
            const rawUrl = snapshot.val();
            localStorage.setItem('cached_book_url_' + bookIdentifier, rawUrl); // حفظ الرابط في هاتف الطالب
            downloadBookFromDrive(rawUrl, `${currentActiveSubject}_${currentActiveType}.pdf`);
        } else {
            fallbackDownload();
        }
    }).catch(() => {
        fallbackDownload();
    });
}

function fallbackDownload() {
    if (currentActiveSubject === 'تكنولوجيا الحبوب' && currentActiveType === 'theory') {
        downloadDirectFile('grains_book.pdf', 'grains_book.pdf');
    } else {
        showTopToast('تعذر جلب الرابط حالياً، تأكد من اتصال الإنترنت! ⏳', 'error');
    }
}

    function rewardUserForBookSilent(bookIdentifier) {
        if (!currentUser) return;

        let rewardedList = currentUser.rewarded_books || [];
        if (rewardedList.includes(bookIdentifier)) return;

        rewardedList.push(bookIdentifier);
        const bonusXP = 15;

        currentUser.rewarded_books = rewardedList;
        currentUser.xp = (currentUser.xp || 0) + bonusXP;
        currentUser.points = currentUser.xp;

        // تسجيل المعاملة في السجل لمرة واحدة فقط
        recordUserTransaction(`الاطلاع على مقرر (${currentActiveSubject} - ${currentActiveType === 'theory' ? 'نظري' : 'عملي'})`, bonusXP, 0, 'reward');

        // تحديث النص والرصيد في الواجهة
        updateBookRewardBadgeUI();
        updateProfileUI();

        // الحفظ في قاعدة البيانات
        db.ref('users/' + currentUser.phone).update({
            xp: currentUser.xp,
            points: currentUser.xp,
            rewarded_books: rewardedList
        });
    }

    function downloadBookFromDrive(url, fileName) {
        let directUrl = url;
        const match = url.match(/\/d\/(.+?)\//) || url.match(/id=(.+?)(&|$)/);
        if (match && match[1]) {
            directUrl = `https://drive.google.com/uc?export=download&id=${match[1]}`;
        }
        downloadDirectFile(directUrl, fileName);
    }

    function downloadDirectFile(url, fileName) {
        playSuccessSound();
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName || 'book.pdf');
        link.setAttribute('target', '_blank');
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // ================= محرك تحدي ديربي الدفعة 1v1 =================
    let selectedDerbyStake = 10;
    let selectedDerbyRewardXP = 15;
    let currentBattleId = null;
    let battleListener = null;
    let battleTimerInterval = null;
    let hasAnsweredCurrentArenaQ = false;
    let isAdvancingQ = false; // 

    function openDerbySetupModal() {
        playClickSound();
        if (!currentUser) {
            showTopToast('يرجى تسجيل الدخول أولاً للمشاركة في الديربي!', 'error');
            return;
        }
        openModal('modal-derby-setup');
    }

    function selectDerbyTier(coins, xp, element) {
        playClickSound();
        selectedDerbyStake = coins;
        selectedDerbyRewardXP = xp;
        document.querySelectorAll('.derby-tier-slide').forEach(b => b.classList.remove('active'));
        if (element) element.classList.add('active');
    }

    async function createDerbyRoomAction() {
    playClickSound();
    if (!currentUser) return;
    if ((currentUser.coins || 0) < selectedDerbyStake) {
        showTopToast(`عفواً! رصيدك لا يكفي (تحتاج ${selectedDerbyStake} عملة) 🪙`, 'error');
        return;
    }

    closeModal('modal-derby-setup');
    showTopToast('جاري فتح غرفة الديربي فوراً ⚡', 'success');

    const randomCode = 'DERBY-' + Math.floor(100 + Math.random() * 900);

    // 1. جلب الأسئلة وتجهيزها أولاً
    const deck = await fetchBattleQuestionsDeck();

    // 2. فصل الأسئلة في مسار مستقل تماماً (يتم قراءتها مرة واحدة فقط ولن تستهلك مجدداً)
    await db.ref('battles_questions/' + randomCode).set(deck);

    // 3. رفع حالة الغرفة واللاعبين فقط في المسار الأساسي (حجم صغير جداً للتحديثات)
    const roomData = {
        roomId: randomCode,
        stake: selectedDerbyStake,
        rewardXP: selectedDerbyRewardXP,
        status: 'waiting',
        currentQIndex: 0,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        player1: {
            phone: currentUser.phone,
            name: currentUser.name,
            avatar: currentUser.avatar || '',
            score: 0,
            answeredCurrent: false,
            answerTime: 0
        },
        player2: null
    };

    await db.ref('users/' + currentUser.phone + '/coins').transaction(currentCoins => {
        return (currentCoins || 0) - selectedDerbyStake;
    });
    
    await db.ref('battles/' + randomCode).set(roomData);
    currentBattleId = randomCode;

    enterBattleLobbyView(randomCode);
}

    async function joinDerbyRoomAction() {
    playClickSound();
    if (!currentUser) return;

    const input = document.getElementById('derby-join-code-input');
    const roomId = input ? input.value.trim().toUpperCase() : '';

    if (!roomId) {
        showTopToast('يرجى إدخال كود الغرفة أولاً!', 'error');
        return;
    }

    const roomRef = db.ref('battles/' + roomId);
    const snap = await roomRef.once('value');

    if (!snap.exists()) {
        showTopToast('عذراً، هذه الغرفة غير موجودة!', 'error');
        return;
    }

    const room = snap.val();

    if (room.status !== 'waiting') {
        showTopToast('عذراً، الغرفة ممتلئة أو بدأت بالفعل!', 'error');
        return;
    }

    if (room.player1.phone === currentUser.phone) {
        showTopToast('لا يمكنك الانضمام لغرفتك الخاصة كمنافس!', 'error');
        return;
    }

    if ((currentUser.coins || 0) < room.stake) {
        showTopToast(`عفواً! رصيدك لا يكفي (تحتاج ${room.stake} عملة) 🪙`, 'error');
        return;
    }

    // خصم الرسوم
await db.ref('users/' + currentUser.phone + '/coins').transaction(currentCoins => {
    return (currentCoins || 0) - room.stake;
});
    const player2Data = {
        phone: currentUser.phone,
        name: currentUser.name,
        avatar: currentUser.avatar || '',
        score: 0,
        answeredCurrent: false,
        answerTime: 0
    };

    // تحديث بيانات الغرفة وحالتها إلى ready
    await roomRef.update({
        player2: player2Data,
        status: 'ready'
    });

    currentBattleId = roomId;
    closeModal('modal-derby-setup'); // تم تصحيح اسم المودال هنا
    if (input) input.value = '';

    // الدخول لشاشة الانتظار
    enterBattleLobbyView(roomId);
}

    async function fetchBattleQuestionsDeck() {
        let pool = [];
        // 1. إضافة الأسئلة الثابتة
        Object.keys(masterQuestionsBank).forEach(cat => {
            masterQuestionsBank[cat].forEach(q => {
                pool.push({ q: q.q, a: [...q.a], correct: q.correct, category: cat });
            });
        });

        // 2. سحب الأسئلة السحابية عبر الكاش الذكي (صفر استهلاك في المرات التالية)
        try {
            const cachedCloud = await getQuestionsWithCache('custom_questions');
            if (cachedCloud && cachedCloud.length > 0) {
                cachedCloud.forEach(q => {
                    pool.push({
                        q: q.q,
                        a: [...q.a],
                        correct: q.correct || 0,
                        category: q.categoryName || 'عام'
                    });
                });
            }
        } catch (e) {
            console.error("Error loading cached derby questions:", e);
        }

        pool = shuffleArray(pool);
        return pool.slice(0, 10);
    }

    function enterBattleLobbyView(roomId) {
        navigateTo('view-battle-lobby', 'غرفة الانتظار', 'في انتظار انضمام المنافس...');
        document.getElementById('lobby-room-code').innerText = roomId;
        document.getElementById('lobby-stake-badge').innerText = `🪙 الرسوم: ${selectedDerbyStake} عملة`;
        document.getElementById('lobby-reward-badge').innerText = `🏆 الجائزة: ${selectedDerbyStake * 2} عملة + ${selectedDerbyRewardXP} XP`;

        // تصفير بيانات المنافس القديم تماماً لتجنب الجليتش
        document.getElementById('lobby-p2-name').innerText = 'في الانتظار...';
        document.getElementById('lobby-p2-name').style.color = 'var(--text-sub)';
        document.getElementById('lobby-p2-avatar').src = 'https://img.icons8.com/fluency/96/user-male.png';
        document.getElementById('lobby-p2-avatar').style.opacity = '0.35';
        document.getElementById('lobby-p2-status').innerText = 'جاري البحث ⏳';

        const startBtn = document.getElementById('btn-start-derby-battle');
        if (startBtn) startBtn.style.display = 'none';

        if (battleListener) db.ref('battles/' + currentBattleId).off('value', battleListener);

        battleListener = db.ref('battles/' + roomId).on('value', snap => {
            if (!snap.exists()) return;
            const room = snap.val();
            const isHost = room.player1.phone === currentUser.phone;

            // تحديد مين أنا ومين المنافس ديناميكياً (نفس نظام الـ Arena)
            const me = isHost ? room.player1 : room.player2;
            const opponent = isHost ? room.player2 : room.player1;

            // أنا دايماً بظهر في الجانب الأول
            if (me) {
                document.getElementById('lobby-p1-name').innerText = me.name.split(' ')[0] + ' (أنت)';
                document.getElementById('lobby-p1-avatar').src = me.avatar || 'https://img.icons8.com/fluency/96/user-male.png';
            }

            // لو في منافس في الغرفة (أو لو أنا اللي دخلت على غرفة المنشئ)
            if (opponent) {
                document.getElementById('lobby-p2-name').innerText = opponent.name.split(' ')[0];
                document.getElementById('lobby-p2-name').style.color = 'var(--text-main)';
                document.getElementById('lobby-p2-avatar').src = opponent.avatar || 'https://img.icons8.com/fluency/96/user-male.png';
                document.getElementById('lobby-p2-avatar').style.opacity = '1';
                
                if (room.status === 'ready') {
                    if (isHost && startBtn) {
                        startBtn.style.display = 'block'; // يظهر زر البدء للمنشئ فقط
                        document.getElementById('lobby-p2-status').innerText = 'جاهز للتحدي 🔥';
                    } else if (!isHost) {
                        document.getElementById('lobby-p2-status').innerText = 'في انتظار بدء المنشئ ⏳';
                    }
                }
            }

            // عند ضغط المنشئ على زر البدء وتحول الحالة إلى playing
            if (room.status === 'playing') {
                enterBattleArenaView(roomId);
            }
        });
    }

    function copyBattleRoomCode() {
        if (!currentBattleId) return;
        navigator.clipboard.writeText(currentBattleId).then(() => {
            showTopToast('تم نسخ كود الغرفة للحافظة! 📋', 'success');
        });
    }

    function shareBattleRoomWhatsApp() {
        if (!currentBattleId) return;
        const text = `تحديتك في ديربي الدفعة 1v1 على تطبيق علوم الأغذية! ⚔️🔥%0Aادخل بالكود: *${currentBattleId}* واقبل التحدي!`;
        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    }
function startDerbyBattleByHost() {
    playClickSound();
    if (!currentBattleId) return;
    
    // تحويل حالة الغرفة إلى اللعب ليدخل الطرفان معاً في نفس اللحظة
    db.ref('battles/' + currentBattleId).update({
        status: 'playing'
    });
}

    async function cancelBattleLobby() {
        if (!currentBattleId) return;
        const roomRef = db.ref('battles/' + currentBattleId);
        const snap = await roomRef.once('value');
        
        if (snap.exists()) {
            const room = snap.val();
            const isHost = room.player1 && room.player1.phone === currentUser.phone;

            if (!isHost && room.status === 'ready') {
                await db.ref('users/' + currentUser.phone + '/coins').transaction(c => (c || 0) + room.stake);
                await roomRef.update({ status: 'waiting', player2: null });
            } 
            else if (room.status === 'waiting') {
                await db.ref('users/' + currentUser.phone + '/coins').transaction(c => (c || 0) + room.stake);
                await roomRef.remove();
            } 
            else if (room.status === 'ready' && isHost) {
                if (room.player1 && room.player1.phone) await db.ref('users/' + room.player1.phone + '/coins').transaction(c => (c || 0) + room.stake);
                if (room.player2 && room.player2.phone) await db.ref('users/' + room.player2.phone + '/coins').transaction(c => (c || 0) + room.stake);
                await roomRef.remove();
            }
            else if (room.status === 'playing') {
                const playerPath = isHost ? 'player1' : 'player2';
                await db.ref(`battles/${currentBattleId}/${playerPath}/score`).set(-999);
                await db.ref(`battles/${currentBattleId}/status`).set('finished');
            }
        }

        if (battleListener) roomRef.off('value', battleListener);
        currentBattleId = null;
        goHomeDirectly();
    }

    let currentMatchQuestions = []; // مصفوفة مستقلة للأسئلة أوفلاين

    function enterBattleArenaView(roomId) {
        navigateTo('view-battle-arena', 'ساحة الديربي 1v1', 'مواجهة حية مباشرة');
        if (battleListener) db.ref('battles/' + currentBattleId).off('value', battleListener);

        // 1. قراءة الأسئلة مرة واحدة فقط من مسارها الخاص
        db.ref('battles_questions/' + roomId).once('value').then(qSnap => {
            currentMatchQuestions = qSnap.val() || [];

            // 2. مراقبة حركة الغرفة فقط بدون لمس الأسئلة
            battleListener = db.ref('battles/' + roomId).on('value', snap => {
                if (!snap.exists()) return;
                const room = snap.val();
                syncArenaState(room);
            });
        });
    }

function syncArenaState(room) {
    if (room.status === 'finished') {
        if (battleListener && currentBattleId) {
            db.ref('battles/' + currentBattleId).off('value', battleListener);
            battleListener = null;
        }
        concludeBattle(room);
        return;
    }

    const isHost = room.player1.phone === currentUser.phone;
    const me = isHost ? room.player1 : room.player2;
    const opponent = isHost ? room.player2 : room.player1;

    document.getElementById('arena-p1-name').innerText = me.name.split(' ')[0] + ' (أنت)';
    document.getElementById('arena-p1-score').innerText = me.score || 0;
    document.getElementById('arena-p1-avatar').src = me.avatar || 'https://img.icons8.com/fluency/96/user-male.png';

    document.getElementById('arena-p2-name').innerText = opponent ? opponent.name.split(' ')[0] : 'المنافس';
    document.getElementById('arena-p2-score').innerText = opponent ? (opponent.score || 0) : 0;
    document.getElementById('arena-p2-avatar').src = (opponent && opponent.avatar) ? opponent.avatar : 'https://img.icons8.com/fluency/96/user-male.png';

    if (opponent) {
        document.getElementById('arena-p2-status').innerText = opponent.answeredCurrent ? 'أجاب ✅' : 'يفكر... ⏳';
        document.getElementById('arena-p2-status').style.color = opponent.answeredCurrent ? 'var(--accent-emerald)' : 'var(--accent-gold)';
    }

    const qIndex = room.currentQIndex || 0;
    document.getElementById('arena-question-counter').innerText = `السؤال ${qIndex + 1} / 10`;
    
    // 👈 القراءة مباشرة من currentMatchQuestions بدلاً من كائن room
    const currentQ = currentMatchQuestions[qIndex];
    if (currentQ) {
        document.getElementById('arena-q-category').innerText = currentQ.category || 'عام';
        document.getElementById('arena-q-text').innerText = currentQ.q;
    }

    if (document.getElementById('arena-options-list').dataset.currentQ !== String(qIndex)) {
        hasAnsweredCurrentArenaQ = false;
        document.getElementById('arena-p1-status').innerText = 'يفكر... ⏳';
        document.getElementById('arena-p1-status').style.color = 'var(--accent-gold)';
        if (currentQ) renderArenaChoices(currentQ, qIndex, isHost);
    }

    if (room.player1 && room.player2 && room.player1.answeredCurrent && room.player2.answeredCurrent) {
        if (isHost && !isAdvancingQ) {
            isAdvancingQ = true; 
            setTimeout(() => {
                advanceArenaNextQuestion(room).then(() => {
                    isAdvancingQ = false; 
                });
            }, 1200);
        }
    }
} 

    // دالة لتغيير حالة القفل من لوحة الأدمن وحفظها في فايربيز
    function setHallOfFameLockStatus(lockState) {
    playClickSound();
    db.ref('settings/hall_of_fame_locked').set(lockState).then(() => {
        showTopToast(lockState ? 'تم قفل قاعة المشاهير بنجاح 🔒' : 'تم فتح قاعة المشاهير للطلاب 🔓', 'success');
        updateAdminFameButtonsUI(lockState);
    });
}

// ================= قفل وفتح لوحة المتصدرين =================
function setLeaderboardLockStatus(lockState) {
    if (typeof playClickSound === 'function') playClickSound();
    db.ref('settings/leaderboard_locked').set(lockState).then(() => {
        showTopToast(lockState ? 'تم إخفاء لوحة المتصدرين بنجاح 🔒' : 'تم إظهار لوحة المتصدرين للطلاب 🔓', 'success');
        updateAdminLbButtonsUI(lockState);
    });
}

function updateAdminLbButtonsUI(isLocked) {
    const lockBtn = document.getElementById('btn-lock-lb');
    const unlockBtn = document.getElementById('btn-unlock-lb');
    if (lockBtn && unlockBtn) {
        lockBtn.style.opacity = isLocked ? '0.5' : '1';
        unlockBtn.style.opacity = isLocked ? '1' : '0.5';
    }
}

// الاستماع لتغييرات حالة القفل لتحديث أزرار الأدمن تلقائياً
db.ref('settings/leaderboard_locked').on('value', snap => {
    const isLocked = snap.exists() ? snap.val() : false;
    updateAdminLbButtonsUI(isLocked);
});

// تحديث شكل الأزرار في لوحة الأدمن حسب الحالة الحالية
function updateAdminFameButtonsUI(isLocked) {
    const lockBtn = document.getElementById('btn-lock-fame');
    const unlockBtn = document.getElementById('btn-unlock-fame');
    if (lockBtn && unlockBtn) {
        lockBtn.style.opacity = isLocked ? '0.5' : '1';
        unlockBtn.style.opacity = isLocked ? '1' : '0.5';
    }
}

// الاستماع لتغييرات حالة القفل لتحديث أزرار الأدمن تلقائياً وشارة الواجهة
db.ref('settings/hall_of_fame_locked').on('value', snap => {
    const isLocked = snap.exists() ? snap.val() : false;
    updateAdminFameButtonsUI(isLocked);
    
    const badge = document.getElementById('fame-status-badge');
    if (badge) {
        badge.style.display = isLocked ? 'inline-block' : 'none';
    }
});

// دالة التحقق عند الضغط على زر قاعة المشاهير من المتصدرين
function checkHallOfFameStatus() {
    playClickSound();
    db.ref('settings/hall_of_fame_locked').once('value').then(snap => {
        const isLocked = snap.exists() ? snap.val() : false;
        
        if (isLocked) {
            showTopToast('قاعة المشاهير مغلقة مؤقتاً للتحديثات، ترقبونا قريباً! ⏳', 'error');
        } else {
            navigateTo('view-hall-of-fame', 'قاعة المشاهير', 'أبرز 6 أبطال في الدفعة');
            loadHallOfFameData();
        }
    });
}

    function renderArenaChoices(question, qIndex, isHost) {
    const list = document.getElementById('arena-options-list');
    list.dataset.currentQ = String(qIndex);
    list.innerHTML = '';

    // حفظ نص الإجابة الصحيحة قبل الخلط
    const correctText = question.a[question.correct || 0];

    // خلط مصفوفة الإجابات عشوائياً باستخدام دالة shuffleArray
    let options = shuffleArray([...question.a]);

    options.forEach((optText) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option-btn';
        btn.innerText = optText;
        btn.onclick = () => handleArenaAnswerClick(btn, optText, correctText, isHost);
        list.appendChild(btn);
    });

    startArenaTimer(15, isHost);
}

    function startArenaTimer(seconds, isHost) {
        clearInterval(battleTimerInterval);
        let timeLeft = seconds;
        const timerEl = document.getElementById('arena-timer');
        timerEl.innerText = timeLeft;

        battleTimerInterval = setInterval(() => {
            timeLeft--;
            timerEl.innerText = timeLeft;

            if (timeLeft <= 0) {
                clearInterval(battleTimerInterval);
                if (!hasAnsweredCurrentArenaQ) {
                    handleArenaAnswerTimeout(isHost);
                }
            }
        }, 1000);
    }

    async function handleArenaAnswerClick(btn, selectedAnswer, correctAnswer, isHost) {
        if (hasAnsweredCurrentArenaQ) return;
        hasAnsweredCurrentArenaQ = true;
        clearInterval(battleTimerInterval);

        const isCorrect = (selectedAnswer === correctAnswer);
        const answerTime = 15 - parseInt(document.getElementById('arena-timer').innerText || '0');

        if (isCorrect) {
            playSuccessSound();
            btn.classList.add('correct-choice');
        } else {
            playErrorSound();
            btn.classList.add('wrong-choice');
        }

        document.querySelectorAll('#arena-options-list .quiz-option-btn').forEach(b => b.disabled = true);
        document.getElementById('arena-p1-status').innerText = 'تمت الإجابة ✅';
        document.getElementById('arena-p1-status').style.color = 'var(--accent-emerald)';

        const playerPath = isHost ? 'player1' : 'player2';
        const updates = {};
        updates[`battles/${currentBattleId}/${playerPath}/answeredCurrent`] = true;
        updates[`battles/${currentBattleId}/${playerPath}/isCorrect`] = isCorrect;
        updates[`battles/${currentBattleId}/${playerPath}/answerTime`] = answerTime;

        await db.ref().update(updates);
    }

    async function handleArenaAnswerTimeout(isHost) {
    if (hasAnsweredCurrentArenaQ) return;
    hasAnsweredCurrentArenaQ = true;
    
    document.querySelectorAll('#arena-options-list .quiz-option-btn').forEach(b => b.disabled = true);
    document.getElementById('arena-p1-status').innerText = 'انتهى الوقت ⏰';
    document.getElementById('arena-p1-status').style.color = '#ef4444';
    
    const playerPath = isHost ? 'player1' : 'player2';
    const updates = {};
    updates[`battles/${currentBattleId}/${playerPath}/answeredCurrent`] = true;
    updates[`battles/${currentBattleId}/${playerPath}/isCorrect`] = false;
    updates[`battles/${currentBattleId}/${playerPath}/answerTime`] = 15;

    await db.ref().update(updates);
}

    async function advanceArenaNextQuestion(room) {
        const p1 = room.player1;
        const p2 = room.player2;
        let p1NewScore = p1.score || 0;
        let p2NewScore = p2.score || 0;

        if (p1.isCorrect && p2.isCorrect) {
            if (p1.answerTime < p2.answerTime) {
                p1NewScore += 2;
                p2NewScore += 1;
            } else if (p2.answerTime < p1.answerTime) {
                p1NewScore += 1;
                p2NewScore += 2;
            } else {
                p1NewScore += 1;
                p2NewScore += 1;
            }
        } else {
            if (p1.isCorrect) p1NewScore += 1;
            if (p2.isCorrect) p2NewScore += 1;
        }

        const nextIndex = (room.currentQIndex || 0) + 1;
        const isGameOver = nextIndex >= 10;

        const updates = {};
        updates[`battles/${currentBattleId}/player1/score`] = p1NewScore;
        updates[`battles/${currentBattleId}/player2/score`] = p2NewScore;
        updates[`battles/${currentBattleId}/player1/answeredCurrent`] = false;
        updates[`battles/${currentBattleId}/player2/answeredCurrent`] = false;
        updates[`battles/${currentBattleId}/currentQIndex`] = nextIndex;

        if (isGameOver) {
            updates[`battles/${currentBattleId}/status`] = 'finished';
        }

        await db.ref().update(updates);
    }

    async function concludeBattle(room) {
    if (battleListener) db.ref('battles/' + currentBattleId).off('value', battleListener);
    clearInterval(battleTimerInterval);

    navigateTo('view-battle-result', 'نتيجة الديربي 1v1', 'حسم المواجهة');

    const isHost = room.player1.phone === currentUser.phone;
    const me = isHost ? room.player1 : room.player2;
    const opp = isHost ? room.player2 : room.player1;

    // ترتيب اللاعبين بحيث يكون الفائز في الأعلى دائماً
    let winner = me.score >= opp.score ? me : opp;
    let loser = me.score >= opp.score ? opp : me;
    let isDraw = me.score === opp.score;

    // تعبئة بيانات الكارت العلوي (الفائز أو الأول في حال التعادل)
    document.getElementById('res-p1-name').innerText = winner.name;
    document.getElementById('res-p1-avatar').src = winner.avatar || 'https://img.icons8.com/fluency/96/user-male.png';
    document.getElementById('res-p1-badge').innerText = `النقاط: ${winner.score}`;
    document.getElementById('res-p1-tag').innerHTML = isDraw ? '🤝 متعادلين' : 'WINNER 👑';
    document.getElementById('result-card-p1').style.borderColor = isDraw ? 'var(--accent-gold)' : 'var(--accent-emerald)';
    document.getElementById('result-card-p1').style.boxShadow = isDraw ? '0 0 15px rgba(245, 158, 11, 0.3)' : '0 0 20px rgba(16, 185, 129, 0.35)';

    // تعبئة بيانات الكارت السفلي (الخاسر)
    document.getElementById('res-p2-name').innerText = loser.name;
    document.getElementById('res-p2-avatar').src = loser.avatar || 'https://img.icons8.com/fluency/96/user-male.png';
    document.getElementById('res-p2-badge').innerText = `النقاط: ${loser.score}`;
    document.getElementById('res-p2-tag').innerHTML = isDraw ? '🤝 متعادلين' : 'DEFEATED ❌';
    document.getElementById('result-card-p2').style.borderColor = '#ef4444';
    document.getElementById('result-card-p2').style.opacity = '0.8';

    const titleEl = document.getElementById('battle-result-title');
    const subEl = document.getElementById('battle-result-subtitle');
    const rewardBox = document.getElementById('battle-result-rewards-box');
    const rewardText = document.getElementById('battle-result-reward-text');
    const iconEl = document.getElementById('battle-result-icon');

    const myScore = me.score;
    const oppScore = opp.score;

    if (myScore > oppScore) {
        playSuccessSound();
        shootStars();
        triggerConfetti();
        titleEl.innerText = 'مبروك الفوز يا بطل! 🏆';
        subEl.innerText = 'أثبت تفوقك وحسمت المعركة بامتياز!';
        iconEl.src = 'https://img.icons8.com/fluency/96/trophy.png';
        
        const totalCoinsWon = room.stake * 2;
        rewardText.innerText = `+${totalCoinsWon} عملة 💸 | +${room.rewardXP} XP ⚡`;
        rewardBox.style.display = 'block';

        recordUserTransaction(`فوز في ديربي 1v1 ضد المنافس`, room.rewardXP, totalCoinsWon, 'derby');

        await db.ref('users/' + currentUser.phone).update({
            coins: (currentUser.coins || 0) + totalCoinsWon,
            xp: (currentUser.xp || currentUser.points || 0) + room.rewardXP,
            points: (currentUser.xp || currentUser.points || 0) + room.rewardXP,
            derby_wins: (currentUser.derby_wins || 0) + 1
        });
    } else if (myScore < oppScore) {
        playErrorSound();
        titleEl.innerText = 'هاردلك، معوضة الجولة القادمة! 🛡️';
        subEl.innerText = 'المنافس كان أسرع هذه المرة، استعد للثأر قريبًا!';
        iconEl.src = 'https://img.icons8.com/fluency/96/shield.png';
        rewardBox.style.display = 'none';

        recordUserTransaction(`خسارة في ديربي 1v1 (رسوم التحدي)`, 0, -room.stake, 'derby');
    } else {
        playSuccessSound();
        titleEl.innerText = 'تعادل بطولي بين العملاقين! 🤝';
        subEl.innerText = 'تقاربت المستويات تماماً، تم استرداد رسوم التحدي.';
        iconEl.src = 'https://img.icons8.com/fluency/96/handshake.png';
        rewardText.innerText = `+${room.stake} عملة (استرداد الرسوم) 🪙`;
        rewardBox.style.display = 'block';

        recordUserTransaction(`تعادل في ديربي 1v1 (استرداد الرسوم)`, 0, 0, 'derby');

        await db.ref('users/' + currentUser.phone + '/coins').set((currentUser.coins || 0) + room.stake);
    }

    // إرسال الإحصائية للوحة تحكم الأدمن وحذف الغرفة المنتهية لتوفير المساحة
    if (isHost && currentBattleId) {
        recordActivityLog('derby', `انتهت مواجهة ديربي 1v1: [${me.name.split(' ')[0]}] (${me.score}) ضد [${opp.name.split(' ')[0]}] (${opp.score}) ⚔️`);
        
        // تنظيف الغرفة والأسئلة بعد 10 ثوانٍ لضمان رؤية الطرفين للنتيجة
        const finishedBattleId = currentBattleId;
        setTimeout(() => {
            db.ref('battles/' + finishedBattleId).remove();
            db.ref('battles_questions/' + finishedBattleId).remove();
        }, 10000);
    }

    currentBattleId = null;
}
// ================= منظومة حماية التحديات والخصم عند الانسحاب =================
    let isClassicQuizActive = false;
    let isPenaltyGameActive = false;

    // دالة الانسحاب من التحدي الكلاسيكي
    function forfeitClassicQuiz() {
        clearInterval(timerInterval);
        isClassicQuizActive = false;
        const xpLoss = 35;

        if (currentUser) {
            const todayDate = getRealDateString();
            db.ref('users/' + currentUser.phone).transaction(user => {
                if (user) {
                    let newXp = (user.xp !== undefined ? user.xp : (user.points || 0)) - xpLoss;
                    user.xp = newXp < 0 ? 0 : newXp;
                    user.points = user.xp;
                    user.quizPlayed = (user.quizPlayed || 0) + 1;

                    if (user.last_quiz_date === todayDate) {
                        user.daily_quiz_count = (user.daily_quiz_count || 0) + 1;
                    } else {
                        user.last_quiz_date = todayDate;
                        user.daily_quiz_count = 1;
                    }
                }
                return user;
            }).then(() => {
                updateProfileUI();
                updateStatsUI();
            });

            recordActivityLog('classic', `انسحب [${currentUser.name}] من تحدي العباقرة وتم خصم (${xpLoss} XP) كعقوبة ⚠️`);
        }

        playErrorSound();
        showTopToast(`انسحبت من التحدي! تم احتساب النتيجة 0/5 وخصم ${xpLoss} XP ❌`, 'error');
        
        navHistory = [{ viewId: 'view-home', title: 'برنامج علوم الأغذية', subtitle: 'الفرقة الرابعة - دفعة 28' }];
        showViewSection('view-home');
        updateHeader();
        updateNavState('nav-home');
    }

    // دالة الانسحاب من ركلات الجزاء
    function forfeitPenaltyGame() {
        clearInterval(penaltyTimer);
        stopStadiumCrowdAudio();
        isPenaltyGameActive = false;
        const xpLoss = 25;

        if (currentUser) {
            const todayDate = getRealDateString();
            db.ref('users/' + currentUser.phone).transaction(user => {
                if (user) {
                    let newXp = (user.xp !== undefined ? user.xp : (user.points || 0)) - xpLoss;
                    user.xp = newXp < 0 ? 0 : newXp;
                    user.points = user.xp;
                    user.quizPlayed = (user.quizPlayed || 0) + 1;

                    if (user.last_penalty_date === todayDate) {
                        user.daily_penalty_count = (user.daily_penalty_count || 0) + 1;
                    } else {
                        user.last_penalty_date = todayDate;
                        user.daily_penalty_count = 1;
                    }
                }
                return user;
            }).then(() => {
                updateProfileUI();
                updateStatsUI();
            });

            recordActivityLog('penalty', `انسحب [${currentUser.name}] من ركلة الجزاء وتم خصم (${xpLoss} XP) ⚠️`);
        }

        playErrorSound();
        showTopToast(`انسحبت من ركلة الجزاء! تم اعتبارها إهدار وخصم ${xpLoss} XP ❌`, 'error');
        
        navHistory = [{ viewId: 'view-home', title: 'برنامج علوم الأغذية', subtitle: 'الفرقة الرابعة - دفعة 28' }];
        showViewSection('view-home');
        updateHeader();
        updateNavState('nav-home');
    }


    // ================= بنك الأسئلة للمسابقات الفردية =================
    const masterQuestionsBank = {
        "علوم وطبيعة": [
            {q: "ما هو الغاز الأكثر وفرة في الغلاف الجوي للأرض؟", a: ["النيتروجين", "الأكسجين", "ثاني أكسيد الكربون", "الهيدروجين"], correct: 0},
            {q: "ما هو الكوكب الأقرب إلى الشمس؟", a: ["عطارد", "الزهرة", "المريخ", "المشتري"], correct: 0},
            {q: "كم عدد عظام جسم الإنسان البالغ؟", a: ["206 عظمة", "180 عظمة", "250 عظمة", "300 عظمة"], correct: 0},
            {q: "ما هو العنصر الكيميائي الذي يرمز له بالرمز (Au)؟", a: ["الذهب", "الفضة", "النحاس", "الحديد"], correct: 0},
            {q: "ما هو الحيوان البري الأسرع في العالم؟", a: ["الفهد (الشيتا)", "الأسد", "الغزال", "الفيل"], correct: 0}
        ],
        "تاريخ وجغرافيا": [
            {q: "ما هي عاصمة دولة أستراليا؟", a: ["كانبيرا", "سيدني", "ملبورن", "بريزبان"], correct: 0},
            {q: "في أي قارة تقع دولة مالي؟", a: ["إفريقيا", "آسيا", "أوروبا", "أمريكا الجنوبية"], correct: 0},
            {q: "ما هو البحر الذي يقع بين إفريقيا وأوروبا؟", a: ["البحر الأبيض المتوسط", "البحر الأحمر", "البحر الأسود", "بحر قزوين"], correct: 0},
            {q: "من هو إمبراطور فرنسا الشهير الذي هزم في معركة واترلو؟", a: ["نابليون بونابرت", "لويس الرابع عشر", "شارل ديجول", "هنري الرابع"], correct: 0},
            {q: "ما هي عاصمة كندا؟", a: ["أوتاوا", "تورونتو", "فانكوفر", "مونتريال"], correct: 0}
        ]
    };

    let activeQuizQuestions = []; 
    let currentQuizIndex = 0; 
    let quizScoreCount = 0; 
    let isAnswerLocked = false; 
    let timerInterval; 
    let timeLeft = 15;
    let hint5050UsedInCurrentQuestion = false;

    async function startActualQuiz() { 
    closeModal('quiz-rules-modal'); 
    playClickSound();

    // فحص استكمال الكلاسيك لو مخرجش منه
    if (isClassicQuizActive && !isLevelBossActive && activeQuizQuestions && activeQuizQuestions.length > 0 && currentQuizIndex < 5) {
        showTopToast('جاري استكمال التحدي من حيث توقفت 🚀', 'success');
        navigateTo('view-quiz-game', 'تحدي المعلومات', 'جولة تحدي العباقرة');
        if (!isAnswerLocked) resumeQuizTimer();
        return;
    }

    const todayDate = typeof getRealDateString !== 'undefined' ? getRealDateString() : new Date().toLocaleDateString('en-CA');
    const lastQuizDate = currentUser.last_quiz_date || '';
    const quizCountToday = (lastQuizDate === todayDate) ? (currentUser.daily_quiz_count || 0) : 0;

    if (quizCountToday >= DAILY_QUIZ_LIMIT) {
        if ((currentUser.extraClassicCount || 0) > 0) {
            currentUser.extraClassicCount -= 1;
            db.ref('users/' + currentUser.phone + '/extraClassicCount').set(currentUser.extraClassicCount);
            showTopToast('تم خصم محاولة كلاسيك من رصيدك الإضافي 🎟️', 'info');
        } else {
            showTopToast(`تم استهلاك جميع محاولات اليوم! اشتري محاولات إضافية من المتجر 🎟️`, 'error');
            return;
        }
    }

    let allAvailableQuestions = [];
    Object.keys(masterQuestionsBank).forEach(cat => {
        masterQuestionsBank[cat].forEach((q, idx) => {
            allAvailableQuestions.push({ 
                id: `master_${cat}_${idx}`, 
                q: q.q, 
                a: [...q.a], 
                correct: q.correct, 
                categoryName: cat 
            });
        });
    });

    // 👈 التعديل السحري: استخدام الكاش الموفر للبيانات
    showTopToast('جاري تجهيز التحدي... ⏳', 'info');
    const cloudQuestions = await getQuestionsWithCache('custom_questions');
    processSmartQuizDeck(allAvailableQuestions.concat(cloudQuestions));
}

    // الذاكرة الذكية لمنع التكرار
    function processSmartQuizDeck(allQuestions) {
        let seenIds = JSON.parse(localStorage.getItem('user_seen_classic_' + currentUser.phone) || '[]');
        let pool = allQuestions.filter(q => !seenIds.includes(q.id));

        if (pool.length < 5) {
            seenIds = [];
            pool = [...allQuestions];
            showTopToast('أحسنت! أتممت بنك الأسئلة بالكامل وتم تجديده بنجاح 🔄✨', 'info');
        }

        pool = shuffleArray(pool);
        activeQuizQuestions = pool.slice(0, 5);

        activeQuizQuestions.forEach(q => {
            if (!seenIds.includes(q.id)) seenIds.push(q.id);
        });
        localStorage.setItem('user_seen_classic_' + currentUser.phone, JSON.stringify(seenIds));

        currentQuizIndex = 0; 
        quizScoreCount = 0;
        isClassicQuizActive = true;
        navigateTo('view-quiz-game', 'تحدي المعلومات', 'جولة تحدي العباقرة');
        renderQuizQuestion();
    }

    function renderQuizQuestion() {
        isAnswerLocked = false;
        hint5050UsedInCurrentQuestion = false;
        const container = document.getElementById('quiz-container');
        const qData = activeQuizQuestions[currentQuizIndex];
        
        if (!qData) {
            finishQuizGame();
            return;
        }

        let optionsWithIndices = qData.a.map((opt, idx) => ({ 
            text: opt, 
            isCorrect: (idx === qData.correct),
            originalIdx: idx
        }));
        optionsWithIndices = shuffleArray(optionsWithIndices);
        
        const hasHint5050 = currentUser && (currentUser.hintsCount || 0) > 0;
        const hasHintTime = currentUser && (currentUser.hintTimeCount || 0) > 0;

        const hint5050Btn = hasHint5050 ? 
            `<button id="btn-hint-5050" class="admin-action-btn" style="padding: 4px 8px; font-size: 0.72rem;" onclick="useHint5050()">💡 50:50 (${currentUser.hintsCount})</button>` : '';
        
        const hintTimeBtn = hasHintTime ? 
            `<button id="btn-hint-time" class="admin-action-btn" style="padding: 4px 8px; font-size: 0.72rem;" onclick="useHintTime()">⏱️ +15ث (${currentUser.hintTimeCount})</button>` : '';

        let html = `
            <div class="section-label" style="justify-content: space-between;">
                <span>السؤال ${currentQuizIndex + 1} من 5</span>
                <div style="display: flex; align-items: center; gap: 6px;">
                    ${hint5050Btn}
                    ${hintTimeBtn}
                    <span style="color: var(--accent-gold); font-size: 0.78rem;">${qData.categoryName}</span>
                </div>
            </div>
            <div class="quiz-card">
                <div id="quiz-timer" class="quiz-timer-box">⏱️ 15</div>
                <h3 style="font-size: 1.1rem; margin-bottom: 20px; line-height: 1.5; color: var(--text-main);">${qData.q}</h3>
                <div id="options-list" style="display: flex; flex-direction: column; gap: 8px;">`;
                
        optionsWithIndices.forEach((opt, idx) => { 
            html += `<button class="quiz-option-btn" data-correct="${opt.isCorrect}" onclick="handleQuizAnswer(this, ${opt.isCorrect})">${idx + 1}. ${opt.text}</button>`; 
        });
        
        html += `</div>
                <div id="next-question-area" style="margin-top: 20px; display: none;">
                    <button class="btn-submit btn-action-quiz" onclick="proceedToNextQuestion()">
                        ${currentQuizIndex === 4 ? 'عرض النتيجة 🏆' : 'السؤال التالي ⬅️'}
                    </button>
                </div>
            </div>`;
            
        container.innerHTML = html; 
        startTimer();
    }

    function useHint5050() {
        if (isAnswerLocked || hint5050UsedInCurrentQuestion) return;
        if (!currentUser || (currentUser.hintsCount || 0) <= 0) {
            showTopToast('ليس لديك تلميحات 50:50 متبقية!', 'error');
            return;
        }

        playSuccessSound();
        hint5050UsedInCurrentQuestion = true;
        
        const newCount = currentUser.hintsCount - 1;
        currentUser.hintsCount = newCount;
        db.ref('users/' + currentUser.phone + '/hintsCount').set(newCount);
        
        const hintBtn = document.getElementById('btn-hint-5050');
        if (hintBtn) {
            hintBtn.disabled = true;
            hintBtn.innerText = `💡 50:50 (${newCount})`;
        }

        const buttons = Array.from(document.querySelectorAll('.quiz-option-btn'));
        const wrongButtons = buttons.filter(btn => btn.getAttribute('data-correct') === 'false');
        const shuffledWrong = shuffleArray(wrongButtons).slice(0, 2);
        
        shuffledWrong.forEach(btn => btn.classList.add('hidden-by-hint'));
        showTopToast('تم حذف خيارين خاطئين بنجاح! 💡', 'info');
    }

    function useHintTime() {
        if (isAnswerLocked) return;
        if (!currentUser || (currentUser.hintTimeCount || 0) <= 0) {
            showTopToast('ليس لديك معزز وقت إضافي!', 'error');
            return;
        }

        playSuccessSound();
        timeLeft += 15;
        const timerEl = document.getElementById('quiz-timer');
        if (timerEl) timerEl.innerHTML = `⏱️ ${timeLeft}`;

        const newCount = currentUser.hintTimeCount - 1;
        currentUser.hintTimeCount = newCount;
        db.ref('users/' + currentUser.phone + '/hintTimeCount').set(newCount);

        const hintBtn = document.getElementById('btn-hint-time');
        if (hintBtn) {
            hintBtn.disabled = true;
            hintBtn.innerText = `⏱️ +15ث (${newCount})`;
        }

        showTopToast('تمت إضافة 15 ثانية إضافية للتفكير! ⏱️🔥', 'info');
    }

    function startTimer() {
        timeLeft = 15; 
        const timerEl = document.getElementById('quiz-timer'); 
        timerEl.innerHTML = `⏱️ ${timeLeft}`; 
        timerEl.style.color = 'var(--text-main)';
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timeLeft--; 
            timerEl.innerHTML = `⏱️ ${timeLeft}`; 
            if (timeLeft <= 5) timerEl.style.color = '#ef4444';
            if (timeLeft <= 0) { 
                clearInterval(timerInterval); 
                handleQuizAnswer(null, false, true); 
            }
        }, 1000);
    }

    function handleQuizAnswer(buttonElem, isCorrect, isTimeout = false) {
        if (isAnswerLocked) return; 
        isAnswerLocked = true; 
        clearInterval(timerInterval); 
        const allButtons = document.querySelectorAll('.quiz-option-btn');
        
        if (isCorrect && !isTimeout) { 
            quizScoreCount++; 
            playSuccessSound(); 
            shootStars(); 
            if (buttonElem) buttonElem.classList.add('correct-choice'); 
        } else {
            playErrorSound(); 
            if (buttonElem) buttonElem.classList.add('wrong-choice');
            const currentQ = activeQuizQuestions[currentQuizIndex];
            allButtons.forEach(btn => { 
                if (btn.innerText.includes(currentQ.a[currentQ.correct])) { 
                    btn.classList.add('correct-choice'); 
                    btn.style.transform = 'scale(1)'; 
                } 
            });
        }
        allButtons.forEach(btn => btn.disabled = true); 
        document.getElementById('next-question-area').style.display = 'block';
    }

    function proceedToNextQuestion() { 
        playClickSound(); 
        currentQuizIndex++; 
        if (currentQuizIndex < 5) {
            renderQuizQuestion(); 
        } else {
            finishQuizGame(); 
        }
    }

    function finishQuizGame() {
isClassicQuizActive = false;
        let wrongCount = 5 - quizScoreCount;

saveLocalQuizHistory('تحدي العباقرة', quizScoreCount, 5, 'classic'); 
        
let xpChange = (quizScoreCount * 5) - (wrongCount * 2); // الخصم أصبح نقطتين بدل خمسة
let coinsChange = (quizScoreCount * 2);        let bonusMsg = "";
        
        if (quizScoreCount === 5) { 
            xpChange += 10; 
            coinsChange += 5;
            bonusMsg = "<br>🔥 <b>عاش يا بطل! جبتهم كلهم صح وخدت بونص +10 XP و +5 عملات!</b>"; 
        } else if (quizScoreCount === 0) { 
            xpChange -= 10; 
            bonusMsg = "<br>😅 <b>للأسف جبتهم كلهم غلط واتخصم منك عقاب -10 XP، شد حيلك المرة الجاية!</b>"; 
        }
recordUserTransaction(`جولة تحدي العباقرة (${quizScoreCount}/5 صح)`, xpChange, coinsChange, 'quiz');

        const isDoubleActive = currentUser && currentUser.double_xp_until && currentUser.double_xp_until > Date.now();
        if (isDoubleActive && xpChange > 0) {
            xpChange = xpChange * 2;
            bonusMsg += "<br>🚀 <b>تم مضاعفة نقاط الخبرة (2X XP) لتفعيلك المعزز!</b>"; 
        }

        if (currentUser) { 
            const todayDate = getRealDateString();

            db.ref('users/' + currentUser.phone).transaction((user) => { 
                if (user) {
                    let newXp = (user.xp || user.points || 0) + xpChange;
                    user.xp = newXp < 0 ? 0 : newXp;
                    user.points = user.xp;

                    let newCoins = (user.coins || 0) + coinsChange;
                    user.coins = newCoins < 0 ? 0 : newCoins;

                    user.quizPlayed = (user.quizPlayed || 0) + 1;
                    user.quizCorrect = (user.quizCorrect || 0) + quizScoreCount;

                    if (user.last_quiz_date === todayDate) {
                        user.daily_quiz_count = (user.daily_quiz_count || 0) + 1;
                    } else {
                        user.last_quiz_date = todayDate;
                        user.daily_quiz_count = 1;
                    }
                }
                return user; 
            }).then(() => {
                updateStatsUI();
            }); 
        }

        const imgEl = document.getElementById('result-img'); 
        const titleEl = document.getElementById('result-title'); 
        const descEl = document.getElementById('result-desc');
        
        if (quizScoreCount === 5) { 
            playFlawlessVictorySound();
            shootStars();
            imgEl.src = "https://img.icons8.com/fluency/96/trophy.png"; 
            titleEl.innerText = "أنت عبقري الدفعة يا باشا! 🏆"; 
        } else if (quizScoreCount >= 4) { 
            playSuccessSound();
            imgEl.src = "https://img.icons8.com/fluency/96/trophy.png"; 
            titleEl.innerText = "أداء ممتاز جداً وشغل عالي!"; 
        } else if (quizScoreCount >= 2) { 
            playSuccessSound();
            imgEl.src = "https://img.icons8.com/fluency/96/medal.png"; 
            titleEl.innerText = "مستوى جيد وقريب من القمة!"; 
        } else { 
            playErrorSound();
            imgEl.src = "https://img.icons8.com/fluency/96/flash-on.png"; 
            titleEl.innerText = "محتاج تركز أكتر يا هندسة!"; 
        }

        descEl.innerHTML = `جاوبت ${quizScoreCount} من 5 أسئلة صح.<br><br>
            <div style="margin-top: 10px; line-height: 1.8;">
                <div>نقاط الخبرة: <span style="color: ${xpChange >= 0 ? 'var(--accent-emerald)' : '#ef4444'}; font-weight: 900; font-size: 1.2rem;">${xpChange >= 0 ? '+' + xpChange : xpChange} XP</span></div>
                <div>العملات: <span style="color: var(--accent-gold); font-weight: 900; font-size: 1.2rem;">+${coinsChange} عملة 💸</span></div>
            </div>
            ${bonusMsg}`;
if (currentUser) {
    recordActivityLog('classic', `أنهى [${currentUser.name}] جولة تحدي العباقرة وأجاب (${quizScoreCount}/5 صح) - (${5 - quizScoreCount} غلط)`);
}
        document.getElementById('quiz-result-modal').classList.add('show'); 
        triggerConfetti();
    }

    function closeQuizResult() { 
        playBackSound(); 
        document.getElementById('quiz-result-modal').classList.remove('show'); 
        goHomeDirectly(); 
    }

    // ================= لوحة التحكم للإدمن =================
    let adminAllUsersData = [];

    function openAdminPanel() {
    playClickSound();
    
    // التحقق المزدوج للأمان
    if (currentUser && (currentUser.phone === "01061032507" || (currentUser.admin_roles && currentUser.admin_roles.length > 0))) {
        navigateTo('view-admin-panel', 'لوحة التحكم', 'إدارة التطبيق والأقسام');
        
        const isMaster = (currentUser.phone === "01061032507");
        const myRoles = currentUser.admin_roles || [];
        const allTabs = ['users','analytics','academic','store','tickets','broadcast','books','quiz','codes','achievements','ehbed-quiz', 'levels-sys', 'academy', 'science', 'risk-quiz', 'guess-game', 'notifs', 'quotes', 'roles'];
        
        let firstAllowedTab = null;

        // إظهار وإخفاء الزراير بناءً على الصلاحية
        allTabs.forEach(t => {
            const tabBtn = document.getElementById('tab-admin-' + t);
            if (tabBtn) {
                // الأدمن الأساسي يشوف كله، المساعد يشوف اللي معاه صلاحيته بس
                if (isMaster || myRoles.includes(t)) {
                    tabBtn.style.display = 'inline-flex';
                    if (!firstAllowedTab && t !== 'roles') firstAllowedTab = t; // حفظ أول تبويب مسموح لفتحه تلقائياً
                } else {
                    tabBtn.style.display = 'none';
                }
            }
        });

        // زرار الصلاحيات (Roles) للأدمن الأساسي فقططط
        const rolesTabBtn = document.getElementById('tab-admin-roles');
        if (rolesTabBtn) rolesTabBtn.style.display = isMaster ? 'inline-flex' : 'none';

        loadAdminData();
        populateAdminStoreInputs();
        
        // فتح أول قسم متاح للمساعد تلقائياً عشان ميفتحلوش صفحة بيضا
        switchAdminTab(isMaster ? 'users' : firstAllowedTab);

    } else {
        showTopToast('عذراً، لا تملك صلاحية الدخول لهذه الصفحة.', 'error');
    }
}

    let loadedAdminTabs = {}; // ذاكرة ذكية لمنع التحميل المتكرر
    let isAdminDataLoaded = false;

    function switchAdminTab(tabName) {
    if(!tabName) return; // حماية
    playClickSound();
    
    // ضفنا 'roles' للمصفوفة
    ['users','analytics','academic','store','tickets','broadcast','books','quiz','codes','achievements','ehbed-quiz', 'levels-sys', 'academy', 'science', 'risk-quiz', 'guess-game', 'notifs', 'quotes', 'roles'].forEach(t => {
        const tabBtn = document.getElementById('tab-admin-' + t);
        const tabSec = document.getElementById('admin-section-' + t);
        if (tabBtn) tabBtn.classList.remove('active');
        if (tabSec) tabSec.style.display = 'none';
    });
    
    const currentBtn = document.getElementById('tab-admin-' + tabName);
    const currentSec = document.getElementById('admin-section-' + tabName);
    
    if (currentBtn) currentBtn.classList.add('active');
    if (currentSec) currentSec.style.display = 'block';

    // تحميل الداتا الخاصة بكل قسم
    if (tabName === 'analytics' && !loadedAdminTabs.analytics) { loadAdminAnalyticsAndLogs(); loadedAdminTabs.analytics = true; }
    if (tabName === 'tickets' && !loadedAdminTabs.tickets) { loadAdminTickets(); loadedAdminTabs.tickets = true; }
    if (tabName === 'achievements' && !loadedAdminTabs.achievements) { renderAdminAchievementsList(); loadedAdminTabs.achievements = true; }
    if (tabName === 'quiz' && !loadedAdminTabs.quiz) { loadAdminCustomQuestions(); loadedAdminTabs.quiz = true; }
    if (tabName === 'ehbed-quiz' && !loadedAdminTabs.ehbed) { loadAdminEhbedQuestions(); loadedAdminTabs.ehbed = true; }
    if (tabName === 'academy' && !loadedAdminTabs.academy) { loadAdminAcademyLessons(); loadedAdminTabs.academy = true; }
    if (tabName === 'notifs') { loadAdminNotificationsHistory(); }
    if (tabName === 'quotes') { if(typeof loadAdminQuotesList === 'function') loadAdminQuotesList(); }
    if (tabName === 'roles') { loadSubAdminsList(); } // 👈 سحب قائمة المساعدين

    if (tabName === 'academic') {
        db.ref('academic_tasks').once('value', (snap) => {
            const select = document.getElementById('adm-cd-task-link');
            if (!select) return;
            select.innerHTML = '<option value="none">بدون ربط (مؤقت عام)</option>';
            if (snap.exists()) {
                snap.forEach(c => { select.innerHTML += `<option value="${c.key}">تكليف: ${c.val().subject} - ${c.val().title}</option>`; });
            }
        });
    }

    if (tabName === 'science') { loadAdminScienceContent(); }
    if (tabName === 'guess-game') { loadAdminGuessCategories(); }
}

// ================= محرك إضافة وإزالة المساعدين (جديد) =================
const roleNamesAr = {
    'notifs': 'الإشعارات 🔔', 'quotes': 'الاقتباسات 📜', 'quiz': 'الكلاسيك 🧠', 'ehbed-quiz': 'اهبد صح 🔢',
    'risk-quiz': 'ريسك ⚡', 'levels-sys': 'المستويات 🗺️', 'science': 'المحتوى العلمي 📚',
    'academic': 'المنظم الأكاديمي 🎓', 'tickets': 'الشكاوى 📩', 'users': 'الطلاب 👥', 
    'analytics': 'الإحصائيات 📊', 'store': 'المتجر 🏷️', 'broadcast': 'رسائل البث 📢', 
    'books': 'روابط الكتب 📥', 'codes': 'الأكواد 🎁', 'achievements': 'الإنجازات 🎖️', 
    'guess-game': 'تخمين الصورة 📱', 'academy': 'أكاديمية الجودة 💼'
};

async function assignAdminRoles() {
    playClickSound();
    const idInput = document.getElementById('adm-role-id').value.trim();
    if (!idInput) return showTopToast('يرجى كتابة ID الطالب أولاً!', 'error');

    // تجميع الأقسام اللي انت علمت عليها صح
    const checkboxes = document.querySelectorAll('#adm-roles-checkboxes input[type="checkbox"]:checked');
    const selectedRoles = Array.from(checkboxes).map(cb => cb.value);

    showTopToast('جاري الفحص والحفظ... ⏳', 'info');

    try {
        // البحث عن المستخدم بالـ ID
        const snapshot = await db.ref('users').orderByChild('student_id').equalTo(Number(idInput)).once('value');
        if (!snapshot.exists()) return showTopToast('لم يتم العثور على طالب بهذا الـ ID!', 'error');

        let targetPhone = Object.keys(snapshot.val())[0];
        
        if (targetPhone === "01061032507") return showTopToast('لا يمكن تعديل صلاحيات المطور الأساسي!', 'error');

        if (selectedRoles.length === 0) {
            // سحب الصلاحيات لو مفيش ولا مربع متعلم
            await db.ref('users/' + targetPhone + '/admin_roles').remove();
            showTopToast('تم سحب جميع الصلاحيات من الطالب ورجوعه لحالة عادية', 'info');
        } else {
            // حفظ الصلاحيات المحددة
            await db.ref('users/' + targetPhone + '/admin_roles').set(selectedRoles);
            showTopToast('تم ترقية الطالب لمساعد وحفظ الصلاحيات بنجاح ✅', 'success');
        }
        
        // تفريغ الحقول وإعادة التحميل
        document.getElementById('adm-role-id').value = '';
        document.querySelectorAll('#adm-roles-checkboxes input[type="checkbox"]').forEach(cb => cb.checked = false);
        loadAdminData(true); // تحديث بيانات كل الطلاب
        setTimeout(loadSubAdminsList, 1000); // تحديث قائمة المساعدين

    } catch(err) {
        showTopToast('حدث خطأ في الاتصال!', 'error');
    }
}

function loadSubAdminsList() {
    const container = document.getElementById('admin-roles-list');
    if(!container) return;
    
    // بنسحب من الداتا اللي متحملة أصلاً في لوحة الأدمن
    if(adminAllUsersData.length === 0) {
         container.innerHTML = '<p style="text-align:center;">جاري جلب البيانات... اضغط تحديث من قائمة الطلاب.</p>';
         return;
    }

    // استخراج الطلاب اللي معاهم أي صلاحية أدمن ومخفيين من المطور
    const subAdmins = adminAllUsersData.filter(u => u.admin_roles && u.admin_roles.length > 0 && u.phone !== "01061032507");
    
    if (subAdmins.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:var(--text-sub);">لا يوجد مساعدين حالياً.</p>';
        return;
    }

    let html = '';
    subAdmins.forEach(admin => {
        // تحويل أسماء الصلاحيات الإنجليزية لعربي عشان تبقى واضحة
        const rolesAr = admin.admin_roles.map(r => roleNamesAr[r] || r).join('، '); 
        
        html += `
        <div class="admin-item-card" style="flex-direction: column; align-items: flex-start; gap: 8px; border-color: var(--accent-highlight);">
            <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                <span style="color: var(--accent-highlight); font-weight: 900; font-size: 0.95rem;">🛡️ ${admin.name}</span>
                <button class="admin-action-btn danger" style="padding: 3px 8px; font-size: 0.72rem;" onclick="removeSubAdmin('${admin.phone}')">سحب الصلاحيات ❌</button>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-sub);">ID: ${admin.student_id} | هاتف: ${admin.phone}</div>
            <div style="font-size: 0.8rem; color: var(--accent-gold); margin-top: 4px; line-height: 1.6; background: rgba(255,255,255,0.05); padding: 6px; border-radius: 8px; width: 100%;">
                <b>مسؤول عن:</b> ${rolesAr}
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

function removeSubAdmin(phone) {
    playErrorSound();
    if(confirm('هل أنت متأكد من سحب جميع الصلاحيات من هذا المساعد؟')) {
        db.ref('users/' + phone + '/admin_roles').remove().then(() => {
            showTopToast('تم إزالة المساعد ورجوعه لطالب عادي.', 'info');
            loadAdminData(true); 
            setTimeout(loadSubAdminsList, 1500);
        });
    }
}

    function populateAdminStoreInputs() {
        const select = document.getElementById('admin-store-item-select');
        if (!select) return;
        const itemId = select.value;
        const item = currentStoreConfig[itemId] || defaultStorePrices[itemId];

        document.getElementById('admin-store-price').value = item.price || 100;
        document.getElementById('admin-store-sale-price').value = item.salePrice !== undefined ? item.salePrice : '';
        document.getElementById('admin-store-badge-text').value = item.badgeText || '';
document.getElementById('admin-store-name').value = item.name || '';
    }

    function saveStorePriceSettings() {
        playClickSound();
        const itemId = document.getElementById('admin-store-item-select').value;
        const price = parseInt(document.getElementById('admin-store-price').value) || 100;
        const customName = document.getElementById('admin-store-name').value.trim();
        const salePrice = document.getElementById('admin-store-sale-price').value.trim();
        const badgeText = document.getElementById('admin-store-badge-text').value.trim();

        let itemData = {
            ...currentStoreConfig[itemId],
            price: price
        };

        if (customName !== '') itemData.name = customName;
        
        // حفظ سعر العرض والشارة
        if (salePrice !== '') itemData.salePrice = parseInt(salePrice);
        else itemData.salePrice = ''; // لإلغاء العرض القديم
        
        if (badgeText !== '') itemData.badgeText = badgeText;
        else itemData.badgeText = '';

        db.ref('store_config/' + itemId).update(itemData).then(() => {
            showTopToast('تم تحديث بيانات السلعة وعروض المتجر بنجاح! 🏷️✅', 'success');
        });
    }
// دالة جلب وعرض الأسئلة السحابية في لوحة التحكم
function loadAdminCustomQuestions() {
    const container = document.getElementById('admin-custom-questions-list');
    if (!container) return;

    db.ref('custom_questions').once('value', snap => {
        if (!snap.exists()) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-sub);">لا توجد أسئلة سحابية مضافة حتى الآن.</p>';
            return;
        }

        let html = '';
        snap.forEach(child => {
            const qData = child.val();
            const qId = child.key;
            
            // تعديل قوي لجلب الإجابة الصحيحة سواء كانت في مصفوفة أو كنص مباشر
            let correctAns = 'غير متوفر';
            if (qData.a && Array.isArray(qData.a) && qData.a.length > 0) {
                correctAns = qData.a[qData.correct || 0];
            } else if (qData.correct_answer) { // في حال تم حفظها كقيمة مباشرة مستقبلاً
                correctAns = qData.correct_answer;
            }

            html += `
            <div class="admin-item-card" style="flex-direction: column; align-items: flex-start; gap: 6px;">
                <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                    <span class="card-badge" style="background: rgba(212, 175, 55, 0.15); color: var(--accent-gold);">${qData.category || 'عام'}</span>
                    <button class="admin-action-btn danger" style="padding: 3px 8px; font-size: 0.72rem;" onclick="deleteCustomQuestion('${qId}')">حذف السؤال 🗑️</button>
                </div>
                <div style="font-size: 0.9rem; font-weight: 800; color: var(--text-main);">❓ ${qData.q}</div>
                <div style="font-size: 0.8rem; color: var(--accent-emerald); font-weight: 700;">✅ الإجابة الصحيحة: ${correctAns}</div>
            </div>`;
        });
        container.innerHTML = html;
    });
}

// دالة حذف سؤال سحابي محدد
function deleteCustomQuestion(qId) {
    playErrorSound();
    if (confirm('هل أنت متأكد من رغبتك في حذف هذا السؤال نهائياً من بنك الأسئلة؟')) {
        db.ref('custom_questions/' + qId).remove().then(() => {
            incrementQuestionsVersion('custom_questions'); // 👈 تحديث الفيرجن
            showTopToast('تم حذف السؤال بنجاح 🗑️', 'info');
            loadAdminCustomQuestions(); // تحديث القائمة أمامك
        });
    }
}

    function loadAdminData(forceRefresh = false) {
        const containerUsers = document.getElementById('admin-users-list');
        const cachedUsers = localStorage.getItem('cached_admin_users');

        // 1. لو مش ضاغط تحديث وموجود كاش محلي -> اقرأ من التليفون بصفر استهلاك
        if (!forceRefresh) {
            if (cachedUsers) {
                adminAllUsersData = JSON.parse(cachedUsers);
                renderAdminUsers(adminAllUsersData);
                isAdminDataLoaded = true;
            } else {
                containerUsers.innerHTML = `
                <div style="text-align: center; padding: 25px 10px;">
                    <p style="color: var(--text-sub); font-size: 0.85rem; margin-bottom: 12px;">قائمة الطلاب غير محملة محلياً (لتوفير الاستهلاك ⚡)</p>
                    <button class="btn-submit" style="padding: 8px 18px; width: auto; display: inline-block;" onclick="loadAdminData(true)">تحديث وتحميل الطلاب 🔄</button>
                </div>`;
            }

            const cachedCodes = localStorage.getItem('cached_admin_codes');
            if (cachedCodes) {
                renderAdminCodes(JSON.parse(cachedCodes));
            }
            return;
        }

        // 2. لو ضغطت على زرار التحديث يدوياً (forceRefresh = true) -> اسحب من الفايربيز
        containerUsers.innerHTML = '<p style="text-align: center; color: var(--text-sub);">جاري التحديث من السيرفر... ⏳</p>';
        showTopToast('جاري تحديث بيانات الطلاب...', 'info');

        db.ref('users').once('value').then((snap) => {
            adminAllUsersData = [];
            snap.forEach(child => { adminAllUsersData.push({ id: child.key, ...child.val() }); });
            adminAllUsersData.sort((a, b) => ((b.xp || b.points || 0) - (a.xp || a.points || 0)));
            
            // حفظ نسخة أوفلاين في جهازك
            localStorage.setItem('cached_admin_users', JSON.stringify(adminAllUsersData));
            renderAdminUsers(adminAllUsersData);
            isAdminDataLoaded = true;
            showTopToast('تم تحديث قائمة الطلاب بنجاح ✅', 'success');
        }).catch(() => {
            showTopToast('حدث خطأ أثناء تحميل بيانات الطلاب!', 'error');
        });

        // تحديث الأكواد أيضاً مع التحديث اليدوي
        db.ref('promo_codes').once('value').then((snap) => {
            let codesArr = [];
            snap.forEach(child => { codesArr.push({ code: child.key, ...child.val() }); });
            localStorage.setItem('cached_admin_codes', JSON.stringify(codesArr));
            renderAdminCodes(codesArr);
        });
    }

    function renderAdminUsers(usersArray) {
        const container = document.getElementById('admin-users-list');
        if(usersArray.length === 0) { container.innerHTML = '<p style="text-align: center;">لا يوجد طلاب.</p>'; return; }
        
        let html = '';
        usersArray.forEach(u => {
            const frameClass = u.active_frame && u.active_frame !== 'none' ? 'frame-' + u.active_frame : '';
            const hatHtml = getHatHtml(u.active_hat);
            html += `
            <div class="admin-item-card">
                <div class="avatar-box-wrapper" style="width: 40px; height: 40px; margin: 0;">
                    ${hatHtml}
                    <img src="${u.avatar || 'https://img.icons8.com/fluency/96/user-male.png'}" class="profile-avatar ${frameClass}" style="width: 100%; height: 100%;">
                </div>
                <div class="admin-item-info">
                    <div class="admin-item-name">${u.name} ${u.is_vip ? '👑' : ''}</div>
                    <div class="admin-item-sub">${u.phone} | ID: ${u.student_id || 'بدون'} | ${u.coins || 0} 💸</div>
                </div>
                <div style="display: flex; gap: 6px; flex-direction: column;">
                    <button class="admin-action-btn" style="padding: 4px 8px; font-size: 0.7rem; border-color: var(--accent-highlight); color: var(--accent-highlight);" onclick="openAdminUserDetails('${u.id}')">التفاصيل 👁️</button>
                    <button class="admin-action-btn" style="padding: 4px 8px; font-size: 0.7rem;" onclick="openEditPointsModal('${u.id}', '${u.name}', ${u.xp || u.points || 0}, ${u.coins || 0})">
                        تعديل ✏️
                    </button>
                </div>
            </div>`;
        });
        container.innerHTML = html;
    }

function openAdminUserDetails(userId) {
        playClickSound();
        const u = adminAllUsersData.find(user => user.id === userId);
        if(!u) return;

        document.getElementById('admin-det-avatar').src = u.avatar || 'https://img.icons8.com/fluency/96/user-male.png';
        document.getElementById('admin-det-name').innerText = u.name;
        document.getElementById('admin-det-phone').innerText = u.phone;
        document.getElementById('admin-det-email').innerText = u.email || 'غير مسجل';
        document.getElementById('admin-det-password').innerText = u.password || 'غير معروف';
        document.getElementById('admin-det-xp').innerText = (u.xp || u.points || 0) + ' XP';
        document.getElementById('admin-det-coins').innerText = (u.coins || 0);
        
        // استدعاء دالة الرتبة
        const rnk = typeof getUserRank === 'function' ? getUserRank(u.xp || u.points || 0) : 'طالب';
        document.getElementById('admin-det-rank').innerText = rnk;
        
        document.getElementById('admin-det-title').innerText = (u.active_title && u.active_title !== 'none') ? u.active_title : 'لا يوجد';
        
        document.getElementById('admin-det-logins').innerText = (u.total_login_days || 0) + ' يوم';
        document.getElementById('admin-det-streak').innerText = (u.daily_streak || 0) + ' 🔥';
        document.getElementById('admin-det-quiz').innerText = `${u.quizCorrect || 0} إجابة صح من ${(u.quizPlayed || 0) * 5}`;
        document.getElementById('admin-det-derby').innerText = (u.derby_wins || 0) + ' ⚔️';
        document.getElementById('admin-det-penalty').innerText = (u.penalties_scored || 0) + ' ⚽';

        openModal('modal-admin-user-details');
    }

    function filterAdminUsers() {
        const query = document.getElementById('admin-search-user').value.trim().toLowerCase();
        const filtered = adminAllUsersData.filter(u => 
            (u.name && u.name.toLowerCase().includes(query)) || 
            (u.phone && u.phone.includes(query)) || 
            (u.student_id && String(u.student_id).includes(query)) ||
            (u.email && u.email.toLowerCase().includes(query))
        );
        renderAdminUsers(filtered);
    }

    function openEditPointsModal(phone, name, currentPoints, currentCoins) {
        playClickSound();
        document.getElementById('edit-points-user-name').innerText = name;
        document.getElementById('edit-points-user-phone').value = phone;
        document.getElementById('edit-points-input').value = currentPoints;
        document.getElementById('edit-coins-input').value = currentCoins !== undefined ? currentCoins : 0;
        document.getElementById('edit-points-modal').classList.add('show');
    }

    function saveEditedUserBalance() {
        playClickSound();
        const phone = document.getElementById('edit-points-user-phone').value;
        const newPoints = parseInt(document.getElementById('edit-points-input').value) || 0;
        const newCoins = parseInt(document.getElementById('edit-coins-input').value) || 0;
        
        db.ref('users/' + phone).update({ 
            xp: newPoints, 
            points: newPoints,
            coins: newCoins
        }).then(() => {
            closeModal('edit-points-modal');
            showTopToast('تم تحديث رصيد الطالب بنجاح!', 'success');
            loadAdminData();
        });
    }

    function loadAdminTickets(forceRefresh = false) {
    const container = document.getElementById('admin-tickets-list');
    const cachedTickets = localStorage.getItem('cached_admin_tickets');

    if (cachedTickets && !forceRefresh) {
        renderAdminTicketsDOM(JSON.parse(cachedTickets), container);
    } else {
        if(forceRefresh) container.innerHTML = '<p style="text-align: center;">جاري التحديث...</p>';
        db.ref('user_tickets').once('value', (snap) => {
            let tickets = [];
            if(snap.exists()) {
                snap.forEach(child => { tickets.push({ id: child.key, ...child.val() }); });
            }
            localStorage.setItem('cached_admin_tickets', JSON.stringify(tickets));
            renderAdminTicketsDOM(tickets, container);
            if(forceRefresh) showTopToast('تم تحديث التذاكر بنجاح ✅', 'success');
        });
    }
}

function renderAdminTicketsDOM(ticketsArr, container) {
    if (ticketsArr.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-sub);">لا توجد شكاوى أو مقترحات واردة حالياً.</p>';
        return;
    }
    let html = '';
    ticketsArr.forEach(t => {
        html += `
        <div class="admin-item-card" style="flex-direction: column; align-items: flex-start; gap: 8px;">
            <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                <span class="card-badge" style="background: ${t.type === 'مشكلة' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(212, 175, 55, 0.2)'}; color: ${t.type === 'مشكلة' ? '#ef4444' : 'var(--accent-gold)'}; font-size: 0.75rem;">${t.type}</span>
                <span style="font-size: 0.75rem; color: var(--text-sub);">${new Date(t.sentAt).toLocaleDateString('ar-EG')}</span>
            </div>
            <h4 style="color: var(--text-main); font-size: 0.95rem;">${t.title}</h4>
            <p style="font-size: 0.85rem; color: var(--text-sub); line-height: 1.5;">${t.desc}</p>
            <div style="display: flex; justify-content: space-between; width: 100%; align-items: center; margin-top: 4px; border-top: 1px dashed var(--border-card); padding-top: 6px;">
                <span style="font-size: 0.75rem; color: var(--accent-gold);">من: ${t.senderName} (${t.senderPhone})</span>
                <button class="admin-action-btn danger" style="padding: 2px 8px; font-size: 0.7rem;" onclick="deleteTicket('${t.id}')">حذف 🗑️</button>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

function adminSendTicketReply(ticketId) {
    playClickSound();
    const input = document.getElementById(`admin-reply-input-${ticketId}`);
    const replyText = input ? input.value.trim() : '';

    if (!replyText) {
        showTopToast('يرجى كتابة نص الرد أولاً!', 'error');
        return;
    }

    db.ref('user_tickets/' + ticketId).update({
        reply: replyText,
        repliedAt: new Date().toISOString(),
        seen: false
    }).then(() => {
        showTopToast('تم إرسال الرد للطالب بنجاح! ✉️', 'success');
    });
}

    function deleteTicket(ticketId) {
        playErrorSound();
        if (confirm('هل تريد مسح هذا السجل؟')) {
            db.ref('user_tickets/' + ticketId).remove();
        }
    }

    function publishBroadcastAlert() {
        playClickSound();
        const title = document.getElementById('admin-broadcast-title').value.trim();
        const body = document.getElementById('admin-broadcast-body').value.trim();

        if (!title || !body) {
            showTopToast('يرجى كتابة العنوان ونص الرسالة أولاً!', 'error');
            return;
        }

        const broadcastData = {
            id: 'msg_' + Date.now(),
            title: title,
            body: body,
            active: true,
            publishedAt: new Date().toISOString()
        };

        db.ref('broadcast_message').set(broadcastData).then(() => {
            showTopToast('تم بث الرسالة بنجاح! ستظهر لجميع الطلاب عند فتح التطبيق 📢', 'success');
        });
    }

    function clearBroadcastAlert() {
        playErrorSound();
        if (confirm('هل تريد إلغاء الرسالة المنبثقة الحالية؟')) {
            db.ref('broadcast_message').remove().then(() => {
                document.getElementById('admin-broadcast-title').value = '';
                document.getElementById('admin-broadcast-body').value = '';
                showTopToast('تم حذف رسالة البث الحالية بنجاح.');
            });
        }
    }

    function saveBookDriveLink() {
        playClickSound();
        const subject = document.getElementById('admin-book-subject').value;
        const type = document.getElementById('admin-book-type').value;
        const url = document.getElementById('admin-book-url').value.trim();

        if (!url) {
            showTopToast('يرجى وضع رابط Google Drive للملف أولاً!', 'error');
            return;
        }

        const safeKey = getSafeSubjectKey(subject);
        db.ref(`subject_files/${safeKey}/${type}`).set(url).then(() => {
            document.getElementById('admin-book-url').value = '';
            showTopToast(`تم تحديث وتثبيت رابط (${subject} - ${type === 'theory' ? 'النظري' : 'العملي'}) بنجاح!`, 'success');
        });
    }

    function saveNewCloudQuestion() {
    playClickSound();
    const cat = document.getElementById('admin-new-q-cat').value.trim() || 'عام';
    const qText = document.getElementById('admin-new-q-text').value.trim();
    const correctAns = document.getElementById('admin-new-q-correct').value.trim();
    const opt1 = document.getElementById('admin-new-q-opt1').value.trim();
    const opt2 = document.getElementById('admin-new-q-opt2').value.trim();
    const opt3 = document.getElementById('admin-new-q-opt3').value.trim();

    if (!qText || !correctAns || !opt1 || !opt2 || !opt3) {
        showTopToast('يرجى كتابة نص السؤال وجميع الخيارات الأربعة كاملة!', 'error');
        return;
    }

    const newQData = {
        category: cat,
        q: qText,
        a: [correctAns, opt1, opt2, opt3],
        correct: 0,
        createdAt: new Date().toISOString()
    };

    db.ref('custom_questions').push(newQData).then(() => {
        document.getElementById('admin-new-q-text').value = '';
        document.getElementById('admin-new-q-correct').value = '';
        document.getElementById('admin-new-q-opt1').value = '';
        document.getElementById('admin-new-q-opt2').value = '';
        document.getElementById('admin-new-q-opt3').value = '';
        
        incrementQuestionsVersion('custom_questions'); // 👈 تحديث الفيرجن
        showTopToast('تمت إضافة السؤال بنجاح إلى بنك الأسئلة باللعبة! 🧠✨', 'success');
    });
}

    function uploadBulkQuestions() {
    playClickSound();
    const rawText = document.getElementById('admin-bulk-quiz-input').value.trim();
    if (!rawText) {
        showTopToast('يرجى لصق الأسئلة أولاً بالصيغة الموضحة!', 'error');
        return;
    }

    const lines = rawText.split('\n');
    let addedCount = 0;
    const updates = {};

    lines.forEach(line => {
        const parts = line.split('#').map(p => p.trim());
        if (parts.length === 6) {
            const [cat, qText, correct, opt1, opt2, opt3] = parts;
            const newKey = db.ref('custom_questions').push().key;
            updates[newKey] = {
                category: cat || 'عام',
                q: qText,
                a: [correct, opt1, opt2, opt3],
                correct: 0,
                createdAt: new Date().toISOString()
            };
            addedCount++;
        }
    });

    if (addedCount === 0) {
        showTopToast('تأكد من كتابة الأسئلة وفصلها بـ 6 خانات بعلامة (#)', 'error');
        return;
    }

    db.ref('custom_questions').update(updates).then(() => {
        document.getElementById('admin-bulk-quiz-input').value = '';
        incrementQuestionsVersion('custom_questions'); // 👈 تحديث الفيرجن
        playSuccessSound();
        showTopToast(`تم رفع (${addedCount}) سؤال بنجاح إلى السحابة! 🧠✨`, 'success');
    });
}

    // 1. إنشاء الكود بمواصفاته الجديدة
function createNewPromoCode() {
    playClickSound();
    let codeName = document.getElementById('admin-new-code').value.trim().toUpperCase();
    let codeVal = parseInt(document.getElementById('admin-new-code-pts').value);
    let rewardType = document.getElementById('admin-code-type').value; // 'xp' أو 'coins'
    let scopeType = document.getElementById('admin-code-scope').value; // 'single' أو 'global'

    if (!codeName || !codeVal || codeVal <= 0) {
        showTopToast('يرجى كتابة اسم الكود والقيمة بشكل صحيح!', 'error');
        return;
    }

    db.ref('promo_codes/' + codeName).once('value').then(snap => {
        if (snap.exists()) {
            showTopToast('هذا الكود موجود بالفعل في النظام!', 'error');
        } else {
            const newCodeData = {
                amount: codeVal,
                type: rewardType,
                scope: scopeType,
                used: false, // للكود الفردي
                usedByList: {}, // للكود الجماعي: يسجل هواتف كل من شحن الكود
                createdAt: new Date().toISOString()
            };

            db.ref('promo_codes/' + codeName).set(newCodeData).then(() => {
                document.getElementById('admin-new-code').value = '';
                document.getElementById('admin-new-code-pts').value = '';
                showTopToast(`تم إنشاء الكود [${codeName}] بنجاح! 🎁✨`, 'success');
                loadAdminData();
            });
        }
    });
}

// 2. عرض الأكواد في لوحة التحكم مع توضيح نوع المكافأة وطبيعتها
function renderAdminCodes(codesArray) {
    const container = document.getElementById('admin-codes-list');
    if (codesArray.length === 0) {
        container.innerHTML = '<p style="text-align: center;">لا توجد أكواد.</p>';
        return;
    }
    
    let html = '';
    codesArray.forEach(c => {
        const isGlobal = c.scope === 'global';
        const isXp = c.type !== 'coins';
        const valText = `${c.amount || c.points || 50} ${isXp ? 'XP ⚡' : 'عملة 💸'}`;

        let statusClass = 'admin-status-active';
        let statusText = isGlobal ? '👥 جماعي متاح' : '👤 فردي متاح';

        if (!isGlobal && c.used) {
            statusClass = 'admin-status-used';
            statusText = 'مُستخدم (منتهي)';
        }

        let usageDetails = '';
        if (isGlobal) {
            const count = c.usedByList ? Object.keys(c.usedByList).length : 0;
            usageDetails = `<span style="font-size: 0.72rem; color: var(--accent-gold); display:block;">عدد المستفيدين: ${count} طالب</span>`;
        } else if (c.used) {
            usageDetails = `<span style="font-size: 0.7rem; color: var(--text-sub); display:block;">استخدمه: ${c.usedByName || c.usedBy}</span>`;
        }
        
        html += `
        <div class="admin-item-card">
            <div class="admin-item-info">
                <div class="admin-item-name" style="color: var(--accent-gold); letter-spacing: 1px;">${c.code}</div>
                <div class="admin-item-sub" style="direction: rtl;">المكافأة: ${valText}</div>
                ${usageDetails}
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                <span class="admin-status-badge ${statusClass}">${statusText}</span>
                <button class="admin-action-btn danger" style="padding: 4px 8px; font-size: 0.75rem;" onclick="deletePromoCode('${c.code}')">حذف 🗑️</button>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

    function deletePromoCode(codeName) {
        playErrorSound();
        if(confirm(`هل أنت متأكد من حذف الكود ${codeName} نهائياً؟`)) {
            db.ref('promo_codes/' + codeName).remove().then(() => {
                loadAdminData();
            });
        }
    }
// مستمع سحابي يفحص وجود ردود جديدة على شكاوى ومقترحات الطالب الحالي
// مستمع سحابي ذكي لفحص الردود والتنبيه بالنقطة الحمراء
function initUserTicketRepliesListener() {
    if (!currentUser) return;

    // السر هنا: جلب الشكاوى الخاصة برقم الطالب الحالي فقط بدل الدفعة كلها!
    db.ref('user_tickets').orderByChild('senderPhone').equalTo(currentUser.phone).once('value', (snap) => {
        if (!snap.exists()) return;

        let hasUnseenReportReply = false;
        let hasUnseenSuggestReply = false;
        let myReports = [];
        let mySuggests = [];

        snap.forEach(child => {
            const t = child.val();
            t.id = child.key;

            if (t.type === 'مشكلة') {
                myReports.push(t);
                if (t.reply && t.seen !== true) hasUnseenReportReply = true;
            } else if (t.type === 'اقتراح') {
                mySuggests.push(t);
                if (t.reply && t.seen !== true) hasUnseenSuggestReply = true;
            }
        });

        // 1. التحكم في النقطة الحمراء عند زر الإعدادات
        const settingsDot = document.getElementById('badge-settings-dot');
        if (settingsDot) settingsDot.style.display = (hasUnseenReportReply || hasUnseenSuggestReply) ? 'inline-block' : 'none';

        // 2. التحكم في النقطة الحمراء داخل الإعدادات
        const reportDot = document.getElementById('badge-report-dot');
        if (reportDot) reportDot.style.display = hasUnseenReportReply ? 'inline-block' : 'none';

        const suggestDot = document.getElementById('badge-suggest-dot');
        if (suggestDot) suggestDot.style.display = hasUnseenSuggestReply ? 'inline-block' : 'none';

        // 3. عرض قائمة الردود للطالب
        renderUserRepliesList('report', myReports);
        renderUserRepliesList('suggest', mySuggests);
    });
}

function renderUserRepliesList(type, ticketsList) {
    const sec = document.getElementById(`my-${type}-replies-section`);
    const list = document.getElementById(`my-${type}-replies-list`);
    if (!sec || !list) return;

    const ticketsWithReplies = ticketsList.filter(t => t.reply);

    if (ticketsWithReplies.length === 0) {
        sec.style.display = 'none';
        return;
    }

    sec.style.display = 'block';
    let html = '';

    ticketsWithReplies.forEach(t => {
        html += `
        <div class="acad-glass-card" style="margin-bottom: 10px; padding: 14px; background: rgba(255, 255, 255, 0.95); border: 1.5px solid var(--accent-emerald); border-radius: 16px;">
            <div style="font-size: 0.82rem; font-weight: 800; color: #0f172a; margin-bottom: 4px;">📌 عنوانك: ${t.title}</div>
            <p style="font-size: 0.78rem; color: #475569; margin-bottom: 8px; font-weight: 600;">رسالتك: "${t.desc}"</p>
            <div style="background: #e0f2fe; border: 1px solid #bae6fd; border-radius: 12px; padding: 10px 12px;">
                <div style="font-size: 0.78rem; font-weight: 900; color: #0369a1; margin-bottom: 3px;">رد الإدارة والمطور 👨‍💻:</div>
                <div style="font-size: 0.86rem; color: #0f172a; font-weight: 800; line-height: 1.5;">${t.reply}</div>
            </div>
        </div>`;
    });

    list.innerHTML = html;
}

function markTicketRepliesAsSeen(type) {
    if (!currentUser) return;
    // تم التعديل: سحب شكاوى الطالب فقط بدلاً من سحب الداتا بالكامل
    db.ref('user_tickets').orderByChild('senderPhone').equalTo(currentUser.phone).once('value', (snap) => {
        if (!snap.exists()) return;
        snap.forEach(child => {
            const t = child.val();
            if (t.type === (type === 'report' ? 'مشكلة' : 'اقتراح')) {
                if (t.reply && t.seen !== true) {
                    db.ref(`user_tickets/${child.key}/seen`).set(true);
                }
            }
        });
    });
}
// ================= منظومة المؤقتات التنازلية التفاعلية =================
    let appCountdownsList = [];
    let countdownTicker = null;

    function listenToCountdowns() {
    // الكاش للمؤقتات
    const localCD = localStorage.getItem('local_countdowns');
    if(localCD) { 
        appCountdownsList = JSON.parse(localCD); 
        renderHomeCountdowns(); 
        renderAdminCountdowns(); 
    }

    db.ref('app_countdowns').once('value', (snap) => {
        appCountdownsList = [];
        if (snap.exists()) {
            snap.forEach(c => { appCountdownsList.push({ id: c.key, ...c.val() }); });
        }
        localStorage.setItem('local_countdowns', JSON.stringify(appCountdownsList));
        renderHomeCountdowns();
        renderAdminCountdowns();
    });

}

function renderHomeCountdowns() {
        const wrapper = document.getElementById('home-countdowns-wrapper');
        const container = document.getElementById('home-countdowns-container');
        const indicatorBar = document.getElementById('countdowns-indicator-bar');
        if (!wrapper || !container) return;

        const myCompletedTasks = (currentUser && currentUser.completed_tasks) ? currentUser.completed_tasks : [];
        const now = Date.now();

        const visibleCountdowns = appCountdownsList.filter(cd => {
            const isExpired = new Date(cd.targetDate).getTime() <= now;
            if (isExpired) return false;
            
            if (cd.linkedTaskId && cd.linkedTaskId !== 'none') {
                if (myCompletedTasks.includes(cd.linkedTaskId)) return false;
            }
            return true;
        });

        if (visibleCountdowns.length === 0) {
            wrapper.style.display = 'none';
            if (countdownTicker) clearInterval(countdownTicker);
            return;
        }

        wrapper.style.display = 'block';
        let html = '';

        visibleCountdowns.forEach(cd => {
            const tag = (cd.linkedTaskId && cd.linkedTaskId !== 'none') ? '📝 تكليف' : '🎯 حدث عام';
            html += `
            <div class="countdown-card" id="cd-card-${cd.id}">
                <div class="countdown-header">
                    <span class="countdown-title">⏳ ${cd.title}</span>
                    <span class="countdown-tag">${tag}</span>
                </div>
                <div class="countdown-timer-grid" data-target="${cd.targetDate}">
                    <div class="timer-unit-box"><div class="timer-unit-val cd-days">00</div><div class="timer-unit-label">يوم</div></div>
                    <div class="timer-unit-box"><div class="timer-unit-val cd-hours">00</div><div class="timer-unit-label">ساعة</div></div>
                    <div class="timer-unit-box"><div class="timer-unit-val cd-mins">00</div><div class="timer-unit-label">دقيقة</div></div>
                    <div class="timer-unit-box"><div class="timer-unit-val cd-secs">00</div><div class="timer-unit-label">ثانية</div></div>
                </div>
            </div>`;
        });

        container.innerHTML = html;

        // إظهار سهم وتلميح التمرير والنقاط إذا وجد أكثر من مؤقت
        if (indicatorBar) {
            if (visibleCountdowns.length > 1) {
                let dotsHtml = '<div class="cd-scroll-hint"><span>اسحب لرؤية المزيد</span> <span>←</span></div>';
                dotsHtml += '<div style="display: flex; gap: 4px; align-items: center;">';
                for (let i = 0; i < visibleCountdowns.length; i++) {
                    dotsHtml += `<span class="cd-dot ${i === 0 ? 'active' : ''}" id="cd-dot-${i}"></span>`;
                }
                dotsHtml += '</div>';
                indicatorBar.innerHTML = dotsHtml;
                indicatorBar.style.display = 'flex';
            } else {
                indicatorBar.innerHTML = '';
                indicatorBar.style.display = 'none';
            }
        }

        startCountdownTicker();
    }

    function updateCountdownDots() {
        const container = document.getElementById('home-countdowns-container');
        if (!container) return;
        const scrollPos = Math.abs(container.scrollLeft);
        const cardWidth = container.offsetWidth; // الحساب على العرض الكامل 100%
        const activeIndex = Math.round(scrollPos / cardWidth);

        document.querySelectorAll('.cd-dot').forEach((dot, idx) => {
            dot.classList.toggle('active', idx === activeIndex);
        });
    }
    function startCountdownTicker() {
        if (countdownTicker) clearInterval(countdownTicker);
        
        function update() {
            const now = Date.now();
            document.querySelectorAll('.countdown-timer-grid').forEach(grid => {
                const targetTime = new Date(grid.getAttribute('data-target')).getTime();
                const diff = targetTime - now;

                if (diff <= 0) {
                    renderHomeCountdowns();
                    return;
                }

                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const secs = Math.floor((diff % (1000 * 60)) / 1000);

                grid.querySelector('.cd-days').innerText = String(days).padStart(2, '0');
                grid.querySelector('.cd-hours').innerText = String(hours).padStart(2, '0');
                grid.querySelector('.cd-mins').innerText = String(mins).padStart(2, '0');
                grid.querySelector('.cd-secs').innerText = String(secs).padStart(2, '0');
            });
        }

        update();
        countdownTicker = setInterval(update, 1000);
    }

    function adminPublishCountdown() {
        playClickSound();
        const title = document.getElementById('adm-cd-title').value.trim();
        const targetDate = document.getElementById('adm-cd-target').value;
        const linkedTaskId = document.getElementById('adm-cd-task-link').value;

        if (!title || !targetDate) {
            showTopToast('يرجى إدخال عنوان المؤقت والموعد المحدد!', 'error');
            return;
        }

        db.ref('app_countdowns').push({
            title,
            targetDate,
            linkedTaskId,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        }).then(() => {
            showTopToast('تم نشر المؤقت التنازلي بنجاح ⏱️🚀', 'success');
            document.getElementById('adm-cd-title').value = '';
            document.getElementById('adm-cd-target').value = '';
        });
    }

    function renderAdminCountdowns() {
        const list = document.getElementById('adm-countdowns-list');
        if (!list) return;
        
        if (appCountdownsList.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: var(--text-sub); font-size: 0.8rem;">لا توجد مؤقتات نشطة.</p>';
            return;
        }

        let html = '';
        appCountdownsList.forEach(cd => {
            html += `
            <div class="admin-item-card" style="padding: 8px 12px;">
                <div class="admin-item-info">
                    <div class="admin-item-name" style="font-size: 0.88rem;">⏱️ ${cd.title}</div>
                    <div class="admin-item-sub" style="font-size: 0.72rem;">${new Date(cd.targetDate).toLocaleString('ar-EG')}</div>
                </div>
                <button class="admin-action-btn danger" style="padding: 4px 8px; font-size: 0.75rem;" onclick="adminDeleteCountdown('${cd.id}')">حذف 🗑️</button>
            </div>`;
        });
        list.innerHTML = html;
    }

    function adminDeleteCountdown(id) {
        if (confirm('هل تريد حذف هذا المؤقت؟')) {
            db.ref('app_countdowns/' + id).remove().then(() => {
                showTopToast('تم حذف المؤقت بنجاح.', 'info');
            });
        }
    }
// ================= محرك ركلات الجزاء والمؤثرات السينمائية =================
    let selectedPenaltyStriker = { id: 'messi', name: 'ليونيل ميسي', img: '' };
    let penaltyQuestionsDeck = [];
    let currentPenaltyQIndex = 0;
    let penaltyCorrectAnswersCount = 0;
    let penaltyTimer = null;
    let penaltyTimeLeft = 15;
    let isPenaltyAnswerLocked = false;
    let crowdAudioCtx = null;
    let crowdNoiseNode = null;

    // توليد صوت هتاف الجماهير الواقعي المستمر أثناء الأسئلة
    function startStadiumCrowdAudio() {
        try {
            stopStadiumCrowdAudio();
            crowdAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const bufferSize = crowdAudioCtx.sampleRate * 2;
            const buffer = crowdAudioCtx.createBuffer(1, bufferSize, crowdAudioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            crowdNoiseNode = crowdAudioCtx.createBufferSource();
            crowdNoiseNode.buffer = buffer;
            crowdNoiseNode.loop = true;

            const filter = crowdAudioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 450;
            filter.Q.value = 1.2;

            const gain = crowdAudioCtx.createGain();
            gain.gain.setValueAtTime(0.06, crowdAudioCtx.currentTime); // صوت ناعم غير مزعج

            crowdNoiseNode.connect(filter);
            filter.connect(gain);
            gain.connect(crowdAudioCtx.destination);
            crowdNoiseNode.start();
        } catch(e) {}
    }

    function stopStadiumCrowdAudio() {
        try {
            if (crowdNoiseNode) {
                crowdNoiseNode.stop();
                crowdNoiseNode.disconnect();
                crowdNoiseNode = null;
            }
            if (crowdAudioCtx) {
                crowdAudioCtx.close();
                crowdAudioCtx = null;
            }
        } catch(e) {}
    }

    function playStadiumSFX(type) {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            if (type === 'kick') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(160, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.25);
                gain.gain.setValueAtTime(1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.25);
            } else if (type === 'post_hit') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(650, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.4);
                gain.gain.setValueAtTime(0.85, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.4);
            }
        } catch(e) {}
    }

    function launchPenaltyMode(strikerId, strikerName, strikerImg) {
    playClickSound();

    // حفظ بيانات اللاعب المختار
    selectedPenaltyStriker = { id: strikerId, name: strikerName, img: strikerImg };

    // تفعيل حالة اللعبة كزعيم ركلات جزاء
    isPenaltyGameActive = true; 
    penaltyCorrectAnswersCount = 0;
    
    // سحب أسئلة الزعيم المجهزة مسبقاً (الخاصة بالمستوى الحالي)
    penaltyQuestionsDeck = [...bossQuestionsDeck]; 
    currentPenaltyQIndex = 0;

    // تطبيق صورة واسم النجم المختار على الواجهة
    const strikerImgEl = document.getElementById('penalty-striker-img');
    const strikerNameEl = document.getElementById('penalty-striker-name');
    if (strikerImgEl) strikerImgEl.src = strikerImg;
    if (strikerNameEl) strikerNameEl.innerText = strikerName;

    resetPenaltyStadiumActors(); 
    startStadiumCrowdAudio();
    
    // الدخول لساحة المعركة
    navigateTo('view-penalty-arena', `زعيم المستوى ${currentLevelPlaying}`, `تسديدة ${strikerName}`);
    renderPenaltyQuestion(); 
}

    function resetPenaltyStadiumActors() {
        const ball = document.getElementById('penalty-soccer-ball');
        const keeper = document.getElementById('penalty-goalkeeper');
        const striker = document.getElementById('penalty-striker-actor');
        const net = document.getElementById('penalty-goal-net');
        const qCard = document.getElementById('penalty-q-card');
        const cinemaModal = document.getElementById('penalty-cinema-modal');

        if (ball) ball.className = 'soccer-ball-element';
        if (keeper) {
            keeper.className = 'goalkeeper-actor';
            keeper.innerText = '🧤';
        }
        if (striker) striker.className = 'striker-player-actor';
        if (net) net.className = 'goal-post-container';
        if (qCard) qCard.classList.remove('hidden-for-kick');
        if (cinemaModal) cinemaModal.classList.remove('show');
    }

    function renderPenaltyQuestion() {
    isPenaltyAnswerLocked = false;
    
    // تأمين لو بنك أسئلة الزعيم فاضي للمستوى ده
    if (!penaltyQuestionsDeck || penaltyQuestionsDeck.length === 0) {
        penaltyQuestionsDeck = [
            { q: "ما هي عاصمة مصر؟", a: ["القاهرة", "الإسكندرية", "الجيزة", "أسوان"], correct: 0, categoryName: "عام" },
            { q: "ما هو العنصر الأكثر وفرة في الغلاف الجوي؟", a: ["النيتروجين", "الأكسجين", "ثاني أكسيد الكربون", "الهيدروجين"], correct: 0, categoryName: "عام" },
            { q: "كم عدد عظام جسم الإنسان البالغ؟", a: ["206", "180", "250", "300"], correct: 0, categoryName: "عام" },
            { q: "ما هو الكوكب الأقرب للشمس؟", a: ["عطارد", "الزهرة", "المريخ", "المشتري"], correct: 0, categoryName: "عام" },
            { q: "أي من الآتي يعتبر خطراً بيولوجياً في الهاسب؟", a: ["السالمونيلا", "شظايا الزجاج", "بقايا المنظفات", "المسامير"], correct: 0, categoryName: "عام" }
        ];
    }

    const qData = penaltyQuestionsDeck[currentPenaltyQIndex];
    if (!qData || currentPenaltyQIndex >= 5) { // هنا بنتأكد انه بيلعب 5 اسئلة
        triggerPenaltyShootoutCinematic();
        return;
    }

    // استخراج النص والخيارات بشكل سليم ودقيق 100%
    const questionText = qData.q || "سؤال زعيم ركلات الجزاء";
    const optionsArray = qData.a || ["خيار 1", "خيار 2", "خيار 3", "خيار 4"];
    const correctIdx = qData.correct !== undefined ? qData.correct : 0;
    const correctText = optionsArray[correctIdx];

    // إظهار رقم السؤال
    document.getElementById('penalty-q-counter').innerText = `السؤال ${currentPenaltyQIndex + 1} من 5`;
    
    // إظهار نص السؤال
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

    function startPenaltyQuestionTimer() {
        clearInterval(penaltyTimer);
        penaltyTimeLeft = 15;
        const timerPill = document.getElementById('penalty-timer-pill');
        timerPill.innerText = `⏱️ ${penaltyTimeLeft}ث`;

        penaltyTimer = setInterval(() => {
            penaltyTimeLeft--;
            timerPill.innerText = `⏱️ ${penaltyTimeLeft}ث`;
            if (penaltyTimeLeft <= 0) {
                clearInterval(penaltyTimer);
                handlePenaltyAnswerClick(null, '', 'TIMEOUT');
            }
        }, 1000);
    }

    function handlePenaltyAnswerClick(btn, selected, correct) {
        if (isPenaltyAnswerLocked) return;
        isPenaltyAnswerLocked = true;
        clearInterval(penaltyTimer);

        const isCorrect = (selected === correct);
        if (isCorrect) {
            penaltyCorrectAnswersCount++;
            playSuccessSound();
            if (btn) btn.classList.add('correct-choice');
        } else {
            playErrorSound();
            if (btn) btn.classList.add('wrong-choice');
        }

        document.querySelectorAll('#penalty-options-box .quiz-option-btn').forEach(b => b.disabled = true);

        setTimeout(() => {
            currentPenaltyQIndex++;
            if (currentPenaltyQIndex < 5) {
                renderPenaltyQuestion();
            } else {
                triggerPenaltyShootoutCinematic();
            }
        }, 1000);
    }

    // دالة لتشغيل صوت المعلق وهتاف الجووول الحماسي
    function playGoalCommentatorAudio(strikerName) {
        try {
            // 1. تشغيل صوت صرخة جوووول وهتاف الملعب
            const goalAudio = new Audio('https://actions.google.com/sounds/v1/sports/football_match_crowd_cheer.ogg');
            goalAudio.volume = 0.9;
            goalAudio.play().catch(e => {});

            // 2. تعليق صوتي فوري ينطق اسم اللاعب
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(`جوووووووووول! هدف رائع من ${strikerName}`);
                utterance.lang = 'ar-SA';
                utterance.rate = 1.05;
                utterance.pitch = 1.2;
                window.speechSynthesis.speak(utterance);
            }
        } catch(e) {}
    }

    // دالة تشغيل صوت تعليق هدف ميسي
    function playMessiCustomAudio() {
        try {
            const messiAudio = new Audio('messi_goal.mp3');
            messiAudio.volume = 1.0;
            messiAudio.play().catch(e => console.log('Audio playback error:', e));
        } catch (e) {}
    }

    // دالة ديناميكية لتشغيل صوت تعليق الهدف حسب النجم المختار
    function playCustomGoalAudio(strikerId) {
        try {
            // يشغل تلقائياً: messi_goal.mp3 أو ronaldo_goal.mp3 أو salah_goal.mp3
            const audio = new Audio(`${strikerId}_goal.mp3`);
            audio.volume = 1.0;
            audio.play().catch(e => console.log('Goal audio error:', e));
        } catch (e) {}
    }

    function triggerPenaltyShootoutCinematic() {
    clearInterval(penaltyTimer);
    const stadium = document.getElementById('penalty-stadium-box');
    const qCard = document.getElementById('penalty-q-card');
    const ball = document.getElementById('penalty-soccer-ball');
    const striker = document.getElementById('penalty-striker-actor');
    const keeper = document.getElementById('penalty-goalkeeper');
    const net = document.getElementById('penalty-goal-net');

    if (qCard) qCard.classList.add('hidden-for-kick');

    const isGoalScored = (penaltyCorrectAnswersCount >= 4);

    if (isGoalScored) {
        playCustomGoalAudio(selectedPenaltyStriker.id);
    }

    setTimeout(() => {
        if (striker) striker.classList.add('run-to-kick');
    }, 400);

    setTimeout(() => {
        playStadiumSFX('kick');
        if (stadium) {
            stadium.classList.add('camera-shake-screen');
            setTimeout(() => stadium.classList.remove('camera-shake-screen'), 350);
        }

        if (isGoalScored) {
            const isRight = Math.random() > 0.5;
            ball.classList.add(isRight ? 'kick-top-right' : 'kick-top-left');
            keeper.classList.add('dive-wrong');

            setTimeout(() => {
                if (net) net.classList.add('net-shake');
                if (striker) striker.classList.add('celebrate');
                shootStars();
                triggerConfetti();
            }, 750);
        } else {
            ball.classList.add('kick-saved');
            keeper.classList.add('save-left');

            setTimeout(() => {
                playStadiumSFX('post_hit');
                keeper.innerText = '🛡️';
                playErrorSound();
            }, 750);
        }
    }, 850);

    const resultDelay = isGoalScored ? 5500 : 2500;

    // توجيه دقيق بدون تكرار
    setTimeout(() => {
        stopStadiumCrowdAudio();
        if (isLevelBossActive) {
            concludeLevelBoss(isGoalScored);
        } else {
            concludePenaltyGame(isGoalScored);
        }
    }, resultDelay);
}

function concludeLevelBoss(isWin) {
    isLevelBossActive = false;
    isPenaltyGameActive = false;
    clearInterval(bombTimer);
    stopStadiumCrowdAudio();
    
    // إخفاء أي واجهات منبثقة تخص ركلات الجزاء فوراً حتى لا تعلق الشاشة
    const cinemaModal = document.getElementById('penalty-cinema-modal');
    if (cinemaModal) cinemaModal.classList.remove('show');
    
    let userLevels = currentUser.levels_progress || {};
    let oldData = userLevels[currentLevelPlaying] || { stars: 0, boss_defeated: false, cooldown: 0 };
    
    let updatedStars = Math.max(oldData.stars, currentLevelStarsEarned);

    if (isWin) {
        let rewards = getLevelRewards(currentLevelPlaying);
        userLevels[currentLevelPlaying] = { stars: updatedStars, boss_defeated: true, cooldown: 0 };
        
        currentUser.xp = (currentUser.xp || 0) + rewards.xp;
        currentUser.points = currentUser.xp;
        currentUser.coins = (currentUser.coins || 0) + rewards.coins;

        db.ref('users/' + currentUser.phone).update({
            levels_progress: userLevels,
            xp: currentUser.xp,
            points: currentUser.xp,
            coins: currentUser.coins
        }).then(() => {
            updateProfileUI();
            goHomeDirectly(true);
            showTopToast(`أسطورة! تم تدمير الزعيم بنجاح 🏆 (+${rewards.xp} XP و +${rewards.coins} عملة)`, 'success');
            setTimeout(() => { openLevelsMap(); triggerConfetti(); }, 500);
        });

    } else {
        // الخسارة والعقوبة الفورية
        let cooldownTime = Date.now() + ((globalBossConfig.cooldownHours || 12) * 60 * 60 * 1000);
        userLevels[currentLevelPlaying] = { stars: updatedStars, boss_defeated: oldData.boss_defeated, cooldown: cooldownTime };
        
        db.ref('users/' + currentUser.phone + '/levels_progress').set(userLevels).then(() => {
            goHomeDirectly(true); // الخروج فوراً للشاشة الرئيسية وإغلاق اللعب
            showTopToast(`تم هزيمتك أمام الزعيم! تم قفل المستوى للراحة ❌`, 'error');
            setTimeout(() => { openLevelsMap(); }, 500); // فتح الخريطة لتظهر علامة القفل
        });
    }
}

    function concludePenaltyGame(isGoal) {
        isPenaltyGameActive = false;
        const cinemaModal = document.getElementById('penalty-cinema-modal');
        const imgEl = document.getElementById('penalty-result-img');
        const titleEl = document.getElementById('penalty-result-title');
        const subEl = document.getElementById('penalty-result-subtitle');
        const rewardEl = document.getElementById('penalty-rewards-badge');

        let xpChange = 0;
        let coinsChange = 0;

        if (isGoal) {
            xpChange = 50;
            coinsChange = 15;

            const isDoubleActive = currentUser && currentUser.double_xp_until && currentUser.double_xp_until > Date.now();
            if (isDoubleActive) {
                xpChange = xpChange * 2;
            }
recordUserTransaction(isGoal ? `هدف ركلة جزاء باللاعب ${selectedPenaltyStriker.name}` : `إهدار ركلة جزاء باللاعب ${selectedPenaltyStriker.name}`, xpChange, coinsChange, isGoal ? 'penalty_game' : 'penalty');

            if (imgEl) imgEl.src = 'https://img.icons8.com/fluency/96/goal.png';
            titleEl.innerText = 'GOOOAAAL! 🎯';
            titleEl.style.color = '#ffd700';
            subEl.innerHTML = `سددها <b>${selectedPenaltyStriker.name}</b> صاروخ في المقص!<br>جاوبت ${penaltyCorrectAnswersCount} من 5 أسئلة صح وحققت الفوز! 🏆`;
rewardEl.innerHTML = `
    <div style="font-weight: 800; margin-bottom: 6px; color: var(--accent-gold);">🏆 المكافآت المستحقة:</div>
    <div style="display: flex; flex-direction: column; gap: 4px; font-weight: 700;">
        <span style="color: #10b981; font-size: 1.05rem;">+${xpChange} XP ⚡</span>
        <span style="color: #ffd700; font-size: 1.05rem;">+${coinsChange} عملة 💸</span>
        <span style="color: var(--text-sub); font-size: 0.85rem;">+1 هدف ركلة جزاء ⚽</span>
    </div>
`;        } else {
            xpChange = -15;
            coinsChange = 0;

            if (imgEl) imgEl.src = 'https://img.icons8.com/fluency/96/cancel.png';
            titleEl.innerText = 'أهدرت ركلة الجزاء!';
            titleEl.style.color = '#ef4444';
            subEl.innerHTML = `أجبت ${penaltyCorrectAnswersCount} فقط من 5 أسئلة.<br><b>القاعدة:</b> لتسجيل الهدف يجب حل 4 أسئلة على الأقل بشكل صحيح!`;
            rewardEl.innerHTML = `⚠️ العقوبة: <span style="color:#ef4444;">-25 XP</span> | 0 عملات`;
        }

        if (currentUser) {
            recordActivityLog('penalty', `سدد [${currentUser.name}] باللاعب (${selectedPenaltyStriker.name}) | النتيجة: (${penaltyCorrectAnswersCount}/5) - ${isGoal ? 'سجل هدفاً رائعاً ⚽🔥' : 'أهدر التسديدة 🧤❌'}`);
        }
        cinemaModal.classList.add('show');

        if (currentUser) {
            const todayDate = getRealDateString();

            db.ref('users/' + currentUser.phone).transaction(user => {
                if (user) {
                    let newXp = (user.xp || user.points || 0) + xpChange;
                    user.xp = newXp < 0 ? 0 : newXp;
                    user.points = user.xp;

                    let newCoins = (user.coins || 0) + coinsChange;
                    user.coins = newCoins < 0 ? 0 : newCoins;

                    user.quizPlayed = (user.quizPlayed || 0) + 1;
                    user.quizCorrect = (user.quizCorrect || 0) + penaltyCorrectAnswersCount;

                    if (isGoal) {
                        user.penalties_scored = (user.penalties_scored || 0) + 1;
                    }

                    if (user.last_penalty_date === todayDate) {
                        user.daily_penalty_count = (user.daily_penalty_count || 0) + 1;
                    } else {
                        user.last_penalty_date = todayDate;
                        user.daily_penalty_count = 1;
                    }
                }
                return user;
            }).then(() => {
                updateProfileUI();
                updateStatsUI();
            });
        }
    }
// ================= منظومة تسجيل ومراقبة النشاط والإحصائيات =================
    function recordActivityLog(type, details) {
        return; // 👈 السطر ده هيوقف استهلاك السيرفر فوراً
        try {
            db.ref('app_activity_logs').push({
                type: type,
                details: details,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
        } catch (e) {}
    }

function loadAdminAnalyticsAndLogs(forceRefresh = false) {
        let totalUsers = adminAllUsersData.length;
        let totalCorrect = 0, totalPlayed = 0, totalDerbyWins = 0, totalPenalties = 0;

        // تجميع البيانات الحقيقية من حسابات الطلاب
        adminAllUsersData.forEach(u => {
            totalCorrect += (u.quizCorrect || 0);
            totalPlayed += (u.quizPlayed || 0);
            totalDerbyWins += (u.derby_wins || 0);
            totalPenalties += (u.penalties_scored || 0);
        });

        const totalQuestionsAnswered = totalPlayed * 5;
        const accuracy = totalQuestionsAnswered > 0 ? Math.round((totalCorrect / totalQuestionsAnswered) * 100) : 0;

        // حقن الأرقام في الواجهة
        document.getElementById('stat-total-users').innerText = totalUsers;
        document.getElementById('stat-total-questions-solved').innerText = totalQuestionsAnswered;
        document.getElementById('stat-accuracy-rate').innerText = `${accuracy}%`;
        
        const derbyEl = document.getElementById('stat-total-derby-wins');
        if (derbyEl) derbyEl.innerText = totalDerbyWins;
        
        const penaltyEl = document.getElementById('stat-total-penalties');
        if (penaltyEl) penaltyEl.innerText = totalPenalties;

        if (forceRefresh) showTopToast('تم تحديث إحصائيات التطبيق بنجاح ✅', 'success');
    }
// ================= محرك الإنجازات ومنظومة الألقاب المتدرجة =================
    const defaultAchievementsConfig = {
        // 1. إنجازات ديربي 1v1
        "derby_10": { title: "مقاتل الديربي", metric: "derby_wins", target: 10, xp: 100, coins: 20, rarity: "common" },
        "derby_50": { title: "سفاح الديربي", metric: "derby_wins", target: 50, xp: 400, coins: 80, rarity: "rare" },
        "derby_100": { title: "جلاد الديربي الأسطوري", metric: "derby_wins", target: 100, xp: 1000, coins: 200, rarity: "mythic" },

        // 2. إنجازات تحدي المستويات الـ 50
        "stars_50": { title: "مغامر المستويات", metric: "total_stars", target: 50, xp: 150, coins: 30, rarity: "common" },
        "stars_150": { title: "صائد النجوم", metric: "total_stars", target: 150, xp: 450, coins: 90, rarity: "rare" },
        "stars_300": { title: "سيد المستويات الأسطوري", metric: "total_stars", target: 300, xp: 1200, coins: 250, rarity: "mythic" },

        // 3. إنجازات تحدي اهبد صح 1v1
        "ehbed_10": { title: "هبيد مبتدئ", metric: "ehbed_wins", target: 10, xp: 100, coins: 20, rarity: "common" },
        "ehbed_50": { title: "قناص التخمين", metric: "ehbed_wins", target: 50, xp: 400, coins: 80, rarity: "rare" },
        "ehbed_100": { title: "ملك الهبد الأسطوري", metric: "ehbed_wins", target: 100, xp: 1000, coins: 200, rarity: "mythic" },

        // 4. إنجازات الاختبارات الدراسية بالمحتوى العلمي (الجديد)
        "exam_5": { title: "طالب مجتهد", metric: "passed_exams_count", target: 5, xp: 120, coins: 25, rarity: "common" },
        "exam_15": { title: "دحيح الدفعة", metric: "passed_exams_count", target: 15, xp: 400, coins: 85, rarity: "rare" },
        "exam_30": { title: "البروفيسور الأكاديمي", metric: "passed_exams_count", target: 30, xp: 1000, coins: 220, rarity: "mythic" },

        // 5. إنجازات الاستمرارية وتسجيل الدخول اليومي
        "streak_7": { title: "مداوم نشيط", metric: "daily_streak", target: 7, xp: 80, coins: 15, rarity: "common" },
        "streak_30": { title: "شعلة الاستمرار", metric: "daily_streak", target: 30, xp: 300, coins: 60, rarity: "rare" },
        "streak_60": { title: "أسطورة الحضور", metric: "daily_streak", target: 60, xp: 750, coins: 150, rarity: "mythic" }
    };

    let activeAchievementsConfig = { ...defaultAchievementsConfig };


    function getTitleBadgeHtml(titleText, rarity = 'common') {
        if (!titleText || titleText === 'none') return '';
        const rarityClass = `title-rarity-${rarity || 'common'}`;
        return `<span class="title-badge ${rarityClass}">🎖️ ${titleText}</span>`;
    }

    function renderAchievementsTabUI() {
    if (!currentUser) return;

    const cabinetContainer = document.getElementById('unlocked-titles-cabinet');
    const countBadge = document.getElementById('cabinet-titles-count');
    const trackContainer = document.getElementById('achievements-track-list');

    if (!cabinetContainer || !trackContainer) return;

    // مصفوفة شاملة لجميع المفاتيح الملغاة بصيغتي المفرد والجمع
    const obsoleteKeys = [
        'penalties_20', 'penalties_50', 'penalties_100',
        'penalty_10', 'penalty_20', 'penalty_50', 'penalty_100',
        'quiz_50', 'quiz_200', 'quiz_500'
    ];

    // حذفها من الكائن النشط والمحلي
    obsoleteKeys.forEach(k => {
        delete activeAchievementsConfig[k];
    });

    // تنظيف أي إنجاز يعتمد على معايير تم إلغاؤها (مثل penalties_scored و quizCorrect القديم)
    Object.keys(activeAchievementsConfig).forEach(k => {
        const ach = activeAchievementsConfig[k];
        if (ach.metric === 'penalties_scored' || (ach.metric === 'quizCorrect' && !k.startsWith('stars_'))) {
            delete activeAchievementsConfig[k];
        }
    });

    const claimedAchievements = currentUser.claimed_achievements || [];
    const activeEquippedTitle = currentUser.active_title || 'none';

    // حساب نجوم المستويات تلقائياً
    let totalStarsCalculated = 0;
    if (currentUser.levels_progress) {
        for (let k in currentUser.levels_progress) {
            totalStarsCalculated += (currentUser.levels_progress[k].stars || 0);
        }
    }
    currentUser.total_stars = totalStarsCalculated;

    // حساب عدد الاختبارات الدراسية المكتملة تلقائياً
    currentUser.passed_exams_count = (currentUser.rewarded_exams || []).length;

    let unlockedTitles = [];
    Object.keys(activeAchievementsConfig).forEach(achId => {
        if (claimedAchievements.includes(achId) && !obsoleteKeys.includes(achId)) {
            unlockedTitles.push({ id: achId, ...activeAchievementsConfig[achId] });
        }
    });

    if (countBadge) countBadge.innerText = `${unlockedTitles.length} لقب`;

    if (unlockedTitles.length === 0) {
        cabinetContainer.innerHTML = '<p style="text-align: center; color: var(--text-sub); font-size: 0.8rem;">لم تفتح أي ألقاب بعد، أنجز المهام بالأسفل للحصول عليها! 🚀</p>';
    } else {
        let cabHtml = '';
        if (activeEquippedTitle !== 'none') {
            cabHtml += `
            <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-primary); padding: 8px 12px; border-radius: 12px; border: 1px dashed #ef4444; margin-bottom: 6px;">
                <span style="font-size: 0.8rem; color: var(--text-sub);">اللقب الحالي مفعل</span>
                <button class="admin-action-btn danger" style="padding: 4px 10px; font-size: 0.75rem;" onclick="equipUserTitle('none', 'none')">خلع اللقب ❌</button>
            </div>`;
        }

        unlockedTitles.forEach(t => {
            const isEquipped = (activeEquippedTitle === t.title);
            cabHtml += `
            <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-primary); padding: 8px 12px; border-radius: 12px; border: 1px solid var(--border-card);">
                <div>${getTitleBadgeHtml(t.title, t.rarity)}</div>
                ${isEquipped ? `
                    <span style="font-size: 0.75rem; color: var(--accent-emerald); font-weight: 800;">مُرتدى الآن ✅</span>
                ` : `
                    <button class="admin-action-btn" style="padding: 4px 12px; font-size: 0.75rem;" onclick="equipUserTitle('${t.title}', '${t.rarity}')">ارتداء 🎖️</button>
                `}
            </div>`;
        });
        cabinetContainer.innerHTML = cabHtml;
    }

    let trackHtml = '';
    Object.keys(activeAchievementsConfig).forEach(achId => {
        if (obsoleteKeys.includes(achId)) return;

        const ach = activeAchievementsConfig[achId];
        const currentVal = currentUser[ach.metric] || 0;
        const targetVal = ach.target;
        const isCompleted = currentVal >= targetVal;
        const isClaimed = claimedAchievements.includes(achId);

        const percent = Math.min(Math.round((currentVal / targetVal) * 100), 100);

        let actionBtn = '';
        if (isClaimed) {
            actionBtn = `<span class="card-badge" style="background: rgba(16, 185, 129, 0.2); color: var(--accent-emerald);">تم الاستلام ✔️</span>`;
        } else if (isCompleted) {
            actionBtn = `<button class="btn-action-glow btn-check-task" style="padding: 6px 14px; font-size: 0.8rem;" onclick="claimAchievementReward('${achId}')">استلم اللقب والجوائز 🎁</button>`;
        } else {
            actionBtn = `<span style="font-size: 0.75rem; color: var(--text-sub); font-weight: 800;">${currentVal} / ${targetVal}</span>`;
        }

        let cardStateClass = isClaimed ? 'claimed' : (isCompleted ? 'completed-unclaimed' : '');

        trackHtml += `
        <div class="achievement-card ${cardStateClass}">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>${getTitleBadgeHtml(ach.title, ach.rarity)}</div>
                <div>${actionBtn}</div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem;">
                <span style="color: var(--text-sub);">الشرط: ${ach.target} (${getMetricArabicName(ach.metric)})</span>
                
                <!-- عرض الـ XP في سطر والعملات تحته مباشرة -->
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 2px;">
                    <span style="color: var(--accent-emerald); font-weight: 800;">+${ach.xp} XP</span>
                    <span style="color: var(--accent-gold); font-weight: 800;">+${ach.coins} 💸</span>
                </div>
            </div>
            <div class="ach-progress-bar-bg">
                <div class="ach-progress-bar-fill" style="width: ${percent}%;"></div>
            </div>
        </div>`;
    });

    trackContainer.innerHTML = trackHtml;
}

    function getMetricArabicName(metric) {
        if (metric === 'derby_wins') return 'فوز ديربي 1v1';
        if (metric === 'total_stars') return 'نجمة في المستويات ⭐';
        if (metric === 'ehbed_wins') return 'فوز اهبد صح 🔢';
        if (metric === 'passed_exams_count') return 'اختبار دراسي ناجح 🎓';
        if (metric === 'daily_streak') return 'أيام متتالية 🔥';
        if (metric === 'total_login_days') return 'أيام حضور إجمالية';
        return metric;
    }

    function claimAchievementReward(achId) {
        const ach = activeAchievementsConfig[achId];
        if (!ach || !currentUser) return;

        playSuccessSound();
        shootStars();
        triggerConfetti();

        recordUserTransaction(`استلام جائزة لقب: ${ach.title}`, ach.xp, ach.coins, 'reward');

        let claimed = currentUser.claimed_achievements || [];
        if (!claimed.includes(achId)) claimed.push(achId);

        const newXp = (currentUser.xp !== undefined ? currentUser.xp : (currentUser.points || 0)) + ach.xp;
        const newCoins = (currentUser.coins || 0) + ach.coins;

        currentUser.claimed_achievements = claimed;
        currentUser.xp = newXp;
        currentUser.points = newXp;
        currentUser.coins = newCoins;
        currentUser.active_title = ach.title;
        currentUser.active_title_rarity = ach.rarity;

        db.ref('users/' + currentUser.phone).update({
            claimed_achievements: claimed,
            xp: newXp,
            points: newXp,
            coins: newCoins,
            active_title: ach.title,
            active_title_rarity: ach.rarity
        }).then(() => {
            showTopToast(`مبروك! فتحت لقب [${ach.title}] وحصلت على +${ach.xp} XP و +${ach.coins} عملة 🎉`, 'success');
            updateProfileUI();
        });
    }

    function equipUserTitle(titleName, rarity) {
        playClickSound();
        if (!currentUser) return;

        currentUser.active_title = titleName;
        currentUser.active_title_rarity = rarity;

        db.ref('users/' + currentUser.phone).update({
            active_title: titleName,
            active_title_rarity: rarity
        }).then(() => {
            showTopToast(titleName !== 'none' ? `تم ارتداء اللقب بنجاح 🎖️` : `تم خلع اللقب`, 'info');
            updateProfileUI();
        });
    }

    function adminSaveAchievement() {
        playClickSound();
        const id = document.getElementById('adm-ach-id').value.trim();
        const title = document.getElementById('adm-ach-title').value.trim();
        const metric = document.getElementById('adm-ach-metric').value;
        const target = parseInt(document.getElementById('adm-ach-target').value);
        const rarity = document.getElementById('adm-ach-rarity').value;
        const xp = parseInt(document.getElementById('adm-ach-xp').value) || 0;
        const coins = parseInt(document.getElementById('adm-ach-coins').value) || 0;

        if (!id || !title || !target) {
            showTopToast('يرجى كتابة المعرف، اسم اللقب، والرقم المستهدف!', 'error');
            return;
        }

        db.ref('achievements_config/' + id).set({
            title, metric, target, rarity, xp, coins
        }).then(() => {
            showTopToast('تم حفظ ونشر الإنجاز واللقب بالسيرفر بنجاح! 🎖️✅', 'success');
            document.getElementById('adm-ach-id').value = '';
            document.getElementById('adm-ach-title').value = '';
            document.getElementById('adm-ach-target').value = '';
            document.getElementById('adm-ach-xp').value = '';
            document.getElementById('adm-ach-coins').value = '';
            renderAdminAchievementsList();
        });
    }

    // دالة عرض قائمة الإنجازات مع زر التعديل والحذف
    function renderAdminAchievementsList() {
        const list = document.getElementById('admin-achievements-list');
        if (!list) return;

        let html = '';
        Object.keys(activeAchievementsConfig).forEach(id => {
            const ach = activeAchievementsConfig[id];
            html += `
            <div class="admin-item-card">
                <div class="admin-item-info">
                    <div class="admin-item-name">${getTitleBadgeHtml(ach.title, ach.rarity)}</div>
                    <div class="admin-item-sub">الشرط: ${ach.target} (${ach.metric}) | الجائزة: +${ach.xp} XP / +${ach.coins} 💸</div>
                </div>
                <div style="display: flex; gap: 6px;">
                    <button class="admin-action-btn" style="padding: 4px 8px; font-size: 0.75rem;" onclick="editAdminAchievement('${id}')">تعديل ✏️</button>
                    <button class="admin-action-btn danger" style="padding: 4px 8px; font-size: 0.75rem;" onclick="adminDeleteAchievement('${id}')">حذف 🗑️</button>
                </div>
            </div>`;
        });
        list.innerHTML = html;
    }

    // دالة جلب بيانات الإنجاز لملء النموذج والتعديل الفوري
    function editAdminAchievement(id) {
        playClickSound();
        const ach = activeAchievementsConfig[id];
        if (!ach) return;

        document.getElementById('adm-ach-id').value = id;
        document.getElementById('adm-ach-title').value = ach.title || '';
        document.getElementById('adm-ach-metric').value = ach.metric || 'derby_wins';
        document.getElementById('adm-ach-target').value = ach.target || 0;
        document.getElementById('adm-ach-rarity').value = ach.rarity || 'common';
        document.getElementById('adm-ach-xp').value = ach.xp || 0;
        document.getElementById('adm-ach-coins').value = ach.coins || 0;

        // الصعود لأعلى لنموذج التعديل
        document.getElementById('adm-ach-title').focus();
        showTopToast(`تم جلب بيانات [${ach.title}]، عدّل واضغط حفظ ✏️`, 'info');
    }

    function adminDeleteAchievement(id) {
        if (confirm(`هل أنت متأكد من حذف الإنجاز (${id})؟`)) {
            db.ref('achievements_config/' + id).remove().then(() => {
                showTopToast('تم حذف الإنجاز بنجاح 🗑️', 'info');
            });
        }
    }
// ================= محرك لعبة اهبد صح (الزوجي 1v1 - أسئلة سحابية كاملة) =================
    let currentEhbedRoomId = null;
    let ehbedStake = 25;
    let ehbedRewardXP = 25;
    let ehbedListener = null;
    let ehbedTimerInt = null;
    let currentEhbedRoom = null;
    let ehbedHasAnswered = false;
    let isAdvancingEhbed = false;
    let ehbedQIndex = -1;

    function openEhbedSetupModal() {
        playClickSound();
        if (!currentUser) { showTopToast('سجل دخولك الأول يا بطل!', 'error'); return; }
        openModal('modal-ehbed-setup');
    }

    function selectEhbedTier(coins, xp, el) {
        playClickSound();
        ehbedStake = coins; ehbedRewardXP = xp;
        document.querySelectorAll('.derby-tier-slide').forEach(b => b.classList.remove('active'));
        el.classList.add('active');
    }

    async function createEhbedRoomAction() {
    playClickSound();
    if ((currentUser.coins || 0) < ehbedStake) { showTopToast('رصيدك غير كافٍ!', 'error'); return; }
    
    closeModal('modal-ehbed-setup');
    showTopToast('جاري تجهيز أسئلة التحدي وفتح الغرفة ⚡', 'success');

    const roomId = 'NUM-' + Math.floor(100 + Math.random() * 900);
    
    // 1. جلب الأسئلة الذكية
    const questionsDeck = await fetchEhbedSmartQuestionsDeck();

    // 2. فصل الأسئلة في مسار مستقل
    await db.ref('ehbed_battles_questions/' + roomId).set(questionsDeck);

    // 3. رفع الحالة الأساسية فقط للغرفة
    const roomData = {
        status: 'waiting', stake: ehbedStake, rewardXP: ehbedRewardXP, currentQIndex: 0,
        player1: { phone: currentUser.phone, name: currentUser.name, avatar: currentUser.avatar, score: 0, guess: null, answeredCurrent: false },
        player2: null
    };

    await db.ref('users/' + currentUser.phone + '/coins').transaction(c => (c || 0) - ehbedStake);
    await db.ref('ehbed_battles/' + roomId).set(roomData);
    
    currentEhbedRoomId = roomId;
    enterEhbedLobby(roomId);
}

    async function joinEhbedRoomAction() {
    playClickSound();
    const input = document.getElementById('ehbed-join-code-input');
    const roomId = input ? input.value.trim().toUpperCase() : '';
    if (!roomId) { showTopToast('يرجى إدخال كود الغرفة!', 'error'); return; }

    const roomRef = db.ref('ehbed_battles/' + roomId);
    
    // 1. جلب بيانات الغرفة من السيرفر مباشرة وليس من الكاش
    const snap = await roomRef.once('value');

    // 2. التحقق من وجود الغرفة
    if (!snap.exists()) {
        showTopToast('عذراً، هذه الغرفة غير موجودة!', 'error');
        return;
    }

    const roomData = snap.val();

    // 3. التحقق من حالة الغرفة
    if (roomData.status !== 'waiting') {
        showTopToast('عذراً، الغرفة ممتلئة أو بدأت بالفعل!', 'error');
        return;
    }

    // 4. منع اللاعب من دخول غرفته الخاصة كمنافس
    if (roomData.player1.phone === currentUser.phone) {
        showTopToast('لا يمكنك تحدي نفسك!', 'error'); 
        return;
    }

    // 5. التحقق من الرصيد
    if ((currentUser.coins || 0) < roomData.stake) {
        showTopToast('رصيدك غير كافٍ!', 'error'); 
        return;
    }

    // 6. خصم العملات وتحديث حالة الغرفة
    await db.ref('users/' + currentUser.phone + '/coins').transaction(c => (c || 0) - roomData.stake);
    
    await roomRef.update({ 
        status: 'ready', 
        player2: { 
            phone: currentUser.phone, 
            name: currentUser.name, 
            avatar: currentUser.avatar || 'https://img.icons8.com/fluency/96/user-male.png', 
            score: 0, 
            guess: null, 
            answeredCurrent: false 
        } 
    });

    currentEhbedRoomId = roomId;
    closeModal('modal-ehbed-setup');
    if (input) input.value = '';
    
    enterEhbedLobby(roomId);
}

    // دالة سحب الأسئلة الذكية لمنع التكرار لكل لاعب
    async function fetchEhbedSmartQuestionsDeck() {
        let allPool = [];
        if (ehbedQuestionsCache) {
            allPool = [...ehbedQuestionsCache];
        } else {
            try {
                const snap = await db.ref('ehbed_custom_questions').once('value');
                ehbedQuestionsCache = [];
                if (snap.exists()) {
                    snap.forEach(c => {
                        const val = c.val();
                        if (val && val.q && val.answer !== undefined) {
                            const qObj = { id: c.key, q: val.q, a: parseInt(val.answer) };
                            ehbedQuestionsCache.push(qObj);
                            allPool.push(qObj);
                        }
                    });
                }
            } catch (e) {}
        }

        if (allPool.length === 0) {
            // أسئلة احتياطية لو السحابة فاضية
            allPool = [
                { id: 'def_1', q: "في أي عام تم افتتاح قناة السويس رسمياً؟", a: 1869 },
                { id: 'def_2', q: "كم عدد عظام جسم الإنسان البالغ؟", a: 206 },
                { id: 'def_3', q: "في أي عام بدأت الحرب العالمية الثانية؟", a: 1939 },
                { id: 'def_4', q: "كم عدد آيات سورة البقرة؟", a: 286 },
                { id: 'def_5', q: "كم عدد القلوب لدى الأخطبوط؟", a: 3 }
            ];
        }

        let seenIds = JSON.parse(localStorage.getItem('user_seen_ehbed_' + currentUser.phone) || '[]');
        let pool = allPool.filter(q => !seenIds.includes(q.id));

        if (pool.length < 5) {
            seenIds = [];
            pool = [...allPool];
            showTopToast('أحسنت! أتممت بنك أسئلة اهبد صح بالكامل وتم تجديده 🔄✨', 'info');
        }

        pool = shuffleArray(pool);
        let selectedDeck = pool.slice(0, 5);

        selectedDeck.forEach(q => {
            if (!seenIds.includes(q.id)) seenIds.push(q.id);
        });
        localStorage.setItem('user_seen_ehbed_' + currentUser.phone, JSON.stringify(seenIds));

        return selectedDeck;
    }

    // باقي دوال اللعب (Lobby و Arena و Feedback زي ما هي بدون تغيير)
    function enterEhbedLobby(roomId) {
        navigateTo('view-ehbed-lobby', 'غرفة اهبد صح', 'في انتظار المنافس...');
        document.getElementById('ehbed-lobby-code').innerText = roomId;
        
        const startBtn = document.getElementById('btn-start-ehbed-battle');
        if (startBtn) startBtn.style.display = 'none';
        
        if (ehbedListener) db.ref('ehbed_battles/' + currentEhbedRoomId).off('value', ehbedListener);
        
        ehbedListener = db.ref('ehbed_battles/' + roomId).on('value', snap => {
            if (!snap.exists()) return;
            const room = snap.val();
            const isHost = room.player1.phone === currentUser.phone;
            
            // تحديد دقيق جداً: مين أنا ومين اللي ضدي (المنافس)
            const me = isHost ? room.player1 : room.player2;
            const opp = isHost ? room.player2 : room.player1;

            // 1. عرض بياناتك أنت في الخانة الأولى (يمين)
            if (me) {
                document.getElementById('ehbed-lobby-p1-name').innerText = me.name.split(' ')[0] + ' (أنت)';
                document.getElementById('ehbed-lobby-p1-avatar').src = me.avatar || 'https://img.icons8.com/fluency/96/user-male.png';
            }

            // 2. عرض بيانات المنافس في الخانة الثانية (شمال) فور وجوده
            if (opp) {
                document.getElementById('ehbed-lobby-p2-name').innerText = opp.name.split(' ')[0];
                document.getElementById('ehbed-lobby-p2-name').style.color = 'var(--text-main)';
                document.getElementById('ehbed-lobby-p2-avatar').src = opp.avatar || 'https://img.icons8.com/fluency/96/user-male.png';
                document.getElementById('ehbed-lobby-p2-avatar').style.opacity = '1';

                if (room.status === 'ready' && isHost) {
                    startBtn.style.display = 'block';
                }
            } else {
                document.getElementById('ehbed-lobby-p2-name').innerText = 'في الانتظار...';
                document.getElementById('ehbed-lobby-p2-avatar').src = 'https://img.icons8.com/fluency/96/user-male.png';
                document.getElementById('ehbed-lobby-p2-avatar').style.opacity = '0.35';
            }

            if (room.status === 'playing') enterEhbedArena();
        });
    }

    function startEhbedBattleByHost() {
        playClickSound();
        if (currentEhbedRoomId) db.ref('ehbed_battles/' + currentEhbedRoomId + '/status').set('playing');
    }

    function copyEhbedRoomCode() {
        if (!currentEhbedRoomId) return;
        navigator.clipboard.writeText(currentEhbedRoomId).then(() => showTopToast('تم نسخ الكود! 📋', 'success'));
    }
    function shareEhbedRoomWhatsApp() {
        if (!currentEhbedRoomId) return;
        window.open(`https://api.whatsapp.com/send?text=تحديتك في اهبد صح! 🔢%0Aادخل بالكود: *${currentEhbedRoomId}*`, '_blank');
    }

    let currentEhbedQuestions = null; // متغير لحفظ أسئلة اهبد مؤقتاً

function enterEhbedArena() {
    navigateTo('view-ehbed-game', 'اهبد صح 1v1', 'مواجهة التخمين');
    ehbedQIndex = -1;
    
    if (ehbedListener) db.ref('ehbed_battles/' + currentEhbedRoomId).off('value', ehbedListener);
    
    // 1. قراءة الأسئلة مرة واحدة فقط عند الدخول
    db.ref('ehbed_battles_questions/' + currentEhbedRoomId).once('value').then(qSnap => {
        currentEhbedQuestions = qSnap.val() || [];

        // 2. مراقبة حالة اللعب والنتائج فقط بصمت
        ehbedListener = db.ref('ehbed_battles/' + currentEhbedRoomId).on('value', snap => {
            if (!snap.exists()) return;
            currentEhbedRoom = snap.val();
            currentEhbedRoom.questions = currentEhbedQuestions; // دمج الأسئلة
            syncEhbedArena();
        });
    });
}

    function syncEhbedArena() {
        const room = currentEhbedRoom;
        if (room.status === 'finished') { 
            setTimeout(() => { concludeEhbedBattle(); }, 4500); 
            return; 
        }

        const isHost = room.player1.phone === currentUser.phone;
        const me = isHost ? room.player1 : room.player2;
        const opp = isHost ? room.player2 : room.player1;

        document.getElementById('ehbed-p1-avatar').src = me.avatar || 'https://img.icons8.com/fluency/96/user-male.png';
        document.getElementById('ehbed-p1-name').innerText = me.name.split(' ')[0] + ' (أنت)';
        document.getElementById('ehbed-p1-score').innerText = me.score || 0;
        
        document.getElementById('ehbed-p2-avatar').src = opp.avatar || 'https://img.icons8.com/fluency/96/user-male.png';
        document.getElementById('ehbed-p2-name').innerText = opp.name.split(' ')[0];
        document.getElementById('ehbed-p2-score').innerText = opp.score || 0;

        const qIdx = room.currentQIndex || 0;
        document.getElementById('ehbed-q-counter-multi').innerText = `السؤال ${qIdx + 1} / 5`;
        document.getElementById('ehbed-q-text').innerText = room.questions[qIdx].q;

        if (ehbedQIndex !== qIdx) {
            ehbedQIndex = qIdx;
            ehbedHasAnswered = false;
            document.getElementById('ehbed-feedback-toast').style.display = 'none';
            document.getElementById('btn-submit-ehbed').style.display = 'block';
            document.getElementById('ehbed-p1-status').innerText = 'يفكر... ⏳';
            document.getElementById('ehbed-p1-status').style.color = 'var(--accent-gold)';
            
            const input = document.getElementById('ehbed-answer-input');
            input.value = ''; input.disabled = false; input.focus();
            
            clearInterval(ehbedTimerInt);
            let timeLeft = 15;
            document.getElementById('ehbed-timer').innerText = timeLeft;
            
            ehbedTimerInt = setInterval(() => {
                timeLeft--;
                document.getElementById('ehbed-timer').innerText = timeLeft;
                if (timeLeft <= 0) {
                    clearInterval(ehbedTimerInt);
                    if (!ehbedHasAnswered) submitEhbedAnswer(true);
                }
            }, 1000);
        }

        if (room.player1.answeredCurrent && room.player2.answeredCurrent) {
            if (!isAdvancingEhbed) {
                isAdvancingEhbed = true;
                clearInterval(ehbedTimerInt);
                showEhbedMultiplayerFeedback(room, isHost);
                
                if (isHost) {
                    setTimeout(() => {
                        advanceEhbedArenaNextQ(room).then(() => { isAdvancingEhbed = false; });
                    }, 6000); 
                } else {
                    setTimeout(() => { isAdvancingEhbed = false; }, 6000);
                }
            }
        }
    }

    function submitEhbedAnswer(isTimeout = false) {
        if (ehbedHasAnswered) return;
        ehbedHasAnswered = true;
        clearInterval(ehbedTimerInt);
        playClickSound();

        const inputEl = document.getElementById('ehbed-answer-input');
        inputEl.disabled = true;
        document.getElementById('btn-submit-ehbed').style.display = 'none';
        
        document.getElementById('ehbed-p1-status').innerText = 'تمت الإجابة ✅';
        document.getElementById('ehbed-p1-status').style.color = 'var(--accent-emerald)';

        const userGuess = isTimeout ? -999 : parseInt(inputEl.value);
        const finalGuess = isNaN(userGuess) ? -999 : userGuess;

        const playerPath = (currentEhbedRoom.player1.phone === currentUser.phone) ? 'player1' : 'player2';
        db.ref(`ehbed_battles/${currentEhbedRoomId}/${playerPath}`).update({
            guess: finalGuess,
            answeredCurrent: true
        });
    }

    function showEhbedMultiplayerFeedback(room, isHost) {
        const correct = room.questions[room.currentQIndex].a;
        const myGuess = isHost ? room.player1.guess : room.player2.guess;
        const oppGuess = isHost ? room.player2.guess : room.player1.guess;
        
        const myAvatar = isHost ? room.player1.avatar : room.player2.avatar;
        const oppAvatar = isHost ? room.player2.avatar : room.player1.avatar;

        const myDiff = Math.abs(myGuess - correct);
        const oppDiff = Math.abs(oppGuess - correct);

        let msg = ''; let iconSrc = ''; let borderColor = '';
        
        if (myGuess === -999 && oppGuess === -999) { 
            msg = 'الوقت خلص عليكم! ⏰'; iconSrc = 'https://img.icons8.com/fluency/96/clock--v1.png'; borderColor = '#ef4444'; playErrorSound(); 
        } else if (myGuess === -999) { 
            msg = 'الوقت خلص! المنافس فاز 🔴'; iconSrc = 'https://img.icons8.com/fluency/96/cancel.png'; borderColor = '#ef4444'; playErrorSound(); 
        } else if (oppGuess === -999) { 
            msg = 'المنافس مالحقش.. كسبت الجولة! 🏆'; iconSrc = 'https://img.icons8.com/fluency/96/trophy.png'; borderColor = '#10b981'; playSuccessSound(); 
        } else if (myDiff === 0 && oppDiff === 0) { 
            msg = 'تعادل أسطوري! انتوا الاتنين بالمللي 🎯'; iconSrc = 'https://img.icons8.com/fluency/96/goal.png'; borderColor = '#ffd700'; playExactMatchSound(); shootStars(); 
        } else if (myDiff === 0) { 
            msg = 'قنااااص! جبتها بالمللي وكسبت 🎯'; iconSrc = 'https://img.icons8.com/fluency/96/goal.png'; borderColor = '#ffd700'; playExactMatchSound(); shootStars(); 
        } else if (oppDiff === 0) { 
            msg = 'المنافس جابها بالمللي! 😱'; iconSrc = 'https://img.icons8.com/fluency/96/astonished.png'; borderColor = '#ef4444'; playErrorSound(); 
        } else if (myDiff < oppDiff) { 
            msg = 'عاش! تخمينك الأقرب 👏'; iconSrc = 'https://img.icons8.com/fluency/96/medal.png'; borderColor = '#10b981'; playSuccessSound(); 
        } else if (oppDiff < myDiff) { 
            msg = 'المنافس كان أقرب المرة دي! 🔴'; iconSrc = 'https://img.icons8.com/fluency/96/crying--v1.png'; borderColor = '#ef4444'; playErrorSound(); 
        } else { 
            msg = 'تعادل! نفس نسبة القرب 🤝'; iconSrc = 'https://img.icons8.com/fluency/96/handshake.png'; borderColor = '#00f0ff'; playClickSound(); 
        }

        const toast = document.getElementById('ehbed-feedback-toast');
        toast.style.borderColor = borderColor;
        toast.style.boxShadow = `0 10px 30px ${borderColor}40`;
        
        toast.innerHTML = `
            <div style="width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <div style="text-align: center; margin-top: 5px; margin-bottom: 4px; position: relative;">
                    <img src="${iconSrc}" style="width: 55px; height: 55px; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.4));">
                </div>
                
                <div style="font-size:0.85rem; color:var(--text-sub); text-align:center; font-weight:800;">الرقم الصحيح هو</div>
                <div style="font-size:2.2rem; font-weight:900; color:#fff; text-align:center; margin-bottom:10px; text-shadow: 0 0 15px ${borderColor}; letter-spacing: 2px;">
                    ${correct}
                </div>
                
                <div style="display:flex; justify-content:space-between; align-items:center; background: rgba(255,255,255,0.05); padding: 10px 12px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.1); width: 100%;">
                    <div style="text-align: center; width: 45%;">
                        <img src="${myAvatar || 'https://img.icons8.com/fluency/96/user-male.png'}" class="ehbed-avatar-small" style="width: 40px; height: 40px; border-color: ${myDiff <= oppDiff && myGuess !== -999 ? '#10b981' : '#ef4444'};">
                        <div style="font-size: 0.75rem; color: var(--text-sub); margin-top: 4px; font-weight: bold;">تخمينك</div>
                        <div style="font-size: 1.2rem; font-weight: 900; color: ${myGuess === -999 ? '#ef4444' : '#fff'};">${myGuess === -999 ? '⏳' : myGuess}</div>
                    </div>
                    
                    <div style="width: 2px; height: 40px; background: rgba(255,255,255,0.1);"></div>
                    
                    <div style="text-align: center; width: 45%;">
                        <img src="${oppAvatar || 'https://img.icons8.com/fluency/96/user-male.png'}" class="ehbed-avatar-small" style="width: 40px; height: 40px; border-color: ${oppDiff <= myDiff && oppGuess !== -999 ? '#10b981' : '#ef4444'};">
                        <div style="font-size: 0.75rem; color: var(--text-sub); margin-top: 4px; font-weight: bold;">المنافس</div>
                        <div style="font-size: 1.2rem; font-weight: 900; color: ${oppGuess === -999 ? '#ef4444' : '#fff'};">${oppGuess === -999 ? '⏳' : oppGuess}</div>
                    </div>
                </div>
                
                <div style="font-size:0.95rem; font-weight:900; text-align:center; margin-top: 12px; color: ${borderColor}; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">${msg}</div>
            </div>
        `;
        
        toast.style.display = 'flex';
        
        setTimeout(() => {
            toast.style.display = 'none';
        }, 6000);
    }

    async function advanceEhbedArenaNextQ(room) {
        const correct = room.questions[room.currentQIndex].a;
        let p1Guess = room.player1.guess;
        let p2Guess = room.player2.guess;
        let p1Score = room.player1.score || 0;
        let p2Score = room.player2.score || 0;

        let p1Diff = Math.abs(p1Guess - correct);
        let p2Diff = Math.abs(p2Guess - correct);

        if (p1Guess === -999 && p2Guess === -999) {
        } else if (p1Guess === -999) {
            p2Score += 1;
        } else if (p2Guess === -999) {
            p1Score += 1;
        } else if (p1Diff === 0 && p2Diff === 0) {
            p1Score += 2; p2Score += 2;
        } else if (p1Diff === 0) {
            p1Score += 2;
        } else if (p2Diff === 0) {
            p2Score += 2;
        } else if (p1Diff < p2Diff) {
            p1Score += 1;
        } else if (p2Diff < p1Diff) {
            p2Score += 1;
        } else {
            p1Score += 1; p2Score += 1;
        }

        const nextIdx = room.currentQIndex + 1;
        await db.ref('ehbed_battles/' + currentEhbedRoomId).update({
            'player1/score': p1Score, 'player2/score': p2Score,
            'player1/answeredCurrent': false, 'player2/answeredCurrent': false,
            'player1/guess': null, 'player2/guess': null,
            currentQIndex: nextIdx,
            status: nextIdx >= 5 ? 'finished' : 'playing'
        });
    }

    function concludeEhbedBattle() {
        if (ehbedListener) db.ref('ehbed_battles/' + currentEhbedRoomId).off('value', ehbedListener);
        clearInterval(ehbedTimerInt);

        document.getElementById('ehbed-feedback-toast').style.display = 'none';
        
        const room = currentEhbedRoom;
        const isHost = room.player1.phone === currentUser.phone;
        const me = isHost ? room.player1 : room.player2;
        const opp = isHost ? room.player2 : room.player1;

        navigateTo('view-battle-result', 'نتيجة اهبد صح 1v1', 'حسم التخمين والمواجهة');

        let winner = me.score >= opp.score ? me : opp;
        let loser = me.score >= opp.score ? opp : me;
        let isDraw = me.score === opp.score;

        document.getElementById('res-p1-name').innerText = winner.name;
        document.getElementById('res-p1-avatar').src = winner.avatar || 'https://img.icons8.com/fluency/96/user-male.png';
        document.getElementById('res-p1-badge').innerText = `النقاط: ${winner.score}`;
        document.getElementById('res-p1-tag').innerHTML = isDraw ? '🤝 متعادلين' : 'WINNER 👑';
        document.getElementById('result-card-p1').style.borderColor = isDraw ? 'var(--accent-gold)' : '#a855f7';
        document.getElementById('result-card-p1').style.boxShadow = isDraw ? '0 0 15px rgba(245, 158, 11, 0.3)' : '0 0 20px rgba(168, 85, 247, 0.35)';

        document.getElementById('res-p2-name').innerText = loser.name;
        document.getElementById('res-p2-avatar').src = loser.avatar || 'https://img.icons8.com/fluency/96/user-male.png';
        document.getElementById('res-p2-badge').innerText = `النقاط: ${loser.score}`;
        document.getElementById('res-p2-tag').innerHTML = isDraw ? '🤝 متعادلين' : 'DEFEATED ❌';
        document.getElementById('result-card-p2').style.borderColor = '#ef4444';
        document.getElementById('result-card-p2').style.opacity = '0.8';

        const titleEl = document.getElementById('battle-result-title');
        const subEl = document.getElementById('battle-result-subtitle');
        const rewardBox = document.getElementById('battle-result-rewards-box');
        const rewardText = document.getElementById('battle-result-reward-text');
        const iconEl = document.getElementById('battle-result-icon');

        let xp = 0, coins = 0;
        let isWon = false;

        if (me.score > opp.score) {
            playFlawlessVictorySound(); shootStars(); triggerConfetti();
            titleEl.innerText = 'ملك الهبد والتخمين! 🏆';
            subEl.innerText = 'أرقامك كانت أدق واكتسحت المنافس بامتياز!';
            iconEl.src = 'https://img.icons8.com/fluency/96/trophy.png';
            
            xp = room.rewardXP; coins = room.stake * 2;
            rewardText.innerText = `+${coins} عملة 💸 | +${xp} XP ⚡`;
            rewardBox.style.display = 'block';
            isWon = true;

            recordUserTransaction(`فوز في اهبد صح 1v1 ضد المنافس`, xp, coins, 'derby');
        } else if (me.score < opp.score) {
            playErrorSound();
            titleEl.innerText = 'هاردلك يا بطل! 🔴';
            subEl.innerText = 'المنافس كان أقرب للرقم الصحيح المرة دي، معوضة!';
            iconEl.src = 'https://img.icons8.com/fluency/96/shield.png';
            rewardBox.style.display = 'none';
            
            recordUserTransaction(`خسارة في اهبد صح 1v1`, 0, -room.stake, 'derby');
        } else {
            playSuccessSound();
            titleEl.innerText = 'تعادل في التخمين! 🤝';
            subEl.innerText = 'مستواكم متقارب جداً، تم استرداد رسوم التحدي.';
            iconEl.src = 'https://img.icons8.com/fluency/96/handshake.png';
            coins = room.stake;
            rewardText.innerText = `+${coins} عملة (استرداد الرسوم) 🪙`;
            rewardBox.style.display = 'block';
            
            recordUserTransaction(`تعادل في اهبد صح 1v1 (استرداد)`, 0, 0, 'derby');
        }

        db.ref('users/' + currentUser.phone).transaction(user => {
            if (user) {
                user.xp = (user.xp || user.points || 0) + xp;
                user.points = user.xp;
                user.coins = (user.coins || 0) + coins;
                if (isWon) {
                    user.ehbed_wins = (user.ehbed_wins || 0) + 1;
                }
            }
            return user;
        }).then(() => {
            if (isWon) currentUser.ehbed_wins = (currentUser.ehbed_wins || 0) + 1;
            currentUser.xp = (currentUser.xp || 0) + xp;
            currentUser.points = currentUser.xp;
            currentUser.coins = (currentUser.coins || 0) + coins;
            updateProfileUI();
        });

        if (isHost) {
            recordActivityLog('derby', `انتهت مواجهة اهبد صح: [${me.name.split(' ')[0]}] (${me.score}) ضد [${opp.name.split(' ')[0]}] (${opp.score}) 🔢`);
        }

        currentEhbedRoomId = null;
    }

    async function cancelEhbedLobby() {
        if (!currentEhbedRoomId) return;
        document.getElementById('ehbed-feedback-toast').style.display = 'none';
        const roomRef = db.ref('ehbed_battles/' + currentEhbedRoomId);
        const snap = await roomRef.once('value');
        
        if (snap.exists()) {
            const room = snap.val();
            const isHost = room.player1 && room.player1.phone === currentUser.phone;

            // لو الضيف (مش الهوست) هو اللي خرج وهو في اللوبي قبل ما تبدأ
            if (!isHost && room.status === 'ready') {
                // رجّع الفلوس للضيف
                await db.ref('users/' + currentUser.phone + '/coins').transaction(c => (c || 0) + room.stake);
                // احذف بيانات player2 ورجع الغرفة لحالة waiting عشان الهوست ما يعلقش ويقدر يستنى ضيف تاني
                await roomRef.update({
                    status: 'waiting',
                    player2: null
                });
            } 
            // لو الهوست هو اللي خرج أو الغرفة لسه في الانتظار
            else if (room.status === 'waiting') {
                await db.ref('users/' + currentUser.phone + '/coins').transaction(c => (c || 0) + room.stake);
                await roomRef.remove();
            } 
            else if (room.status === 'ready') {
                // كل لاعب يرجع فلوسه لنفسه فقط
                await db.ref('users/' + currentUser.phone + '/coins').transaction(c => (c || 0) + room.stake);
                
                if (isHost) {
                    await roomRef.remove();
                } else {
                    await roomRef.update({ status: 'waiting', player2: null });
                }
            }
            // لو اللعبة بدأت أصلاً وحصل انسحاب
            else if (room.status === 'playing') {
                const playerPath = isHost ? 'player1' : 'player2';
                await db.ref(`ehbed_battles/${currentEhbedRoomId}/${playerPath}/score`).set(-999);
                await db.ref(`ehbed_battles/${currentEhbedRoomId}/status`).set('finished');
            }
        }

        if (ehbedListener) roomRef.off('value', ehbedListener);
        currentEhbedRoomId = null;
        goHomeDirectly();
    }

    function saveNewEhbedQuestion() {
        playClickSound();
        const qText = document.getElementById('admin-ehbed-q-text').value.trim();
        const ansVal = parseInt(document.getElementById('admin-ehbed-q-ans').value);

        if (!qText || isNaN(ansVal)) {
            showTopToast('يرجى كتابة نص السؤال والإجابة الرقمية بشكل صحيح!', 'error');
            return;
        }

        db.ref('ehbed_custom_questions').push({
            q: qText,
            answer: ansVal,
            createdAt: new Date().toISOString()
        }).then(() => {
            document.getElementById('admin-ehbed-q-text').value = '';
            document.getElementById('admin-ehbed-q-ans').value = '';
            showTopToast('تمت إضافة سؤال التخمين بنجاح! 🔢✨', 'success');
        });
    }

    function loadAdminEhbedQuestions() {
        const container = document.getElementById('admin-ehbed-questions-list');
        if (!container) return;

        db.ref('ehbed_custom_questions').once('value', snap => {
            if (!snap.exists()) {
                container.innerHTML = '<p style="text-align: center; color: var(--text-sub);">لا توجد أسئلة تخمين مضافة حتى الآن.</p>';
                return;
            }

            let html = '';
            snap.forEach(child => {
                const q = child.val();
                const id = child.key;
                html += `
                <div class="admin-item-card" style="flex-direction: column; align-items: flex-start; gap: 4px;">
                    <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                        <span style="color: #c084fc; font-weight: 900;">🔢 إجابة صحيحة: ${q.answer}</span>
                        <button class="admin-action-btn danger" style="padding: 2px 8px; font-size: 0.7rem;" onclick="deleteEhbedQuestion('${id}')">حذف 🗑️</button>
                    </div>
                    <div style="font-size: 0.88rem; color: var(--text-main); font-weight: 700;">${q.q}</div>
                </div>`;
            });
            container.innerHTML = html;
        });
    }

    function deleteEhbedQuestion(id) {
        playErrorSound();
        if (confirm('هل تريد حذف هذا السؤال نهائياً؟')) {
            db.ref('ehbed_custom_questions/' + id).remove().then(() => showTopToast('تم الحذف بنجاح'));
        }
    }

    function uploadBulkEhbedQuestions() {
        playClickSound();
        const rawText = document.getElementById('admin-ehbed-bulk-input').value.trim();
        if (!rawText) { showTopToast('يرجى لصق الأسئلة أولاً!', 'error'); return; }

        const lines = rawText.split('\n');
        let addedCount = 0;
        const updates = {};

        lines.forEach(line => {
            const parts = line.split('#').map(p => p.trim());
            if (parts.length === 2) {
                const [qText, ansStr] = parts;
                const ansNum = parseInt(ansStr);
                if (qText && !isNaN(ansNum)) {
                    const newKey = db.ref('ehbed_custom_questions').push().key;
                    updates[newKey] = { q: qText, answer: ansNum, createdAt: new Date().toISOString() };
                    addedCount++;
                }
            }
        });

        if (addedCount === 0) {
            showTopToast('تأكد من كتابة الصيغة الصحيحة (السؤال # الرقم)', 'error');
            return;
        }

        db.ref('ehbed_custom_questions').update(updates).then(() => {
            document.getElementById('admin-ehbed-bulk-input').value = '';
            playSuccessSound();
            showTopToast(`تم رفع (${addedCount}) سؤال تخمين بنجاح للسحابة! 🚀`, 'success');
        });
    }
function openTransferModal() {
    playClickSound();
    if (!currentUser) return;

    const idInput = document.getElementById('transfer-id-input');
    const amountInput = document.getElementById('transfer-amount-input');
    const typeInput = document.getElementById('transfer-type-input');

    if (idInput) idInput.value = '';
    if (amountInput) amountInput.value = '';
    if (typeInput) typeInput.value = 'coins'; // الافتراضي عملات

    openModal('modal-transfer-coins');
}

    // الحد الأقصى اليومي المسموح بإرساله لنفس الزميل
const DAILY_LIMIT_PER_USER = 100;

async function executeCoinTransfer() {
    const idInput = document.getElementById('transfer-id-input');
    const amountInput = document.getElementById('transfer-amount-input');

    if (!idInput || !amountInput) {
        showTopToast('حدث خطأ في تحميل نافذة الدعم', 'error');
        return;
    }

    const targetStudentId = idInput.value.trim();
    const amount = parseInt(amountInput.value);

    // التحقق من صحة المدخلات
    if (!targetStudentId) {
        showTopToast('يرجى إدخال معرّف الطالب (ID)', 'error');
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        showTopToast('يرجى كتابة عدد عملات صحيح', 'error');
        return;
    }

    if ((currentUser.coins || 0) < amount) {
        showTopToast('رصيدك من العملات لا يكفي لإتمام التحويل', 'error');
        return;
    }

    // تجهيز تاريخ اليوم لفحص العداد
    const todayStr = typeof getRealDateString === 'function' 
        ? getRealDateString() 
        : new Date().toISOString().split('T')[0];

    if (!currentUser.daily_transfers || currentUser.daily_transfers_date !== todayStr) {
        currentUser.daily_transfers = {};
        currentUser.daily_transfers_date = todayStr;
    }

    const alreadySent = currentUser.daily_transfers[targetStudentId] || 0;

    if (alreadySent + amount > DAILY_LIMIT_PER_USER) {
        const remaining = Math.max(0, DAILY_LIMIT_PER_USER - alreadySent);
        showTopToast(`الحد الأقصى هو ${DAILY_LIMIT_PER_USER} عملة يومياً لكل طالب. المتبقي لك معه اليوم: ${remaining} عملة.`, 'error');
        return;
    }

    showTopToast('جاري التحقق من بيانات الزميل...', 'info');

    try {
        // البحث عن الطالب في السيرفر باستخدام student_id
        const snapshot = await db.ref('users')
            .orderByChild('student_id')
            .equalTo(Number(targetStudentId))
            .once('value');

        let targetUserData = null;
        let targetPhone = null;

        if (snapshot.exists()) {
            snapshot.forEach(child => {
                targetPhone = child.key;
                targetUserData = child.val();
            });
        } else {
            // محاولة مطابقة في حال كان المعرف مخزناً كنص
            const textSnapshot = await db.ref('users')
                .orderByChild('student_id')
                .equalTo(targetStudentId)
                .once('value');
            if (textSnapshot.exists()) {
                textSnapshot.forEach(child => {
                    targetPhone = child.key;
                    targetUserData = child.val();
                });
            }
        }

        if (!targetUserData || !targetPhone) {
            showTopToast('لم يتم العثور على طالب بهذا الـ ID', 'error');
            return;
        }

        // منع التحويل للنفس
        if (targetPhone === currentUser.phone || String(targetUserData.student_id) === String(currentUser.student_id)) {
            showTopToast('لا يمكنك إرسال عملات لحسابك الشخصي!', 'error');
            return;
        }

        // 1. خصم العملات وتحديث سجل الراسل
        currentUser.coins -= amount;
        currentUser.daily_transfers[targetStudentId] = alreadySent + amount;

        await db.ref('users/' + currentUser.phone).update({
            coins: currentUser.coins,
            daily_transfers: currentUser.daily_transfers,
            daily_transfers_date: currentUser.daily_transfers_date
        });

        // 2. زيادة العملات للمستلم
        const updatedTargetCoins = (targetUserData.coins || 0) + amount;
        await db.ref('users/' + targetPhone).update({
            coins: updatedTargetCoins
        });

        // 3. إنهاء وإشعار بالنجاح
        showTopToast(`تم إرسال ${amount} عملة بنجاح إلى ${targetUserData.name || 'زميلك'}! 🪙`, 'success');

        idInput.value = '';
        amountInput.value = '';

        if (typeof closeModal === 'function') {
            closeModal('modal-transfer-coins');
        }
        if (typeof updateProfileUI === 'function') {
            updateProfileUI();
        }

    } catch (err) {
        console.error("Transfer Error:", err);
        showTopToast('حدث خطأ أثناء الاتصال بالسيرفر، حاول ثانية', 'error');
    }
}

// ================= المحرك الشامل لمكتبة مهندس الجودة =================

const engAcademyDB = {
    basics: {
        title: "أساسيات الجودة", desc: "مفاهيم ومبادئ الجودة وسلامة الغذاء المبسطة.", icon: "📘", type: "chapters",
        content: [
            { title: "يعني إيه Quality (الجودة)؟", text: "الجودة هي تلبية أو تجاوز توقعات ومتطلبات العميل بشكل مستمر.<br><b>مثال من المصنع:</b> إنتاج عصير نسبة السكر (Brix) فيه مطابقة تماماً للمواصفة المكتوبة على العبوة." },
            { title: "الفرق بين QA و QC", text: "<b>QA (توكيد الجودة):</b> نظام استباقي (Proactive) يركز على العملية نفسها لمنع حدوث الخطأ (مثل تدريب العمال ووضع خطة الهاسب).<br><br><b>QC (مراقبة الجودة):</b> نظام تفاعلي (Reactive) يركز على المنتج لاكتشاف الخطأ (مثل سحب عينة من خط الإنتاج وتحليلها في المعمل)." },
            { title: "أنواع المخاطر (Hazards)", text: "<b>1. بيولوجية:</b> بكتيريا، فيروسات، فطريات (مثل السالمونيلا).<br><b>2. كيميائية:</b> بقايا مبيدات، منظفات، سموم فطرية.<br><b>3. فيزيائية:</b> زجاج، معادن، خشب، شعر." }
        ]
    },
    dictionary: {
        title: "قاموس الجودة", desc: "اكتب أي اختصار أو مصطلح للبحث عنه فوراً.", icon: "🔍", type: "dictionary",
        content: [
            { term: "Calibration", ar: "المعايرة", def: "عملية مقارنة جهاز القياس (مثل ميزان أو ترمومتر) بمعيار مرجعي دقيق وموثق للتأكد من صحة قراءاته." },
            { term: "Traceability", ar: "التتبع / التتبعية", def: "القدرة على تتبع مسار الغذاء خطوة بخطوة، من استلام المواد الخام (Backwards) حتى وصول المنتج النهائي للمستهلك (Forwards)." },
            { term: "CAPA", ar: "الإجراء التصحيحي والوقائي", def: "اختصار لـ Corrective Action / Preventive Action. وهو الإجراء المتخذ للقضاء على سبب حالة عدم مطابقة لمنع تكرارها." },
            { term: "CCP", ar: "نقطة التحكم الحرجة", def: "خطوة في العملية التصنيعية يمكن عندها تطبيق تحكم لمنع أو تقليل الخطر المتعلق بسلامة الغذاء لمستوى مقبول (مثل البسترة)." }
        ]
    },
    comparisons: {
        title: "المقارنات الفنية", desc: "أهم الفروقات التي تُسأل عنها في المقابلات والمصانع.", icon: "⚔️", type: "comparisons",
        content: [
            { title: "HACCP 🆚 ISO 22000", sideA: "<b>HACCP:</b> نظام تحليلي يركز بشكل كامل وحصري على سلامة الغذاء (Food Safety) والمخاطر.", sideB: "<b>ISO 22000:</b> نظام إدارة متكامل أوسع وأشمل، ويحتوي على الـ HACCP كجزء أو بند أساسي داخله." },
            { title: "Validation 🆚 Verification", sideA: "<b>التحقق (Verification):</b> هل نقوم بالعمل بشكل صحيح؟ (مثل مراجعة سجلات درجات الحرارة للتأكد من أن العامل سجلها).", sideB: "<b>الصلاحية/التصديق (Validation):</b> هل العمل الذي نقوم به هو الصحيح أصلاً؟ (مثل تحليل معملي يثبت أن حرارة البسترة قتلت البكتيريا فعلاً)." }
        ]
    },
    lab: {
        title: "المعمل المصغر", desc: "أدوات وحاسبات كيميائية سريعة لمهندس المعمل.", icon: "🧮", type: "lab"
    }
};

// الدالة المعدلة للدخول (حماية المطور مؤقتاً)
function openEngineerHub() {
    playClickSound();
    if (!currentUser || currentUser.phone !== "01061032507") {
        showTopToast('الأكاديمية قيد التجهيز والبناء حالياً.. ترقبوا العظمة قريباً! ⏳🔥', 'info');
        return;
    }
    navigateTo('view-engineer-hub', 'مكتبة مهندس الجودة', 'المهارات وسوق العمل');
}

// ================= محتوى مسار أساسيات الجودة وسلامة الغذاء =================
const engBasicsLessons = {
    part1: {
        title: "01. افهم الأساسيات بقوة",
        icon: "🌱",
        desc: "Quality vs Food Safety, QA vs QC, Hazard vs Risk",
        content: `
        <div class="lesson-content-box">
            <h4>يعني إيه جودة (Quality)؟</h4>
            <p>الجودة ببساطة هي <b>تلبية متطلبات العميل باستمرار</b> وخلو المنتج من العيوب المظهرية والوظيفية. ليس بالضرورة أن يكون المنتج الأغلى، بل الأطابق للمواصفة المحددة.</p>
            <div class="lesson-highlight">💡 <b>مثال من المصنع:</b> إنتاج عصير مانجو بلون برتقالي زاهٍ ونسبة سكر (Brix) مطابقة تماماً للمكتوب على العبوة. إذا كان اللون باهتاً، فهذا عيب جودة (Quality Defect).</div>
        </div>

        <div class="lesson-content-box">
            <h4>يعني إيه سلامة غذاء (Food Safety)؟</h4>
            <p>هي الضمان واليقين بأن الغذاء لن يسبب أي ضرر (مرض أو إصابة) للمستهلك عند إعداده أو تناوله.</p>
            <div class="lesson-danger">⚠️ <b>الفرق الجوهري:</b> الجودة تؤثر على (مبيعات وسمعة الشركة)، بينما سلامة الغذاء تؤثر على (حياة الإنسان). العصير ذو اللون الباهت (مشكلة جودة)، لكن العصير الملوث ببكتيريا السالمونيلا (مشكلة سلامة غذاء مميتة).</div>
        </div>

        <div class="lesson-content-box">
            <h4>QA vs QC (توكيد الجودة ومراقبتها)</h4>
            <p><b>توكيد الجودة (QA):</b> هو نظام <b>إداري استباقي (Proactive)</b>. هدفه "منع" الخطأ قبل وقوعه. يشمل تدريب العمال، تصميم خطة الهاسب، ومعايرة الأجهزة.<br>
            <b>مراقبة الجودة (QC):</b> هو نظام <b>تنفيذي تفاعلي (Reactive)</b>. هدفه "اكتشاف" الخطأ. يشمل سحب عينات من خط الإنتاج وتحليلها في المعمل.</p>
        </div>

        <div class="lesson-content-box">
            <h4>Hazard vs Risk (الخطر والمخاطرة)</h4>
            <p><b>الخطر (Hazard):</b> هو أي عامل (بيولوجي، كيميائي، فيزيائي) لديه "القدرة" على إحداث ضرر صحي. (مثال: وجود بكتيريا في اللبن الخام).<br>
            <b>المخاطرة (Risk):</b> هي "احتمالية" حدوث هذا الضرر مضروبة في مدى شدته (Likelihood × Severity). (مثال: شرب اللبن الخام دون بسترته يمثل Risk عالٍ جداً).</p>
        </div>`
    },
    part2: {
        title: "02. ما هي مخاطر الغذاء؟",
        icon: "🛡️",
        desc: "Biological, Chemical, Physical, Allergens",
        content: `
        <div class="lesson-content-box">
            <h4>1. المخاطر البيولوجية (Biological Hazards) 🦠</h4>
            <p>أخطر أنواع الملوثات على الإطلاق لأنها لا تُرى بالعين المجردة وتتكاثر بسرعة.</p>
            <div class="lesson-danger"><b>تشمل:</b> البكتيريا الممرضة (مثل E.coli، Salmonella، Listeria)، الفيروسات، الفطريات والطفيليات.<br><b>مثال من المصنع:</b> تلوث اللبن المبستر بالبكتيريا بسبب عدم غسل خطوط الإنتاج (CIP) بشكل صحيح.</div>
        </div>

        <div class="lesson-content-box">
            <h4>2. المخاطر الكيميائية (Chemical Hazards) 🧪</h4>
            <p>سموم ومواد كيميائية قد تلوث المنتج أثناء الزراعة أو التصنيع.</p>
            <div class="lesson-danger"><b>تشمل:</b> متبقيات المبيدات، المضادات الحيوية في الألبان، السموم الفطرية (الأفلاتوكسين)، وبقايا منظفات الـ CIP.<br><b>مثال من المصنع:</b> عدم شطف التنكات جيداً بالماء بعد دورة التعقيم بالصودا الكاوية.</div>
        </div>

        <div class="lesson-content-box">
            <h4>3. المخاطر الفيزيائية (Physical Hazards) 🪨</h4>
            <p>أجسام غريبة ملموسة قد تسبب جروحاً أو اختناقاً للمستهلك.</p>
            <div class="lesson-danger"><b>تشمل:</b> شظايا الزجاج، قطع المعادن، المسامير، الخشب، البلاستيك الصلب.<br><b>مثال من المصنع:</b> سقوط صامولة من ماكينة التعبئة داخل العبوة.</div>
        </div>

        <div class="lesson-content-box">
            <h4>4. مسببات الحساسية (Allergens) 🥜</h4>
            <p>بروتينات طبيعية في بعض الأغذية تسبب رد فعل مناعي مميت لبعض الأشخاص.</p>
            <div class="lesson-highlight"><b>أشهرها (The Big 8):</b> الفول السوداني، المكسرات، الألبان، البيض، الأسماك، القشريات، الصويا، القمح.<br><b>الإجراء المطلوب:</b> فصل خطوط الإنتاج، غسيل مكثف، وكتابة تحذير واضح على البطاقة الإرشادية.</div>
        </div>`
    },
    part3: {
        title: "03. الممارسات الصحية والـ GMP",
        icon: "🧼",
        desc: "Personal Hygiene, Cleaning vs Sanitizing",
        content: `
        <div class="lesson-content-box">
            <h4>النظافة الشخصية (Personal Hygiene)</h4>
            <p>العامل البشري هو الملوث رقم 1 في المصنع. لذا يشترط:<br>
            - <b>غسيل اليدين:</b> بالماء والصابون لمدة 20 ثانية قبل دخول صالة الإنتاج وبعد استخدام الحمام.<br>
            - <b>الزي الواقي:</b> ارتداء البالطو/الأفرول النظيف، غطاء الرأس (Hairnet) يغطي الأذن والشعر بالكامل، وغطاء اللحية.<br>
            - <b>الممنوعات:</b> يمنع تماماً ارتداء المجوهرات والساعات، الأظافر الطويلة، وتناول الطعام أو التدخين داخل صالة الإنتاج.</p>
        </div>

        <div class="lesson-content-box">
            <h4>Cleaning 🆚 Sanitizing</h4>
            <p><b>التنظيف (Cleaning):</b> هو الإزالة الفيزيائية للأوساخ، الدهون، وبقايا الطعام باستخدام المنظفات (مثل إزالة بقعة دهن من على سطح الماكينة).<br>
            <b>التطهير (Sanitizing):</b> هي الخطوة التي تلي التنظيف، وتهدف إلى خفض عدد الميكروبات غير المرئية إلى مستوى آمن باستخدام الحرارة أو المواد الكيميائية (مثل الكلور).</p>
            <div class="lesson-highlight">💡 <b>قاعدة ذهبية:</b> لا يمكن تطهير سطح متسخ! يجب التنظيف أولاً ثم التطهير.</div>
        </div>

        <div class="lesson-content-box">
            <h4>GMP & GHP</h4>
            <p><b>GMP (ممارسات التصنيع الجيد):</b> اشتراطات شاملة تغطي تصميم المبنى، صيانة المعدات، التحكم في المياه، وتدريب العمال لضمان بيئة تصنيع آمنة.<br>
            <b>GHP (الممارسات الصحية الجيدة):</b> جزء من الـ GMP يركز بشكل خاص وحصري على النظافة والتطهير.</p>
        </div>`
    },
    part4: {
        title: "04. افهم دورة المصنع",
        icon: "🏭",
        desc: "من استلام الخامة حتى التوزيع",
        content: `
        <div class="lesson-content-box">
            <h4>دورة حياة المنتج والمخاطر المحتملة</h4>
            <p>لا تقتصر جودة المصنع على المعمل فقط، إليك رحلة المنتج من البداية للنهاية:</p>
            
            <div class="factory-timeline">
                <div class="timeline-step">
                    <div class="timeline-title">1. استلام المواد الخام (Receiving)</div>
                    <div class="timeline-desc"><b>التفتيش على:</b> حرارة سيارة النقل، سلامة العبوات، الصلاحية، والمواصفات الميكروبيولوجية.<br><b>المخاطر:</b> استلام لبن به مضادات حيوية أو حرارته مرتفعة.</div>
                </div>
                
                <div class="timeline-step">
                    <div class="timeline-title">2. التخزين (Storage)</div>
                    <div class="timeline-desc"><b>التفتيش على:</b> تطبيق نظام الوارد أولاً يصرف أولاً (FIFO)، والوارد ينتهي أولاً يصرف أولاً (FEFO).<br><b>المخاطر:</b> تلوث تبادلي لعدم الفصل، أو فساد لارتفاع حرارة الثلاجات.</div>
                </div>

                <div class="timeline-step">
                    <div class="timeline-title">3. التصنيع والمعاملة (Processing)</div>
                    <div class="timeline-desc"><b>التفتيش على:</b> النقاط الحرجة كالحرارة والوقت (مثل البسترة 72م لمدة 15ث).<br><b>المخاطر:</b> بقاء الميكروبات الممرضة بسبب انخفاض حرارة البسترة.</div>
                </div>

                <div class="timeline-step">
                    <div class="timeline-title">4. التعبئة والتغليف (Packaging)</div>
                    <div class="timeline-desc"><b>التفتيش على:</b> جودة لحام العبوة، طباعة تاريخ الإنتاج، والوزن.<br><b>المخاطر:</b> تسريب العبوة مما يؤدي لتلوث المنتج بعد البسترة.</div>
                </div>

                <div class="timeline-step" style="margin-bottom:0;">
                    <div class="timeline-title">5. التوزيع (Distribution)</div>
                    <div class="timeline-desc"><b>التفتيش على:</b> سلسلة التبريد السليمة (Cold Chain).</div>
                </div>
            </div>
        </div>`
    },
    part5: {
        title: "05. مصطلحات لازم تعرفها",
        icon: "🧠",
        desc: "أهم المفردات الأساسية",
        content: `
        <div class="lesson-content-box" style="text-align: center;">
            <p style="margin-bottom: 15px; font-weight: 700;">إليك قائمة سريعة لأهم المصطلحات المتداولة يومياً في المصانع:</p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; text-align: right; direction: ltr; margin-bottom: 20px;">
                <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; border: 1px solid var(--border-card);"><b>Conformity:</b> مطابقة</div>
                <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; border: 1px solid var(--border-card);"><b>Defect:</b> عيب جودة</div>
                <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; border: 1px solid var(--border-card);"><b>Contamination:</b> تلوث</div>
                <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; border: 1px solid var(--border-card);"><b>Monitoring:</b> مراقبة/رصد</div>
                <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; border: 1px solid var(--border-card);"><b>Control Measure:</b> إجراء تحكم</div>
                <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; border: 1px solid var(--border-card);"><b>Specification:</b> مواصفة</div>
            </div>
            <button class="btn-submit" onclick="openEngModule('dictionary')">🔍 فتح قاموس الجودة الشامل</button>
        </div>`
    },
    part6: {
        title: "06. التلوث التبادلي",
        icon: "⚠️",
        desc: "Cross Contamination",
        content: `
        <div class="lesson-content-box">
            <h4>ما هو التلوث التبادلي (Cross Contamination)؟</h4>
            <p>هو انتقال البكتيريا أو مسببات الحساسية من مادة ملوثة (عادة مادة خام) إلى طعام آمن (منتج نهائي) عبر وسط ناقل.</p>
            <div class="lesson-danger"><b>الوسط الناقل قد يكون:</b><br>- الأيدي العاملة غير المغسولة.<br>- الأسطح والمعدات (استخدام نفس السكين لتقطيع لحم نيء ثم جبن).<br>- الهواء وتيارات التكييف داخل المصنع.</div>
        </div>
        
        <div class="scenario-card" style="border-color: #3b82f6;">
            <div class="scenario-q">❓ سؤال تفاعلي:<br>عامل لمس لحوماً نيئة، ثم قام بتعبئة منتج مطبوخ ونهائي بدون غسل يديه أو تغيير القفازات. ما هو نوع المشكلة؟</div>
            <button class="scenario-btn" onclick="revealScenarioAns('ans-cross')">اظهار الإجابة الصحيحة</button>
            <div id="ans-cross" class="scenario-ans" style="color: #3b82f6;">✅ الإجابة: تلوث تبادلي (Cross-Contamination). الأيدي كانت الوسط الذي نقل البكتيريا من الخام للنهائي.</div>
        </div>`
    },
    part7: {
        title: "07. فكر كمهندس جودة",
        icon: "🎯",
        desc: "محاكاة لسيناريوهات من قلب المصنع",
        content: `
        <div class="lesson-content-box">
            <p>الواقع في المصانع ليس أسود وأبيض فقط. اختبر مهاراتك في اتخاذ القرار:</p>
            
            <div class="scenario-card">
                <div class="scenario-q">🏭 الحالة الأولى:<br>أثناء جولتك التفقدية في صالة الإنتاج، وجدت عاملاً يقوم بالتعبئة وهو لا يرتدي غطاء الرأس (Hairnet). ماذا تفعل وما نوع المخالفة؟</div>
                <button class="scenario-btn" onclick="revealScenarioAns('scen1')">تحليل الموقف</button>
                <div id="scen1" class="scenario-ans">
                    <b>الإجراء:</b> إيقاف العامل فوراً وإلزامه بارتداء غطاء الرأس.<br>
                    <b>المشكلة:</b> مخالفة لمتطلبات الـ Personal Hygiene وممارسات (GMP). الشعر يعتبر خطر فيزيائي (Physical Hazard) وقد يحمل ميكروبات تمثل خطراً بيولوجياً.
                </div>
            </div>

            <div class="scenario-card">
                <div class="scenario-q">🏭 الحالة الثانية:<br>وجدت كرتونة تحتوي على عبوات لبن معقم (UHT) تسرب منتجاً على الأرضية. هل هذه مشكلة Quality (جودة) أم Food Safety (سلامة غذاء)؟</div>
                <button class="scenario-btn" onclick="revealScenarioAns('scen2')">تحليل الموقف</button>
                <div id="scen2" class="scenario-ans">
                    قد تكون <b>مشكلة جودة (Quality)</b> في البداية (عيب في ماكينة اللحام أدى لسوء شكل العبوة).<br>
                    ولكنها <b>تتحول فوراً لمشكلة سلامة غذاء (Food Safety)</b> لأن التسريب يعني فتح مسار لدخول البكتيريا للمنتج المعقم وإفساده، مما يضر بالمستهلك.
                </div>
            </div>

            <div class="scenario-card">
                <div class="scenario-q">🏭 الحالة الثالثة:<br>جهاز كشف المعادن (Metal Detector) أطلق إنذاراً واستبعد عبوة لحوم أثناء الإنتاج. هل تقوم بتمرير العبوة مرة أخرى لتتأكد؟</div>
                <button class="scenario-btn" onclick="revealScenarioAns('scen3')">تحليل الموقف</button>
                <div id="scen3" class="scenario-ans">
                    <b>ممنوع تماماً!</b> العبوة المستبعدة توضع فوراً في صندوق المرفوضات المغلق (Hold).<br>يتم إيقاف الخط، والبحث عن مصدر القطعة المعدنية وإجراء تحقيق كامل (Root Cause Analysis). تمريرها مرة أخرى قد يؤدي لعدم استشعارها وتمرير الخطر للمستهلك.
                </div>
            </div>
        </div>`
    }
};

// دالة توجيه المحرك الشامل
// دالة توجيه المحرك الشامل
function openEngModule(moduleId) {
    playClickSound();
    
    // سحب الداتا من فايربيز بدل الكود الثابت
    if (moduleId === 'basics') {
        const listDiv = document.getElementById('eng-basics-lessons-list');
        listDiv.innerHTML = '<p style="text-align:center;">جاري تحميل الدروس...</p>';
        
        db.ref('eng_academy/basics').once('value', snap => {
            listDiv.innerHTML = '';
            if(!snap.exists()) {
                // الهجرة التلقائية لأول مرة (رفع الداتا القديمة لفايربيز)
                if(typeof engBasicsLessons !== 'undefined') {
                    db.ref('eng_academy/basics').set(engBasicsLessons);
                    showTopToast('تم ربط قاعدة بيانات الأكاديمية، افتح القسم مرة أخرى.', 'info');
                }
                return;
            }

            snap.forEach(child => {
                const lessonKey = child.key;
                const lesson = child.val();
                listDiv.innerHTML += `
                <div class="eng-path-card" onclick="openEngLessonCloud('${lessonKey}')">
                    <div class="eng-path-icon">${lesson.icon}</div>
                    <div class="eng-path-text">
                        <h4>${lesson.title}</h4>
                        <p>${lesson.desc}</p>
                    </div>
                </div>`;
            });
        });

        navigateTo('view-eng-basics-hub', 'أساسيات الجودة', 'المسار التعليمي');
        return;
    }

// (ضع هذا الشرط أسفل شرط 'basics' مباشرة في دالة openEngModule)
    if (moduleId === 'haccp') {
        navigateTo('view-eng-haccp-master', 'نظام HACCP', 'أقسام وتطبيقات الهاسب');
        return;
    }

    // باقي الأقسام كما هي
    const data = engAcademyDB[moduleId];
    if (!data) { showTopToast('جاري التجهيز! ⏳', 'info'); return; }

    document.getElementById('eng-module-title').innerText = data.title;
    document.getElementById('eng-module-desc').innerText = data.desc;
    document.getElementById('eng-module-icon').innerText = data.icon;
    const contentArea = document.getElementById('eng-module-content-area');
    contentArea.innerHTML = '';

    if (data.type === "dictionary") {
        contentArea.innerHTML = `<input type="text" id="eng-dict-search" class="eng-search-bar" placeholder="ابحث بالمصطلح أو الاختصار..." onkeyup="filterEngDictionary()"><div id="eng-dict-results"></div>`;
        window.currentDictData = data.content; filterEngDictionary();
    }
    else if (data.type === "comparisons") {
        let html = '';
        data.content.forEach(comp => {
            html += `<div class="eng-compare-card"><div class="eng-compare-header">${comp.title}</div><div class="eng-compare-body"><div class="eng-compare-side right">${comp.sideA}</div><div class="eng-compare-side">${comp.sideB}</div></div></div>`;
        });
        contentArea.innerHTML = html;
    }
    else if (data.type === "lab") { contentArea.innerHTML = renderEngLabHTML(); }

    navigateTo('view-eng-sub-section', data.title, 'أكاديمية المهندس');
}

// فتح الدرس من الكلاود
function openEngLessonCloud(lessonKey) {
    playClickSound();
    db.ref('eng_academy/basics/' + lessonKey).once('value', snap => {
        if(!snap.exists()) return;
        const lesson = snap.val();
        document.getElementById('lesson-detail-title').innerText = lesson.title;
        document.getElementById('lesson-detail-content').innerHTML = lesson.content;
        navigateTo('view-eng-lesson-detail', 'أساسيات الجودة', lesson.title);
    });
}

// دالة إظهار إجابات السيناريوهات التفاعلية
function revealScenarioAns(id) {
    playClickSound();
    const ansDiv = document.getElementById(id);
    if (ansDiv) {
        if (ansDiv.style.display === 'block') {
            ansDiv.style.display = 'none';
        } else {
            ansDiv.style.display = 'block';
            ansDiv.style.animation = 'popInBounce 0.4s ease'; // تأثير ظهرو ناعم
        }
    }
}

// محرك بحث القاموس اللحظي
function filterEngDictionary() {
    const query = document.getElementById('eng-dict-search').value.toLowerCase().trim();
    const resultsBox = document.getElementById('eng-dict-results');
    let html = '';
    
    window.currentDictData.forEach(item => {
        if (item.term.toLowerCase().includes(query) || item.ar.includes(query)) {
            html += `
            <div class="eng-dict-item">
                <div class="eng-dict-term">${item.term}</div>
                <div class="eng-dict-ar">${item.ar}</div>
                <div class="eng-dict-def">${item.def}</div>
            </div>`;
        }
    });
    
    if(html === '') html = '<p style="text-align:center; color:var(--text-sub);">لم يتم العثور على مصطلح مطابق.</p>';
    resultsBox.innerHTML = html;
}

// واجهة المعمل المصغر
function renderEngLabHTML() {
    return `
    <div class="auth-card" style="margin-bottom:15px; text-align:right;">
        <h4 style="color:var(--accent-emerald); margin-bottom:10px;">⚖️ مربع بيرسون (توحيد نسبة الدهن)</h4>
        <div class="form-group"><label>نسبة الدهن في اللبن (الضعيف) %</label><input type="number" id="pearson-milk" class="form-input" placeholder="مثال: 3"></div>
        <div class="form-group"><label>نسبة الدهن في القشدة (القوي) %</label><input type="number" id="pearson-cream" class="form-input" placeholder="مثال: 40"></div>
        <div class="form-group"><label>النسبة المطلوبة في المخلوط %</label><input type="number" id="pearson-target" class="form-input" placeholder="مثال: 5"></div>
        <button class="btn-submit" onclick="calcPearson()">احسب النسب 🧮</button>
        <div id="pearson-res" style="margin-top:15px; font-weight:800; color:var(--accent-gold); line-height: 1.6;"></div>
    </div>
    
    <div class="auth-card" style="text-align:right;">
        <h4 style="color:var(--accent-emerald); margin-bottom:10px;">🧪 حساب الحموضة (اللاكتيك)</h4>
        <div class="form-group"><label>حجم المستهلك من السحاحة (ملي)</label><input type="number" id="acid-v" class="form-input" placeholder="مثال: 2.5"></div>
        <div class="form-group"><label>وزن/حجم العينة</label><input type="number" id="acid-w" class="form-input" placeholder="مثال: 10"></div>
        <button class="btn-submit" onclick="calcAcidity()">احسب الحموضة 🧮</button>
        <div id="acid-res" style="margin-top:15px; font-weight:900; color:var(--accent-gold); font-size: 1.1rem;"></div>
    </div>
    `;
}

// دوال حسابات المعمل
function calcPearson() {
    playClickSound();
    const m = parseFloat(document.getElementById('pearson-milk').value);
    const c = parseFloat(document.getElementById('pearson-cream').value);
    const t = parseFloat(document.getElementById('pearson-target').value);
    if (isNaN(m) || isNaN(c) || isNaN(t)) return showTopToast('أدخل جميع النسب!', 'error');
    if (t <= m || t >= c) return showTopToast('النسبة المطلوبة بين اللبن والقشدة!', 'error');
    const mP = Math.abs(c - t), cP = Math.abs(t - m), tot = mP + cP;
    document.getElementById('pearson-res').innerHTML = `
    أجزاء اللبن: ${mP.toFixed(2)} | أجزاء القشدة: ${cP.toFixed(2)}<br>
    <span style="color:#fff;">لعمل 100 كجم:</span> ${(mP/tot*100).toFixed(1)} كجم لبن، و ${(cP/tot*100).toFixed(1)} كجم قشدة.`;
}

function calcAcidity() {
    playClickSound();
    const v = parseFloat(document.getElementById('acid-v').value);
    const w = parseFloat(document.getElementById('acid-w').value);
    if (isNaN(v) || isNaN(w) || w === 0) return showTopToast('أدخل البيانات صحيحة!', 'error');
    document.getElementById('acid-res').innerHTML = `نسبة الحموضة: ${((v * 0.1 * 0.090 / w) * 100).toFixed(3)} %`;
}
// ================= دوال إدارة الأكاديمية (أدمن) =================

// دالة عرض دروس الأكاديمية في لوحة التحكم بشكل آمن وسريع
function loadAdminAcademyLessons() {
    const list = document.getElementById('admin-academy-list');
    if (!list) return;
    
    list.innerHTML = '<p style="text-align:center; color: var(--text-sub);">جاري التحميل...</p>';
    
    db.ref('eng_academy/basics').once('value').then(snap => {
        list.innerHTML = '';
        if(!snap.exists()) { 
            list.innerHTML = '<p style="text-align:center; color: var(--text-sub);">لا توجد دروس مسجلة بالسيرفر حتى الآن.</p>'; 
            return; 
        }
        
        let html = '';
        snap.forEach(child => {
            const id = child.key;
            const data = child.val();
            html += `
            <div class="admin-item-card">
                <div class="admin-item-info">
                    <div class="admin-item-name">${data.icon || '📘'} ${data.title || 'بدون عنوان'}</div>
                    <div class="admin-item-sub">${data.desc || ''}</div>
                </div>
                <div style="display: flex; gap: 6px; flex-direction: column;">
                    <button class="admin-action-btn" style="padding: 4px 8px; font-size: 0.7rem;" onclick="editAdminAcademyLesson('${id}')">تعديل ✏️</button>
                    <button class="admin-action-btn danger" style="padding: 4px 8px; font-size: 0.7rem;" onclick="deleteAdminAcademyLesson('${id}')">حذف 🗑️</button>
                </div>
            </div>`;
        });
        list.innerHTML = html;
    }).catch(err => {
        list.innerHTML = '<p style="text-align:center; color: #ef4444;">حدث خطأ في الاتصال بالسيرفر.</p>';
    });
}

// الإدراج السريع للقوالب (Magic Builder)
function insertAcademyBlock(type) {
    const textarea = document.getElementById('adm-acad-content');
    let snippet = '';
    const uniqueId = 'ans_' + Math.floor(Math.random() * 100000); // توليد ID عشوائي للسيناريوهات

    if(type === 'box') {
        snippet = `\n<div class="lesson-content-box">\n    <h4>عنوان الفقرة</h4>\n    <p>اكتب الشرح هنا...</p>\n</div>\n`;
    } else if (type === 'highlight') {
        snippet = `\n<div class="lesson-highlight">💡 <b>معلومة هامة:</b> اكتب الملاحظة هنا...</div>\n`;
    } else if (type === 'danger') {
        snippet = `\n<div class="lesson-danger">⚠️ <b>تحذير:</b> اكتب التحذير هنا...</div>\n`;
    } else if (type === 'scenario') {
        snippet = `\n<div class="scenario-card" style="border-color: #3b82f6;">\n    <div class="scenario-q">❓ سؤال تفاعلي:<br>اكتب الموقف هنا...</div>\n    <button class="scenario-btn" onclick="revealScenarioAns('${uniqueId}')">إظهار الإجابة الصحيحة</button>\n    <div id="${uniqueId}" class="scenario-ans" style="color: #3b82f6;">✅ الإجابة: اكتب الحل هنا...</div>\n</div>\n`;
    } else if (type === 'timeline') {
        snippet = `\n<div class="factory-timeline">\n    <div class="timeline-step">\n        <div class="timeline-title">اسم المرحلة</div>\n        <div class="timeline-desc"><b>التفتيش على:</b> ...<br><b>المخاطر:</b> ...</div>\n    </div>\n</div>\n`;
    }

    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    textarea.value = textarea.value.substring(0, startPos) + snippet + textarea.value.substring(endPos, textarea.value.length);
    textarea.focus();
}

function editAdminAcademyLesson(id) {
    playClickSound();
    db.ref('eng_academy/basics/' + id).once('value', snap => {
        if(!snap.exists()) return;
        const data = snap.val();
        document.getElementById('adm-acad-id').value = id;
        document.getElementById('adm-acad-title').value = data.title;
        document.getElementById('adm-acad-icon').value = data.icon;
        document.getElementById('adm-acad-desc').value = data.desc;
        document.getElementById('adm-acad-content').value = data.content;
        
        document.getElementById('adm-acad-title').focus();
        showTopToast('تم جلب بيانات الدرس، يمكنك التعديل الآن.', 'info');
    });
}

function adminSaveAcademyLesson() {
    playClickSound();
    const idField = document.getElementById('adm-acad-id').value.trim();
    // لو مفيش ID، نعمل واحد جديد (درس جديد)
    const finalId = idField !== '' ? idField : 'lesson_' + Date.now();
    
    const title = document.getElementById('adm-acad-title').value.trim();
    const icon = document.getElementById('adm-acad-icon').value.trim() || '📘';
    const desc = document.getElementById('adm-acad-desc').value.trim();
    const content = document.getElementById('adm-acad-content').value.trim();

    if(!title || !content) { showTopToast('يرجى كتابة العنوان والمحتوى على الأقل!', 'error'); return; }

    db.ref('eng_academy/basics/' + finalId).update({ title, icon, desc, content }).then(() => {
        showTopToast('تم حفظ ونشر الدرس بنجاح! ✅', 'success');
        resetAcademyAdminForm();
    });
}

function deleteAdminAcademyLesson(id) {
    if(confirm('هل أنت متأكد من حذف هذا الدرس نهائياً؟')) {
        db.ref('eng_academy/basics/' + id).remove().then(() => showTopToast('تم الحذف بنجاح.', 'info'));
    }
}

function resetAcademyAdminForm() {
    document.getElementById('adm-acad-id').value = '';
    document.getElementById('adm-acad-title').value = '';
    document.getElementById('adm-acad-icon').value = '';
    document.getElementById('adm-acad-desc').value = '';
    document.getElementById('adm-acad-content').value = '';
}
// دالة التنقل داخل بيئة الهاسب
function switchHaccpTab(tabId, clickedBtn) {
    playClickSound();
    
    // إزالة التفعيل من كل الأزرار
    document.querySelectorAll('.haccp-tab-btn').forEach(btn => btn.classList.remove('active'));
    // إخفاء كل المحتوى
    document.querySelectorAll('.haccp-content-pane').forEach(pane => pane.classList.remove('active'));
    
    // تفعيل الزر المضغوط والمحتوى المطلوب
    clickedBtn.classList.add('active');
    document.getElementById('haccp-pane-' + tabId).classList.add('active');
    
    // عمل Scroll ناعم للزر ليكون في المنتصف عند الضغط (للهواتف)
    clickedBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
}

// ============================================================================
// ===================== محرك تحدي المستويات الـ 50 الجديد =======================
// ============================================================================

let pendingLevelStart = 1;
let isLevelBossActive = false;
let currentLevelPlaying = 1;
let currentLevelStarsEarned = 0;
let currentQuestionStars = 0;
let cooldownTickerInterval = null;

let globalLevelsConfig = {}; 
let globalBossConfig = { cooldownHours: 12, skipCost: 50 };

// 1. قراءة إعدادات المستويات المحفوظة في ذاكرة الهاتف أولاً
const localLevelsCfg = localStorage.getItem('local_levels_config');
if (localLevelsCfg) {
    try {
        const parsed = JSON.parse(localLevelsCfg);
        if (parsed.levels) globalLevelsConfig = parsed.levels;
        if (parsed.boss) globalBossConfig = parsed.boss;
    } catch(e) {}
}

// 1. الاستماع المباشر للسحابة وتحديث الكاش المحلي فورياً
db.ref('levels_config').on('value', snap => {
    if (snap.exists()) {
        const data = snap.val();
        localStorage.setItem('local_levels_config', JSON.stringify(data));
        if (data.levels) globalLevelsConfig = data.levels;
        if (data.boss) globalBossConfig = data.boss;
        // تحديث خريطة المستويات فوراً إذا كانت مفتوحة
        if (typeof renderLevelsGridUI === 'function') renderLevelsGridUI();
    }
});

// 2. دالة جلب النجوم المطلوبة للمستوى (تعتمد حصرياً على ما تحفظه أنت)
function getLevelReqStars(level) {
    if (level === 1) return 0;
    if (globalLevelsConfig && globalLevelsConfig[level] && globalLevelsConfig[level].reqStars !== undefined) {
        return parseInt(globalLevelsConfig[level].reqStars);
    }
    // قيمة افتراضية ثابتة فقط إذا لم تكن قد حددت قيمة بنفسك بعد
    return (level - 1) * 20;
}

// 3. دالة جلب مكافآت المستوى (XP والعملات التي تحددها أنت فقط)
function getLevelRewards(level) {
    if (globalLevelsConfig && globalLevelsConfig[level]) {
        return {
            xp: globalLevelsConfig[level].rewardXP !== undefined ? parseInt(globalLevelsConfig[level].rewardXP) : 0,
            coins: globalLevelsConfig[level].rewardCoins !== undefined ? parseInt(globalLevelsConfig[level].rewardCoins) : 0
        };
    }
    // قيم افتراضية ثابتة بدون معادلات تغير الأرقام عشوائياً
    return { xp: 50, coins: 10 };
}

// 2. دوال لوحة تحكم الأدمن
function loadAdminSingleLevelConfig() {
    const lvl = parseInt(document.getElementById('adm-specific-lvl').value);
    if (!lvl || lvl < 1 || lvl > 50) return;

    // جلب القيم من السيرفر مباشرة لتفادي أي تضارب
    db.ref(`levels_config/levels/${lvl}`).once('value').then(snap => {
        if (snap.exists()) {
            const data = snap.val();
            document.getElementById('adm-specific-stars').value = data.reqStars !== undefined ? data.reqStars : 0;
            document.getElementById('adm-specific-xp').value = data.rewardXP !== undefined ? data.rewardXP : 0;
            document.getElementById('adm-specific-coins').value = data.rewardCoins !== undefined ? data.rewardCoins : 0;
        } else {
            // لو المستوى لسه لم يتم حفظ بيانات مخصصة له
            document.getElementById('adm-specific-stars').value = getLevelReqStars(lvl);
            const rew = getLevelRewards(lvl);
            document.getElementById('adm-specific-xp').value = rew.xp;
            document.getElementById('adm-specific-coins').value = rew.coins;
        }
    });
}

function saveAdminSingleLevelConfig() {
    playClickSound();
    const lvl = parseInt(document.getElementById('adm-specific-lvl').value);
    if (!lvl || lvl < 1 || lvl > 50) { 
        showTopToast('يرجى اختيار مستوى صحيح (1-50)', 'error'); 
        return; 
    }

    const reqStars = parseInt(document.getElementById('adm-specific-stars').value) || 0;
    const rewardXP = parseInt(document.getElementById('adm-specific-xp').value) || 0;
    const rewardCoins = parseInt(document.getElementById('adm-specific-coins').value) || 0;

    const levelData = { reqStars, rewardXP, rewardCoins };

    // تثبيت محلي فوري
    if (!globalLevelsConfig) globalLevelsConfig = {};
    globalLevelsConfig[lvl] = levelData;
    localStorage.setItem('local_levels_config', JSON.stringify({ levels: globalLevelsConfig, boss: globalBossConfig }));

    // حفظ في Firebase Realtime Database
    db.ref(`levels_config/levels/${lvl}`).set(levelData).then(() => {
        showTopToast(`تم تثبيت إعدادات المستوى ${lvl} بنجاح! ولن تتغير بعد الآن ✅`, 'success');
        if (typeof renderLevelsGridUI === 'function') renderLevelsGridUI();
    }).catch(err => {
        showTopToast('حدث خطأ أثناء الحفظ بالسيرفر!', 'error');
    });
}

function saveAdminBossGeneralConfig() {
    playClickSound();
    const cooldownHours = parseInt(document.getElementById('adm-lvl-cooldown-hrs').value) || 12;
    const skipCost = parseInt(document.getElementById('adm-lvl-skip-cost').value) || 50;

    db.ref('levels_config/boss').set({ cooldownHours, skipCost }).then(() => {
        showTopToast('تم حفظ إعدادات الزعماء (الكول داون) ⚙️', 'success');
    });
}

function uploadBulkRiskQuestions() {
    playClickSound();
    const rawText = document.getElementById('admin-risk-bulk-input').value.trim();
    if (!rawText) { showTopToast('يرجى لصق الأسئلة أولاً!', 'error'); return; }

    const lines = rawText.split('\n');
    let addedCount = 0;
    const updates = {};

    lines.forEach(line => {
        const parts = line.split('#').map(p => p.trim());
        if (parts.length === 4) {
            const [cat, ptsStr, qText, ansText] = parts;
            const pts = parseInt(ptsStr);
            if (cat && !isNaN(pts) && qText && ansText) {
                const newKey = db.ref('risk_questions').push().key;
                updates[newKey] = { category: cat, points: pts, q: qText, a: ansText };
                addedCount++;
            }
        }
    });

    if (addedCount === 0) {
        showTopToast('تأكد من كتابة الصيغة الصحيحة مفصولة بـ #', 'error'); return;
    }

    db.ref('risk_questions').update(updates).then(() => {
        document.getElementById('admin-risk-bulk-input').value = '';
        incrementQuestionsVersion('risk_questions'); // لتحديث الكاش عند كل الطلاب
        playSuccessSound();
        showTopToast(`تم رفع (${addedCount}) سؤال ريسك بنجاح! ⚡`, 'success');
    });
}

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
        // تجاهل السطور الفاضية تماماً
        if (line.trim() === '') return;
        
        const parts = line.split('#').map(p => p.trim());
        
        // التأكد من وجود 6 أجزاء (التصنيف + السؤال + 4 اختيارات)
        if (parts.length >= 6) {
            const [cat, qText, correct, opt1, opt2, opt3] = parts;
            formattedQuestions.push({ 
                q: qText, 
                a: [correct, opt1, opt2, opt3], 
                correct: 0, 
                categoryName: cat // 👈 تم حفظ التصنيف الفعلي هنا
            });
        }
    });

    // لو مفيش ولا سؤال اتقرأ صح، نطلع إيرور
    if (formattedQuestions.length === 0) { 
        showTopToast('صيغة خاطئة! استخدم: التصنيف # السؤال # الصح # خطأ # خطأ # خطأ', 'error'); 
        return; 
    }

    db.ref(`levels_data/level_${levelNum}/${type}`).set(formattedQuestions).then(() => {
        document.getElementById('adm-lvl-bulk-input').value = '';
        showTopToast(`تم حفظ (${formattedQuestions.length}) أسئلة بنجاح لـ ${type === 'classic' ? 'المستوى' : 'الزعيم'} ${levelNum} 🚀`, 'success');
    });
}

// 3. واجهة خريطة المستويات وبدء التحدي
function renderLevelsGridUI() {
    const container = document.getElementById('levels-grid-container');
    let html = '';
    const userLevels = (currentUser && currentUser.levels_progress) ? currentUser.levels_progress : {};
    let totalGlobalStars = 0;
    
    for(let k in userLevels) { totalGlobalStars += (userLevels[k].stars || 0); }
    
    for (let i = 1; i <= 50; i++) {
        let lvlData = userLevels[i] || { stars: 0, boss_defeated: false, cooldown: 0 };
        let isUnlocked = false;
        
        let requiredStars = getLevelReqStars(i);
        let prevBossDefeated = (i === 1) ? true : (userLevels[i-1] && userLevels[i-1].boss_defeated);
        
        if (i === 1 || (totalGlobalStars >= requiredStars && prevBossDefeated)) {
            isUnlocked = true;
        }
        
        let stateClass = 'locked';
        let starsDisplay = `قفل (${requiredStars}⭐)`;

        if (isUnlocked) {
            if (lvlData.cooldown && lvlData.cooldown > Date.now()) {
                stateClass = 'cooldown-locked'; // 👈 إعطاء الكلاس المميز الأحمر
                starsDisplay = '⏱️ راحة للزعيم';
            } else {
                stateClass = lvlData.boss_defeated ? 'completed' : 'unlocked';
                starsDisplay = `${lvlData.stars} / 30 ⭐`;
            }
        }
        
        html += `
        <div class="level-node ${stateClass}" onclick="startLevelNode(${i}, '${stateClass}')">
            <div class="level-number">${i}</div>
            <div class="level-lock-icon">${lvlData.cooldown && lvlData.cooldown > Date.now() ? '⏱️' : '🔒'}</div>
            <div class="level-stars" style="font-size: 0.95rem; font-weight: 900; color: var(--accent-gold); margin-top: 5px;">
                ${starsDisplay}
            </div>
        </div>`;
    }
    container.innerHTML = html;
    document.getElementById('total-stars-display').innerText = totalGlobalStars;
if (currentUser) {
        const mapXp = document.getElementById('map-xp-display');
        const mapCoins = document.getElementById('map-coins-display');
        if (mapXp) mapXp.innerText = currentUser.xp || currentUser.points || 0;
        if (mapCoins) mapCoins.innerText = currentUser.coins || 0;
    }
}

function generateMockQuestionsForLevel(levelNum, count) {
    let mock = [];
    for(let i=1; i<=count; i++) {
        mock.push({
            q: `هذا سؤال تجريبي رقم ${i} للمستوى ${levelNum}. اختر الإجابة الصحيحة.`,
            a: [`الإجابة الصحيحة ${levelNum}-${i}`, `خطأ A`, `خطأ B`, `خطأ C`],
            correct: 0,
            categoryName: `المستوى ${levelNum}`
        });
    }
    return mock;
}

// متغيرات تتبع استخدام المعززات في سؤال المستوى الحالي
let levelHint5050Used = false;
let levelHintTimeUsed = false;

// 4. أسئلة المستوى ومنطق احتساب النجوم والمعززات
function renderLevelQuestion() {
    isAnswerLocked = false;
    currentQuestionStars = 0;
    levelHint5050Used = false;
    levelHintTimeUsed = false;

    const container = document.getElementById('quiz-container');
    const qData = activeQuizQuestions[currentQuizIndex];
    
    if (!qData) { checkBossEligibility(); return; }

    let options = shuffleArray([...qData.a]);
    const correctText = qData.a[qData.correct || 0];
    
    // فحص رصيد الطالب من المعززات الثلاثة
    const has5050 = currentUser && (currentUser.hintsCount || 0) > 0;
    const hasTime = currentUser && (currentUser.hintTimeCount || 0) > 0;
    const hasSkip = currentUser && (currentUser.skipCount || 0) > 0;

    const btn5050Html = has5050 ? 
        `<button id="btn-lvl-5050" class="admin-action-btn" style="padding: 4px 7px; font-size: 0.72rem;" onclick="useLevelHint5050('${correctText}')">💡 50:50 (${currentUser.hintsCount})</button>` : '';

    const btnTimeHtml = hasTime ? 
        `<button id="btn-lvl-time" class="admin-action-btn" style="padding: 4px 7px; font-size: 0.72rem;" onclick="useLevelHintTime()">⏱️ +15ث (${currentUser.hintTimeCount})</button>` : '';

    const btnSkipHtml = hasSkip ? 
        `<button id="btn-lvl-skip" class="admin-action-btn" style="padding: 4px 7px; font-size: 0.72rem; border-color: var(--accent-emerald); color: var(--accent-emerald);" onclick="useLevelSkipQuestion('${correctText}')">🚀 تخطي 3⭐ (${currentUser.skipCount})</button>` : '';

    let html = `
        <div class="section-label" style="justify-content: space-between; align-items: center; gap: 4px; flex-wrap: wrap;">
            <span>السؤال ${currentQuizIndex + 1} / 10</span>
            <div style="display: flex; gap: 4px; align-items: center;">
                ${btn5050Html}
                ${btnTimeHtml}
                ${btnSkipHtml}
            </div>
            <span style="color: var(--accent-gold); font-weight: 800;">نجومك: ${currentLevelStarsEarned} ⭐</span>
        </div>
        <div class="quiz-card">
            <div id="quiz-timer" class="quiz-timer-box">⏱️ 15</div>
            <h3 style="font-size: 1.1rem; margin-bottom: 20px; line-height: 1.5; color: var(--text-main);">${qData.q}</h3>
            <div id="options-list" style="display: flex; flex-direction: column; gap: 8px;">`;
            
    options.forEach(opt => { 
        html += `<button class="quiz-option-btn level-opt-btn" data-val="${opt}" onclick="handleLevelAnswer(this, '${opt}', '${correctText}')">${opt}</button>`; 
    });
    
    html += `</div>
            <div id="question-feedback-stars" style="text-align: center; margin-top: 15px; font-size: 1.5rem; display: none;"></div>
            <div id="next-question-area" style="margin-top: 20px; display: none;">
                <button class="btn-submit btn-action-quiz" onclick="proceedToNextLevelQuestion()">
                    ${currentQuizIndex === 9 ? 'تحقق من النجوم 🏆' : 'السؤال التالي ⬅️'}
                </button>
            </div>
        </div>`;
        
    container.innerHTML = html; 
    startLevelTimer();
}

// دالة تفعيل معزز حذف إجابتين في المستويات
function useLevelHint5050(correctText) {
    if (isAnswerLocked || levelHint5050Used) return;
    if (!currentUser || (currentUser.hintsCount || 0) <= 0) {
        showTopToast('ليس لديك معززات 50:50 متبقية!', 'error');
        return;
    }

    playSuccessSound();
    levelHint5050Used = true;
    currentUser.hintsCount -= 1;
    db.ref('users/' + currentUser.phone + '/hintsCount').set(currentUser.hintsCount);

    const btn = document.getElementById('btn-lvl-5050');
    if (btn) {
        btn.disabled = true;
        btn.innerText = `💡 50:50 (${currentUser.hintsCount})`;
    }

    const buttons = Array.from(document.querySelectorAll('.level-opt-btn'));
    const wrongButtons = buttons.filter(b => b.getAttribute('data-val') !== correctText);
    const toHide = shuffleArray(wrongButtons).slice(0, 2);

    toHide.forEach(b => {
        b.style.visibility = 'hidden';
        b.disabled = true;
    });

    showTopToast('تم حذف خيارين خاطئين بنجاح! 💡', 'info');
}

// دالة تفعيل معزز زيادة الوقت في المستويات
function useLevelHintTime() {
    if (isAnswerLocked || levelHintTimeUsed) return;
    if (!currentUser || (currentUser.hintTimeCount || 0) <= 0) {
        showTopToast('ليس لديك معزز وقت إضافي!', 'error');
        return;
    }

    playSuccessSound();
    levelHintTimeUsed = true;
    timeLeft += 15;

    const timerEl = document.getElementById('quiz-timer');
    if (timerEl) timerEl.innerHTML = `⏱️ ${timeLeft}`;

    currentUser.hintTimeCount -= 1;
    db.ref('users/' + currentUser.phone + '/hintTimeCount').set(currentUser.hintTimeCount);

    const btn = document.getElementById('btn-lvl-time');
    if (btn) {
        btn.disabled = true;
        btn.innerText = `⏱️ +15ث (${currentUser.hintTimeCount})`;
    }

    showTopToast('تمت إضافة 15 ثانية إضافية للتفكير! ⏱️🔥', 'info');
}

// دالة تفعيل معزز تخطي السؤال بـ 3 نجوم
function useLevelSkipQuestion(correctText) {
    if (isAnswerLocked) return;
    if (!currentUser || (currentUser.skipCount || 0) <= 0) {
        showTopToast('ليس لديك رصيد من معزز التخطي!', 'error');
        return;
    }

    isAnswerLocked = true;
    clearInterval(timerInterval);
    playSuccessSound();
    shootStars();
    triggerConfetti();

    currentUser.skipCount -= 1;
    db.ref('users/' + currentUser.phone + '/skipCount').set(currentUser.skipCount);

    quizScoreCount++;
    currentQuestionStars = 3;
    currentLevelStarsEarned += 3;

    // تمييز الإجابة الصحيحة وإيقاف الأزرار
    document.querySelectorAll('.level-opt-btn').forEach(btn => {
        if (btn.getAttribute('data-val') === correctText) {
            btn.classList.add('correct-choice');
        }
        btn.disabled = true;
    });

    const feedbackStars = document.getElementById('question-feedback-stars');
    feedbackStars.style.display = 'block';
    feedbackStars.innerHTML = '⭐⭐⭐<br><span style="color:var(--accent-emerald); font-weight:800; font-size:0.85rem;">تم استخدام معزز التخطي بنجاح واحتساب 3 نجوم كاملة! 🚀</span>';

    document.getElementById('next-question-area').style.display = 'block';
    showTopToast('تم تخطي السؤال بنجاح مع 3 نجوم! 🚀⭐', 'success');
}

function startLevelTimer() {
    timeLeft = 15; 
    const timerEl = document.getElementById('quiz-timer'); 
    timerEl.innerHTML = `⏱️ ${timeLeft}`; 
    timerEl.style.color = 'var(--text-main)';
    clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        timeLeft--; 
        timerEl.innerHTML = `⏱️ ${timeLeft}`; 
        if (timeLeft <= 5) timerEl.style.color = '#ef4444';
        if (timeLeft <= 0) { 
            clearInterval(timerInterval); 
            handleLevelAnswer(null, '', 'TIMEOUT'); 
        }
    }, 1000);
}

function handleLevelAnswer(buttonElem, selectedAns, correctAns) {
    if (isAnswerLocked) return; 
    isAnswerLocked = true; 
    clearInterval(timerInterval); 
    
    const isCorrect = (selectedAns === correctAns);
    const feedbackStars = document.getElementById('question-feedback-stars');
    feedbackStars.style.display = 'block';

    if (isCorrect) { 
        quizScoreCount++; 
        playSuccessSound(); 
        if (buttonElem) buttonElem.classList.add('correct-choice'); 
        
        if (timeLeft >= 10) {
            currentQuestionStars = 3;
            feedbackStars.innerHTML = '⭐⭐⭐<br><span style="font-size:0.8rem; color:var(--accent-gold);">ممتاز! سرعة بديهة خرافية</span>';
        } else if (timeLeft >= 5) {
            currentQuestionStars = 2;
            feedbackStars.innerHTML = '⭐⭐<br><span style="font-size:0.8rem; color:var(--accent-emerald);">جيد جداً! إجابة موفقة</span>';
        } else {
            currentQuestionStars = 1;
            feedbackStars.innerHTML = '⭐<br><span style="font-size:0.8rem; color:var(--text-sub);">صحيح، لكن حاول أن تكون أسرع</span>';
        }
        currentLevelStarsEarned += currentQuestionStars;
        shootStars(); 
    } else {
        playErrorSound(); 
        currentQuestionStars = 0;
        feedbackStars.innerHTML = '❌<br><span style="font-size:0.8rem; color:#ef4444;">إجابة خاطئة! لم تحصل على نجوم</span>';
        if (buttonElem) buttonElem.classList.add('wrong-choice');
        
        document.querySelectorAll('.quiz-option-btn').forEach(btn => { 
            if (btn.innerText === correctAns) { 
                btn.classList.add('correct-choice'); 
                btn.style.transform = 'scale(1)'; 
            } 
        });
    }
    
    document.querySelectorAll('.quiz-option-btn').forEach(btn => btn.disabled = true); 
    document.getElementById('next-question-area').style.display = 'block';
}

function proceedToNextLevelQuestion() { 
    playClickSound(); 
    currentQuizIndex++; 
    
    // حفظ التقدم ورقم السؤال الجديد فوراً لمنع ضياعه لو حدث ريفريش
    saveActiveQuizSession(); 

    if (currentQuizIndex < 10) {
        renderLevelQuestion(); 
    } else {
        checkBossEligibility(); 
    }
}

function checkBossEligibility() {
    isClassicQuizActive = false;
    clearInterval(timerInterval);

    // مسح الجلسة المؤقتة لأن المستوى انتهى بالفعل (عشان يرجع الزرار لوضعه الطبيعي)
    clearActiveQuizSession();

    let userLevels = (currentUser && currentUser.levels_progress) ? currentUser.levels_progress : {};
    let oldData = userLevels[currentLevelPlaying] || { stars: 0, boss_defeated: false, cooldown: 0 };
    
    // حفظ النجوم بشكل قاطع وفوري بمجرد إنهاء الـ 10 أسئلة
    let updatedStars = Math.max(oldData.stars || 0, currentLevelStarsEarned);
    userLevels[currentLevelPlaying] = { ...oldData, stars: updatedStars };
    
    if (currentUser) {
        currentUser.levels_progress = userLevels;
        db.ref('users/' + currentUser.phone + '/levels_progress').set(userLevels);
    }

    let totalGlobalStars = 0;
    for(let k in userLevels) { totalGlobalStars += (userLevels[k].stars || 0); }
    const starsDisplay = document.getElementById('total-stars-display');
    if (starsDisplay) starsDisplay.innerText = totalGlobalStars;

    // لو الزعيم مهزوم أصلاً، نقفل ونرجع الخريطة فوراً
    if (oldData.boss_defeated) {
        goHomeDirectly(true);
        if (currentLevelStarsEarned > (oldData.stars || 0)) {
            showTopToast(`عاش! حسنت نجومك لـ ${currentLevelStarsEarned}⭐ في المستوى ده 🚀`, 'success');
            triggerConfetti();
        } else {
            showTopToast(`جمعت ${currentLevelStarsEarned}⭐، رقمك القياسي ${oldData.stars}⭐ لم يتأثر.`, 'info');
        }
        setTimeout(() => openLevelsMap(), 500);
        return;
    }

    // لو لسه مخلصش الزعيم يكمل العادي:
    let reqStarsForNext = getLevelReqStars(currentLevelPlaying + 1);

    if (totalGlobalStars >= reqStarsForNext) {
        openModal('modal-pre-boss');
    } else {
        document.getElementById('shortage-desc').innerText = `جمعت ${totalGlobalStars} نجمة تراكمية، لكنك تحتاج ${reqStarsForNext} نجمة لمواجهة وحش هذا المستوى. عد وحسن نجومك القديمة!`;
        openModal('modal-boss-shortage');
    }
}

function saveLevelProgressPartial() {
    if (!currentUser) return;
    let userLevels = currentUser.levels_progress || {};
    let oldData = userLevels[currentLevelPlaying] || { stars: 0, boss_defeated: false, cooldown: 0 };

    if (currentLevelStarsEarned > oldData.stars) {
        userLevels[currentLevelPlaying] = { ...oldData, stars: currentLevelStarsEarned };
        currentUser.levels_progress = userLevels;
        db.ref('users/' + currentUser.phone + '/levels_progress').set(userLevels);
    }
}

// 5. محرك توجيه الزعماء الذكي (Dynamic Boss Router)
let activeBossType = 'penalty'; 
let bossQuestionsDeck = [];
let currentBossQIndex = 0;

function startPenaltyBoss() {
    showTopToast(`زعيم المستوى ${currentLevelPlaying}: ركلات الجزاء ⚽🔥`, 'info');
    
    // توجيه الطالب لشاشة اختيار النجم بدلاً من الدخول للساحة مباشرة
    navigateTo('view-penalty-select', `زعيم المستوى ${currentLevelPlaying}`, 'اختر نجمك للتسديد');
}

// 6. منطق زعيم القنبلة الموقوتة
let bombTimer;
let bombTimeLeft = 30;
let wiresCut = 0;

function startBombBoss() {
    showTopToast(`زعيم المستوى ${currentLevelPlaying}: القنبلة الموقوتة 💣`, 'error');
    bombTimeLeft = 30;
    wiresCut = 0;
    updateBombUI();
    navigateTo('view-boss-bomb', 'القنبلة الموقوتة', 'اقطع الأسلاك قبل الانفجار');
    renderBombQuestion();
    
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

function updateBombUI() {
    const timerDisplay = document.getElementById('bomb-timer-display');
    const wiresDisplay = document.getElementById('bomb-wires-cut');
    if (timerDisplay) timerDisplay.innerText = `00:${bombTimeLeft < 10 ? '0'+bombTimeLeft : bombTimeLeft}`;
    if (wiresDisplay) wiresDisplay.innerText = `الأسلاك المقطوعة: ${wiresCut} / 3`;
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

    // فحص: هل المستخدم الحالي أدمن أو يمتلك أي صلاحيات إدارية؟
    const isAuthorizedToShare = currentUser && (
        currentUser.phone === "01061032507" || 
        (Array.isArray(currentUser.admin_roles) && currentUser.admin_roles.length > 0)
    );

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
                    : `<div style="font-size:0.75rem; color:#ef4444; font-weight:800;">${item.examTime} دقيقة \vert{} +${item.examXP} XP</div>`;
                
                // زر المشاركة يظهر فقط للمصرح لهم
                const shareBtnUI = isAuthorizedToShare ? `
                    <button onclick="event.stopPropagation(); shareExamDeepLink('${currentActiveSubject}', '${currentActiveType}', '${item.id}')" 
                            class="admin-action-btn" 
                            style="padding: 3px 8px; font-size: 0.68rem; border-color: var(--accent-gold); color: var(--accent-gold); margin-top: 6px; width: 100%;">
                        🔗 مشاركة الرابط
                    </button>
                ` : '';

                // فتح نافذة التأكيد والقواعد بدلاً من فتح الامتحان مباشرة
                examsHTML += `
                <div class="eng-bento-card" style="--theme-color: ${isCompleted ? 'var(--accent-emerald)' : '#ef4444'}; padding: 16px 10px; text-align: center; align-items: center; justify-content: center; border-color: ${isCompleted ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'};" onclick="showExamRulesConfirmation('${item.id}')">
                    <div class="dynamic-emoji-box" style="width: 45px; height: 45px; font-size: 1.6rem; margin: 0 auto 10px;">${customEmoji}</div>
                    <h4 style="font-size: 0.9rem; margin-bottom: 4px; color: var(--text-main);">${item.title}</h4>
                    ${examRewardUI}${shareBtnUI}
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
        
        const xpReward = Math.round((parseInt(examDataCache.examXP) || 0) * passRate);
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

function shareExamDeepLink(subject, type, examId) {
    if (typeof playClickSound === 'function') playClickSound();

    // تشفير اسم المادة لحمايته داخل الرابط
    const safeSub = encodeURIComponent(subject);
    const origin = window.location.origin;
    const pathname = window.location.pathname;

    // الرابط الكامل الذي يحمل مسار الاختبار
    const shareUrl = `${origin}${pathname}?openExam=${examId}&sub=${safeSub}&typ=${type}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).then(() => {
            showTopToast('تم نسخ الرابط المباشر للاختبار بنجاح! 📋', 'success');
        });
    } else {
        prompt('انسخ الرابط لمشاركته مع الطلاب:', shareUrl);
    }
}

async function checkExamDeepLinkOnStartup() {
    const urlParams = new URLSearchParams(window.location.search);
    const targetExamId = urlParams.get('openExam');
    const targetSubject = urlParams.get('sub');
    const targetType = urlParams.get('typ') || 'practical';

    if (targetExamId && targetSubject) {
        const decodedSubject = decodeURIComponent(targetSubject);
        const safeKey = getSafeSubjectKey(decodedSubject);

        showTopToast('جاري تجهيز بيانات الاختبار... ⏳', 'info');

        try {
            const path = `scientific_content/${safeKey}/${targetType}/quizzes/${targetExamId}`;
            const snap = await db.ref(path).once('value');

            if (snap.exists()) {
                const examData = snap.val();
                examData.id = targetExamId;

                currentActiveSubject = decodedSubject;
                currentActiveType = targetType;
                currentActiveCategory = 'quizzes';

                if (!window.tempLessonContentStore) {
                    window.tempLessonContentStore = {};
                }
                window.tempLessonContentStore[targetExamId] = examData;

                // إظهار نافذة القواعد والتأكيد قبل بدء الامتحان
                setTimeout(() => {
                    showExamRulesConfirmation(targetExamId);
                }, 600);
            } else {
                showTopToast('عذراً، هذا الاختبار لم يعد متاحاً!', 'error');
            }
        } catch (e) {
            console.error("Deep link error:", e);
        }
    }
}

let pendingExamIdToStart = null;

// دالة إظهار نافذة القواعد وتجهيز البيانات
function showExamRulesConfirmation(examId) {
    if (typeof playClickSound === 'function') playClickSound();

    const examData = window.tempLessonContentStore ? window.tempLessonContentStore[examId] : null;
    if (!examData) {
        showTopToast('بيانات الاختبار غير متوفرة', 'error');
        return;
    }

    pendingExamIdToStart = examId;

    document.getElementById('rule-exam-title').innerText = examData.title || 'اختبار تقييمي';
    document.getElementById('rule-exam-emoji').innerText = examData.emoji || '⏱️';
    document.getElementById('rule-exam-subject').innerText = currentActiveSubject || 'المقرر الدراسي';
    document.getElementById('rule-exam-time').innerText = `${examData.examTime || 10} دقيقة`;
    document.getElementById('rule-exam-xp').innerText = `+${examData.examXP || 50} XP`;

    const modal = document.getElementById('exam-rules-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
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