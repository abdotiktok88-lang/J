// نظام قفل الصيانة الذكي مع استثناء المطور
document.addEventListener("DOMContentLoaded", () => {
    const maintenanceScreen = document.getElementById('maintenance-lock-screen');
    const adminPhone = "01061032507"; // رقم المطور المستثنى من القفل
    const currentPhone = localStorage.getItem('active_user_phone'); // قراءة رقم الطالب من الذاكرة
    
    // موعد فك القفل (1 سبتمبر 2026 الساعة 12 منتصف الليل)
    const unlockDate = new Date("2026-09-01T00:00:00"); 
    const now = new Date();

    // الشرط: لو الموعد لسه مجاش، واللي فاتح التطبيق *مش المطور* -> اقفل التطبيق
    if (now < unlockDate && currentPhone !== adminPhone) {
        if (maintenanceScreen) {
            maintenanceScreen.style.display = 'flex';
            document.body.style.overflow = 'hidden'; 
        }
    } else {
        // فك القفل فوراً لو الموعد عدى، أو لو اللي فاتح هو المطور
        if (maintenanceScreen) {
            maintenanceScreen.remove();
            document.body.style.overflow = 'auto';
        }
    }
});

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
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
// ================= محرك مزامنة وقت السيرفر (لمنع الغش) =================
    let serverTimeOffset = 0;
    db.ref('.info/serverTimeOffset').on('value', function(snap) {
        serverTimeOffset = snap.val() || 0;
    });

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

    // ================= نظام التحديث التلقائي وتخطي الكاش =================
    const CURRENT_APP_VERSION = "1.1.1";

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

    // ================= دوال المنظم الأكاديمي والمنصة =================
    function openAcademicHub() {
        playClickSound();
        navigateTo('view-academic-hub', 'المنظم الأكاديمي', 'المنصة والتكليفات والجداول');
        loadAcademicTasks();
    }

    function switchAcademicTab(tab) {
        playClickSound();
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
    }

    function loadAcademicTasks() {
        const list = document.getElementById('acad-tasks-list');
        db.ref('academic_tasks').once('value', (snap) => {
            if (!snap.exists()) {
                list.innerHTML = `
                <div class="acad-glass-card" style="text-align: center; padding: 25px 15px;">
                    <img src="https://img.icons8.com/fluency/96/ok.png" style="width: 55px; height: 55px; margin-bottom: 8px;" alt="Empty">
                    <p style="color: #0f172a; font-weight: 800; font-size: 0.95rem;">لا توجد تكليفات مطلوبة حالياً 🎉</p>
                </div>`;
                return;
            }
            let html = '';
            const myCompletedTasks = (currentUser && currentUser.completed_tasks) ? currentUser.completed_tasks : JSON.parse(localStorage.getItem('completed_tasks_' + (currentUser ? currentUser.phone : 'guest')) || '[]');

            snap.forEach(child => {
                const task = child.val();
                const taskId = child.key;
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
        });
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

    function viewScheduleInApp(secKey, secName) {
        playClickSound();
        document.getElementById('schedule-view-title').innerText = `جدول ${secName}`;
        const container = document.getElementById('schedule-viewer-container');
        
        navigateTo('view-schedule-detail', `جدول ${secName}`, 'الجدول الأسبوعي المعتمد');

        // 1. فحص وجود نسخة مخزنة أوفلاين للجدول أولاً
        const cachedImg = localStorage.getItem('cached_schedule_' + secKey);
        if (cachedImg) {
            renderScheduleImage(container, cachedImg, secName);
        } else {
            container.innerHTML = `
                <img src="https://img.icons8.com/fluency/96/sand-timer.png" style="width: 50px; height: 50px; margin-bottom: 8px;">
                <p style="color: var(--text-sub); font-size: 0.85rem;">جاري فحص حالة الجدول...</p>
            `;
        }

        // 2. فحص السحابة لجلب التحديث وحفظه أوفلاين
        db.ref('schedules/' + secKey).once('value').then(snap => {
            if (snap.exists() && snap.val()) {
                const imgUrl = snap.val();
                
                // حفظ الرابط وتحويله لكاش محلي للعمل أوفلاين
                localStorage.setItem('cached_schedule_' + secKey, imgUrl);
                renderScheduleImage(container, imgUrl, secName);
            } else if (!cachedImg) {
                container.innerHTML = `
                    <img src="https://img.icons8.com/fluency/96/calendar.png" style="width: 65px; height: 65px; margin-bottom: 10px;">
                    <h4 style="color: var(--text-main); font-size: 0.95rem; margin-bottom: 4px;">الجدول غير متاح حالياً</h4>
                    <p style="color: var(--text-sub); font-size: 0.8rem;">سيتم إتاحة جدول هذا السكشن رسمياً هنا فور اعتماده ⏳</p>
                `;
            }
        }).catch(() => {
            // في حال عدم وجود إنترنت تماماً، يظل الكاش معروضاً
            if (!cachedImg) {
                container.innerHTML = `
                    <p style="color: #ef4444; font-weight: bold; font-size: 0.85rem;">أنت غير متصل بالإنترنت ولم يتم حفظ الجدول مسبقاً.</p>
                `;
            }
        });
    }

    function renderScheduleImage(container, imgUrl, secName) {
        container.innerHTML = `
            <img src="${imgUrl}" style="width: 100%; border-radius: 12px; max-height: 70vh; object-fit: contain; box-shadow: 0 4px 15px rgba(0,0,0,0.3);" alt="${secName}" onerror="this.onerror=null;">
            <button class="btn-action-glow btn-download-file" style="margin-top: 12px; width: 100%;" onclick="window.open('${imgUrl}', '_blank')">🔍 عرض الصورة بحجم كامل</button>
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
        db.ref('schedules/' + sec).set(url).then(() => {
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
    try {
        // 1. إمبراطور النقاط
        const xpSnap = await db.ref('users').orderByChild('xp').limitToLast(1).once('value');
        xpSnap.forEach(c => setFameCard(1, c.val(), `${c.val().xp || 0} XP`));

        // 2. بطل الاستمرارية
        const streakSnap = await db.ref('users').orderByChild('daily_streak').limitToLast(1).once('value');
        streakSnap.forEach(c => setFameCard(2, c.val(), `${c.val().daily_streak || 0} يوم متتالي 🔥`));

        // 3. فارس التحديات (أعلى إجابات صحيحة)
        const quizSnap = await db.ref('users').orderByChild('quizCorrect').limitToLast(1).once('value');
        quizSnap.forEach(c => setFameCard(3, c.val(), `${c.val().quizCorrect || 0} إجابة صحيحة`));

        // 4. القناص الخارق (نسحب أعلى 15 بس في الإجابات ونحسب الدقة بينهم بدل الدفعة كلها)
        const accSnap = await db.ref('users').orderByChild('quizCorrect').limitToLast(15).once('value');
        let topAccUser = null;
        let maxAcc = -1;
        accSnap.forEach(c => {
            const u = c.val();
            if ((u.quizPlayed || 0) >= 3) {
                const acc = Math.round((u.quizCorrect / (u.quizPlayed * 5)) * 100);
                if (acc > maxAcc) { maxAcc = acc; topAccUser = u; }
            }
        });
        if (topAccUser) setFameCard(4, topAccUser, `دقة ${maxAcc}% 🎯`);

        // 5. جلاد الديربي
        const derbySnap = await db.ref('users').orderByChild('derby_wins').limitToLast(1).once('value');
        derbySnap.forEach(c => {
            if((c.val().derby_wins || 0) > 0) setFameCard(5, c.val(), `${c.val().derby_wins || 0} فوز ديربي ⚔️`);
        });

        // 6. مليونير الدفعة
        const coinsSnap = await db.ref('users').orderByChild('coins').limitToLast(1).once('value');
        coinsSnap.forEach(c => setFameCard(6, c.val(), `${c.val().coins || 0} عملة 💸`));

    } catch (e) {
        console.log("Error loading Hall of Fame:", e);
    }
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
"extra_classic_5": { price: 70, name: "حزمة +5 محاولات كلاسيك 📚", category: "boosters", desc: "تمنحك 5 محاولات إضافية لتحدي العباقرة" },
        "extra_penalty_5": { price: 70, name: "حزمة +5 محاولات جزاء ⚽", category: "boosters", desc: "تمنحك 5 محاولات إضافية لركلات الجزاء" },
        "double_xp": { price: 100, name: "مضاعف نقاط 24 ساعة (2x XP) 🚀", category: "boosters", desc: "ضاعف نقاط كل تحدي لمدة 24 ساعة" },
        "hint_5050": { price: 40, name: "تلميح التحدي (حذف إجابتين) 💡", category: "boosters", desc: "يحذف إجابتين خطأ أثناء السؤال" },
        "hint_time": { price: 35, name: "تجميد الوقت بالتحدي (+15 ثانية) ⏱️", category: "boosters", desc: "إضافة 15 ثانية إضافية للتفكير" },
        "freeze": { price: 90, name: "تجميد السلسلة (Streak Freeze) 🛡️", category: "boosters", desc: "حماية سلسلة دخولك اليومي من الضياع" }
    };

    let currentStoreConfig = { ...defaultStorePrices };

    db.ref('store_config').once('value', (snap) => {
        if (snap.exists()) {
            currentStoreConfig = { ...defaultStorePrices, ...snap.val() };
        } else {
            db.ref('store_config').set(defaultStorePrices);
        }
        if (typeof renderStoreCatalog === 'function') renderStoreCatalog();
    });

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

    function goHomeDirectly() {
        // حماية الديربي من الهروب
        if (currentBattleId || currentEhbedRoomId) {
            if (confirm('⚠️ تحذير: خروجك الآن سيعتبر انسحاباً من التحدي (وقد تخسر عملاتك ونقاطك)!\n\nهل أنت متأكد من الخروج؟')) {
                if (currentBattleId) cancelBattleLobby();
                if (currentEhbedRoomId) cancelEhbedLobby();
            }
            return;
        }
        if (isClassicQuizActive) {
            if (confirm('⚠️ تحذير: خروجك الآن سيعتبر انسحاباً وسيتم احتساب إجاباتك 0/5 وخصم 35 XP!\n\nهل أنت متأكد من الخروج؟')) {
                forfeitClassicQuiz();
            }
            return;
        }
        if (isPenaltyGameActive) {
            if (confirm('⚠️ تحذير: خروجك الآن سيعتبر إهداراً لركلة الجزاء وخصم 25 XP!\n\nهل أنت متأكد من الخروج؟')) {
                forfeitPenaltyGame();
            }
            return;
        }
        playClickSound();
        navHistory = [{ viewId: 'view-home', title: 'برنامج علوم الأغذية', subtitle: 'الفرقة الرابعة - دفعة 28' }];
        showViewSection('view-home');
        updateHeader();
        updateNavState('nav-home');
        window.history.pushState({ viewId: 'view-home' }, "");
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
            if (confirm('⚠️ تحذير: خروجك الآن سيعتبر انسحاباً من التحدي (وقد تخسر عملاتك ونقاطك)!\n\nهل أنت متأكد من الخروج؟')) {
                if (currentBattleId) cancelBattleLobby();
                if (currentEhbedRoomId) cancelEhbedLobby();
            }
            return;
        }
        if (isClassicQuizActive) {
            if (confirm('⚠️ تحذير: خروجك الآن سيعتبر انسحاباً وسيتم احتساب إجاباتك 0/5 بالكامل وخصم 35 XP من رصيدك!\n\nهل أنت متأكد من الانسحاب؟')) {
                forfeitClassicQuiz();
            }
            return;
        }
        if (isPenaltyGameActive) {
            if (confirm('⚠️ تحذير: خروجك الآن سيعتبر إهداراً لركلة الجزاء وسيتم خصم 25 XP من رصيدك فوراً!\n\nهل أنت متأكد من الانسحاب؟')) {
                forfeitPenaltyGame();
            }
            return;
        }
        if (navHistory.length > 1) {
            playBackSound();
            window.history.back(); 
        }
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

    window.addEventListener('popstate', function (event) {
        if (navHistory.length > 1) {
            navHistory.pop();
            const previous = navHistory[navHistory.length - 1];
            showViewSection(previous.viewId);
            updateHeader();
            
            if(previous.viewId === 'view-home') updateNavState('nav-home');
            else if(previous.viewId === 'view-stats') updateNavState('nav-stats');
            else if(previous.viewId === 'view-leaderboard') updateNavState('nav-leaderboard');
            else if(previous.viewId === 'view-profile') updateNavState('nav-profile');
            else updateNavState(null);
        }
    });

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

    function openQuizRulesModal() {
        playClickSound();
        if (!currentUser) {
            showTopToast('يرجى تسجيل الدخول أولاً للمشاركة في التحدي!', 'error');
            return;
        }

        const todayDate = getRealDateString();
        
        // عداد الكلاسيك
        const lastClassicDate = currentUser.last_quiz_date || '';
        const classicCountToday = (lastClassicDate === todayDate) ? (currentUser.daily_quiz_count || 0) : 0;
        const classicRemaining = Math.max(0, DAILY_QUIZ_LIMIT - classicCountToday);

        // عداد ركلات الجزاء
        const lastPenaltyDate = currentUser.last_penalty_date || '';
        const penaltyCountToday = (lastPenaltyDate === todayDate) ? (currentUser.daily_penalty_count || 0) : 0;
        const penaltyRemaining = Math.max(0, DAILY_QUIZ_LIMIT - penaltyCountToday);

        const counterEl = document.getElementById('quiz-modal-daily-counter');
        if (counterEl) {
            let extraClassicText = (currentUser.extraClassicCount || 0) > 0 ? ` <span style="color:#10b981; font-size:0.7rem;">(+${currentUser.extraClassicCount} إضافي)</span>` : '';
            let extraPenaltyText = (currentUser.extraPenaltyCount || 0) > 0 ? ` <span style="color:#10b981; font-size:0.7rem;">(+${currentUser.extraPenaltyCount} إضافي)</span>` : '';
            
            counterEl.innerHTML = `
                <div style="display: flex; justify-content: space-around; gap: 10px; margin-top: 5px;">
                    <span>📚 كلاسيك: <b>${classicRemaining}/10</b>${extraClassicText}</span>
                    <span>⚽ جزاء: <b>${penaltyRemaining}/10</b>${extraPenaltyText}</span>
                </div>
            `;
        }

        document.getElementById('quiz-rules-modal').classList.add('show');
    }

    function openPenaltySelectionFlow() {
        const todayDate = getRealDateString();
        const lastPenaltyDate = currentUser ? (currentUser.last_penalty_date || '') : '';
        const penaltyCountToday = (lastPenaltyDate === todayDate) ? (currentUser.daily_penalty_count || 0) : 0;

        if (penaltyCountToday >= DAILY_QUIZ_LIMIT) {
            if ((currentUser.extraPenaltyCount || 0) > 0) {
                currentUser.extraPenaltyCount -= 1;
                db.ref('users/' + currentUser.phone + '/extraPenaltyCount').set(currentUser.extraPenaltyCount);
                showTopToast('تم خصم محاولة جزاء من رصيدك الإضافي 🎟️', 'info');
            } else {
                showTopToast(`استنفدت محاولات ركلات الجزاء اليوم! اشتري محاولات إضافية من المتجر 🎟️`, 'error');
                return;
            }
        }

        closeModal('quiz-rules-modal');
        navigateTo('view-penalty-select', 'ركلات الجزاء ⚽', 'اختر نجمك المفضل');
    }
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

    // ================= تهيئة المستخدم =================
    let currentUser = null; 
    let editSelectedAvatar = 'https://img.icons8.com/fluency/96/user-male.png';
let hasCheckedDailyLoginSession = false;

    window.addEventListener('DOMContentLoaded', () => {
        updateSoundUI();
        checkAppEntryFlow();
        checkBroadcastAlerts();
        initUserTicketRepliesListener();
        listenToCountdowns();
        preloadLeaderboardData();
    });

    function checkAppEntryFlow() {
        const loggedInPhone = localStorage.getItem('active_user_phone');
        const cachedUserData = localStorage.getItem('cached_user_data');

        if (loggedInPhone) {
            if (cachedUserData) {
                try {
                    currentUser = JSON.parse(cachedUserData);
                    updateProfileUI();
                    const bottomNav = document.getElementById('main-bottom-nav');
                    if (bottomNav) bottomNav.style.display = 'flex';
                } catch (e) {}
            }

            db.ref('users/' + loggedInPhone).on('value', (snapshot) => {
                if (snapshot.exists()) {
                    currentUser = snapshot.val();
// كود تنظيف آلي لمرة واحدة لتخفيف وزن الحساب القديم
                    if (currentUser.transactions) {
                        db.ref('users/' + loggedInPhone + '/transactions').remove();
                        delete currentUser.transactions;
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
                    const bottomNav = document.getElementById('main-bottom-nav');
                    if (bottomNav) bottomNav.style.display = 'flex';

                    if (navHistory[navHistory.length - 1].viewId === 'view-auth') {
                        goHomeDirectly();
                    }

                    if (!hasCheckedDailyLoginSession) {
                        checkDailyLoginCloudSync();
                        hasCheckedDailyLoginSession = true;
                    }
                } else {
                    logoutUserLocally();
                    showAuthGateDirectly();
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
    }

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
                        playSuccessSound();
                    }
                }
            }
        });
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
        } // ✅ تم إغلاق القوس هنا بنجاح

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
                        const newUser = { 
                            name: name, 
                            phone: phone, 
                            email: email, 
                            password: pass, 
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

        db.ref('users').once('value', (snapshot) => {
            let foundUser = null;
            snapshot.forEach(child => {
                const u = child.val();
                if (u.phone === inputVal || (u.email && u.email.toLowerCase() === inputVal.toLowerCase())) {
                    foundUser = u;
                }
            });

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
            document.getElementById('main-bottom-nav').style.display = 'flex';
            showTopToast('تم تسجيل الدخول بنجاح ✨', 'success');
            goHomeDirectly();
        });
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

    // ================= إعدادات المتجر والملف الشخصي =================
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
        if (tab === 'store') renderStoreCatalog();
if (tab === 'badges') renderAchievementsTabUI();
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
            else if (itemId === 'double_xp') previewCircleHtml = `<div class="store-preview-circle" style="color: #ef4444; font-weight: 900;">2X</div>`;
            else if (itemId === 'hint_5050') previewCircleHtml = `<div class="store-preview-circle">💡</div>`;
            else if (itemId === 'hint_time') previewCircleHtml = `<div class="store-preview-circle">⏱️</div>`;
            else if (itemId === 'freeze') previewCircleHtml = `<div class="store-preview-circle">🛡️</div>`;
else if (itemId === 'extra_classic_5') previewCircleHtml = `<div class="store-preview-circle">📚</div>`;
            else if (itemId === 'extra_penalty_5') previewCircleHtml = `<div class="store-preview-circle">⚽</div>`;

            let countBadge = '';
            if (itemId === 'hint_5050') countBadge = ` (لديك: ${currentUser.hintsCount || 0})`;
            if (itemId === 'hint_time') countBadge = ` (لديك: ${currentUser.hintTimeCount || 0})`;
if (itemId === 'extra_classic_5') countBadge = ` (لديك: ${currentUser.extraClassicCount || 0})`;
            if (itemId === 'extra_penalty_5') countBadge = ` (لديك: ${currentUser.extraPenaltyCount || 0})`;

            const priceDisplay = isSale ? 
                `<div class="store-price-tag"><span class="store-old-price">${item.price}</span> <span>${activePrice} عملة 💸</span> <span class="store-limited-badge">${item.badgeText || 'عرض خاص'}</span></div>` : 
                `<div class="store-price-tag"><span>${activePrice} عملة 💸</span></div>`;

            let btnHtml = '';

            if (itemId.startsWith('frame_')) {
        // تنظيف المفتاح لمطابقته بدقة سواء تم حفظه كـ frame_ring_xxx أو ring_xxx
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
const todayStr = getRealDateString();
        if (itemId === 'extra_classic_5' || itemId === 'extra_penalty_5') {
            const currentBuys = (currentUser['last_buy_' + itemId] === todayStr) ? (currentUser['count_buy_' + itemId] || 0) : 0;
            if (currentBuys >= 2) {
                showTopToast('وصلت للحد الأقصى لشراء هذه الحزمة اليوم (مرتين فقط)! 🛑', 'error');
                return; // بيوقف الكود هنا وميخصمش عملات
            }
        }

        recordUserTransaction(`شراء عنصر من المتجر: ${currentStoreConfig[itemId]?.name || itemId}`, 0, -cost, 'purchase');

        let updates = { coins: currentCoins - cost };

        if (itemId.startsWith('frame_') || itemId.startsWith('ring_')) {
            const frameKey = itemId;
            let owned = currentUser.owned_frames || [];
            if (!owned.includes(frameKey)) owned.push(frameKey);
            updates.owned_frames = owned;
            updates.active_frame = frameKey;
        } else if (itemId.startsWith('hat_')) {
            let owned = currentUser.owned_hats || [];
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
        } else if (itemId === 'freeze') {
            updates.has_streak_freeze = true;
}
  else if (itemId === 'extra_classic_5') {
            updates.extraClassicCount = (currentUser.extraClassicCount || 0) + 5;
            // تسجيل عدد مرات الشراء اليومية
            updates['last_buy_' + itemId] = todayStr;
            updates['count_buy_' + itemId] = ((currentUser['last_buy_' + itemId] === todayStr) ? (currentUser['count_buy_' + itemId] || 0) : 0) + 1;
        } else if (itemId === 'extra_penalty_5') {
            updates.extraPenaltyCount = (currentUser.extraPenaltyCount || 0) + 5;
            // تسجيل عدد مرات الشراء اليومية
            updates['last_buy_' + itemId] = todayStr;
            updates['count_buy_' + itemId] = ((currentUser['last_buy_' + itemId] === todayStr) ? (currentUser['count_buy_' + itemId] || 0) : 0) + 1;
        }

        db.ref('users/' + currentUser.phone).update(updates).then(() => {
            playSuccessSound();
            shootStars();
            triggerConfetti();
            showTopToast(`تم الشراء والتفعيل بنجاح! خصم ${cost} عملة 🛍️✨`, 'success');
            updateProfileUI();
        });
    }

    function toggleFeatureStatus(field, status) {
        playClickSound();
        let updates = {};
        updates[field] = status;
        db.ref('users/' + currentUser.phone).update(updates).then(() => {
            showTopToast(status && status !== 'none' ? 'تم تفعيل الميزة بنجاح! ✨' : 'تم إيقاف الميزة بنجاح.', 'info');
            updateProfileUI();
        });
    }

    function equipOwnedFrame(frameKey) {
        playClickSound();
        // ضمان حفظ المفتاح بالشكل الصحيح سواء كان دائرياً أو فريماً عادياً
        let fullKey = frameKey;
        if (!frameKey.startsWith('frame_') && !frameKey.startsWith('ring_')) {
            fullKey = 'frame_' + frameKey;
        }
        
        db.ref('users/' + currentUser.phone + '/active_frame').set(fullKey).then(() => {
            showTopToast('تم تفعيل وارتداء الإطار بنجاح! ✨', 'success');
            updateProfileUI();
        });
    }

    function equipOwnedHat(hatKey) {
        playClickSound();
        db.ref('users/' + currentUser.phone + '/active_hat').set(hatKey).then(() => {
            showTopToast('تم ارتداء إكسسوار الرأس بنجاح! ✨', 'success');
            updateProfileUI();
        });
    }

    function updateProfileUI() {
        if (currentUser) {
            const avatarSrc = currentUser.avatar || 'https://img.icons8.com/fluency/96/user-male.png'; 
            const xp = currentUser.xp || currentUser.points || 0; 
            const coins = currentUser.coins || 0;
            const rnk = getUserRank(xp);
            const nextXp = getNextLevelXP(xp);
            const progressPercent = Math.min((xp / nextXp) * 100, 100);
            
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
            if (hatContainer) {
                hatContainer.innerHTML = getHatHtml(currentUser.active_hat) + getAvatarFrameOverlayHtml(currentUser.active_frame);
            }

            const profileCard = document.getElementById('main-profile-header-card');
            if (profileCard) {
                if (currentUser.is_vip) profileCard.classList.add('vip-profile-card');
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
            if (dXpBadge) {
                const isDoubleActive = currentUser.double_xp_until && currentUser.double_xp_until > Date.now();
                dXpBadge.style.display = isDoubleActive ? 'inline-block' : 'none';
            }

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
            document.getElementById('display-phone').innerText = currentUser.phone; 
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

            if (currentUser.phone === "01061032507") {
                document.getElementById('sidebar-admin-panel').style.display = 'flex';
            } else {
                document.getElementById('sidebar-admin-panel').style.display = 'none';
            }
            initUserTicketRepliesListener();
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
// دالة تسجيل أي معاملة في سجل الطالب
function recordUserTransaction(title, xpChange = 0, coinsChange = 0, type = 'reward') {
    if (!currentUser) return;
    try {
        // تم تغيير المسار ليكون مستقلاً تماماً
        db.ref('user_transactions/' + currentUser.phone).push({
            title: title,
            xp: xpChange,
            coins: coinsChange,
            type: type, // 'reward', 'purchase', 'penalty'
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
    } catch (e) {
        console.error('Error logging transaction:', e);
    }
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

function preloadLeaderboardData() {
    db.ref('users').orderByChild('xp').limitToLast(10).once('value').then(snapshot => {
        let usersArr = [];
        snapshot.forEach(child => {
            let u = child.val();
            u.id = child.key;
            u.xp = u.xp || u.points || 0;
            usersArr.push(u);
        });
        usersArr.reverse();
        cachedLeaderboardData = usersArr;
        localStorage.setItem('local_top_10', JSON.stringify(usersArr)); // حفظ في تليفون الطالب
    }).catch(() => {});
}

// 2. عرض الليدربورد الذكي
function renderLeaderboard() {
    const container = document.getElementById('leaderboard-content');

    // عرض البيانات من ذاكرة التليفون فوراً (صفر استهلاك انترنت وصفر وقت تحميل)
    if (cachedLeaderboardData && cachedLeaderboardData.length > 0) {
        buildLeaderboardDOM(cachedLeaderboardData, container);
    } else {
        container.innerHTML = '<p style="text-align: center; color: var(--text-sub); margin-top: 30px; font-weight: 800;">جاري تحميل الأبطال... ⏳</p>';
    }

    // فحص سريع في الخلفية لأول 10 لتحديث الواجهة إذا حدث تغيير
    db.ref('users').orderByChild('xp').limitToLast(10).once('value').then(snapshot => {
        let usersArr = [];
        snapshot.forEach(child => {
            let u = child.val();
            u.id = child.key;
            u.xp = u.xp || u.points || 0;
            usersArr.push(u);
        });

        usersArr.reverse();
        
        // لو حصل تغيير فعلي، نحدث الشاشة والذاكرة
        if (JSON.stringify(usersArr) !== JSON.stringify(cachedLeaderboardData)) {
            cachedLeaderboardData = usersArr;
            localStorage.setItem('local_top_10', JSON.stringify(usersArr));
            buildLeaderboardDOM(usersArr, container);
        }
    }).catch(err => {
        if (!cachedLeaderboardData) {
            container.innerHTML = '<p style="text-align: center; color: #ef4444; margin-top: 30px;">حدث خطأ في تحميل البيانات.</p>';
        }
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
    }

    function openSubjectTypeDetails(type) {
        playClickSound();
        currentActiveType = type;
        const typeName = type === 'theory' ? 'قسم النظري' : 'قسم العملي';
        const cardTitle = type === 'theory' ? 'كتاب المقرر' : 'مذكرة العملي والسكاشن';
        const cardIcon = type === 'theory' ? 'https://img.icons8.com/fluency/96/literature.png' : 'https://img.icons8.com/fluency/96/microscope.png';
        
        document.getElementById('subject-detail-label').innerText = `${typeName} - ${currentActiveSubject}`;
        document.getElementById('detail-card-title').innerText = cardTitle;
        document.getElementById('detail-card-icon').src = cardIcon;
        
        navigateTo('view-subject-detail', currentActiveSubject, typeName);
        updateBookRewardBadgeUI(); // تحديث النص فور فتح الشاشة
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
        
        // احتساب المكافأة فوراً وتحديث النص وتسجيل المعاملة
        rewardUserForBookSilent(bookIdentifier);

        db.ref(`subject_files/${safeKey}/${currentActiveType}`).once('value').then((snapshot) => {
            if (snapshot.exists() && snapshot.val()) {
                const rawUrl = snapshot.val();
                downloadBookFromDrive(rawUrl, `${currentActiveSubject}_${currentActiveType}.pdf`);
            } else {
                if (currentActiveSubject === 'تكنولوجيا الحبوب' && currentActiveType === 'theory') {
                    downloadDirectFile('grains_book.pdf', 'grains_book.pdf');
                } else {
                    showTopToast('سيتم إتاحة ملف هذا القسم للتحميل قريباً من قبل المطور! ⏳', 'info');
                }
            }
        });
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
    showTopToast('جاري فتح غرفة الديربي فوراً ⚡', 'success'); // رسالة سريعة

    const randomCode = 'DERBY-' + Math.floor(100 + Math.random() * 900);

    // 1. إنشاء الغرفة فوراً بدون انتظار تجهيز الأسئلة لضمان السرعة الفائقة
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
        player2: null,
        questions: [] // سيتم جلبها وتوليدها بذكاء فور اكتمال الانضمام
    };

    // خصم العملات وحفظ الغرفة دفعة واحدة وبسرعة خيالية
    await db.ref('users/' + currentUser.phone + '/coins').transaction(currentCoins => {
        return (currentCoins || 0) - selectedDerbyStake;
    });
    
    await db.ref('battles/' + randomCode).set(roomData);
    currentBattleId = randomCode;

    // 2. تجهيز الأسئلة في الخلفية بهدوء وبدون ما نعطل الواجهة
    fetchBattleQuestionsDeck().then(deck => {
        db.ref('battles/' + randomCode + '/questions').set(deck);
    });

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
        Object.keys(masterQuestionsBank).forEach(cat => {
            masterQuestionsBank[cat].forEach(q => {
                pool.push({ q: q.q, a: [...q.a], correct: q.correct, category: cat });
            });
        });

        try {
            const snap = await db.ref('custom_questions').once('value');
            if (snap.exists()) {
                snap.forEach(c => {
                    const val = c.val();
                    if (val && val.q && val.a) pool.push(val);
                });
            }
        } catch (e) {}

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

    function enterBattleArenaView(roomId) {
        navigateTo('view-battle-arena', 'ساحة الديربي 1v1', 'مواجهة حية مباشرة');
        if (battleListener) db.ref('battles/' + currentBattleId).off('value', battleListener);

        battleListener = db.ref('battles/' + roomId).on('value', snap => {
            if (!snap.exists()) return;
            const room = snap.val();
            syncArenaState(room);
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
    // باقي الكود كما هو تماماً...

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
    
    const currentQ = room.questions[qIndex];
    document.getElementById('arena-q-category').innerText = currentQ.category || 'عام';
    document.getElementById('arena-q-text').innerText = currentQ.q;

    // تجهيز السؤال الجديد عند تغير رقم السؤال
    if (document.getElementById('arena-options-list').dataset.currentQ !== String(qIndex)) {
        hasAnsweredCurrentArenaQ = false;
        document.getElementById('arena-p1-status').innerText = 'يفكر... ⏳';
        document.getElementById('arena-p1-status').style.color = 'var(--accent-gold)';
        renderArenaChoices(currentQ, qIndex, isHost);
    }

    // الانتقال للسؤال التالي بمجرد إجابة الطرفين (مع حماية القفل)
        if (room.player1 && room.player2 && room.player1.answeredCurrent && room.player2.answeredCurrent) {
            if (isHost && !isAdvancingQ) {
                isAdvancingQ = true; // 👈 قفل الباب عشان الأمر ميتكررش
                setTimeout(() => {
                    advanceArenaNextQuestion(room).then(() => {
                        isAdvancingQ = false; // 👈 نفتح القفل تاني بعد ما السؤال يتغير فعلياً
                    });
                }, 1200);
            }
        }
    } // 👈👈👈 ضيف القوس ده هنا عشان تقفل دالة syncArenaState 

    // دالة لتغيير حالة القفل من لوحة الأدمن وحفظها في فايربيز
    function setHallOfFameLockStatus(lockState) {
    playClickSound();
    db.ref('settings/hall_of_fame_locked').set(lockState).then(() => {
        showTopToast(lockState ? 'تم قفل قاعة المشاهير بنجاح 🔒' : 'تم فتح قاعة المشاهير للطلاب 🔓', 'success');
        updateAdminFameButtonsUI(lockState);
    });
}

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

// إرسال الإحصائية للوحة تحكم الإدمن (بواسطة الهوست فقط لمنع التكرار)
        if (isHost) {
            recordActivityLog('derby', `انتهت مواجهة ديربي 1v1: [${me.name.split(' ')[0]}] (${me.score}) ضد [${opp.name.split(' ')[0]}] (${opp.score}) ⚔️`);
        }

        currentBattleId = null;

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

    function startActualQuiz() {
        closeModal('quiz-rules-modal'); 
        playClickSound();

        // استخدام وقت السيرفر الآمن لو كنت طبقته، أو الوقت العادي
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

        db.ref('custom_questions').once('value').then((snapshot) => {
            if (snapshot.exists()) {
                snapshot.forEach(child => {
                    let customQ = child.val();
                    if (customQ && customQ.q && customQ.a) {
                        allAvailableQuestions.push({
                            id: `custom_${child.key}`,
                            q: customQ.q,
                            a: [...customQ.a],
                            correct: customQ.correct || 0,
                            categoryName: customQ.category || "أسئلة إضافية"
                        });
                    }
                });
            }
            processSmartQuizDeck(allAvailableQuestions);
        }).catch(() => {
            processSmartQuizDeck(allAvailableQuestions);
        });
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
        if(currentUser && currentUser.phone === "01061032507") {
            navigateTo('view-admin-panel', 'لوحة التحكم', 'إدارة التطبيق والمستخدمين والمتجر');
            loadAdminData();
            populateAdminStoreInputs();
        } else {
            showTopToast('عذراً، هذه الصفحة مخصصة لمدير التطبيق فقط.', 'error');
        }
    }

    function switchAdminTab(tabName) {
        playClickSound();
        // 👈 تم إضافة 'academy' داخل المصفوفة هنا
        ['users','analytics','academic','store','tickets','broadcast','books','quiz','codes','achievements','ehbed-quiz', 'academy'].forEach(t => {
            const tabBtn = document.getElementById('tab-admin-' + t);
            const tabSec = document.getElementById('admin-section-' + t);
            if (tabBtn) tabBtn.classList.remove('active');
            if (tabSec) tabSec.style.display = 'none';
        });
        
        const currentBtn = document.getElementById('tab-admin-' + tabName);
        const currentSec = document.getElementById('admin-section-' + tabName);
        
        if (currentBtn) currentBtn.classList.add('active');
        if (currentSec) currentSec.style.display = 'block';

        if (tabName === 'analytics') loadAdminAnalyticsAndLogs();
        if (tabName === 'tickets') loadAdminTickets();
        if (tabName === 'achievements') renderAdminAchievementsList();
        if (tabName === 'quiz') loadAdminCustomQuestions();
        if (tabName === 'ehbed-quiz') loadAdminEhbedQuestions();
        if (tabName === 'academy') loadAdminAcademyLessons(); // 👈 السطر ده اللي بيحمل الدروس
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

    db.ref('custom_questions').on('value', snap => {
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
            showTopToast('تم حذف السؤال بنجاح 🗑️', 'info');
        });
    }
}

    function loadAdminData() {
        document.getElementById('admin-users-list').innerHTML = '<p style="text-align: center;">جاري التحميل...</p>';
        document.getElementById('admin-codes-list').innerHTML = '<p style="text-align: center;">جاري التحميل...</p>';
        
        db.ref('users').once('value').then((snap) => {
            adminAllUsersData = [];
            snap.forEach(child => { adminAllUsersData.push({ id: child.key, ...child.val() }); });
            adminAllUsersData.sort((a, b) => ((b.xp || b.points || 0) - (a.xp || a.points || 0)));
            renderAdminUsers(adminAllUsersData);
        });

        db.ref('promo_codes').once('value').then((snap) => {
            let codesArr = [];
            snap.forEach(child => { codesArr.push({ code: child.key, ...child.val() }); });
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
                    <div class="admin-item-sub">${u.phone} | ${u.coins || 0} 💸</div>
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
        const filtered = adminAllUsersData.filter(u => u.name.toLowerCase().includes(query) || u.phone.includes(query) || (u.email && u.email.toLowerCase().includes(query)));
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

    function loadAdminTickets() {
    const container = document.getElementById('admin-tickets-list');
    db.ref('user_tickets').on('value', (snap) => {
        if (!snap.exists()) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-sub);">لا توجد شكاوى أو مقترحات واردة حالياً.</p>';
            return;
        }
        let html = '';
        snap.forEach(child => {
            const t = child.val();
            const id = child.key;
            html += `
            <div class="admin-item-card" style="flex-direction: column; align-items: flex-start; gap: 8px;">
                <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                    <span class="card-badge" style="background: ${t.type === 'مشكلة' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(212, 175, 55, 0.2)'}; color: ${t.type === 'مشكلة' ? '#ef4444' : 'var(--accent-gold)'}; font-size: 0.75rem;">${t.type}</span>
                    <span style="font-size: 0.75rem; color: var(--text-sub);">${new Date(t.sentAt).toLocaleDateString('ar-EG')}</span>
                </div>
                <h4 style="color: var(--text-main); font-size: 0.95rem;">${t.title}</h4>
                <p style="font-size: 0.85rem; color: var(--text-sub); line-height: 1.5;">${t.desc}</p>
                
                <div style="width: 100%; margin-top: 6px; background: var(--bg-primary); padding: 10px; border-radius: 10px; border: 1px dashed var(--border-card);">
                    ${t.reply ? `
                        <div style="font-size: 0.8rem; color: var(--accent-emerald); font-weight: bold; margin-bottom: 4px;">✅ تم إرسال الرد:</div>
                        <p style="font-size: 0.82rem; color: var(--text-main); line-height: 1.4;">${t.reply}</p>
                    ` : `
                        <input type="text" id="admin-reply-input-${id}" class="form-input" placeholder="اكتب ردك للطالب هنا..." style="padding: 8px 12px; font-size: 0.82rem; margin-bottom: 6px;">
                        <button class="btn-action-glow btn-check-task" style="width: 100%; padding: 6px; font-size: 0.8rem;" onclick="adminSendTicketReply('${id}')">إرسال الرد للطالب 💬</button>
                    `}
                </div>

                <div style="display: flex; justify-content: space-between; width: 100%; align-items: center; margin-top: 4px; border-top: 1px dashed var(--border-card); padding-top: 6px;">
                    <span style="font-size: 0.75rem; color: var(--accent-gold);">من: ${t.senderName} (${t.senderPhone})</span>
                    <button class="admin-action-btn danger" style="padding: 2px 8px; font-size: 0.7rem;" onclick="deleteTicket('${id}')">حذف 🗑️</button>
                </div>
            </div>`;
        });
        container.innerHTML = html;
    });
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

// دالة لتصفير النقطة الحمراء فقط عند فتح شاشة المشكلة أو الاقتراح
function markTicketRepliesAsSeen(type) {
    if (!currentUser) return;
    db.ref('user_tickets').once('value', (snap) => {
        if (!snap.exists()) return;
        snap.forEach(child => {
            const t = child.val();
            if (t.senderPhone === currentUser.phone && t.type === (type === 'report' ? 'مشكلة' : 'اقتراح')) {
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
        db.ref('app_countdowns').once('value', (snap) => {
            appCountdownsList = [];
            if (snap.exists()) {
                snap.forEach(c => {
                    appCountdownsList.push({ id: c.key, ...c.val() });
                });
            }
            renderHomeCountdowns();
            renderAdminCountdowns();
        });

        db.ref('academic_tasks').on('value', (snap) => {
            const select = document.getElementById('adm-cd-task-link');
            if (!select) return;
            select.innerHTML = '<option value="none">بدون ربط (مؤقت عام - يظهر للجميع دائماً)</option>';
            if (snap.exists()) {
                snap.forEach(c => {
                    const t = c.val();
                    select.innerHTML += `<option value="${c.key}">تكليف: ${t.subject} - ${t.title}</option>`;
                });
            }
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

    async function launchPenaltyMode(strikerId, strikerName, strikerImg) {
        playClickSound();
        if (!currentUser) return;

        selectedPenaltyStriker = { id: strikerId, name: strikerName, img: strikerImg };

        let allAvailableQuestions = [];
        Object.keys(masterQuestionsBank).forEach(cat => {
            masterQuestionsBank[cat].forEach((q, idx) => {
                allAvailableQuestions.push({ 
                    id: `master_pen_${cat}_${idx}`,
                    q: q.q, 
                    a: [...q.a], 
                    correct: q.correct, 
                    category: cat 
                });
            });
        });

        try {
            const snap = await db.ref('custom_questions').once('value');
            if (snap.exists()) {
                snap.forEach(c => {
                    const val = c.val();
                    if (val && val.q && val.a) {
                        allAvailableQuestions.push({
                            id: `custom_pen_${c.key}`,
                            q: val.q,
                            a: [...val.a],
                            correct: val.correct || 0,
                            category: val.category || "أسئلة إضافية"
                        });
                    }
                });
            }
        } catch (e) {}

        let seenIds = JSON.parse(localStorage.getItem('user_seen_penalty_' + currentUser.phone) || '[]');
        let pool = allAvailableQuestions.filter(q => !seenIds.includes(q.id));

        if (pool.length < 5) {
            seenIds = [];
            pool = [...allAvailableQuestions];
            showTopToast('تم تجديد بنك أسئلة ركلات الجزاء بالكامل! 🔄✨', 'info');
        }

        pool = shuffleArray(pool);
        penaltyQuestionsDeck = pool.slice(0, 5);

        penaltyQuestionsDeck.forEach(q => {
            if (!seenIds.includes(q.id)) seenIds.push(q.id);
        });
        localStorage.setItem('user_seen_penalty_' + currentUser.phone, JSON.stringify(seenIds));

        currentPenaltyQIndex = 0;
        isPenaltyGameActive = true;
        penaltyCorrectAnswersCount = 0;

        document.getElementById('penalty-striker-img').src = strikerImg;
        document.getElementById('penalty-striker-name').innerText = strikerName;

        resetPenaltyStadiumActors();
        startStadiumCrowdAudio();

        navigateTo('view-penalty-arena', 'ركلة الجزاء ⚽', `تسديدة ${strikerName}`);
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
        const qData = penaltyQuestionsDeck[currentPenaltyQIndex];
        if (!qData) {
            triggerPenaltyShootoutCinematic();
            return;
        }

        document.getElementById('penalty-q-counter').innerText = `السؤال ${currentPenaltyQIndex + 1} من 5`;
        document.getElementById('penalty-q-text').innerText = qData.q;

        const optionsBox = document.getElementById('penalty-options-box');
        optionsBox.innerHTML = '';

        let options = shuffleArray([...qData.a]);
        const correctText = qData.a[qData.correct || 0];

        options.forEach(optText => {
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

        // 1. إخفاء كارت الأسئلة فوراً لكشف زاوية الرؤية
        if (qCard) qCard.classList.add('hidden-for-kick');

        const isGoalScored = (penaltyCorrectAnswersCount >= 4);

        // تشغيل صوت المعلق المخصص للاعب المختار في حال التسجيل
        if (isGoalScored) {
            playCustomGoalAudio(selectedPenaltyStriker.id);
        }

        // 2. انطلاق اللاعب نحو الكرة
        setTimeout(() => {
            if (striker) striker.classList.add('run-to-kick');
        }, 400);

        // 3. لحظة ركل الكرة وهزة الكاميرا والصوت
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

                // اصطدام الكرة بالشباك واحتفال اللاعب
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

        // 4. إيقاف صوت الجمهور وإظهار شاشة النتيجة مع مهلة إضافية 3 ثوانٍ عند تسجيل الهدف للاستمتاع بالمشهد والاحتفال
        const resultDelay = isGoalScored ? 5500 : 2500;

        setTimeout(() => {
            stopStadiumCrowdAudio();
            concludePenaltyGame(isGoalScored);
        }, resultDelay);
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
        try {
            db.ref('app_activity_logs').push({
                type: type,
                details: details,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
        } catch (e) {}
    }

    function loadAdminAnalyticsAndLogs() {
        // 1. حساب الإحصائيات العامة من بيانات المستخدمين
        db.ref('users').once('value').then(snapshot => {
            let totalUsers = 0;
            let totalCorrect = 0;
            let totalPlayed = 0;
            let totalDerbyWins = 0;
            let totalPenalties = 0;

            snapshot.forEach(child => {
                totalUsers++;
                const u = child.val();
                totalCorrect += (u.quizCorrect || 0);
                totalPlayed += (u.quizPlayed || 0);
                totalDerbyWins += (u.derby_wins || 0);
                totalPenalties += (u.penalties_scored || 0);
            });

            const totalQuestionsAnswered = totalPlayed * 5;
            const accuracy = totalQuestionsAnswered > 0 ? Math.round((totalCorrect / totalQuestionsAnswered) * 100) : 0;

            document.getElementById('stat-total-users').innerText = totalUsers;
            document.getElementById('stat-total-questions-solved').innerText = totalQuestionsAnswered;
            document.getElementById('stat-accuracy-rate').innerText = `${accuracy}%`;
        });

        // 2. قراءة عدد مباريات الديربي وركلات الجزاء من السجلات
        db.ref('app_activity_logs').limitToLast(100).on('value', snap => {
            const container = document.getElementById('admin-live-logs-list');
            if (!snap.exists()) {
                container.innerHTML = '<p style="text-align: center; color: var(--text-sub);">لا توجد أنشطة مسجلة حتى الآن.</p>';
                document.getElementById('stat-derby-battles').innerText = '0';
                document.getElementById('stat-penalty-played').innerText = '0';
                document.getElementById('stat-classic-quizzes').innerText = '0';
                return;
            }

            let logsArr = [];
            let derbyCount = 0;
            let penaltyCount = 0;
            let classicCount = 0;

            snap.forEach(child => {
                const log = child.val();
                log.id = child.key;
                logsArr.push(log);

                if (log.type === 'derby') derbyCount++;
                else if (log.type === 'penalty') penaltyCount++;
                else if (log.type === 'classic') classicCount++;
            });

            document.getElementById('stat-derby-battles').innerText = derbyCount;
            document.getElementById('stat-penalty-played').innerText = penaltyCount;
            document.getElementById('stat-classic-quizzes').innerText = classicCount;

            // ترتيب السجلات من الأحدث للأقدم
            // ترتيب السجلات من الأحدث للأقدم بناءً على الوقت الفعلي (Timestamp)
            logsArr.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

            let html = '';
            logsArr.slice(0, 50).forEach(log => {
                let badgeStyle = 'background: rgba(99, 102, 241, 0.2); color: var(--accent-highlight);';
                let typeText = '🧠 تحدي كلاسيكي';

                if (log.type === 'derby') {
                    badgeStyle = 'background: rgba(239, 68, 68, 0.2); color: #ef4444;';
                    typeText = '⚔️ ديربي 1v1';
                } else if (log.type === 'penalty') {
                    badgeStyle = 'background: rgba(16, 185, 129, 0.2); color: var(--accent-emerald);';
                    typeText = '⚽ ركلات جزاء';
                }

                const timeStr = log.timestamp ? new Date(log.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'numeric' }) : 'الآن';

                html += `
                <div class="live-log-item">
                    <div class="live-log-header">
                        <span class="card-badge" style="${badgeStyle}">${typeText}</span>
                        <span style="font-size: 0.7rem; color: var(--text-sub);">${timeStr}</span>
                    </div>
                    <p style="font-size: 0.84rem; color: var(--text-main); font-weight: 700; line-height: 1.5; margin: 0;">${log.details}</p>
                </div>`;
            });

            container.innerHTML = html;
        });
    }

    function clearActivityLogs() {
        playErrorSound();
        if (confirm('هل أنت متأكد من مسح جميع سجلات النشاط المباشر؟')) {
            db.ref('app_activity_logs').remove().then(() => {
                showTopToast('تم مسح السجلات بنجاح 🗑️', 'info');
            });
        }
    }
// ================= محرك الإنجازات ومنظومة الألقاب المتدرجة =================
    const defaultAchievementsConfig = {
        "derby_10": { title: "مقاتل الديربي", metric: "derby_wins", target: 10, xp: 100, coins: 20, rarity: "common" },
        "derby_50": { title: "سفاح الديربي", metric: "derby_wins", target: 50, xp: 400, coins: 80, rarity: "rare" },
        "derby_100": { title: "جلاد الديربي الأسطوري", metric: "derby_wins", target: 100, xp: 1000, coins: 200, rarity: "mythic" },

        "pen_5": { title: "قناص المرمى", metric: "penalties_scored", target: 5, xp: 100, coins: 20, rarity: "common" },
        "pen_25": { title: "ساحر الشباك", metric: "penalties_scored", target: 25, xp: 350, coins: 70, rarity: "rare" },
        "pen_50": { title: "سوبر هاتريك أسطوري", metric: "penalties_scored", target: 50, xp: 800, coins: 150, rarity: "mythic" },

        "streak_7": { title: "مداوم نشيط", metric: "daily_streak", target: 7, xp: 80, coins: 15, rarity: "common" },
        "streak_30": { title: "شعلة الاستمرار", metric: "daily_streak", target: 30, xp: 300, coins: 60, rarity: "rare" },
        "streak_60": { title: "أسطورة الحضور", metric: "daily_streak", target: 60, xp: 750, coins: 150, rarity: "mythic" },

        "quiz_50": { title: "محب المعرفة", metric: "quizCorrect", target: 50, xp: 100, coins: 20, rarity: "common" },
        "quiz_200": { title: "موسوعة الكلية", metric: "quizCorrect", target: 200, xp: 400, coins: 80, rarity: "rare" },
        "quiz_500": { title: "المخ البشري الأسطوري", metric: "quizCorrect", target: 500, xp: 1000, coins: 200, rarity: "mythic" }
    };

    let activeAchievementsConfig = { ...defaultAchievementsConfig };

    db.ref('achievements_config').once('value', snap => {
        if (snap.exists()) {
            activeAchievementsConfig = { ...defaultAchievementsConfig, ...snap.val() };
        } else {
            db.ref('achievements_config').set(defaultAchievementsConfig);
        }
        renderAchievementsTabUI();
    });

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

        const claimedAchievements = currentUser.claimed_achievements || [];
        const activeEquippedTitle = currentUser.active_title || 'none';

        let unlockedTitles = [];
        Object.keys(activeAchievementsConfig).forEach(achId => {
            if (claimedAchievements.includes(achId)) {
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
                    <span style="color: var(--accent-gold); font-weight: 800;">+${ach.xp} XP | +${ach.coins} 💸</span>
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
        if (metric === 'penalties_scored') return 'هدف ركلات جزاء';
        if (metric === 'quizCorrect') return 'إجابة صحيحة';
        if (metric === 'daily_streak') return 'أيام متتالية';
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
        
        // جلب الأسئلة الذكية من السحابة وتطبيق منع التكرار
        const questionsDeck = await fetchEhbedSmartQuestionsDeck();

        const roomData = {
            status: 'waiting', stake: ehbedStake, rewardXP: ehbedRewardXP, currentQIndex: 0,
            player1: { phone: currentUser.phone, name: currentUser.name, avatar: currentUser.avatar, score: 0, guess: null, answeredCurrent: false },
            player2: null,
            questions: questionsDeck
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
        try {
            const snap = await db.ref('ehbed_custom_questions').once('value');
            if (snap.exists()) {
                snap.forEach(c => {
                    const val = c.val();
                    if (val && val.q && val.answer !== undefined) {
                        allPool.push({ id: c.key, q: val.q, a: parseInt(val.answer) });
                    }
                });
            }
        } catch (e) {}

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

    function enterEhbedArena() {
        navigateTo('view-ehbed-game', 'اهبد صح 1v1', 'مواجهة التخمين');
        ehbedQIndex = -1;
        
        if (ehbedListener) db.ref('ehbed_battles/' + currentEhbedRoomId).off('value', ehbedListener);
        ehbedListener = db.ref('ehbed_battles/' + currentEhbedRoomId).on('value', snap => {
            if (!snap.exists()) return;
            currentEhbedRoom = snap.val();
            syncEhbedArena();
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

        if (me.score > opp.score) {
            playFlawlessVictorySound(); shootStars(); triggerConfetti();
            titleEl.innerText = 'ملك الهبد والتخمين! 🏆';
            subEl.innerText = 'أرقامك كانت أدق واكتسحت المنافس بامتياز!';
            iconEl.src = 'https://img.icons8.com/fluency/96/trophy.png';
            
            xp = room.rewardXP; coins = room.stake * 2;
            rewardText.innerText = `+${coins} عملة 💸 | +${xp} XP ⚡`;
            rewardBox.style.display = 'block';

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

        if (coins > 0 || xp > 0) {
            db.ref('users/' + currentUser.phone).transaction(user => {
                if(user) { user.xp = (user.xp||user.points||0) + xp; user.points = user.xp; user.coins = (user.coins||0) + coins; }
                return user;
            }).then(() => updateProfileUI());
        }

// إرسال الإحصائية للوحة تحكم الإدمن
        if (isHost) {
            recordActivityLog('derby', `انتهت مواجهة اهبد صح: [${me.name.split(' ')[0]}] (${me.score}) ضد [${opp.name.split(' ')[0]}] (${opp.score}) 🔢`);
        }

        currentEhbedRoomId = null;

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
// تفعيل تبويب اهبد صح في لوحة التحكم
    // (تأكد إنك ضفت اسم التبويب في مصفوفة switchAdminTab لو مش شغالة، بس ارفع الدوال دي في الآخر عادي)
    function switchAdminTab(tabName) {
        playClickSound();
        ['users','analytics','academic','store','tickets','broadcast','books','quiz','codes','achievements','ehbed-quiz'].forEach(t => {
            const tabBtn = document.getElementById('tab-admin-' + t);
            const tabSec = document.getElementById('admin-section-' + t);
            if (tabBtn) tabBtn.classList.remove('active');
            if (tabSec) tabSec.style.display = 'none';
        });
        const currentBtn = document.getElementById('tab-admin-' + tabName);
        const currentSec = document.getElementById('admin-section-' + tabName);
        if (currentBtn) currentBtn.classList.add('active');
        if (currentSec) currentSec.style.display = 'block';

        if (tabName === 'analytics') loadAdminAnalyticsAndLogs();
        if (tabName === 'tickets') loadAdminTickets();
        if (tabName === 'achievements') renderAdminAchievementsList();
        if (tabName === 'quiz') loadAdminCustomQuestions();
        if (tabName === 'ehbed-quiz') loadAdminEhbedQuestions();
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

        db.ref('ehbed_custom_questions').on('value', snap => {
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
        if(!currentUser) return;
        document.getElementById('transfer-phone-input').value = '';
        document.getElementById('transfer-amount-input').value = '';
        document.getElementById('transfer-type-input').value = 'coins'; // الافتراضي عملات
        openModal('modal-transfer-coins');
    }

    async function executeCoinTransfer() {
        playClickSound();
        const targetPhone = document.getElementById('transfer-phone-input').value.trim();
        const amount = parseInt(document.getElementById('transfer-amount-input').value);
        const transferType = document.getElementById('transfer-type-input').value; // 'coins' أو 'xp'

        if (!targetPhone || targetPhone.length < 11 || isNaN(amount) || amount <= 0) {
            showTopToast('يرجى إدخال رقم هاتف صحيح ومبلغ أكبر من الصفر!', 'error');
            return;
        }

        if (targetPhone === currentUser.phone) {
            showTopToast('لا يمكنك التحويل لنفسك يا هندسة!', 'error');
            return;
        }

        // تحديد الرصيد الحالي بناءً على نوع التحويل
        const userBalance = transferType === 'coins' ? (currentUser.coins || 0) : (currentUser.xp || currentUser.points || 0);
        
        if (userBalance < amount) {
            const typeName = transferType === 'coins' ? 'العملات' : 'النقاط (XP)';
            showTopToast(`رصيدك من ${typeName} غير كافٍ لإتمام التحويل!`, 'error');
            return;
        }

        const btn = document.querySelector('#modal-transfer-coins .btn-submit');
        btn.disabled = true;
        btn.innerText = 'جاري التحقق والتحويل... ⏳';

        try {
            // التأكد من أن المستلم مسجل فعلاً في النظام
            const receiverSnap = await db.ref('users/' + targetPhone).once('value');
            if (!receiverSnap.exists()) {
                showTopToast('هذا الرقم غير مسجل في التطبيق!', 'error');
                btn.disabled = false; btn.innerText = 'إرسال الدعم 🚀';
                return;
            }

            const receiverData = receiverSnap.val();
            const receiverName = receiverData.name.split(' ')[0] || 'زميلك';

            // مسار العملات
            if (transferType === 'coins') {
                await db.ref('users/' + currentUser.phone + '/coins').transaction(c => (c || 0) - amount);
                await db.ref('users/' + targetPhone + '/coins').transaction(c => (c || 0) + amount);
                
                recordUserTransaction(`تحويل عملات لـ ${receiverName}`, 0, -amount, 'purchase');
                db.ref('user_transactions/' + targetPhone).push({
                    title: `دعم عملات من ${currentUser.name.split(' ')[0]}`,
                    xp: 0, coins: amount, type: 'reward', timestamp: firebase.database.ServerValue.TIMESTAMP
                });
                
                showTopToast(`تم تحويل ${amount} عملة لـ ${receiverName} بنجاح! 🎉`, 'success');
            } 
            // مسار نقاط الخبرة (XP)
            else {
                await db.ref('users/' + currentUser.phone).transaction(user => {
                    if(user) {
                        let newXp = (user.xp || user.points || 0) - amount;
                        user.xp = newXp < 0 ? 0 : newXp;
                        user.points = user.xp;
                    }
                    return user;
                });
                
                await db.ref('users/' + targetPhone).transaction(user => {
                    if(user) {
                        let newXp = (user.xp || user.points || 0) + amount;
                        user.xp = newXp; user.points = newXp;
                    }
                    return user;
                });

                recordUserTransaction(`تحويل نقاط لـ ${receiverName}`, -amount, 0, 'purchase');
                db.ref('user_transactions/' + targetPhone).push({
                    title: `دعم نقاط (XP) من ${currentUser.name.split(' ')[0]}`,
                    xp: amount, coins: 0, type: 'reward', timestamp: firebase.database.ServerValue.TIMESTAMP
                });
                
                showTopToast(`تم تحويل ${amount} XP لـ ${receiverName} بنجاح! ⚡`, 'success');
            }

            closeModal('modal-transfer-coins');
            updateProfileUI(); // تحديث شاشة المرسل لتسميع الخصم فوراً
            
        } catch (e) {
            showTopToast('حدث خطأ بالشبكة، يرجى المحاولة لاحقاً.', 'error');
        } finally {
            btn.disabled = false;
            btn.innerText = 'إرسال الدعم 🚀';
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

function loadAdminAcademyLessons() {
    const list = document.getElementById('admin-academy-list');
    db.ref('eng_academy/basics').on('value', snap => {
        list.innerHTML = '';
        if(!snap.exists()) { list.innerHTML = '<p style="text-align:center;">لا توجد دروس.</p>'; return; }
        
        snap.forEach(child => {
            const id = child.key;
            const data = child.val();
            list.innerHTML += `
            <div class="admin-item-card">
                <div class="admin-item-info">
                    <div class="admin-item-name">${data.icon} ${data.title}</div>
                    <div class="admin-item-sub">${data.desc}</div>
                </div>
                <div style="display: flex; gap: 6px; flex-direction: column;">
                    <button class="admin-action-btn" style="padding: 4px 8px; font-size: 0.7rem;" onclick="editAdminAcademyLesson('${id}')">تعديل ✏️</button>
                    <button class="admin-action-btn danger" style="padding: 4px 8px; font-size: 0.7rem;" onclick="deleteAdminAcademyLesson('${id}')">حذف 🗑️</button>
                </div>
            </div>`;
        });
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