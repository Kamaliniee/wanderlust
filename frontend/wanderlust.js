const API_URL = 'http://127.0.0.1:5000';
let currentResults = [];

document.addEventListener('DOMContentLoaded', () => {

    // Fetch options dynamically
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

            document.getElementById('modelStats').textContent =
                `ML Accuracy: ${data.model_accuracy}%`;
        })
        .catch(err => {
            showError("Cannot connect to Flask backend.");
        });

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
                showSelectionGrid();
            }
        } catch (error) {
            showError("Network Error. Cannot connect to API.");
        } finally {
            btn.disabled = false;
            btnText.style.display = 'block';
            spinner.style.display = 'none';
        }
    });

    // Back Button (from Report to Options)
    document.getElementById('backBtn').addEventListener('click', () => {
        document.getElementById('reportView').classList.add('hidden');
        document.getElementById('selectionView').classList.remove('hidden');
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

        const grid = document.getElementById('optionsGrid');
        grid.innerHTML = '';

        currentResults.forEach((cityObj, index) => {
            const card = document.createElement('div');
            card.className = 'city-card';

            card.innerHTML = `
                <span class="rank-tag">Match #${cityObj.rank}</span>
                <h3>${cityObj.city}</h3>
                <p>${cityObj.description.substring(0, 90)}...</p>
                <div class="card-bottom">
                    <span class="est-expense-sm">Est: ${cityObj.estimated_expense.split('/')[0].trim()}</span>
                    <span style="font-size: 0.8rem; color: #fbbf24; font-weight:700;">View Report ➔</span>
                </div>
            `;

            card.addEventListener('click', () => {
                showReport(index);
            });

            grid.appendChild(card);
        });
    }

    function showReport(index) {
        const cityObj = currentResults[index];

        document.getElementById('selectionView').classList.add('hidden');
        document.getElementById('reportView').classList.remove('hidden');

        document.getElementById('reportCityName').textContent = cityObj.city;
        document.getElementById('reportExpense').textContent = cityObj.estimated_expense;
        document.getElementById('reportDesc').textContent = cityObj.description;

        document.getElementById('reportPlaces').textContent = cityObj.places.length > 0 ? cityObj.places.join(', ') : 'Explore local markets and culture.';
        document.getElementById('reportFood').textContent = cityObj.food.length > 0 ? cityObj.food.join(', ') : 'Try the local street food.';

        const ul = document.getElementById('reportItinerary');
        ul.innerHTML = '';

        // Render detailed itinerary blocks
        cityObj.itinerary.forEach(plan => {
            const dayBox = document.createElement('div');
            dayBox.className = 'day-box';

            let html = '<div class="day-title">' + plan.day + '</div>';

            if (plan.morning) {
                html += '<div class="day-plan-item">' +
                    '<div class="day-plan-time">Morning</div>' +
                    '<div class="day-plan-desc">' + plan.morning + '</div>' +
                    '</div>';
            }
            if (plan.afternoon) {
                html += '<div class="day-plan-item">' +
                    '<div class="day-plan-time">Afternoon</div>' +
                    '<div class="day-plan-desc">' + plan.afternoon + '</div>' +
                    '</div>';
            }
            if (plan.evening) {
                html += '<div class="day-plan-item">' +
                    '<div class="day-plan-time">Evening</div>' +
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
