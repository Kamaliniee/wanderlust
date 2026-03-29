import pandas as pd
import pickle
import warnings
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier

warnings.filterwarnings('ignore')

def train_and_save_model():
    print("Loading dataset...")
    df = pd.read_excel('tourism_data.xlsx')

    df.dropna(subset=['Month', 'Days', 'Travel_Type', 'Experience', 'Climate', 'City'], inplace=True)

    X = df[['Month', 'Days', 'Travel_Type', 'Experience', 'Climate']].copy()
    y = df['City'].copy()

    city_mapping = {}
    for _, row in df.iterrows():
        if row['City'] not in city_mapping:
            city_mapping[row['City']] = {
                'places': [p.strip() for p in str(row['Places']).split(',') if p.strip()],
                'food': [f.strip() for f in str(row['Food']).split(',') if f.strip()],
                'desc': str(row['Description']),
                'base_cost': int(row['BaseCost'])
            }

    print("Encoding features and target...")
    encoders = {}
    for col in X.columns:
        if col == 'Days': 
            continue
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col])
        encoders[col] = le

    target_encoder = LabelEncoder()
    y_encoded = target_encoder.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42)

    print("Training RandomForest model...")
    model = RandomForestClassifier(random_state=42, n_estimators=100)
    model.fit(X_train, y_train)

    best_acc = model.score(X_test, y_test)
    print(f"Accuracy: {best_acc:.4f}")

    dropdown_options = {}
    for col, le in encoders.items():
        dropdown_options[col] = list(le.classes_)

    data_to_save = {
        'model': model,
        'model_name': 'Optimal Routing RF',
        'model_accuracy': round(best_acc * 100, 2),
        'encoders': encoders,
        'target_encoder': target_encoder,
        'city_mapping': city_mapping,
        'dropdown_options': dropdown_options
    }

    with open('tourism_model.pkl', 'wb') as f:
        pickle.dump(data_to_save, f)
    
    print("Process complete!")

if __name__ == '__main__':
    train_and_save_model()
