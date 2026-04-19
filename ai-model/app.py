from flask import Flask, request, jsonify
import os
import pickle

app = Flask(__name__)

model, le_disease, le_risk = pickle.load(open("model.pkl", "rb"))


def build_recommendation(risk):
    if risk == "High":
        return "ICU Required"
    if risk == "Medium":
        return "Regular Monitoring"
    return "Normal Care"

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json or {}

    age = int(data.get("age", 0))
    disease_name = str(data.get("disease", "")).strip().lower()

    if not disease_name:
        return jsonify({"message": "Disease is required"}), 400

    known_diseases = {
        label.lower(): index for index, label in enumerate(le_disease.classes_)
    }

    if disease_name in known_diseases:
        disease = known_diseases[disease_name]
        pred = model.predict([[age, disease]])
        risk = le_risk.inverse_transform(pred)[0]
    else:
        # Fallback when the disease label was not present during model training.
        if age >= 60:
            risk = "High"
        elif age >= 40:
            risk = "Medium"
        else:
            risk = "Low"

        if any(term in disease_name for term in ["heart", "stroke", "cancer", "covid", "pneumonia"]):
            risk = "High"

    return jsonify({
        "risk": risk,
        "recommendation": build_recommendation(risk)
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5001")))
