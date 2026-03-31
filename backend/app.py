from flask import Flask, request, jsonify, session
from flask_cors import CORS
import pickle
import numpy as np
import os
import json
import hashlib
import secrets

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)

# Enable CORS for all domains with credentials
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

MODEL_PATH = 'tourism_model.pkl'
USERS_FILE = 'users.json'

# --- User Storage Helpers ---
def load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_users(users):
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f, indent=2)

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# --- Auth Token Store (simple in-memory) ---
active_tokens = {}

# Global pre-load for extreme speed
loaded_data = None
if os.path.exists(MODEL_PATH):
    print("Loading ML model into memory...")
    with open(MODEL_PATH, 'rb') as f:
        loaded_data = pickle.load(f)
    print("Model loaded successfully!")

# --- Auth Routes ---
@app.route('/register', methods=['POST'])
def register():
    data = request.json
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = (data.get('password') or '').strip()

    if not name or not email or not password:
        return jsonify({"error": "All fields are required."}), 400
    if len(password) < 4:
        return jsonify({"error": "Password must be at least 4 characters."}), 400

    users = load_users()
    if email in users:
        return jsonify({"error": "Email already registered. Please login."}), 409

    users[email] = {
        "name": name,
        "email": email,
        "password": hash_password(password)
    }
    save_users(users)

    token = secrets.token_hex(24)
    active_tokens[token] = email

    return jsonify({
        "message": "Registration successful!",
        "token": token,
        "user": {"name": name, "email": email}
    }), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = (data.get('email') or '').strip().lower()
    password = (data.get('password') or '').strip()

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    users = load_users()
    user = users.get(email)

    if not user or user['password'] != hash_password(password):
        return jsonify({"error": "Invalid email or password."}), 401

    token = secrets.token_hex(24)
    active_tokens[token] = email

    return jsonify({
        "message": "Login successful!",
        "token": token,
        "user": {"name": user['name'], "email": user['email']}
    })

@app.route('/logout', methods=['POST'])
def logout():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if token in active_tokens:
        del active_tokens[token]
    return jsonify({"message": "Logged out successfully."})

@app.route('/me', methods=['GET'])
def me():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    email = active_tokens.get(token)
    if not email:
        return jsonify({"error": "Not authenticated."}), 401
    users = load_users()
    user = users.get(email)
    if not user:
        return jsonify({"error": "User not found."}), 404
    return jsonify({"user": {"name": user['name'], "email": user['email']}})

# --- Existing Routes ---
def generate_itinerary(city, days, places, food, experience="Leisure", travel_type="Couple"):
    plan = []
    num_places = len(places)
    
    exp_verbs_am = {"Adventure": "Gear up for an adrenaline-pumping morning exploring", "Culture": "Immerse yourself in history at", "Relaxation": "Take a slow, peaceful morning walk around", "Nature": "Breathe in the fresh morning air discovering", "Party": "Recover with a late brunch and head to"}
    exp_verbs_pm = {"Adventure": "Push your limits with afternoon activities near", "Culture": "Discover hidden local gems near", "Relaxation": "Enjoy a tranquil afternoon spa or lounging by", "Nature": "Hike or take a scenic drive around", "Party": "Pre-game and feel the vibrant energy near"}
    
    am_prefix = exp_verbs_am.get(experience, "Explore the beautiful sights of")
    pm_prefix = exp_verbs_pm.get(experience, "Continue your journey at")
    
    companion_text = {"Solo": "by yourself", "Couple": "with your partner", "Family": "with the whole family", "Friends": "with your squad"}
    who = companion_text.get(travel_type, "with your group")
    
    for day in range(1, days + 1):
        day_plan = {"day": f"Day {day}"}
        
        if day == 1:
            day_plan["morning"] = f"🛬 <b>Arrival & Check-in (10:00 AM)</b><br>Welcome to {city}! Drop your bags at the hotel, freshen up, and get ready for an amazing time {who}."
            day_plan["afternoon"] = f"🚶 <b>Neighborhood Walk (1:30 PM)</b><br>Grab a casual lunch at a local cafe to shake off the jet lag and explore the immediate surroundings."  
            day_plan["evening"] = f"🌃 <b>Welcome Dinner (7:00 PM)</b><br>Kick off the trip with authentic local {food[0] if len(food) > 0 else 'street food'}. Take a gentle evening stroll to soak in the city lights."
        elif day == days:
            day_plan["morning"] = f"☕ <b>Relaxed Morning (9:30 AM)</b><br>Enjoy a late breakfast. Perfect time for last-minute souvenir shopping for friends back home."
            day_plan["afternoon"] = f"🛫 <b>Departure (2:00 PM)</b><br>Pack up your bags {who}. Head to the airport/station. Goodbye {city}!"
            day_plan["evening"] = ""
        else:
            p1 = places[(day - 2) % num_places] if num_places > 0 else "a beautiful local spot"
            p2 = places[((day - 2) + 1) % num_places] if num_places > 1 else "a nearby cafe"
            f_item = food[day % len(food)] if len(food) > 0 else "some amazing local dishes"
            
            day_plan["morning"] = f"🌅 <b>Morning Exploration (9:00 AM)</b><br>{am_prefix} <i>{p1}</i>. Take plenty of photos and enjoy the vibe {who}."
            day_plan["afternoon"] = f"☀️ <b>Afternoon Adventure (2:00 PM)</b><br>{pm_prefix} <i>{p2}</i>. Take a break for some light snacks or coffee."
            day_plan["evening"] = f"🥂 <b>Evening Unwind (7:30 PM)</b><br>Find a highly-rated spot to enjoy <i>{f_item}</i>. End the day reflecting on memories made {who}."
            
        plan.append(day_plan)
        
    return plan

@app.route('/')
def index():
    return "Backend API is running. Please open http://localhost:8080 in your browser to view the Tourism Dashboard!"

@app.route('/predict', methods=['POST'])
def predict():
    if not loaded_data:
        return jsonify({"error": "Model not loaded on server."}), 500
    
    try:
        data = request.json
        def get_val(key):
            val = data.get(key) or data.get(key.lower()) or data.get(key.capitalize())
            if isinstance(val, str): val = val.strip()
            return val
        
        month = get_val('Month')
        travel_type = get_val('Travel_Type') or get_val('Travel_type') or get_val('travel_type')
        experience = get_val('Experience')
        climate = get_val('Climate')
        days = int(get_val('Days') or 3)
        
        encoders = loaded_data['encoders']
        model = loaded_data['model']
        target_encoder = loaded_data['target_encoder']
        city_mapping = loaded_data['city_mapping']
        
        month_enc = encoders['Month'].transform([month])[0]
        travel_enc = encoders['Travel_Type'].transform([travel_type])[0]
        exp_enc = encoders['Experience'].transform([experience])[0]
        clim_enc = encoders['Climate'].transform([climate])[0]
        
        features = np.array([[month_enc, days, travel_enc, exp_enc, clim_enc]])
        
        probs = model.predict_proba(features)[0]
        
        top_4_idx = probs.argsort()[-4:][::-1]
        
        top_cities = []
        for rank, idx in enumerate(top_4_idx, start=1):
            city_name = target_encoder.inverse_transform([idx])[0]
            c_info = city_mapping.get(city_name, {})
            
            est_low = c_info.get('base_cost', 2000) * days
            est_high = int(est_low * 1.5)
            
            # Generate mock budget breakdown
            food_pct = int(np.random.randint(20, 35))
            transport_pct = int(np.random.randint(15, 25))
            activities_pct = int(np.random.randint(10, 20))
            accommodation_pct = 100 - (food_pct + transport_pct + activities_pct)

            # Temps
            city_temperatures = {
                'Ooty': [15, 23], 'Goa': [25, 34], 'Manali': [10, 20], 'Darjeeling': [12, 21],
                'Jaipur': [22, 35], 'Rishikesh': [18, 30], 'Mumbai': [26, 33], 'Kerala': [24, 32],
                'Shimla': [14, 25], 'Agra': [22, 38]
            }
            c_temp = city_temperatures.get(city_name, [20, 30])
            
            city_obj = {
                "rank": rank,
                "city": city_name,
                "description": c_info.get('desc', ''),
                "match_pct": round(float(probs[idx]) * 100, 1),
                "base_cost": est_low,
                "places": c_info.get('places', []),
                "food": c_info.get('food', []),
                "estimated_expense": f"₹{est_low:,} - ₹{est_high:,} / person",
                "temperature_range": c_temp,
                "budget_breakdown": {
                    "Accommodation": accommodation_pct,
                    "Food": food_pct,
                    "Transport": transport_pct,
                    "Activities": activities_pct
                },
                "itinerary": generate_itinerary(city_name, days, c_info.get('places', []), c_info.get('food', []), experience, travel_type)
            }
            
            top_cities.append(city_obj)
        
        return jsonify({
            "results": top_cities,
            "model_name": loaded_data['model_name'],
            "model_accuracy": loaded_data['model_accuracy']
        })
                                
    except Exception as e:
        return jsonify({"error": f"Prediction error: {str(e)}. Please check inputs."}), 400

@app.route('/options', methods=['GET'])
def options():
    if not loaded_data:
        return jsonify({"error": "Model not loaded."}), 500
        
    months_order = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    raw_months = loaded_data.get('dropdown_options', {}).get('Month', [])
    sorted_months = sorted(raw_months, key=lambda m: months_order.index(m) if m in months_order else 99)
    
    options_dict = loaded_data.get('dropdown_options', {})
    options_dict['Month'] = sorted_months
    
    return jsonify({
        "options": options_dict,
        "model_name": loaded_data.get('model_name', 'Unknown'),
        "model_accuracy": loaded_data.get('model_accuracy', 0)
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
