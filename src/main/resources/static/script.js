/* ===================================================
   MedControl · Hospital System JavaScript
   ================================================ */

// ── STATE ──────────────────────────────────────────
let patients       = [];
let turnCounter    = 1;
let attendedCount  = 0;
let currentPatient = null;
let toastInstance  = null;
const weight = {
  Emergencia: 3,
  Urgencia: 2,
  Normal: 1
};
const API_URL = "https://hospital-proyecto-luis.duckdns.org/patients";

async function loadPatients() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    patients = data.map(p => ({
      id: p.id,
      turn: 0,
      name: p.nombre,
      age: p.edad,
      symptoms: p.sintomas,
      priority: p.prioridad,
      arrivalTime: p.horaLlegada, // 🔥 VIENE DEL BACKEND
      status: p.estado || 'Esperando'
    }));

    turnCounter = patients.length + 1;

    renderTable();
    updateDashboard();

  } catch (error) {
    console.error(error);
    showToast('error', 'Error', 'No se pudieron cargar los pacientes');
  }
}

// ── INIT ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initToast();
  startClock();
  renderTable();
  updateDashboard();
  initPriorityPreview();
  initTheme();
  loadPatients();
});

// ── CLOCK ──────────────────────────────────────────
function startClock() {
  const el = document.getElementById('liveTime');
  const tick = () => {
    el.textContent = new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };
  tick();
  setInterval(tick, 1000);
}


// ── ADD PATIENT ────────────────────────────────────
async function addPatient() {

  const name = document.getElementById('patientName').value.trim();
  const age = parseInt(document.getElementById('patientAge').value, 10);
  const symptoms = document.getElementById('patientSymptoms').value.trim();
  const priority = document.getElementById('patientPriority').value;

  if (!name)
    return shakeInput('patientName', 'Ingresa el nombre del paciente');

  if (!age || age < 0 || age > 120)
    return shakeInput('patientAge', 'Ingresa una edad válida');

  if (!symptoms)
    return shakeInput('patientSymptoms', 'Describe los síntomas');

  const patient = {
    nombre: name,
    edad: age,
    sintomas: symptoms,
    prioridad: priority,
    estado: 'Esperando',
    horaLlegada: new Date().toLocaleTimeString()
  };

  try {

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(patient)
    });

    if (!response.ok) {
      throw new Error('Error al guardar');
    }

    await loadPatients();

    bootstrap.Modal.getInstance(
      document.getElementById('addPatientModal')
    ).hide();

    clearForm();

    showToast(
      'success',
      'Paciente registrado',
      `${name} fue agregado correctamente`
    );

  } catch (error) {
    console.error(error);

    showToast(
      'error',
      'Error',
      'No se pudo guardar el paciente'
    );
  }
}

function insertByPriority(patient) {
  const weight = { Emergencia: 3, Urgencia: 2, Normal: 1 };
  const w = weight[patient.priority];
  // Find first patient with lower weight
  const idx = patients.findIndex(p => p.status === 'Esperando' && weight[p.priority] < w);
  if (idx === -1) {
    patients.push(patient);
  } else {
    patients.splice(idx, 0, patient);
  }
}

// ── ATTEND NEXT ────────────────────────────────────
async function attendNext() {
  if (currentPatient) {
    showToast('warning', 'Paciente en atención', 'Finaliza la atención actual antes de llamar al siguiente');
    return;
  }

  const next = patients
    .filter(p => p.status === 'Esperando')
    .sort((a, b) => {
      const diff = (weight[b.priority] || 1) - (weight[a.priority] || 1);

      if (diff !== 0) return diff;

      // FIFO dentro de misma prioridad
      return new Date(a.arrivalTime) - new Date(b.arrivalTime);
    })[0];

  if (!next) return;

  try {
    await fetch(`${API_URL}/${next.id}/status?estado=En Atención`, {
      method: 'PATCH'
    });

    currentPatient = next;

    document.getElementById('currentPatientName').textContent = next.name;
    document.getElementById('currentPatientBanner').classList.remove('d-none');

    await loadPatients();

    showToast('info', 'Llamando paciente', `Turno ${next.turn} — ${next.name}`);

  } catch (error) {
    console.error(error);
    showToast('error', 'Error', 'No se pudo actualizar el paciente');
  }
}

// ── FINISH ATTENTION ───────────────────────────────
async function finishAttention() {
  if (!currentPatient) return;

  try {
    await fetch(`${API_URL}/${currentPatient.id}/status?estado=Atendido`, {
      method: 'PATCH'
    });

    attendedCount++;
    currentPatient = null;

    document.getElementById('currentPatientBanner').classList.add('d-none');

    await loadPatients();

    showToast('success', 'Atención completada', 'El paciente ha sido dado de alta');

  } catch (error) {
    console.error(error);
    showToast('error', 'Error', 'No se pudo finalizar la atención');
  }
}

// ── REMOVE PATIENT ─────────────────────────────────
async function removePatient(id) {
  const idx = patients.findIndex(p => p.id === id);
  if (idx === -1) return;

  const p = patients[idx];

  if (p.status === 'En Atención') {
    showToast('warning', 'No permitido', 'No puedes eliminar un paciente en atención');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Error al eliminar en el servidor');
    }

    // Opcional: también lo quitas localmente para respuesta inmediata
    patients.splice(idx, 1);

    renderTable();
    updateDashboard();

    showToast(
      'success',
      'Paciente eliminado',
      `${p.name} fue removido de la lista`
    );

  } catch (error) {
    console.error(error);
    showToast('error', 'Error', 'No se pudo eliminar el paciente');
  }
}

// ── RENDER TABLE ───────────────────────────────────
function renderTable() {
  const tbody = document.getElementById('waitingTableBody');
  const empty = document.getElementById('emptyState');
  const attendBtn = document.getElementById('attendBtn');
  const searchVal = (document.getElementById('searchInput').value || '').toLowerCase();

  const visible = patients.filter(p =>
    !searchVal || p.name.toLowerCase().includes(searchVal) || p.symptoms.toLowerCase().includes(searchVal)
  );

  if (visible.length === 0) {
    tbody.innerHTML = '';
    empty.classList.add('show');
    attendBtn.disabled = true;
    return;
  }

  empty.classList.remove('show');
  const hasWaiting = patients.some(p => p.status === 'Esperando');
  attendBtn.disabled = !hasWaiting || !!currentPatient;

  tbody.innerHTML = visible.map((p, i) => {
    const priorityClass = `priority-pill--${p.priority.toLowerCase()}`;
    const priorityIcon  = p.priority === 'Emergencia' ? 'bi-exclamation-circle-fill'
                        : p.priority === 'Urgencia'   ? 'bi-lightning-fill'
                        :                               'bi-check-circle-fill';

    const statusClass = p.status === 'En Atención' ? 'status-pill--attending'
                      : p.status === 'Atendido'     ? 'status-pill--done'
                      :                              'status-pill--waiting';
    const statusIcon  = p.status === 'En Atención' ? 'bi-activity'
                      : p.status === 'Atendido'     ? 'bi-check2-circle'
                      :                              'bi-hourglass-split';
    const rowClass = p.status === 'En Atención' ? 'row-attending'
                   : p.status === 'Atendido'     ? 'row-done'
                   : '';

    const time = p.arrivalTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    return `
      <tr class="${rowClass} row-enter" style="animation-delay:${i * 0.04}s">
        <td>
          <div class="turno-badge">${p.turn}</div>
        </td>
        <td>
          <div class="patient-name">${escHtml(p.name)}</div>
          <div class="patient-age">${p.age} años</div>
        </td>
        <td>${p.age}</td>
        <td>
          <span class="symptom-text" title="${escHtml(p.symptoms)}">${escHtml(p.symptoms)}</span>
        </td>
        <td>
          <span class="priority-pill ${priorityClass}">
            <i class="bi ${priorityIcon}"></i>
            ${p.priority}
          </span>
        </td>
        <td style="color:var(--text-secondary); font-size:.82rem;">
          <i class="bi bi-clock me-1"></i>${time}
        </td>
        <td>
          <span class="status-pill ${statusClass}">
            <i class="bi ${statusIcon}"></i>
            ${p.status}
          </span>
        </td>
        <td class="text-center">
          ${p.status !== 'En Atención' ? `
            <button class="btn-remove" onclick="removePatient(${p.id})" title="Eliminar paciente">
              <i class="bi bi-trash3"></i>
            </button>
          ` : '—'}
        </td>
      </tr>
    `;
  }).join('');

  // Update count badge
  const waitingCount = patients.filter(p => p.status === 'Esperando').length;
  document.getElementById('tableCount').textContent =
    waitingCount === 1 ? '1 paciente' : `${waitingCount} pacientes`;
}

// ── UPDATE DASHBOARD ───────────────────────────────
function updateDashboard() {
  const waiting   = patients.filter(p => p.status === 'Esperando').length;
  const emergency = patients.filter(p => p.priority === 'Emergencia' && p.status !== 'Atendido').length;
  const urgent    = patients.filter(p => p.priority === 'Urgencia'   && p.status !== 'Atendido').length;

  animateCount('statWaiting',   waiting);
  animateCount('statEmergency', emergency);
  animateCount('statUrgent',    urgent);
  animateCount('statAttended',  attendedCount);

  // Pulse red card if emergency
  const cardEmergency = document.getElementById('cardEmergency');
  if (emergency > 0) {
    cardEmergency.style.boxShadow = '0 0 0 3px rgba(239,68,68,.2)';
  } else {
    cardEmergency.style.boxShadow = '';
  }
}

function animateCount(id, val) {
  const el = document.getElementById(id);
  const prev = parseInt(el.textContent, 10) || 0;
  if (prev === val) return;
  el.textContent = val;
  el.classList.remove('count-update');
  void el.offsetWidth; // reflow
  el.classList.add('count-update');
}

// ── FILTER TABLE ───────────────────────────────────
function filterTable() { renderTable(); }

// ── PRIORITY PREVIEW (MODAL) ───────────────────────
function initPriorityPreview() {
  const select = document.getElementById('patientPriority');
  select.addEventListener('change', updatePriorityPreview);
}

function updatePriorityPreview() {
  const val = document.getElementById('patientPriority').value;
  const ind = document.getElementById('priorityIndicator');
  const txt = document.getElementById('priorityText');

  ind.className = 'priority-indicator';
  if (val === 'Normal') {
    ind.classList.add('priority-normal');
    txt.textContent = 'Prioridad Normal — Atención estándar';
  } else if (val === 'Urgencia') {
    ind.classList.add('priority-urgencia');
    txt.textContent = 'Urgencia — Atención prioritaria';
  } else {
    ind.classList.add('priority-emergencia');
    txt.textContent = '⚠ Emergencia — Requiere atención inmediata';
  }
}

// ── DARK MODE ──────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem('medcontrol-theme') || 'light';
  applyTheme(saved);

  document.getElementById('themeToggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-bs-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-bs-theme', theme);
  localStorage.setItem('medcontrol-theme', theme);
  const icon = document.getElementById('themeIcon');
  if (theme === 'dark') {
    icon.className = 'bi bi-sun-fill';
  } else {
    icon.className = 'bi bi-moon-stars-fill';
  }
}

// ── FORM HELPERS ───────────────────────────────────
function clearForm() {
  ['patientName', 'patientAge', 'patientSymptoms'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('patientPriority').value = 'Normal';
  updatePriorityPreview();
}

function shakeInput(id, msg) {
  const el = document.getElementById(id);
  el.classList.add('is-invalid');
  el.focus();
  el.addEventListener('input', () => el.classList.remove('is-invalid'), { once: true });
  showToast('error', 'Campo requerido', msg);
}

// ── TOAST ──────────────────────────────────────────
function initToast() {
  const el = document.getElementById('liveToast');
  toastInstance = new bootstrap.Toast(el, { delay: 3500 });
}

function showToast(type, title, msg) {
  const icons = {
    success: '<i class="bi bi-check-circle-fill" style="color:#22c55e"></i>',
    error:   '<i class="bi bi-x-circle-fill" style="color:#ef4444"></i>',
    warning: '<i class="bi bi-exclamation-triangle-fill" style="color:#eab308"></i>',
    info:    '<i class="bi bi-info-circle-fill" style="color:#3b82f6"></i>',
  };
  document.getElementById('toastIcon').innerHTML = icons[type] || icons.info;
  document.getElementById('toastTitle').textContent = title;
  document.getElementById('toastMsg').textContent   = msg;
  toastInstance.show();
}

// ── UTILITY ────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
