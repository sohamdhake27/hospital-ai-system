import pickle

model, le_disease, le_risk = pickle.load(open("model.pkl", "rb"))

print("MODEL TYPE:", type(model))
print(model)