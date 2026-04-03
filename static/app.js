// API Call 1: Get AI Safety Summary
async function getSummary() {
  const location = document.getElementById('location-input').value.trim();
  if (!location) return alert('Please enter a location.');

  const summaryText = document.getElementById('summary-text');
  summaryText.textContent = 'Generating safety summary...';

  const res = await fetch('/api/summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ location })
  });

  const data = await res.json();
  summaryText.textContent = data.summary || 'No summary available.';
}

// API Call 2: Submit Incident Report
async function submitReport(e) {
  e.preventDefault();

  const location = document.getElementById('report-location').value.trim();
  const description = document.getElementById('report-desc').value.trim();
  const lat = parseFloat(document.getElementById('report-lat').value);
  const lng = parseFloat(document.getElementById('report-lng').value);

  const status = document.getElementById('report-status');
  status.textContent = 'Submitting report...';

  const res = await fetch('/api/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ location, description, lat, lng })
  });

  const data = await res.json();
  status.textContent = `✅ Report submitted! Severity: ${data.severity}`;
  document.getElementById('report-location').value = '';
  document.getElementById('report-desc').value = '';

  // Reload SVG map pins
  loadIncidents();
}
