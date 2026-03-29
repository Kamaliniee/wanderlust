import pandas as pd
import random

random.seed(42)

months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
travel_types = ['Solo', 'Family', 'Friends', 'Couple']
experiences = ['Adventure', 'Cultural', 'Leisure', 'Nature', 'Spiritual', 'Urban']
climates = ['Hot', 'Cold', 'Moderate']
days_options = [2, 3, 4, 5, 6, 7, 8, 10, 14]

cities = {
    'Ooty': {
        'places': 'Botanical Garden, Ooty Lake, Doddabetta Peak, Rose Garden, Pykara Waterfall', 
        'food': 'Ooty Varkey, Homemade Chocolates, Nilgiri Tea',
        'desc': 'A beautiful hill station in the south famous for its tea gardens.',
        'base_cost': 2000
    },
    'Goa': {
        'places': 'Baga Beach, Fort Aguada, Dudhsagar Falls, Basilica of Bom Jesus, Anjuna Market', 
        'food': 'Goan Fish Curry, Bebinca, Feni, Pork Vindaloo',
        'desc': 'Sun, sand, and sea. Famous for parties and heritage sites.',
        'base_cost': 4500
    },
    'Manali': {
        'places': 'Rohtang Pass, Solang Valley, Hidimba Temple, Old Manali, Vashisht Baths', 
        'food': 'Siddu, Trout Fish, Kullu Trout, Babru',
        'desc': 'A high-altitude Himalayan resort town perfect for trekking and adventure.',
        'base_cost': 3500
    },
    'Darjeeling': {
        'places': 'Tiger Hill, Batasia Loop, Peace Pagoda, Rock Garden, Happy Valley Tea Estate', 
        'food': 'Momos, Thukpa, Darjeeling Tea, Churpee',
        'desc': 'Known for the Toy Train and breathtaking views of Mt. Kanchenjunga.',
        'base_cost': 2500
    },
    'Jaipur': {
        'places': 'Amber Palace, Hawa Mahal, City Palace, Jantar Mantar, Nahargarh Fort', 
        'food': 'Dal Bati Churma, Ghevar, Laal Maas, Pyaaz Kachori',
        'desc': 'The Pink City offering royal heritage, forts, and rich culture.',
        'base_cost': 3000
    },
    'Rishikesh': {
        'places': 'Laxman Jhula, Triveni Ghat, Parmarth Niketan, Neelkanth Mahadev Temple, Beatles Ashram', 
        'food': 'Ayurvedic Thali, Aloo Poori, Masala Chai, local sweets',
        'desc': 'The Yoga Capital of the World along the holy Ganges river.',
        'base_cost': 1500
    },
    'Mumbai': {
        'places': 'Gateway of India, Marine Drive, Elephanta Caves, Colaba Causeway, Juhu Beach', 
        'food': 'Vada Pav, Pav Bhaji, Bhel Puri, Bombay Sandwich',
        'desc': 'A bustling metropolis offering a mix of history, culture, and urban life.',
        'base_cost': 5000
    },
    'Kerala': {
        'places': 'Alleppey Backwaters, Munnar Tea Gardens, Fort Kochi, Varkala Beach, Periyar National Park', 
        'food': 'Appam with Stew, Karimeen Pollichathu, Kerala Sadya, Payasam',
        'desc': 'Gods own country featuring lush landscapes and tranquil backwaters.',
        'base_cost': 4000
    },
    'Shimla': {
        'places': 'The Ridge, Mall Road, Jakhoo Temple, Kufri, Christ Church', 
        'food': 'Madra, Dhaam, Tudkiya Bhath, Babru',
        'desc': 'Capital of Himachal Pradesh with colonial architecture and snow ranges.',
        'base_cost': 3500
    },
    'Agra': {
        'places': 'Taj Mahal, Agra Fort, Fatehpur Sikri, Mehtab Bagh, Tomb of Itimad-ud-Daulah', 
        'food': 'Petha, Mughlai Chicken, Bedai and Jalebi, Shawarma',
        'desc': 'Home to the iconic Taj Mahal, a masterpiece of Mughal architecture.',
        'base_cost': 2000
    }
}

data = []
for _ in range(800):
    month = random.choice(months)
    travel_type = random.choice(travel_types)
    experience = random.choice(experiences)
    climate = random.choice(climates)
    days = random.choice(days_options)
    
    city_scores = {c: 0 for c in cities.keys()}
    
    # Logic
    if climate == 'Hot':
        city_scores['Goa'] += 2
        city_scores['Mumbai'] += 2
        city_scores['Agra'] += 1
    elif climate == 'Cold':
        city_scores['Manali'] += 2
        city_scores['Shimla'] += 2
        city_scores['Darjeeling'] += 2
        city_scores['Ooty'] += 2
    else:
        city_scores['Kerala'] += 2
        city_scores['Jaipur'] += 1
        city_scores['Rishikesh'] += 2
        
    if experience == 'Adventure':
        city_scores['Manali'] += 3
        city_scores['Rishikesh'] += 3
        city_scores['Goa'] += 1
    elif experience == 'Cultural':
        city_scores['Jaipur'] += 3
        city_scores['Agra'] += 3
    elif experience == 'Leisure':
        city_scores['Kerala'] += 3
        city_scores['Goa'] += 3
        city_scores['Ooty'] += 2
    elif experience == 'Nature':
        city_scores['Darjeeling'] += 3
        city_scores['Shimla'] += 2
        city_scores['Ooty'] += 2
        city_scores['Kerala'] += 2
    elif experience == 'Spiritual':
        city_scores['Rishikesh'] += 4
    elif experience == 'Urban':
        city_scores['Mumbai'] += 4
        
    if days > 7:
        city_scores['Kerala'] += 2
        city_scores['Jaipur'] += 2
        city_scores['Goa'] += 1
    elif days < 4:
        city_scores['Agra'] += 2
        city_scores['Mumbai'] += 1
        
    # Best city
    best_city = max(city_scores, key=city_scores.get)
    if random.random() < 0.15:
        best_city = random.choice(list(cities.keys()))
        
    p = cities[best_city]['places']
    d = cities[best_city]['desc']
    f = cities[best_city]['food']
    bc = cities[best_city]['base_cost']

    data.append([month, days, travel_type, experience, climate, p, f, d, bc, best_city])

df = pd.DataFrame(data, columns=['Month', 'Days', 'Travel_Type', 'Experience', 'Climate', 'Places', 'Food', 'Description', 'BaseCost', 'City'])
df.to_excel('tourism_data.xlsx', index=False)
print("tourism_data.xlsx generated successfully without Budget constraint.")
