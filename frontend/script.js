const API_URL = 'http://127.0.0.1:5000';
let currentResults = [];
let suitabilityChartInstance = null;
let budgetChartInstance = null;
let cityBudgetChartInstance = null;
let climateChartInstance = null;
let explorerChartInstance = null;
let lastDaysUsed = 5;

// ============================================
// AUTH FUNCTIONS
// ============================================

function getToken() {
    return localStorage.getItem('wanderlust_token');
}
function getUser() {
    const u = localStorage.getItem('wanderlust_user');
    return u ? JSON.parse(u) : null;
}
function saveSession(token, user) {
    localStorage.setItem('wanderlust_token', token);
    localStorage.setItem('wanderlust_user', JSON.stringify(user));
}
function clearSession() {
    localStorage.removeItem('wanderlust_token');
    localStorage.removeItem('wanderlust_user');
}

function showLogin() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    clearErrors();
}
function showRegister() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
    clearErrors();
}
function clearErrors() {
    document.getElementById('loginError').classList.add('hidden');
    document.getElementById('regError').classList.add('hidden');
}

async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const errBox = document.getElementById('loginError');
    const btn = document.getElementById('loginBtn');
    const btnText = document.getElementById('loginBtnText');
    const spinner = document.getElementById('loginSpinner');

    errBox.classList.add('hidden');
    if (!email || !password) {
        errBox.textContent = 'Please fill in all fields! 📝';
        errBox.classList.remove('hidden');
        return;
    }

    btn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'block';

    try {
        const resp = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await resp.json();
        if (data.error) {
            errBox.textContent = data.error;
            errBox.classList.remove('hidden');
        } else {
            saveSession(data.token, data.user);
            showDashboard(data.user);
            showToast(`Welcome back, ${data.user.name}! 🎉`);
        }
    } catch (e) {
        errBox.textContent = 'Cannot connect to server. Is the backend running? 🔌';
        errBox.classList.remove('hidden');
    } finally {
        btn.disabled = false;
        btnText.style.display = 'block';
        spinner.style.display = 'none';
    }
}

async function handleRegister() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const errBox = document.getElementById('regError');
    const btn = document.getElementById('regBtn');
    const btnText = document.getElementById('regBtnText');
    const spinner = document.getElementById('regSpinner');

    errBox.classList.add('hidden');
    if (!name || !email || !password) {
        errBox.textContent = 'All fields are required! 📝';
        errBox.classList.remove('hidden');
        return;
    }

    btn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'block';

    try {
        const resp = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await resp.json();
        if (data.error) {
            errBox.textContent = data.error;
            errBox.classList.remove('hidden');
        } else {
            saveSession(data.token, data.user);
            showDashboard(data.user);
            showToast(`Account created! Let's explore, ${data.user.name}! 🗺️`);
        }
    } catch (e) {
        errBox.textContent = 'Cannot connect to server. Is the backend running? 🔌';
        errBox.classList.remove('hidden');
    } finally {
        btn.disabled = false;
        btnText.style.display = 'block';
        spinner.style.display = 'none';
    }
}

async function handleLogout() {
    const token = getToken();
    try {
        await fetch(`${API_URL}/logout`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    } catch (e) { /* ignore */ }
    clearSession();
    showAuthScreen();
    showToast('Logged out. See you next trip! ✈️');
}

function showDashboard(user) {
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('dashboardScreen').classList.remove('hidden');
    document.body.classList.add('dashboard-active');
    document.getElementById('userName').textContent = user.name;
    document.getElementById('welcomeMsg').textContent = `Hey ${user.name}! 🎉 Where to next?`;

    // Pick a random travel avatar
    const avatars = ['🧳', '🌴', '🏄', '🎒', '🗺️', '🧭', '✈️', '🏖️'];
    document.getElementById('userAvatar').textContent = avatars[Math.floor(Math.random() * avatars.length)];
}

function showAuthScreen() {
    document.getElementById('authScreen').classList.remove('hidden');
    document.getElementById('dashboardScreen').classList.add('hidden');
    document.body.classList.remove('dashboard-active');
    showLogin();
}

function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
}

// ============================================
// FLOATING EMOJIS
// ============================================
function spawnFloatingEmojis() {
    const container = document.getElementById('floatingEmojis');
    if (!container) return;
    const emojis = ['✈️', '🌍', '🏖️', '🗺️', '🌴', '⛰️', '🎒', '🧭', '🏔️', '🚢', '🌅', '🗼', '🎡', '🌺', '🐚'];
    
    for (let i = 0; i < 18; i++) {
        const el = document.createElement('div');
        el.className = 'float-emoji';
        el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        el.style.left = Math.random() * 100 + '%';
        el.style.animationDuration = (12 + Math.random() * 20) + 's';
        el.style.animationDelay = (Math.random() * 15) + 's';
        el.style.fontSize = (1.2 + Math.random() * 1.5) + 'rem';
        container.appendChild(el);
    }
}

// ============================================
// MAIN APP LOGIC
// ============================================
document.addEventListener('DOMContentLoaded', () => {

    // Spawn floating emojis
    spawnFloatingEmojis();

    // Check for existing session
    const token = getToken();
    const user = getUser();
    if (token && user) {
        // Verify token with backend
        fetch(`${API_URL}/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(r => r.json())
        .then(data => {
            if (data.user) {
                showDashboard(data.user);
            } else {
                clearSession();
                showAuthScreen();
            }
        })
        .catch(() => {
            // Backend might be down, still show dashboard with cached user
            showDashboard(user);
        });
    } else {
        showAuthScreen();
    }

    // Fetch dropdown options
    fetch(`${API_URL}/options`)
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                showError(data.error);
                return;
            }
            populateSelect('month', data.options.Month);
            populateSelect('climate', data.options.Climate);
            populateSelect('experience', data.options.Experience);
            populateSelect('travel_type', data.options.Travel_Type);
        })
        .catch(err => {
            // Silently handle - user will see error when they submit
        });

    // Form submission
    const form = document.getElementById('recommendationForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        document.getElementById('errorBox').classList.add('hidden');
        
        const btn = document.getElementById('submitBtn');
        const btnText = document.getElementById('btnText');
        const spinner = document.getElementById('spinner');
        
        btn.disabled = true;
        btnText.style.display = 'none';
        spinner.style.display = 'block';
        
        const payload = {
            Month: document.getElementById('month').value,
            Days: document.getElementById('days').value,
            Climate: document.getElementById('climate').value,
            Experience: document.getElementById('experience').value,
            Travel_Type: document.getElementById('travel_type').value
        };

        try {
            const resp = await fetch(`${API_URL}/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const data = await resp.json();
            
            if (data.error) {
                showError(data.error);
            } else {
                currentResults = data.results;
                lastDaysUsed = parseInt(payload.Days || 5);
                showSelectionGrid();
            }
        } catch (error) {
            showError("Network Error. Cannot connect to API. 🔌");
        } finally {
            btn.disabled = false;
            btnText.style.display = 'block';
            spinner.style.display = 'none';
        }
    });

    // Back Button
    document.getElementById('backBtn').addEventListener('click', () => {
        document.getElementById('reportView').classList.add('hidden');
        document.getElementById('selectionView').classList.remove('hidden');
    });

    // Make the Days slider interactively change chart values!
    document.getElementById('days').addEventListener('input', (e) => {
        const newDays = parseInt(e.target.value);
        document.getElementById('daysValue').textContent = newDays;
        
        if (currentResults.length > 0 && budgetChartInstance && lastDaysUsed) {
            // Update the Budget Chart dynamically
            const newData = currentResults.map(c => Math.round((c.base_cost / lastDaysUsed) * newDays));
            budgetChartInstance.data.datasets[0].data = newData;
            budgetChartInstance.update();

            // Update the final report UI if visible
            const activeCityName = document.getElementById('reportCityName').textContent.replace('📍 ', '');
            const activeCity = currentResults.find(c => c.city === activeCityName);
            if (activeCity) {
                const estLow = Math.round((activeCity.base_cost / lastDaysUsed) * newDays);
                const estHigh = Math.round(estLow * 1.5);
                document.getElementById('reportExpense').textContent = `💰 ₹${estLow.toLocaleString()} - ₹${estHigh.toLocaleString()} / person`;
            }
        }
    });

    // Allow Enter key to submit auth forms
    document.getElementById('loginPassword').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    document.getElementById('regPassword').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleRegister();
    });

    function populateSelect(id, items) {
        const select = document.getElementById(id);
        if (!select || !items) return;
        items.forEach(item => {
            const el = document.createElement('option');
            el.value = item;
            el.textContent = item;
            select.appendChild(el);
        });
    }

    function showSelectionGrid() {
        document.getElementById('emptyState').classList.add('hidden');
        document.getElementById('reportView').classList.add('hidden');
        document.getElementById('selectionView').classList.remove('hidden');

        const labels = currentResults.map(c => c.city);
        const matchData = currentResults.map(c => c.match_pct || 0);
        const budgetData = currentResults.map(c => c.base_cost || parseInt((c.estimated_expense.match(/\d+/g) || ['0']).join('')));

        // Chart 1: Suitability Pie Chart
        const suitCtx = document.getElementById('suitabilityChart').getContext('2d');
        if (suitabilityChartInstance) suitabilityChartInstance.destroy();
        suitabilityChartInstance = new Chart(suitCtx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: matchData,
                    backgroundColor: ['#6c5ce7', '#00cec9', '#fdcb6e', '#e17055'],
                    borderWidth: 0,
                    hoverOffset: 12
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#fff', font: { family: 'Outfit', size: 14 } } },
                    tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw}% match` } }
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const cityObj = currentResults[index];
                        
                        document.getElementById('explorerCityName').textContent = cityObj.city;
                        // Build fake vibe profile
                        let seed = 0;
                        for(let i=0; i<cityObj.city.length; i++) seed += cityObj.city.charCodeAt(i);
                        const fakeVibe = (offset) => Math.floor(Math.max(30, Math.min(100, (seed * offset) % 100)));

                        if (explorerChartInstance) {
                            explorerChartInstance.data.datasets[0].data = [
                                fakeVibe(7),  // Adventure
                                fakeVibe(13), // Culture
                                fakeVibe(17), // Relaxation
                                fakeVibe(23), // Nature
                                fakeVibe(29)  // Food
                            ];
                            explorerChartInstance.update();
                        }
                        
                        const viewBtn = document.getElementById('viewIterBtn');
                        viewBtn.classList.remove('hidden');
                        viewBtn.onclick = () => showReport(index);
                    }
                }
            }
        });

        // Chart 2: Budget Line Chart
        const bdgCtx = document.getElementById('budgetChart').getContext('2d');
        if (budgetChartInstance) budgetChartInstance.destroy();
        budgetChartInstance = new Chart(bdgCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Base Cost (₹)',
                    data: budgetData,
                    borderColor: '#00cec9',
                    backgroundColor: 'rgba(0, 206, 201, 0.2)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#fdcb6e',
                    pointBorderColor: '#fff',
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { ticks: { color: '#a4a8c7' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                    x: { ticks: { color: '#a4a8c7' }, grid: { color: 'rgba(255,255,255,0.1)' } }
                },
                plugins: {
                    legend: { labels: { color: '#fff', font: {family: 'Outfit'} } }
                }
            }
        });

        // Chart 3: Climate Range Chart
        const climCtx = document.getElementById('climateChart').getContext('2d');
        if (climateChartInstance) climateChartInstance.destroy();
        
        const lowTempData = currentResults.map(c => c.temperature_range ? c.temperature_range[0] : 15);
        const highTempData = currentResults.map(c => c.temperature_range ? c.temperature_range[1] : 25);

        climateChartInstance = new Chart(climCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Low Temp (°C)',
                        data: lowTempData,
                        backgroundColor: '#00cec9',
                        borderRadius: 4
                    },
                    {
                        label: 'High Temp (°C)',
                        data: highTempData,
                        backgroundColor: '#e17055',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: { ticks: { color: '#a4a8c7' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                    x: { ticks: { color: '#a4a8c7' }, grid: { color: 'transparent' } }
                },
                plugins: {
                    legend: { labels: { color: '#fff', font: {family: 'Outfit'} } }
                }
            }
        });

        // Chart 4: City Vibe Spectrum (Bar)
        const expCtx = document.getElementById('explorerChart').getContext('2d');
        if (explorerChartInstance) explorerChartInstance.destroy();
        
        explorerChartInstance = new Chart(expCtx, {
            type: 'bar',
            data: {
                labels: ['Adventure', 'Culture', 'Relax', 'Nature', 'Food'],
                datasets: [{
                    label: 'Vibe Score',
                    data: [50, 50, 50, 50, 50],
                    backgroundColor: ['#ff7e67', '#00a8cc', '#ffc13b', '#6c5ce7', '#00cec9'],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { color: '#a4a8c7', stepSize: 25 },
                        grid: { color: 'rgba(0, 0, 0, 0.08)' }
                    },
                    x: {
                        ticks: { color: '#fff', font: { family: 'Outfit', size: 12 } },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    function showReport(index) {
        const cityObj = currentResults[index];
        
        // Don't hide selection view, let them scroll down or see it side-by-side
        document.getElementById('reportView').classList.remove('hidden');
        
        // Scroll to report view smoothly
        setTimeout(() => {
            document.getElementById('reportView').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);

        document.getElementById('reportCityName').textContent = `📍 ${cityObj.city}`;
        document.getElementById('reportExpense').textContent = `💰 ${cityObj.estimated_expense}`;
        document.getElementById('reportDesc').textContent = cityObj.description;
        
        document.getElementById('reportPlaces').textContent = cityObj.places && cityObj.places.length > 0 ? cityObj.places.join(', ') : 'Explore local markets and culture.';
        document.getElementById('reportFood').textContent = cityObj.food && cityObj.food.length > 0 ? cityObj.food.join(', ') : 'Try the local street food.';

        // Chart 3: City Budget Breakdown Pie Chart
        const breakdownObj = cityObj.budget_breakdown || { "Accommodation": 40, "Food": 30, "Transport": 20, "Activities": 10 };
        const bCtx = document.getElementById('cityBudgetChart').getContext('2d');
        if (cityBudgetChartInstance) cityBudgetChartInstance.destroy();
        cityBudgetChartInstance = new Chart(bCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(breakdownObj),
                datasets: [{
                    data: Object.values(breakdownObj),
                    backgroundColor: ['#e17055', '#6c5ce7', '#fdcb6e', '#00cec9'],
                    borderWidth: 0,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { color: '#fff', font: {family: 'Outfit'}, boxWidth: 12 } },
                    tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw}%` } }
                }
            }
        });

        const ul = document.getElementById('reportItinerary');
        ul.innerHTML = '';
        
        cityObj.itinerary.forEach(plan => {
            const dayBox = document.createElement('div');
            dayBox.className = 'day-box';
            
            const dayNum = plan.day.replace('Day ', '');
            const dayEmojis = ['🛬', '🧭', '🗺️', '🏞️', '🎭', '🛍️', '🌅', '🏄', '🎡', '🌺', '🚢', '🏔️', '🎒', '🛫'];
            const emoji = dayEmojis[parseInt(dayNum) - 1] || '📅';

            let html = `<div class="day-title">${emoji} ${plan.day}</div>`;
            
            if (plan.morning) {
                html += '<div class="day-plan-item">' +
                        '<div class="day-plan-time">🌅 Morning</div>' +
                        '<div class="day-plan-desc">' + plan.morning + '</div>' +
                        '</div>';
            }
            if (plan.afternoon) {
                html += '<div class="day-plan-item">' +
                        '<div class="day-plan-time">☀️ Afternoon</div>' +
                        '<div class="day-plan-desc">' + plan.afternoon + '</div>' +
                        '</div>';
            }
            if (plan.evening) {
                html += '<div class="day-plan-item">' +
                        '<div class="day-plan-time">🌙 Evening</div>' +
                        '<div class="day-plan-desc">' + plan.evening + '</div>' +
                        '</div>';
            }
            
            dayBox.innerHTML = html;
            ul.appendChild(dayBox);
        });
    }

    function showError(msg) {
        const box = document.getElementById('errorBox');
        box.classList.remove('hidden');
        box.textContent = msg;
    }
});
