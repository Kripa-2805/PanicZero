// PanicZero — app.js (redesigned)

// ===== Theme Toggle =====
function toggleTheme() {
  const html = document.documentElement;
  const btn = document.getElementById('theme-btn');
  const isLight = html.getAttribute('data-theme') === 'light';
  if (isLight) {
    html.removeAttribute('data-theme');
    btn.textContent = '🌙';
    localStorage.setItem('pz-theme', 'dark');
  } else {
    html.setAttribute('data-theme', 'light');
    btn.textContent = '☀️';
    localStorage.setItem('pz-theme', 'light');
  }
}

(function() {
  const saved = localStorage.getItem('pz-theme');
  if (saved === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    document.addEventListener('DOMContentLoaded', () => {
      const btn = document.getElementById('theme-btn');
      if (btn) btn.textContent = '☀️';
    });
  }
})();

// ===== SOS Modal =====
function openSOS() {
  document.getElementById('sos-modal').classList.add('open');
  document.getElementById('sos-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeSOS() {
  document.getElementById('sos-modal').classList.remove('open');
  document.getElementById('sos-overlay').classList.remove('open');
  document.body.style.overflow = '';
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSOS(); });

// ===== Mobile Nav =====
function toggleNav() {
  document.getElementById('mobile-nav').classList.toggle('open');
}

// ===== Header scroll =====
window.addEventListener('scroll', () => {
  const header = document.getElementById('site-header');
  if (window.scrollY > 40) {
    header.style.borderBottomColor = 'rgba(255,255,255,0.1)';
  } else {
    header.style.borderBottomColor = '';
  }
}, { passive: true });

// ===== Active nav link on scroll =====
const sections = ['alerts','radar','map','report','preparedness','guide'];
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el && window.scrollY >= el.offsetTop - 120) current = id;
  });
  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + current);
  });
}, { passive: true });

// ===== AI Safety Summary =====
async function getSummary() {
  const input = document.getElementById('location-input');
  const location = input.value.trim();
  if (!location) {
    input.focus();
    input.style.outline = '2px solid var(--accent)';
    setTimeout(() => input.style.outline = '', 1500);
    return;
  }

  const card = document.getElementById('summary-card');
  const btn = document.getElementById('alert-btn');
  const weatherStrip = document.getElementById('weather-strip');
  const label = document.getElementById('alert-btn-label');

  btn.classList.add('loading');
  label.textContent = 'Analysing...';
  card.className = 'summary-card';
  card.innerHTML = `
    <div style="width:100%;padding:8px 0">
      <div class="summary-loading" style="width:75%;margin-bottom:12px;height:14px;border-radius:7px"></div>
      <div class="summary-loading" style="width:55%;height:12px;border-radius:6px;margin-bottom:8px"></div>
      <div class="summary-loading" style="width:65%;height:12px;border-radius:6px"></div>
    </div>
  `;
  weatherStrip.style.display = 'none';

  try {
    const res = await fetch('/api/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location })
    });
    const data = await res.json();
    const summary = data.summary || `✅ No alerts for ${location} at this time. Stay safe!`;

    if (summary.startsWith('🚨') || summary.includes('HIGH') || summary.includes('danger')) {
      card.className = 'summary-card danger';
    } else if (summary.startsWith('⚠️') || summary.includes('caution') || summary.includes('warning')) {
      card.className = 'summary-card warning';
    } else {
      card.className = 'summary-card loaded';
    }

    card.innerHTML = `<p style="font-size:15px;line-height:1.8;width:100%">${summary}</p>`;

    if (data.weather) {
      weatherStrip.style.display = 'flex';
      weatherStrip.innerHTML = `<span>🌤️</span><span>Current weather in <strong>${location}</strong>: ${data.weather}</span>`;
    }
  } catch {
    card.className = 'summary-card';
    card.innerHTML = `<p style="color:var(--text2)">Unable to fetch summary. Please check your connection.</p>`;
  } finally {
    btn.classList.remove('loading');
    label.textContent = 'Get Safety Alert';
  }
}

document.getElementById('location-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') getSummary();
});

// ===== Submit Incident Report =====
async function submitReport(e) {
  e.preventDefault();
  const location    = document.getElementById('report-location').value.trim();
  const description = document.getElementById('report-desc').value.trim();
  const lat  = parseFloat(document.getElementById('report-lat').value) || 0;
  const lng  = parseFloat(document.getElementById('report-lng').value) || 0;
  const status = document.getElementById('report-status');
  const btn    = document.querySelector('.submit-btn');
  if (!location || !description) return;

  btn.disabled = true;
  document.getElementById('submit-label').textContent = 'Submitting...';
  status.textContent = '';
  status.className = '';

  try {
    const res = await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location, description, lat, lng })
    });
    const data = await res.json();
    const sevEmoji = { high: '🚨', medium: '⚠️', low: '✅' }[data.severity] || '📋';
    status.className = '';
    status.textContent = `${sevEmoji} Submitted — AI severity: ${(data.severity || 'unknown').toUpperCase()}`;
    document.getElementById('report-location').value = '';
    document.getElementById('report-desc').value = '';
    setTimeout(() => { loadIncidents(); updateRadar(); }, 500);
  } catch {
    status.className = 'error';
    status.textContent = '❌ Failed to submit. Please try again.';
  } finally {
    btn.disabled = false;
    document.getElementById('submit-label').textContent = 'Submit Report';
  }
}

// ===== Radar Dashboard =====
async function updateRadar() {
  try {
    const res = await fetch('/api/incidents');
    const incidents = await res.json();

    // Update hero stat
    const today = new Date().toDateString();
    const todayCount = incidents.filter(i => new Date(i.timestamp).toDateString() === today).length;
    const statEl = document.getElementById('stat-incidents');
    if (statEl) animateNumber(statEl, todayCount);

    // Category counts
    const cats = { flood: 0, fire: 0, quake: 0, cyclone: 0, other: 0 };
    incidents.forEach(i => {
      const d = i.description.toLowerCase();
      if (d.includes('flood') || d.includes('water')) cats.flood++;
      else if (d.includes('fire') || d.includes('burn')) cats.fire++;
      else if (d.includes('earthquake') || d.includes('quake') || d.includes('tremor')) cats.quake++;
      else if (d.includes('cyclone') || d.includes('storm') || d.includes('wind')) cats.cyclone++;
      else cats.other++;
    });
    const total = Math.max(incidents.length, 1);
    Object.entries(cats).forEach(([key, count]) => {
      const bar = document.querySelector(`.cat-bar[data-type="${key}"]`);
      const countEl = document.getElementById(`cat-${key}`);
      if (bar) bar.style.width = Math.round((count / total) * 100) + '%';
      if (countEl) countEl.textContent = count;
    });

    // Threat level
    const highCount = incidents.filter(i => i.severity === 'high').length;
    const medCount  = incidents.filter(i => i.severity === 'medium').length;
    let threatScore = Math.min(100, (highCount * 20) + (medCount * 8));
    let threatLabel, threatColor;
    if (threatScore < 25)       { threatLabel = 'LOW';      threatColor = '#2ecc71'; }
    else if (threatScore < 60)  { threatLabel = 'MODERATE'; threatColor = '#f59e0b'; }
    else                        { threatLabel = 'HIGH';     threatColor = '#e74c3c'; }

    const arcFill = document.getElementById('arc-fill');
    const arcNeedle = document.getElementById('arc-needle');
    const arcLabel = document.getElementById('arc-label');
    if (arcFill) {
      const totalDash = 251;
      arcFill.style.strokeDashoffset = totalDash - (threatScore / 100) * totalDash;
      arcFill.style.stroke = threatColor;
    }
    if (arcNeedle) {
      const angle = -90 + (threatScore / 100) * 180;
      arcNeedle.setAttribute('transform', `rotate(${angle}, 100, 100)`);
      arcNeedle.style.transition = 'transform 1.5s cubic-bezier(.34,1.56,.64,1)';
    }
    if (arcLabel) {
      arcLabel.textContent = threatLabel;
      arcLabel.setAttribute('fill', threatColor);
    }

    // Ticker
    const ticker = document.getElementById('ticker-scroll');
    if (ticker) {
      if (!incidents.length) {
        ticker.innerHTML = '<div class="ticker-item ticker-empty">No active alerts — system monitoring…</div>';
      } else {
        ticker.innerHTML = incidents.slice(0, 6).map((inc, i) => `
          <div class="ticker-item ${inc.severity}" style="animation-delay:${i * 0.08}s">
            <strong>📍 ${inc.location}</strong> — ${inc.description.slice(0, 80)}${inc.description.length > 80 ? '…' : ''}
          </div>
        `).join('');
      }
    }
  } catch (err) {
    console.error('Radar update error:', err);
  }
}

function animateNumber(el, target) {
  let current = 0;
  const step = Math.max(1, Math.floor(target / 20));
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(timer);
  }, 50);
}

// ===== Preparedness Quiz =====
let quizAnswers = [];
let quizScore = 0;
const totalQuestions = 6;

function answerQuiz(step, points, answerKey) {
  quizAnswers[step] = { points, answerKey };
  quizScore = quizAnswers.reduce((s, a) => s + (a ? a.points : 0), 0);

  const current = document.getElementById(`qstep-${step}`);
  const next    = document.getElementById(`qstep-${step + 1}`);

  // Animate out
  current.style.animation = 'fadeIn 0.2s ease reverse both';
  setTimeout(() => {
    current.classList.remove('active');
    if (next) {
      next.classList.add('active');
    } else {
      showResult();
    }
  }, 200);

  // Update progress bar
  const progress = ((step + 1) / totalQuestions) * 100;
  const bar = document.getElementById('quiz-progress-bar');
  if (bar) bar.style.width = progress + '%';
}

function showResult() {
  const quiz   = document.getElementById('prep-quiz');
  const result = document.getElementById('prep-result');

  quiz.classList.add('hidden');
  result.style.display = 'flex';
  result.classList.add('visible');

  const maxScore = totalQuestions * 3;
  const pct = (quizScore / maxScore);
  const offset = 314 - (pct * 314);

  const ring = document.getElementById('result-ring-fill');
  const numEl = document.getElementById('result-score-num');
  const labelEl = document.getElementById('result-label');
  const descEl = document.getElementById('result-desc');
  const actionsEl = document.getElementById('result-actions');

  if (ring) {
    setTimeout(() => {
      ring.style.strokeDashoffset = offset;
      ring.style.stroke = pct > 0.66 ? '#2ecc71' : pct > 0.33 ? '#f59e0b' : '#e74c3c';
    }, 200);
  }
  if (numEl) numEl.textContent = quizScore;

  let label, desc, actions;
  if (quizScore >= 15) {
    label = '🛡️ Well Prepared';
    desc = 'You\'re ahead of 90% of Indians in disaster preparedness. Keep your emergency kit refreshed and run a drill annually.';
    actions = [
      { done: true, text: 'Emergency contacts memorised ✓' },
      { done: true, text: 'Emergency kit ready ✓' },
      { done: false, text: 'Share PanicZero with your neighbourhood' },
    ];
  } else if (quizScore >= 8) {
    label = '⚠️ Partially Prepared';
    desc = 'You\'re on the right track, but a few gaps could be critical during a real disaster. Let\'s fix them.';
    actions = [
      { done: false, text: 'Save 112, 101, 102, 100, 1078 in your phone today' },
      { done: false, text: 'Assemble a basic emergency kit this week' },
      { done: false, text: 'Agree on a family meeting point' },
    ];
  } else {
    label = '🚨 Needs Attention';
    desc = 'Disasters don\'t give warnings. Even 30 minutes of preparation can save lives — yours and your family\'s.';
    actions = [
      { done: false, text: '📞 Save all 6 emergency numbers NOW' },
      { done: false, text: '🎒 Pack a 72-hour emergency kit' },
      { done: false, text: '🗺️ Walk your family\'s evacuation route' },
      { done: false, text: '📲 Subscribe to weather alerts for your city' },
    ];
  }

  if (labelEl) labelEl.textContent = label;
  if (descEl) descEl.textContent = desc;
  if (actionsEl) {
    actionsEl.innerHTML = actions.map(a => `
      <div class="result-action-item ${a.done ? 'done' : ''}">
        ${a.done ? '✅' : '→'} ${a.text}
      </div>
    `).join('');
  }
}

function resetQuiz() {
  quizAnswers = [];
  quizScore = 0;
  const quiz   = document.getElementById('prep-quiz');
  const result = document.getElementById('prep-result');

  result.style.display = 'none';
  result.classList.remove('visible');
  quiz.classList.remove('hidden');

  document.querySelectorAll('.quiz-step').forEach(s => s.classList.remove('active'));
  const first = document.getElementById('qstep-0');
  if (first) first.classList.add('active');
  const bar = document.getElementById('quiz-progress-bar');
  if (bar) bar.style.width = '0%';
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  updateRadar();
  // Refresh radar every 60s
  setInterval(updateRadar, 60000);
});
