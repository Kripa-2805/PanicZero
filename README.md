# PanicZero 🚨
### Reducing Panic to Zero — One Alert at a Time.

PanicZero is a community-powered disaster preparedness web app built for HackMatrix 2026 at VIT Bhopal. It lets citizens report local incidents, receive AI-generated safety alerts, access offline emergency guides, and view real-time crowd-sourced maps — all in one place.

---

## 🌐 Problem Statement
**HM50 — Disaster Preparedness App** | Open Innovation Track

During floods, earthquakes, or heatwaves, communities need fast, localised information. Existing systems are too slow, too technical, and don't work offline. ResQNet turns every citizen into an informed first responder.

---

## ✨ Features
- 🗺️ **Live Incident Map** — Community-reported pins updating in real time
- 🤖 **AI Safety Alerts** — OpenAI-powered plain-English safety summaries by location
- 📴 **Offline Emergency Guide** — Works without internet via Service Workers
- 🆘 **One-Tap Crisis Button** — Instant access to emergency helplines
- 📝 **Incident Report Form** — Submit ground conditions in under 10 seconds

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3 |
| Backend | Python, Flask |
| Database | SQLite |
| AI | OpenAI API (GPT-4o) |
| Offline | Service Worker API |
| Geolocation | IP-API |

---



# Install dependencies
pip install flask flask-cors openai

# Add your OpenAI API key
export OPENAI_API_KEY=""

# Run the app
python app.py
```

Then open `http://localhost:5000` in your browser.

---

## 📁 Project Structure

```
resqnet/
├── app.py              ← Flask backend
├── templates/
│   └── index.html      ← Frontend UI
├── static/
│   ├── style.css       ← Styling
│   └── app.js          ← Map & form logic
├── database.db         ← SQLite database
└── README.md

---

## 🔮 Future Scope
- Multilingual support — Hindi, Marathi, Tamil for rural reach
- SMS alerts for users with no smartphones
- AI-powered image verification to prevent fake incident reports

## 📈 Scalability
- Switch SQLite → PostgreSQL for thousands of concurrent users
- Leaflet.js scales globally to any region or country
- Convertible to a Progressive Web App (PWA) for mobile

---

Requirements:
-flask
-flask-cors
-openai
-python-dotenv
