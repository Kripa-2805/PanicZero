// PanicZero — map.js (redesigned)

const cities = [
  { name: "Delhi",         lat: 28.6139, lng: 77.2090, x: 310, y: 145 },
  { name: "Mumbai",        lat: 19.0760, lng: 72.8777, x: 228, y: 308 },
  { name: "Chennai",       lat: 13.0827, lng: 80.2707, x: 328, y: 418 },
  { name: "Kolkata",       lat: 22.5726, lng: 88.3639, x: 450, y: 250 },
  { name: "Bangalore",     lat: 12.9716, lng: 77.5946, x: 298, y: 398 },
  { name: "Hyderabad",     lat: 17.3850, lng: 78.4867, x: 308, y: 344 },
  { name: "Bhopal",        lat: 23.2599, lng: 77.4126, x: 293, y: 228 },
  { name: "Ahmedabad",     lat: 23.0225, lng: 72.5714, x: 208, y: 234 },
  { name: "Pune",          lat: 18.5204, lng: 73.8567, x: 240, y: 320 },
  { name: "Jaipur",        lat: 26.9124, lng: 75.7873, x: 263, y: 174 },
  { name: "Lucknow",       lat: 26.8467, lng: 80.9462, x: 354, y: 174 },
  { name: "Patna",         lat: 25.5941, lng: 85.1376, x: 398, y: 204 },
  { name: "Bhubaneswar",   lat: 20.2961, lng: 85.8245, x: 413, y: 284 },
  { name: "Guwahati",      lat: 26.1445, lng: 91.7362, x: 488, y: 174 },
  { name: "Srinagar",      lat: 34.0837, lng: 74.7973, x: 263, y: 94  },
  { name: "Visakhapatnam", lat: 17.6868, lng: 83.2185, x: 388, y: 330 },
  { name: "Kochi",         lat: 9.9312,  lng: 76.2673, x: 272, y: 444 },
];

const severityColors = {
  high:   '#e53935',
  medium: '#f59e0b',
  low:    '#22c55e'
};

let incidents = [];

async function loadIncidents() {
  try {
    const res = await fetch('/api/incidents');
    incidents = await res.json();
  } catch {
    incidents = [];
  }
  renderMap();
  renderFeed();
}

function renderMap() {
  const layer = document.getElementById('incident-layer');
  if (!layer) return;
  layer.innerHTML = '';

  const cityIncidents = {};
  incidents.forEach(inc => {
    const key = inc.location.trim().toLowerCase();
    if (!cityIncidents[key]) cityIncidents[key] = [];
    cityIncidents[key].push(inc);
  });

  Object.entries(cityIncidents).forEach(([key, incs]) => {
    const city = cities.find(c => c.name.toLowerCase() === key);
    if (!city) return;

    const sev = incs.some(i => i.severity === 'high') ? 'high'
              : incs.some(i => i.severity === 'medium') ? 'medium' : 'low';
    const color = severityColors[sev] || '#3b82f6';
    const count = incs.length;

    const ns = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('class', 'incident-pin');
    g.style.cursor = 'pointer';

    // Outer glow ring
    const glow = document.createElementNS(ns, 'circle');
    glow.setAttribute('cx', city.x);
    glow.setAttribute('cy', city.y);
    glow.setAttribute('r', '18');
    glow.setAttribute('fill', color);
    glow.setAttribute('opacity', '0.08');

    // Pulse ring
    const pulse = document.createElementNS(ns, 'circle');
    pulse.setAttribute('cx', city.x);
    pulse.setAttribute('cy', city.y);
    pulse.setAttribute('r', '14');
    pulse.setAttribute('fill', color);
    pulse.setAttribute('opacity', '0.15');
    pulse.style.animation = 'ripple 2s ease-out infinite';

    // Main circle
    const circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('cx', city.x);
    circle.setAttribute('cy', city.y);
    circle.setAttribute('r', '9');
    circle.setAttribute('fill', color);
    circle.setAttribute('stroke', 'rgba(255,255,255,0.4)');
    circle.setAttribute('stroke-width', '1.5');
    circle.setAttribute('filter', 'url(#glow)');

    g.appendChild(glow);
    g.appendChild(pulse);
    g.appendChild(circle);

    if (count > 1) {
      const badge = document.createElementNS(ns, 'text');
      badge.setAttribute('x', city.x);
      badge.setAttribute('y', city.y + 3.5);
      badge.setAttribute('text-anchor', 'middle');
      badge.setAttribute('font-size', '8');
      badge.setAttribute('font-weight', '700');
      badge.setAttribute('fill', '#fff');
      badge.setAttribute('pointer-events', 'none');
      badge.textContent = count;
      g.appendChild(badge);
    }

    g.addEventListener('click', e => {
      e.stopPropagation();
      showIncidentPopup(incs, city, color);
    });

    layer.appendChild(g);
  });

  document.getElementById('india-map').addEventListener('click', () => {
    const popup = document.getElementById('map-popup');
    popup.classList.remove('show');
  });
}

function showIncidentPopup(incs, city, color) {
  const popup = document.getElementById('map-popup');
  const latest = incs[0];
  const sev = latest.severity || 'unknown';
  const sevColor = severityColors[sev] || '#3b82f6';

  popup.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <strong style="font-size:14px;font-family:'Syne',sans-serif;font-weight:700">${city.name}</strong>
      <button onclick="document.getElementById('map-popup').classList.remove('show')"
        style="background:none;border:none;color:#8b949e;font-size:18px;cursor:pointer;line-height:1;transition:transform 0.2s"
        onmouseover="this.style.transform='rotate(90deg)'" onmouseout="this.style.transform=''">&times;</button>
    </div>
    ${incs.length > 1 ? `<p style="font-size:11px;color:#6b7a8d;margin-bottom:8px;font-family:'DM Mono',monospace">${incs.length} incidents reported</p>` : ''}
    <p style="font-size:13px;color:#c9d1d9;line-height:1.55;margin-bottom:12px">${latest.description}</p>
    <span style="background:${sevColor}18;color:${sevColor};border:1px solid ${sevColor}33;padding:3px 10px;border-radius:6px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;font-family:'DM Mono',monospace">
      ${sev}
    </span>
    <p style="font-size:10px;color:#4a5568;margin-top:10px;font-family:'DM Mono',monospace">${latest.timestamp}</p>
  `;
  popup.classList.add('show');
}

function highlightCity(name) {
  document.querySelectorAll('.city-dot').forEach(d => {
    if (d.dataset.city === name) {
      d.setAttribute('r', '8');
      d.setAttribute('fill', '#e74c3c');
    } else {
      d.setAttribute('r', '5');
      d.setAttribute('fill', '#2196f3');
    }
  });

  const reportLoc = document.getElementById('report-location');
  if (reportLoc) reportLoc.value = name;

  const city = cities.find(c => c.name === name);
  if (city) {
    document.getElementById('report-lat').value = city.lat;
    document.getElementById('report-lng').value = city.lng;
  }
}

function renderFeed() {
  const feed = document.getElementById('incidents-feed');
  if (!feed) return;

  if (!incidents.length) {
    feed.innerHTML = '<p class="feed-placeholder">No incidents reported yet — be the first to report!</p>';
    return;
  }

  feed.innerHTML = incidents.slice(0, 9).map((inc, i) => `
    <div class="feed-item ${inc.severity}" style="animation-delay:${i * 0.05}s">
      <span class="feed-severity ${inc.severity}">${inc.severity}</span>
      <div class="feed-body">
        <div class="feed-location">📍 ${inc.location}</div>
        <div class="feed-desc">${inc.description}</div>
        <div class="feed-time">${inc.timestamp}</div>
      </div>
    </div>
  `).join('');
}

loadIncidents();
