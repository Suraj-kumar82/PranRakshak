/**
 * PRANरक्षक — Patient Dashboard Controller
 * Computes health readiness percentage, populates differentiated summary cards,
 * and handles quick-action shortcuts.
 */

const DashboardManager = {
  async init() {
    const session = (typeof Auth !== 'undefined' && Auth.getSession) ? Auth.getSession() : null;
    const sessionPatientId = (session && session.role === 'patient' && session.id) ? session.id : null;
    if (sessionPatientId) {
      await this.syncProfileFromServer(sessionPatientId);
    }
    this.renderDashboard();
  },

  renderDashboard() {
    const patient = DataManager.getPatient();
    if (!patient) return;

    // Greeting & Identity
    const nameEl = document.getElementById('dash-user-name');
    if (nameEl) nameEl.textContent = patient.fullName;

    const avatarEl = document.getElementById('dash-avatar-initials');
    if (avatarEl) {
      const parts = patient.fullName.split(' ');
      avatarEl.textContent = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0][0];
    }

    const patientIdEl = document.getElementById('dash-patient-id');
    if (patientIdEl) patientIdEl.textContent = patient.id;

    const lastUpdatedEl = document.getElementById('dash-last-updated');
    if (lastUpdatedEl) {
      lastUpdatedEl.textContent = `Last updated: ${UI.timeAgo(patient.lastUpdated) || 'Recently'}`;
    }

    // Profile Completion Percentage
    const completion = DataManager.calculateProfileCompletion(patient);
    const scoreValEl = document.getElementById('dash-completion-val');
    const scoreBarEl = document.getElementById('dash-completion-bar');
    if (scoreValEl) scoreValEl.textContent = `${completion}%`;
    if (scoreBarEl) scoreBarEl.style.width = `${completion}%`;

    // Blood Group
    const bloodEl = document.getElementById('dash-blood-group');
    if (bloodEl) bloodEl.textContent = patient.bloodGroup || 'O+';

    const donorEl = document.getElementById('dash-organ-donor');
    if (donorEl) donorEl.textContent = patient.organDonor ? 'Registered Organ Donor' : 'Not Registered';

    // Allergies
    const allergiesListEl = document.getElementById('dash-allergies-list');
    if (allergiesListEl) {
      if (patient.allergies && patient.allergies.length > 0) {
        allergiesListEl.innerHTML = patient.allergies.map(a => `
          <div class="allergy-chip">
            <span class="severity-badge">${a.severity}</span>
            <span>${a.name}</span>
          </div>
        `).join('');
      } else {
        allergiesListEl.innerHTML = `<p style="font-size:0.85rem; color:var(--color-cool-gray);">No known drug allergies reported.</p>`;
      }
    }

    // Current Medications
    const medsListEl = document.getElementById('dash-meds-list');
    if (medsListEl) {
      if (patient.medicines && patient.medicines.length > 0) {
        medsListEl.innerHTML = patient.medicines.map(m => `
          <div class="med-item">
            <div>
              <div class="med-name">${m.name}</div>
              <div class="med-dosage">${m.frequency}</div>
            </div>
            <span class="med-frequency-badge">${m.dosage}</span>
          </div>
        `).join('');
      } else {
        medsListEl.innerHTML = `<p style="font-size:0.85rem; color:var(--color-cool-gray);">No routine medications recorded.</p>`;
      }
    }

    // Existing Conditions & History
    const condEl = document.getElementById('dash-conditions-text');
    if (condEl) condEl.textContent = patient.conditions || 'None specified';

    const historyEl = document.getElementById('dash-history-text');
    if (historyEl) historyEl.textContent = patient.medicalHistory || 'No previous surgeries or complications recorded.';

    const instrEl = document.getElementById('dash-instructions-text');
    if (instrEl) instrEl.textContent = patient.emergencyNotes || 'None';

    // Clinical & Insurance Metrics
    const bmiEl = document.getElementById('dash-bmi-val');
    if (bmiEl) bmiEl.textContent = patient.bmi || '23.5 (Normal)';

    const mdrEl = document.getElementById('dash-mdr-val');
    if (mdrEl) mdrEl.textContent = patient.mdr || 'Negative';

    const lifeEl = document.getElementById('dash-lifestyle-val');
    if (lifeEl) lifeEl.textContent = patient.lifestyleHabits || 'Social Alcohol, Non-smoker';

    const insEl = document.getElementById('dash-insurance-val');
    if (insEl) insEl.textContent = patient.medicalInsurance || 'Star Health Cashless Active';

    // Emergency Contacts Summary
    const contactsSummaryEl = document.getElementById('dash-contacts-list');
    if (contactsSummaryEl) {
      const contacts = patient.emergencyContacts || [];
      if (contacts.length > 0) {
        contactsSummaryEl.innerHTML = contacts.map(c => `
          <div class="contact-card-item ${c.isPrimary ? 'is-primary' : ''}">
            <div class="contact-info-block">
              <div class="contact-name">${c.name}</div>
              <div class="contact-relation">${c.relation} • <a href="tel:${c.phone}">${c.phone}</a></div>
            </div>
            <a href="tel:${c.phone}" class="contact-call-btn" title="Call Contact">
              ${Icons.phoneCall} Call
            </a>
          </div>
        `).join('');
      } else {
        contactsSummaryEl.innerHTML = `<p style="font-size:0.85rem; color:var(--color-cool-gray);">No emergency contacts configured yet.</p>`;
      }
    }

    // Featured Smart QR Code Lifeline & Actions
    const mainQrImg = document.getElementById('dash-main-qr-img');
    if (mainQrImg) {
      mainQrImg.src = `/api/qr/${encodeURIComponent(patient.id)}`;
    }

    ['dash-btn-scan-qr', 'nav-btn-scan-qr', 'card8-btn-scan-qr'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.href = '#camera-scanner';
        el.onclick = (e) => {
          e.preventDefault();
          if (typeof QRScannerModal !== 'undefined') {
            QRScannerModal.open(patient.id);
          }
        };
      }
    });

    ['dash-btn-test-scan', 'nav-btn-test-scan', 'card8-btn-test-scan'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.href = `/scan/${encodeURIComponent(patient.id)}`;
    });

    const qrUrlText = document.getElementById('dash-qr-url-text');
    if (qrUrlText) {
      qrUrlText.textContent = `${window.location.origin}/scan/${encodeURIComponent(patient.id)}`;
    }

    const qrPatientName = document.getElementById('dash-qr-patient-name');
    if (qrPatientName) {
      qrPatientName.textContent = patient.fullName;
    }

    const downloadQrBtn = document.getElementById('dash-btn-download-qr');
    if (downloadQrBtn) {
      downloadQrBtn.href = `/api/qr/${encodeURIComponent(patient.id)}`;
      downloadQrBtn.download = `PRAN-QR-${patient.id}.png`;
    }

    // QR Code Thumbnail Widget in Card 8
    const qrThumbContainer = document.getElementById('dash-qr-thumb');
    if (qrThumbContainer) {
      qrThumbContainer.innerHTML = `<img src="/api/qr/${encodeURIComponent(patient.id)}" alt="QR Thumbnail" style="width:90px; height:90px; display:block; border-radius:6px;">`;
    }

    // Render Treatments
    this.renderTreatments(patient.treatments || []);

    // Sync from server for latest clinical updates
    this.syncProfileFromServer(patient.id);

    renderIcons();
  },

  async syncProfileFromServer(patientId) {
    try {
      const res = await fetch(`/api/patient/profile?id=${encodeURIComponent(patientId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.patient) {
          const p = data.patient;
          // Normalize
          p.fullName = p.fullName || p.full_name;
          p.bloodGroup = p.bloodGroup || p.blood_group;
          p.medicalHistory = p.medicalHistory || p.medical_history;
          p.emergencyNotes = p.emergencyNotes || p.emergency_notes;
          DataManager.savePatient(p);
          this.renderTreatments(p.treatments || []);
        }
      }
    } catch (e) {
      console.warn('Profile sync error:', e);
    }
  },

  renderTreatments(treatments) {
    const listEl = document.getElementById('dash-treatments-list');
    if (!listEl) return;

    if (!treatments || treatments.length === 0) {
      listEl.innerHTML = `
        <div style="font-size:0.875rem; color:var(--color-cool-gray); font-style:italic; padding:0.5rem 0;">
          No hospital treatment records logged yet. When an attending trauma center treats you, their verified diagnosis and clinical notes will appear here.
        </div>
      `;
      return;
    }

    listEl.innerHTML = treatments.map(t => {
      const dt = t.created_at ? new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Verified Clinical Record';
      return `
        <div style="background:var(--color-off-white); border:1px solid var(--border-light); border-left:4px solid var(--color-teal); border-radius:6px; padding:0.9rem 1.1rem; margin-bottom:0.75rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.35rem;">
            <div>
              <strong style="color:var(--color-deep-slate); font-size:1rem;">${t.hospital_name || 'Hospital Trauma ER'}</strong>
              <span style="font-size:0.8rem; color:var(--color-cool-gray); margin-left:0.5rem;">Attending: Dr. ${t.doctor_name || 'Staff Surgeon'}</span>
            </div>
            <span class="badge badge-teal" style="font-size:0.75rem; font-weight:800;">${t.patient_status || 'STABILIZED'}</span>
          </div>

          <div style="font-size:0.9rem; color:var(--color-deep-slate); margin-bottom:0.25rem;">
            <strong>Diagnosis:</strong> <span style="color:var(--color-emergency-red); font-weight:700;">${t.diagnosis}</span>
          </div>

          <div style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.25rem;">
            <strong>Treatment & Procedures:</strong> ${t.treatment_provided}
          </div>

          ${t.prescriptions_added ? `
            <div style="font-size:0.825rem; color:var(--color-teal-dark);">
              <strong>Prescriptions Added to Profile:</strong> ${t.prescriptions_added}
            </div>
          ` : ''}

          ${t.notes ? `
            <div style="font-size:0.8rem; color:var(--color-cool-gray); margin-top:0.2rem;">
              <strong>Clinical Directives:</strong> ${t.notes}
            </div>
          ` : ''}

          <div style="font-size:0.75rem; color:var(--color-cool-gray); margin-top:0.4rem; font-family:var(--font-mono);">
            Recorded: ${dt} • Verification ID: ${t.id}
          </div>
        </div>
      `;
    }).join('');
  }
};
