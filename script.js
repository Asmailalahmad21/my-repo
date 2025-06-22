document.addEventListener('DOMContentLoaded', () => {

    // --- 1. تحديد العناصر (بعضها قد لا يكون موجودًا في كل صفحة) ---
    const elements = {
        themeSwitcher: document.getElementById('theme-switcher-checkbox'),
        headerStarsStat: document.getElementById('header-stars-stat'),
        // صفحة المهام
        streakStat: document.getElementById('streak-stat'),
        todayStat: document.getElementById('today-stat'),
        addTaskForm: document.getElementById('add-task-form'),
        taskInput: document.getElementById('task-input'),
        taskStartTime: document.getElementById('task-start-time'), // جديد
        taskEndTime: document.getElementById('task-end-time'),     // جديد
        taskList: document.getElementById('task-list'),
        emptyListMsg: document.getElementById('empty-list-msg'),
        // صفحة المكافآت
        rewardsList: document.getElementById('rewards-list'),
        // صفحة المؤقت
        timerDisplay: document.getElementById('timer-display'),
        timerMessage: document.getElementById('timer-message'),
        stopTimerBtn: document.getElementById('stop-timer-btn'),
    };

    // --- 2. الحالة والبيانات ---
    let state = {};

    const REWARDS = [
        { id: 1, text: 'استراحة قصيرة (5 دقائق)', cost: 3, icon: '☕', duration: 5 * 60 },
        { id: 2, text: 'مشاهدة فيديو ممتع (10 دقائق)', cost: 7, icon: '▶️', duration: 10 * 60 },
        { id: 3, text: 'قطعة حلوى أو مشروب مفضل', cost: 12, icon: '🍬', duration: 0 },
        { id: 5, text: 'شراء هدية بسيطة لنفسك', cost: 35, icon: '🎁', duration: 0 },
        { id: 6, text: 'يوم راحة أو نشاط مميز', cost: 50, icon: '🎉', duration: 0 },
    ];

    // --- 3. وظائف حفظ وتحميل الحالة ---
    function saveState() {
        localStorage.setItem('tahadiAlnojomState', JSON.stringify(state));
    }

    function loadState() {
        const savedState = JSON.parse(localStorage.getItem('tahadiAlnojomState'));
        const defaultState = {
            tasks: [],
            stats: { stars: 0, streak: 0, tasksToday: 0, lastCompletedDate: null },
            theme: 'light',
        };
        state = { ...defaultState, ...savedState };
        
        // **منطق دقيق لتصفير الإحصائيات اليومية**
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        if (state.stats.lastCompletedDate !== today) {
            // إذا كان آخر إنجاز ليس اليوم، صفر عداد مهام اليوم
            state.stats.tasksToday = 0;
            // إذا كان آخر إنجاز ليس اليوم وليس الأمس، صفر السلسلة
            if (state.stats.lastCompletedDate !== yesterday) {
                state.stats.streak = 0;
            }
        }
    }

    // --- 4. وظائف العرض (Render Functions) ---
    function renderTheme() {
        document.documentElement.setAttribute('data-theme', state.theme);
        if (elements.themeSwitcher) {
            elements.themeSwitcher.checked = state.theme === 'dark';
        }
    }

    function renderHeader() {
        if (elements.headerStarsStat) {
            elements.headerStarsStat.textContent = state.stats.stars;
        }
    }

    function renderTasksPage() {
        if (!elements.taskList) return; // تأكد أننا في صفحة المهام
        elements.streakStat.textContent = state.stats.streak;
        elements.todayStat.textContent = state.stats.tasksToday;
        
        elements.taskList.innerHTML = '';
        if (state.tasks.length === 0) {
            elements.emptyListMsg.style.display = 'block';
        } else {
            elements.emptyListMsg.style.display = 'none';
            state.tasks.forEach(task => {
                const li = document.createElement('li');
                li.className = `task-item ${task.completed ? 'completed' : ''}`;
                li.dataset.id = task.id;

                // إنشاء نص الوقت (جديد)
                let timeHTML = '';
                if (task.startTime && task.endTime) {
                    timeHTML = `<span class="task-time">${task.startTime} - ${task.endTime}</span>`;
                }
                
                li.innerHTML = `
                    <input type="checkbox" class="complete-checkbox" ${task.completed ? 'checked' : ''}>
                    <div class="task-details">
                        <span class="task-text">${task.text}</span>
                        ${timeHTML}
                    </div>
                    <button class="delete-btn">🗑️</button>
                `;
                elements.taskList.appendChild(li);
            });
        }
    }

    // ... باقي دوال العرض تبقى كما هي ...
    function renderRewardsPage() {
        if (!elements.rewardsList) return; // تأكد أننا في صفحة المكافآت
        elements.rewardsList.innerHTML = '';
        REWARDS.forEach(reward => {
            const affordable = state.stats.stars >= reward.cost;
            const li = document.createElement('li');
            li.className = `reward-item ${affordable ? 'affordable' : ''}`;
            li.dataset.id = reward.id;
            li.innerHTML = `
                <span class="reward-cost">${reward.cost}</span>
                <div class="reward-info">${reward.icon} ${reward.text}</div>
                <button class="reward-buy-btn" ${!affordable ? 'disabled' : ''}>شراء</button>
            `;
            elements.rewardsList.appendChild(li);
        });
    }

    // --- 5. منطق التطبيق ---
    function addTask(text, startTime, endTime) { // تعديل الدالة
        state.tasks.push({ id: Date.now(), text, completed: false, startTime, endTime });
        saveState();
        renderTasksPage();
    }

    function completeTask(id) {
        const task = state.tasks.find(t => t.id === id);
        if (task && !task.completed) {
            task.completed = true;
            state.stats.stars += 1;
            state.stats.tasksToday += 1;
            
            // **منطق دقيق ومحدث لحساب سلسلة الإنجاز**
            const today = new Date().toDateString();
            const yesterday = new Date(Date.now() - 86400000).toDateString();
            
            if (state.stats.lastCompletedDate === yesterday) {
                // إذا كان آخر إنجاز بالأمس، استمر في السلسلة
                state.stats.streak += 1;
            } else if (state.stats.lastCompletedDate !== today) {
                // إذا كان آخر إنجاز ليس اليوم (وليس الأمس)، ابدأ سلسلة جديدة
                state.stats.streak = 1;
            }
            // إذا كان آخر إنجاز هو اليوم، لا تفعل شيئًا للسلسلة

            state.stats.lastCompletedDate = today; // تحديث تاريخ آخر إنجاز
            
            saveState();
            renderHeader();
            renderTasksPage();
        }
    }

    // ... باقي دوال منطق التطبيق تبقى كما هي ...
    function deleteTask(id) {
        state.tasks = state.tasks.filter(t => t.id !== id);
        saveState();
        renderTasksPage();
    }
    
    function buyReward(id) {
        const reward = REWARDS.find(r => r.id === id);
        if (reward && state.stats.stars >= reward.cost) {
            state.stats.stars -= reward.cost;
            saveState();
            if (reward.duration > 0) {
                localStorage.setItem('timerToStart', JSON.stringify({ duration: reward.duration, text: reward.text }));
                window.location.href = 'timer.html';
            } else {
                alert(`تهانينا! لقد حصلت على مكافأة: ${reward.text}`);
                renderHeader();
                renderRewardsPage();
            }
        }
    }

    // --- 6. منطق المؤقت (Timer Logic) ---
    // ... يبقى كما هو ...
    let timerInterval;
    function runTimerPage() {
        if (!elements.timerDisplay) return;
        const timerData = JSON.parse(localStorage.getItem('timerToStart'));
        if (!timerData) {
            elements.timerDisplay.textContent = "خطأ!";
            elements.timerMessage.textContent = "لم يتم تحديد وقت. عد لصفحة المكافآت.";
            return;
        }
        localStorage.removeItem('timerToStart');
        elements.timerMessage.textContent = timerData.text;
        let secondsLeft = timerData.duration;
        function updateDisplay() {
            if (secondsLeft < 0) {
                clearInterval(timerInterval);
                elements.timerDisplay.textContent = "انتهى!";
                alert("انتهى الوقت!");
                window.location.href = 'rewards.html';
                return;
            }
            const mins = Math.floor(secondsLeft / 60);
            const secs = secondsLeft % 60;
            elements.timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            secondsLeft--;
        }
        updateDisplay();
        timerInterval = setInterval(updateDisplay, 1000);
        elements.stopTimerBtn.addEventListener('click', () => {
            clearInterval(timerInterval);
            window.location.href = 'rewards.html';
        });
    }

    // --- 7. ربط الأحداث ---
    // ... ربط الأحداث السابقة يبقى كما هو ...
    if (elements.themeSwitcher) {
        elements.themeSwitcher.addEventListener('change', () => {
            state.theme = elements.themeSwitcher.checked ? 'dark' : 'light';
            saveState();
            renderTheme();
        });
    }
    // تعديل event listener لإضافة المهمة
    if (elements.addTaskForm) {
        elements.addTaskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = elements.taskInput.value.trim();
            const startTime = elements.taskStartTime.value;
            const endTime = elements.taskEndTime.value;
            if (text) {
                addTask(text, startTime, endTime);
                elements.taskInput.value = '';
                elements.taskStartTime.value = '';
                elements.taskEndTime.value = '';
            }
        });
    }
    if (elements.taskList) {
        elements.taskList.addEventListener('click', (e) => {
            const taskItem = e.target.closest('.task-item');
            if (!taskItem) return;
            const id = parseInt(taskItem.dataset.id);
            if (e.target.classList.contains('complete-checkbox')) {
                completeTask(id);
            }
            if (e.target.classList.contains('delete-btn')) {
                deleteTask(id);
            }
        });
    }
    if (elements.rewardsList) {
        elements.rewardsList.addEventListener('click', (e) => {
            if (e.target.classList.contains('reward-buy-btn')) {
                const rewardItem = e.target.closest('.reward-item');
                const id = parseInt(rewardItem.dataset.id);
                buyReward(id);
            }
        });
    }

    // --- 8. التشغيل الأولي ---
    loadState();
    renderTheme();
    renderHeader();
    renderTasksPage();
    renderRewardsPage();
    runTimerPage();
});