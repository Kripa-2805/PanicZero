from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import sqlite3
import openai
import os
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
CORS(app)

openai.api_key = os.environ.get("OPENAI_API_KEY")

def init_db():
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS incidents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        location TEXT,
        description TEXT,
        severity TEXT,
        lat REAL,
        lng REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )''')
    conn.commit()
    conn.close()

init_db()

@app.route('/')
def index():
    return render_template('index.html')

# API Call 1: Generate AI safety summary based on location
@app.route('/api/summary', methods=['POST'])
def get_summary():
    data = request.json
    location = data.get('location', '')

    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute("SELECT description, severity FROM incidents WHERE location LIKE ?", ('%' + location + '%',))
    reports = c.fetchall()
    conn.close()

    report_text = "\n".join([f"- {r[0]} (Severity: {r[1]})" for r in reports]) if reports else "No reports yet."

    response = openai.ChatCompletion.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a disaster safety assistant. Give a short, plain-English safety summary based on community reports."},
            {"role": "user", "content": f"Location: {location}\nCommunity reports:\n{report_text}\nGive a 2-3 line safety summary."}
        ]
    )
    summary = response.choices[0].message.content
    return jsonify({"summary": summary})

# API Call 2: Categorise severity of a new incident report
@app.route('/api/report', methods=['POST'])
def report_incident():
    data = request.json
    location = data.get('location', '')
    description = data.get('description', '')
    lat = data.get('lat', 0)
    lng = data.get('lng', 0)

    response = openai.ChatCompletion.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a disaster assessment assistant. Classify the severity of the incident as: low, medium, or high. Reply with one word only."},
            {"role": "user", "content": f"Incident: {description}"}
        ]
    )
    severity = response.choices[0].message.content.strip().lower()

    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute("INSERT INTO incidents (location, description, severity, lat, lng) VALUES (?, ?, ?, ?, ?)",
              (location, description, severity, lat, lng))
    conn.commit()
    conn.close()

    return jsonify({"message": "Incident reported successfully", "severity": severity})

@app.route('/api/incidents', methods=['GET'])
def get_incidents():
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute("SELECT id, location, description, severity, lat, lng, timestamp FROM incidents")
    rows = c.fetchall()
    conn.close()
    incidents = [{"id": r[0], "location": r[1], "description": r[2], "severity": r[3], "lat": r[4], "lng": r[5], "timestamp": r[6]} for r in rows]
    return jsonify(incidents)

if __name__ == '__main__':
    app.run(debug=True)
