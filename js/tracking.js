/**
 * PRANरक्षक — Ambulance Request Tracking & Status Timeline
 * Live status progression, interactive map beacon simulation, countdown timer, and hackathon judge controls.
 */

const TrackingManager = {
  currentRequest: null,
  countdownInterval: null,
  mapAnimInterval: null,

  STATUS_FLOW: [
    'Request Submitted',
    'Awaiting Response',
    'Accepted',
    'Ambulance Dispatched',
    'Completed'
  ],

  init() {
    this.loadRequest();
    this.bindJudgeControls();
    this.startMapSimulation();
  },

  loadRequest() {
    const params = new URLSearchParams(window.location.search);
    const reqId = params.get('id') || 'EMG-8924'; // fallback to seed

    this.currentRequest = DataManager.getEmergencyRequestById(reqId);
    if (!this.currentRequest) {
      // If id not found, get most recent request or fallback
      const all = DataManager.getEmergencyRequests();
      this.currentRequest = all[0];
    }

    if (!this.currentRequest) {
      UI.showToast('No emergency requests found.', 'warning');
      return;
    }

    this.renderRequestDetails();
    this.renderTimeline();
    this.startCountdown();
  },

  renderRequestDetails() {
    const r = this.currentRequest;
    const setEl = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text || '--';
    };

    setEl('track-req-id', r.id);
    setEl('track-incident-type', r.incidentType);
    setEl('track-location', r.location);
    setEl('track-submitted-time', UI.formatDateTime(r.submittedAt));
    setEl('track-callback-phone', r.callbackPhone);
    setEl('track-patient-name', r.patientName);
    setEl('track-desc', r.description);

    // Status pill
    const statusPill = document.getElementById('track-status-pill');
    if (statusPill) {
      statusPill.textContent = r.status.toUpperCase();
      statusPill.className = 'badge';
      if (r.status === 'Completed') statusPill.classList.add('badge-sage');
      else if (r.status === 'Ambulance Dispatched') statusPill.classList.add('badge-emergency');
      else if (r.status === 'Accepted') statusPill.classList.add('badge-teal');
      else statusPill.classList.add('badge-dusty');
    }

    // Provider details
    setEl('track-hospital', r.assignedHospital || 'City General Trauma Center');
    setEl('track-ambulance', r.assignedAmbulance || 'LifeCare ALS #14');
    setEl('track-paramedic', r.paramedicContact || 'Ramesh Kumar (+91 98110 99887)');

    const etaEl = document.getElementById('track-eta-mins');
    if (etaEl) {
      etaEl.textContent = `${r.estimatedArrivalMins || 6} MINS`;
    }

    renderIcons();
  },

  renderTimeline() {
    const currentStatus = this.currentRequest.status;
    const currentIndex = this.STATUS_FLOW.indexOf(currentStatus);

    const steps = [
      { key: 'Request Submitted', title: 'Request Submitted', desc: 'Emergency dispatch ticket received by PRANरक्षक triage engine.' },
      { key: 'Awaiting Response', title: 'Awaiting Response', desc: 'Nearest emergency trauma centers alerted with GPS coordinates.' },
      { key: 'Accepted', title: 'Accepted by Trauma Center', desc: 'Case acknowledged and primary medical protocol assigned.' },
      { key: 'Ambulance Dispatched', title: 'Ambulance Dispatched', desc: 'Advanced Life Support (ALS) vehicle en route with paramedic team.' },
      { key: 'Completed', title: 'Reached Scene / Completed', desc: 'Paramedics on scene, patient stabilization initiated.' }
    ];

    const timelineContainer = document.getElementById('timeline-container');
    if (!timelineContainer) return;

    if (currentStatus === 'Cancelled') {
      timelineContainer.innerHTML = `
        <div style="background:#fff4f4; padding:1.25rem; border-radius:var(--radius-md); border:1px solid #ffd0d0; color:var(--color-emergency-red); text-align:center;">
          <h4>Emergency Request Cancelled</h4>
          <p style="font-size:0.85rem; margin-top:0.35rem;">This request was marked as cancelled by the reporter or dispatcher.</p>
        </div>
      `;
      return;
    }

    timelineContainer.innerHTML = steps.map((s, idx) => {
      let stateClass = '';
      let bulletIcon = idx + 1;

      if (idx < currentIndex) {
        stateClass = 'is-done';
        bulletIcon = '✔';
      } else if (idx === currentIndex) {
        stateClass = (s.key === 'Ambulance Dispatched' || s.key === 'Completed') ? 'is-emergency is-active' : 'is-active';
        bulletIcon = '●';
      }

      return `
        <div class="timeline-step ${stateClass}">
          <div class="timeline-step-bullet">${bulletIcon}</div>
          <div class="timeline-step-content">
            <h4>${s.title}</h4>
            <div class="timeline-step-desc">${s.desc}</div>
          </div>
        </div>
      `;
    }).join('');
  },

  startCountdown() {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    let secondsLeft = (this.currentRequest.estimatedArrivalMins || 6) * 60;

    const timerDisplay = document.getElementById('countdown-timer');
    if (!timerDisplay) return;

    const updateText = () => {
      if (this.currentRequest.status === 'Completed') {
        timerDisplay.textContent = 'ARRIVED ON SCENE';
        return;
      }
      if (this.currentRequest.status === 'Cancelled') {
        timerDisplay.textContent = 'REQUEST CANCELLED';
        return;
      }

      const m = Math.floor(secondsLeft / 60);
      const s = secondsLeft % 60;
      timerDisplay.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} ETA`;

      if (secondsLeft > 0) secondsLeft--;
    };

    updateText();
    this.countdownInterval = setInterval(updateText, 1000);
  },

  startMapSimulation() {
    const ambulancePin = document.getElementById('sim-ambulance-pin');
    if (!ambulancePin) return;

    let progress = 0.15;
    let direction = 1;

    this.mapAnimInterval = setInterval(() => {
      if (this.currentRequest && this.currentRequest.status === 'Completed') {
        ambulancePin.style.left = '70%';
        ambulancePin.style.top = '35%';
        return;
      }
      progress += 0.05 * direction;
      if (progress > 0.65) direction = -0.5;
      if (progress < 0.15) direction = 1;

      const leftPercent = 15 + (progress * 80);
      ambulancePin.style.left = `${leftPercent}%`;
      ambulancePin.style.top = `${30 + (progress * 15)}%`;
    }, 1500);
  },

  // Hackathon demo controls
  advanceStatus() {
    const curStatus = this.currentRequest.status;
    const curIdx = this.STATUS_FLOW.indexOf(curStatus);
    if (curIdx < this.STATUS_FLOW.length - 1) {
      const nextStatus = this.STATUS_FLOW[curIdx + 1];
      this.updateStatus(nextStatus);
    } else {
      UI.showToast('Request is already at final status (Completed).', 'info');
    }
  },

  updateStatus(newStatus) {
    const updated = DataManager.updateRequestStatus(this.currentRequest.id, newStatus);
    if (updated) {
      this.currentRequest = updated;
      this.renderRequestDetails();
      this.renderTimeline();
      UI.playEmergencyBeep();
      UI.showToast(`Status updated to "${newStatus}"`, 'success', 'Live Tracking Update');
    }
  },

  cancelRequest() {
    if (confirm('Are you sure you want to cancel this emergency request?')) {
      const updated = DataManager.updateRequestStatus(this.currentRequest.id, 'Cancelled');
      if (updated) {
        this.currentRequest = updated;
        this.renderRequestDetails();
        this.renderTimeline();
        UI.showToast('Emergency request cancelled.', 'warning');
      }
    }
  },

  bindJudgeControls() {
    const advanceBtn = document.getElementById('btn-advance-status');
    if (advanceBtn) {
      advanceBtn.addEventListener('click', () => this.advanceStatus());
    }

    const cancelBtn = document.getElementById('btn-cancel-req');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.cancelRequest());
    }

    const resetBtn = document.getElementById('btn-reset-demo-req');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        DataManager.resetDemoData();
        UI.showToast('Demo data re-initialized.', 'info');
        setTimeout(() => window.location.reload(), 400);
      });
    }
  }
};
