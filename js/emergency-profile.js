/**
 * PRANरक्षक — Public Emergency Medical Profile Controller
 * Rendered when a first responder or civilian scans the QR code.
 * Zero login required. Maximum speed and critical life-saving clarity.
 */

const EmergencyProfileView = {
  init() {
    this.renderProfile();
    this.bindActions();
  },

  renderProfile() {
    const params = new URLSearchParams(window.location.search);
    const patientId = params.get('id') || 'PRAN-7429';

    // In prototype, loads patient data from DataManager
    const patient = DataManager.getPatient();

    const setEl = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text || '--';
    };

    setEl('pub-patient-name', patient.fullName);
    setEl('pub-patient-id', patient.id);
    setEl('pub-blood-group', patient.bloodGroup || 'B+');
    setEl('pub-age-gender', `${patient.age || DataManager.calculateAge(patient.dateOfBirth)} yrs • ${patient.gender}`);
    setEl('pub-organ-donor', patient.organDonor ? 'Registered Organ Donor' : 'Not Registered');
    setEl('pub-conditions', patient.conditions || 'None recorded');
    setEl('pub-notes', patient.emergencyNotes || 'No special emergency directives on file.');

    // Clinical Parameters
    setEl('pub-mdr', patient.mdr || 'Negative / None Reported');
    setEl('pub-drug-tox', patient.drugToxicity || 'None Reported');
    setEl('pub-insurance', patient.medicalInsurance || 'Star Health Cashless Active');
    setEl('pub-bmi', patient.bmi || '23.5 (Normal)');

    // Critical allergies list
    const allergiesContainer = document.getElementById('pub-allergies-list');
    if (allergiesContainer) {
      if (patient.allergies && patient.allergies.length > 0) {
        allergiesContainer.innerHTML = patient.allergies.map(a => `
          <div class="allergy-chip" style="background:#ffffff; border:1.5px solid var(--color-emergency-red);">
            <span class="severity-badge" style="background:var(--color-emergency-red);">${a.severity}</span>
            <strong style="color:var(--color-emergency-red); font-size:1rem;">${a.name}</strong>
          </div>
        `).join('');
      } else {
        allergiesContainer.innerHTML = `<span style="color:var(--color-cool-gray);">No known drug allergies reported.</span>`;
      }
    }

    // Current Medications
    const medsContainer = document.getElementById('pub-meds-list');
    if (medsContainer) {
      if (patient.medicines && patient.medicines.length > 0) {
        medsContainer.innerHTML = patient.medicines.map(m => `
          <div class="med-item" style="border-left:3px solid var(--color-dusty-blue);">
            <div>
              <div class="med-name">${m.name}</div>
              <div class="med-dosage">${m.frequency} ${m.notes ? `(${m.notes})` : ''}</div>
            </div>
            <span class="med-frequency-badge">${m.dosage}</span>
          </div>
        `).join('');
      } else {
        medsContainer.innerHTML = `<span style="color:var(--color-cool-gray);">No routine medications registered.</span>`;
      }
    }

    // Emergency Contacts
    const primaryContact = (patient.emergencyContacts || []).find(c => c.isPrimary) || (patient.emergencyContacts || [])[0];
    const callPrimaryBtn = document.getElementById('pub-call-primary-btn');
    const primaryContactDetails = document.getElementById('pub-primary-contact-details');

    if (primaryContact) {
      if (callPrimaryBtn) {
        callPrimaryBtn.href = `tel:${primaryContact.phone}`;
        callPrimaryBtn.innerHTML = `${Icons.phoneCall} Call ${primaryContact.name} (${primaryContact.relation})`;
      }
      if (primaryContactDetails) {
        primaryContactDetails.innerHTML = `<strong>${primaryContact.name}</strong> • ${primaryContact.phone}`;
      }
    }

    // Secondary contacts
    const otherContacts = (patient.emergencyContacts || []).filter(c => c !== primaryContact);
    const secondaryListEl = document.getElementById('pub-secondary-contacts');
    if (secondaryListEl) {
      if (otherContacts.length > 0) {
        secondaryListEl.innerHTML = otherContacts.map(c => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:0.6rem 0; border-bottom:1px solid var(--border-light);">
            <div>
              <strong>${c.name}</strong> <span style="color:var(--color-cool-gray); font-size:0.85rem;">(${c.relation})</span>
              <div style="font-size:0.85rem; color:var(--color-deep-slate);">${c.phone}</div>
            </div>
            <a href="tel:${c.phone}" class="btn btn-secondary btn-sm">${Icons.phone} Call</a>
          </div>
        `).join('');
      } else {
        secondaryListEl.innerHTML = `<span style="color:var(--color-cool-gray); font-size:0.85rem;">No secondary contacts listed.</span>`;
      }
    }

    // Connect ambulance button to emergency assistance with prepopulated patientId
    const reqAmbBtn = document.getElementById('pub-req-ambulance-btn');
    if (reqAmbBtn) {
      reqAmbBtn.href = `emergency-assistance.html?patientId=${encodeURIComponent(patient.id)}`;
    }

    renderIcons();
  },

  bindActions() {
    const notifyBtn = document.getElementById('btn-notify-family');
    if (notifyBtn) {
      notifyBtn.addEventListener('click', () => {
        UI.showToast('Automated SMS & WhatsApp emergency ping simulated to family!', 'success', 'Family Alerted');
      });
    }
  }
};
