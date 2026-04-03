from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import sqlite3
import os
import requests
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
WEATHER_API_KEY = os.environ.get("WEATHER_API_KEY")

print("API KEY LOADED:", bool(OPENAI_API_KEY), OPENAI_API_KEY[:8] if OPENAI_API_KEY else "MISSING")

client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

app = Flask(__name__)
CORS(app)

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

def get_weather(location):
    if not WEATHER_API_KEY:
        return None
    try:
        url = f"https://api.openweathermap.org/data/2.5/weather?q={location},IN&appid={WEATHER_API_KEY}&units=metric"
        r = requests.get(url, timeout=5)
        if r.status_code == 200:
            d = r.json()
            desc = d['weather'][0]['description'].capitalize()
            temp = d['main']['temp']
            feels = d['main']['feels_like']
            humidity = d['main']['humidity']
            return f"{desc}, {temp:.0f}°C (feels like {feels:.0f}°C), Humidity: {humidity}%"
    except Exception:
        pass
    return None

@app.route('/api/summary', methods=['POST'])
def get_summary():
    data = request.json
    location = data.get('location', '')

    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute("SELECT description, severity FROM incidents WHERE location LIKE ?", ('%' + location + '%',))
    reports = c.fetchall()
    conn.close()

    report_text = "\n".join([f"- {r[0]} (Severity: {r[1]})" for r in reports]) if reports else ""
    weather_info = get_weather(location)

    # No API key fallback
    if not client:
        if not reports:
            weather_str = f" Current weather: {weather_info}." if weather_info else ""
            return jsonify({
                "summary": f"✅ All clear in {location} — no active incidents reported by the community.{weather_str} Stay prepared and keep emergency contacts handy.",
                "weather": weather_info
            })
        else:
            severities = [r[1] for r in reports]
            high_count = severities.count('high')
            summary = f"⚠️ {len(reports)} incident(s) reported in {location}."
            if high_count:
                summary += f" {high_count} HIGH severity alert(s) — exercise caution."
            return jsonify({"summary": summary, "weather": weather_info})

    # Build context
    context_parts = []
    if weather_info:
        context_parts.append(f"Current weather: {weather_info}")
    if report_text:
        context_parts.append(f"Community reports:\n{report_text}")
    else:
        context_parts.append("No community incidents reported.")
    context = "\n".join(context_parts)

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a disaster safety assistant for India. Give a clear 3-5 line safety summary. If incidents are reported, mention each one specifically — what happened and its severity. If no incidents, reassure the user with a helpful tip. Always start with an emoji (✅ safe, ⚠️ caution, 🚨 danger). Be specific, not generic."},
                {"role": "user", "content": f"Location: {location}\n{context}\nGive a detailed safety summary mentioning each incident specifically with its description and severity level."}
            ]
        )
        summary = response.choices[0].message.content
    except Exception as e:
        print("OpenAI error:", e)
        if not reports:
            weather_str = f" Weather: {weather_info}." if weather_info else ""
            summary = f"✅ No active incidents in {location} at this time.{weather_str} Stay alert and keep emergency contacts ready."
        else:
            summary = f"⚠️ {len(reports)} incident(s) reported near {location}. Please stay cautious and follow local authority guidance."

    return jsonify({"summary": summary, "weather": weather_info})

@app.route('/api/report', methods=['POST'])
def report_incident():
    data = request.json
    location = data.get('location', '')
    description = data.get('description', '')
    lat = data.get('lat', 0)
    lng = data.get('lng', 0)

    severity = "medium"

    if client:
        try:
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a disaster assessment assistant. Classify the severity of the incident as: low, medium, or high. Reply with one word only."},
                    {"role": "user", "content": f"Incident: {description}"}
                ]
            )
            severity = response.choices[0].message.content.strip().lower()
            if severity not in ('low', 'medium', 'high'):
                severity = "medium"
        except Exception as e:
            print("OpenAI error:", e)
    else:
        desc_lower = description.lower()
        high_keywords = ['fire', 'flood', 'collapse', 'explosion', 'earthquake', 'tsunami', 'cyclone', 'death', 'casualty']
        low_keywords = ['minor', 'small', 'pothole', 'traffic', 'slow', 'noise']
        if any(k in desc_lower for k in high_keywords):
            severity = "high"
        elif any(k in desc_lower for k in low_keywords):
            severity = "low"

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
    c.execute("SELECT id, location, description, severity, lat, lng, timestamp FROM incidents ORDER BY timestamp DESC")
    rows = c.fetchall()
    conn.close()
    incidents = [{"id": r[0], "location": r[1], "description": r[2], "severity": r[3], "lat": r[4], "lng": r[5], "timestamp": r[6]} for r in rows]
    return jsonify(incidents)

if __name__ == '__main__':
    app.run(debug=True)
