import { initChrome, $, $$, reveal, weekHours, fmtHour, directionsURL, telURL } from './common.js';
import { LOCATION, AMENITIES, GETTING_HERE, FAQ } from './content.js';

initChrome('visit');

$('#address').innerHTML = `${LOCATION.street}<br>${LOCATION.city}<br><span class="address-notes">${LOCATION.notes}</span>`;
$('#directions').href = directionsURL();
$('#call').href = telURL();
$('#call').textContent = `Call ${LOCATION.phone}`;
$('#map-street').textContent = LOCATION.street;

function renderWeek() {
  const today = new Date().getDay();
  $('#week').innerHTML = weekHours().map(({ day, name, hours }) => `
    <div class="${day === today ? 'today' : ''}">
      <dt>${name}${day === today ? ' <span>Today</span>' : ''}</dt>
      <dd>${hours ? `${fmtHour(hours.open)} – ${fmtHour(hours.close)}` : 'Closed'}</dd>
    </div>`).join('');
}
renderWeek();

const ICONS = {
  wifi: '<path d="M4 15 C 13 7, 27 7, 36 15"/><path d="M9 20 C 15 15, 25 15, 31 20"/><path d="M14 25 C 17 22, 23 22, 26 25"/><circle cx="20" cy="30" r="1.8"/>',
  dog: '<path d="M10 18 L 8 9 L 14 13 H 26 L 32 9 L 30 18"/><path d="M10 18 C 10 28, 14 33, 20 33 C 26 33, 30 28, 30 18"/><circle cx="16" cy="21" r="1"/><circle cx="24" cy="21" r="1"/><path d="M18 27 H 22"/>',
  plug: '<path d="M14 6 V 13 M 26 6 V 13"/><path d="M10 13 H 30 V 20 C 30 26, 26 29, 20 29 C 14 29, 10 26, 10 20 Z"/><path d="M20 29 V 35"/>',
  bike: '<circle cx="10" cy="26" r="6"/><circle cx="30" cy="26" r="6"/><path d="M10 26 L 17 14 H 26 L 30 26 M 17 14 L 21 26 H 10 M 15 10 H 19"/>',
  access: '<circle cx="20" cy="7" r="2.5"/><path d="M12 13 H 28 M 20 13 V 22 L 14 33 M 20 22 L 26 33"/>',
  sun: '<circle cx="20" cy="20" r="6"/><path d="M20 5 V 9 M 20 31 V 35 M 5 20 H 9 M 31 20 H 35 M 9 9 L 12 12 M 28 28 L 31 31 M 9 31 L 12 28 M 28 12 L 31 9"/>',
};
$('#amenities').innerHTML = AMENITIES.map((a, i) => `
  <li data-reveal style="transition-delay:${(i % 3) * 80}ms">
    <svg viewBox="0 0 40 40" aria-hidden="true">${ICONS[a.icon]}</svg>
    <h3>${a.title}</h3>
    <p>${a.text}</p>
  </li>`).join('');

$('#getting-here').innerHTML = GETTING_HERE.map((g, i) => `
  <li data-reveal style="transition-delay:${i * 80}ms">
    <span class="step-num">0${i + 1}</span>
    <h3>${g.title}</h3>
    <p>${g.text}</p>
  </li>`).join('');

$('#faq').innerHTML = FAQ.map((f, i) => `
  <details${i === 0 ? ' open' : ''}>
    <summary>${f.q}</summary>
    <p>${f.a}</p>
  </details>`).join('');

/* ---------- Contact form (demo: validates, then thanks; nothing is sent) ---------- */

const form = $('#contact-form');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  let firstBad = null;
  $$('input, textarea', form).forEach((el) => {
    const bad = !el.checkValidity() || !el.value.trim();
    el.setAttribute('aria-invalid', String(bad));
    if (bad && !firstBad) firstBad = el;
  });
  if (firstBad) { firstBad.focus(); return; }
  const name = form.elements.namedItem('name').value.trim().split(' ')[0];
  form.innerHTML = `
    <div class="form-done full">
      <div class="check" aria-hidden="true">✓</div>
      <p class="done-title">Thanks, ${name.replace(/[<>&"]/g, '')}!</p>
      <p>We'll get back to you within two business days.</p>
    </div>`;
});
form.addEventListener('input', (e) => {
  if (e.target.getAttribute('aria-invalid') === 'true' && e.target.checkValidity() && e.target.value.trim()) e.target.setAttribute('aria-invalid', 'false');
});

reveal();
