from flask import Flask, request, jsonify
import pandas as pd
import pickle

app = Flask(__name__)

# Load the model
with open('trainer_recommender.pkl', 'rb') as f:
    recommender = pickle.load(f)

@app.route('/recommend', methods=['GET'])
def recommend():
    # Get query parameters from frontend
    location = request.args.get('location')
    specialization = request.args.get('specialization')
    min_rating = float(request.args.get('min_rating', 0))
    min_experience = int(request.args.get('min_experience', 0))
    top_n = int(request.args.get('top_n', 5))

    # Get recommendations
    result = recommender.recommend(
        location=location,
        specialization=specialization,
        min_rating=min_rating,
        min_experience=min_experience,
        top_n=top_n
    )

    # Return as JSON
    return jsonify(result.to_dict(orient='records'))

if __name__ == '__main__':
    app.run(port=5000)
