from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import os

app = Flask(__name__)
# Enable CORS for all domains
CORS(app, resources={r"/*": {"origins": "*"}})

MODEL_PATH = 'tourism_model.pkl'

# Global pre-load for extreme speed
loaded_data = None
if os.path.exists(MODEL_PATH):
    print("Loading ML model into memory...")
    with open(MODEL_PATH, 'rb') as f:
        loaded_data = pickle.load(f)
    print("Model loaded successfully!")

def generate_itinerary(city, days, places, food):
    plan = []
    num_places = len(places)
    
    for day in range(1, days + 1):
        day_plan = {"day": f"Day {day}"}
        
        if day == 1:
            day_plan["morning"] = f"Arrival in {city} and hotel check-in. Drop the bags!"
            day_plan["afternoon"] = f"Head out to relax and grab a casual lunch."  
            day_plan["evening"] = f"Welcome drinks with friends and try local {food[0] if len(food) > 0 else 'street food'} to kick off the trip!"
        elif day == days:
            day_plan["morning"] = f"Late breakfast and final souvenir shopping."
            day_plan["afternoon"] = f"Pack up and departure from {city}."
            day_plan["evening"] = ""
        else:
            p1 = places[(day - 2) % num_places] if num_places > 0 else "a beautiful local spot"
            p2 = places[((day - 2) + 1) % num_places] if num_places > 1 else "a nearby cafe"
            f_item = food[day % len(food)] if len(food) > 0 else "some amazing local drinks"
            
            day_plan["morning"] = f"Morning expedition exploring {p1}."
            day_plan["afternoon"] = f"Afternoon chill vibes hanging out at {p2}."
            day_plan["evening"] = f"Evening party! Enjoying drinks and tasting {f_item} with the group."
            
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
            
            city_obj = {
                "rank": rank,
                "city": city_name,
                "description": c_info.get('desc', ''),
                "places": c_info.get('places', []),
                "food": c_info.get('food', []),
                "estimated_expense": f"₹{est_low:,} - ₹{est_high:,} / person",
                "itinerary": generate_itinerary(city_name, days, c_info.get('places', []), c_info.get('food', []))
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
    # Listen on all interfaces to avoid localhost matching issues
    app.run(host='0.0.0.0', port=5000, debug=False)
