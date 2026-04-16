import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
import pickle

# Load dataset
df = pd.read_csv("data.csv")

# Encode text
le_disease = LabelEncoder()
df["disease"] = le_disease.fit_transform(df["disease"])

le_risk = LabelEncoder()
df["risk"] = le_risk.fit_transform(df["risk"])

X = df[["age", "disease"]]
y = df["risk"]

# Train model
model = RandomForestClassifier()
model.fit(X, y)

# Save model
pickle.dump((model, le_disease, le_risk), open("model.pkl", "wb"))

print("Model trained successfully")