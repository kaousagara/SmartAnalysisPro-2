#!/usr/bin/env python3

# Test simple Flask server
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/health')
def health():
    return jsonify({"status": "OK"})

@app.route('/api/dashboard/stats')
def dashboard_stats():
    return jsonify({
        "active_threats": 12,
        "total_threats": 45,
        "average_score": 0.65,
        "status": "operational"
    })

if __name__ == '__main__':
    print("Starting Flask server...")
    app.run(host='0.0.0.0', port=8000, debug=True)