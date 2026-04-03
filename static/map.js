// India SVG Map — Offline Static Map with City Pins
// Replace the Leaflet map section in index.html with this

const cities = [
  { name: "Delhi",       lat: 28.6139, lng: 77.2090, x: 310, y: 145 },
  { name: "Mumbai",      lat: 19.0760, lng: 72.8777, x: 230, y: 310 },
  { name: "Chennai",     lat: 13.0827, lng: 80.2707, x: 330, y: 420 },
  { name: "Kolkata",     lat: 22.5726, lng: 88.3639, x: 450, y: 250 },
  { name: "Bangalore",   lat: 12.9716, lng: 77.5946, x: 300, y: 400 },
  { name: "Hyderabad",   lat: 17.3850, lng: 78.4867, x: 310, y: 345 },
  { name: "Bhopal",      lat: 23.2599, lng: 77.4126, x: 295, y: 230 },
  { name: "Ahmedabad",   lat: 23.0225, lng: 72.5714, x: 210, y: 235 },
  { name: "Pune",        lat: 18.5204, lng: 73.8567, x: 240, y: 310 },
  { name: "Jaipur",      lat: 26.9124, lng: 75.7873, x: 265, y: 175 },
  { name: "Lucknow",     lat: 26.8467, lng: 80.9462, x: 355, y: 175 },
  { name: "Patna",       lat: 25.5941, lng: 85.1376, x: 400, y: 205 },
  { name: "Bhubaneswar", lat: 20.2961, lng: 85.8245, x: 415, y: 285 },
  { name: "Guwahati",    lat: 26.1445, lng: 91.7362, x: 490, y: 175 },
  { name: "Srinagar",    lat: 34.0837, lng: 74.7973, x: 265, y: 95  },
];

const severityColors = { high: '#e74c3c', medium: '#f39c12', low: '#27ae60' };

let incidents = [];
let selectedCity = null;

async function loadIncidents() {
  try {
    const res = await fetch('/api/incidents');
    incidents = await res.json();
    renderMap();
  } catch {
    renderMap();
  }
}

function renderMap() {
  const svg = document.getElementById('india-map');
  // Remove old incident pins
  document.querySelectorAll('.incident-pin').forEach(e => e.remove());

  incidents.forEach(inc => {
    const city = cities.find(c => c.name.toLowerCase() === inc.location.toLowerCase());
    if (!city) return;
    const color = severityColors[inc.severity] || '#3498db';
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'incident-pin');
    g.setAttribute('cursor', 'pointer');

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', city.x);
    circle.setAttribute('cy', city.y);
    circle.setAttribute('r', '10');
    circle.setAttribute('fill', color);
    circle.setAttribute('opacity', '0.8');
    circle.setAttribute('stroke', '#fff');
    circle.setAttribute('stroke-width', '1.5');

    g.appendChild(circle);
    g.addEventListener('click', () => showIncidentPopup(inc, city));
    svg.appendChild(g);
  });
}

function showIncidentPopup(inc, city) {
  const popup = document.getElementById('map-popup');
  const color = severityColors[inc.severity] || '#3498db';
  popup.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <strong style="font-size:15px">${inc.location}</strong>
      <span onclick="document.getElementById('map-popup').style.display='none'" style="cursor:pointer;font-size:18px;color:#999">&times;</span>
    </div>
    <p style="font-size:13px;color:#444;margin-bottom:8px">${inc.description}</p>
    <span style="background:${color};color:white;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600">
      ${inc.severity.toUpperCase()} SEVERITY
    </span>
    <p style="font-size:11px;color:#999;margin-top:8px">${inc.timestamp}</p>
  `;
  popup.style.display = 'block';
}

function highlightCity(name) {
  document.querySelectorAll('.city-dot').forEach(d => {
    d.setAttribute('r', d.dataset.city === name ? '7' : '5');
    d.setAttribute('fill', d.dataset.city === name ? '#e74c3c' : '#3498db');
  });
  selectedCity = name;
  document.getElementById('report-location').value = name;
}

loadIncidents();
