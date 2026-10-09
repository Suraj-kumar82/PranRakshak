/**
 * PRANरक्षक — Patient Dashboard Controller
 * Computes health readiness percentage, populates differentiated summary cards,
 * and handles quick-action shortcuts.
 */

const DashboardManager = {
  init() {
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

    // QR Code Thumbnail
    const qrThumbContainer = document.getElementById('dash-qr-thumb');
    if (qrThumbContainer) {
      qrThumbContainer.innerHTML = '';
      const emergencyUrl = `${window.location.origin}${window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'))}/emergency.html?id=${patient.id}`;
      try {
        new QRCode(qrThumbContainer, {
          text: emergencyUrl,
          width: 90,
          height: 90,
          colorDark: "#273746",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.M
        });
      } catch (e) {
        console.error(e);
      }
    }

    renderIcons();
  }
};
