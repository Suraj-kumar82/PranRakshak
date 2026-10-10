/**
 * PRANरक्षक — Patient Profile Management & Medical Information Editor
 * Live age computation, dynamic allergies & medicine chips, unsaved changes tracker.
 */

const ProfileManager = {
  isDirty: false,
  allergiesList: [],
  medicinesList: [],

  async init() {
    await this.loadPatientData();
    this.bindEvents();
    this.setupUnsavedWarning();
  },

  async loadPatientData() {
    try {
      const res = await fetch('/api/patient/profile');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.patient) {
          const p = data.patient;
          const merged = {
            ...DataManager.getPatient(),
            id: p.id,
            fullName: p.full_name || p.fullName,
            email: p.email,
            phone: p.phone,
            dateOfBirth: p.date_of_birth || p.dateOfBirth,
            age: p.age,
            gender: p.gender,
            address: p.address,
            bloodGroup: p.blood_group || p.bloodGroup,
            organDonor: p.organ_donor !== undefined ? p.organ_donor : p.organDonor,
            allergies: p.allergies || [],
            medicines: p.medicines || [],
            conditions: p.conditions,
            medicalHistory: p.medical_history || p.medicalHistory,
            emergencyNotes: p.emergency_notes || p.emergencyNotes,
            emergencyContacts: p.emergency_contacts || p.emergencyContacts || [],
            heightCm: p.height_cm || p.heightCm,
            weightKg: p.weight_kg || p.weightKg,
            bmi: p.bmi,
            mdr: p.mdr_status || p.mdr,
            surgicalHistory: p.surgical_history || p.surgicalHistory,
            transplantHistory: p.transplant_history || p.transplantHistory,
            drugToxicity: p.drug_toxicity || p.drugToxicity,
            medicalInsurance: p.medical_insurance || p.medicalInsurance,
            qrCodeBase64: p.qr_code_base64
          };
          DataManager.savePatient(merged);
        }
      }
    } catch (e) {
      console.warn('Backend profile fetch error, fallback to local:', e);
    }

    const patient = DataManager.getPatient();
    if (!patient) return;

    // Fill personal fields
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };

    setVal('prof-name', patient.fullName);
    setVal('prof-email', patient.email);
    setVal('prof-phone', patient.phone);
    setVal('prof-dob', patient.dateOfBirth);
    setVal('prof-gender', patient.gender);
    setVal('prof-address', patient.address);
    setVal('prof-blood-group', patient.bloodGroup || 'B+');
    setVal('prof-conditions', patient.conditions);
    setVal('prof-history', patient.medicalHistory);
    setVal('prof-instructions', patient.emergencyNotes);

    // Clinical Parameters
    setVal('prof-height', patient.heightCm || '175');
    setVal('prof-weight', patient.weightKg || '72');
    setVal('prof-lifestyle', patient.lifestyleHabits || 'Social Alcohol, Non-smoker');
    setVal('prof-mdr', patient.mdr || 'None (Negative)');
    setVal('prof-previous-treatment', patient.previousHistory || '');
    setVal('prof-surgical', patient.surgicalHistory || '');
    setVal('prof-transplant', patient.transplantHistory || 'None');
    setVal('prof-drug-toxicity', patient.drugToxicity || '');
    setVal('prof-insurance', patient.medicalInsurance || '');

    this.updateBmi();

    const organDonorEl = document.getElementById('prof-organ-donor');
    if (organDonorEl) organDonorEl.checked = !!patient.organDonor;

    // Calculate age
    this.updateAgeDisplay(patient.dateOfBirth);

    // Allergies copy
    this.allergiesList = Array.isArray(patient.allergies) ? JSON.parse(JSON.stringify(patient.allergies)) : [];
    this.renderAllergies();

    // Medicines copy
    this.medicinesList = Array.isArray(patient.medicines) ? JSON.parse(JSON.stringify(patient.medicines)) : [];
    this.renderMedicines();

    this.isDirty = false;
  },

  updateAgeDisplay(dobStr) {
    const ageEl = document.getElementById('prof-age-display');
    if (!ageEl) return;
    if (!dobStr) {
      ageEl.textContent = '--';
      return;
    }
    const age = DataManager.calculateAge(dobStr);
    ageEl.textContent = age !== '' ? `${age} yrs` : '--';
  },

  bindEvents() {
    // DOB change recalculates age live
    const dobInput = document.getElementById('prof-dob');
    if (dobInput) {
      dobInput.addEventListener('input', (e) => {
        this.updateAgeDisplay(e.target.value);
        this.markDirty();
      });
    }

    // Height and Weight change recalculates BMI live
    const hInput = document.getElementById('prof-height');
    const wInput = document.getElementById('prof-weight');
    if (hInput) hInput.addEventListener('input', () => { this.updateBmi(); this.markDirty(); });
    if (wInput) wInput.addEventListener('input', () => { this.updateBmi(); this.markDirty(); });

    // Mark dirty on any input change
    const form = document.getElementById('profile-form');
    if (form) {
      form.addEventListener('input', () => this.markDirty());
      form.addEventListener('change', () => this.markDirty());

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveProfile(false);
      });
    }

    // Add Allergy button
    const addAllergyBtn = document.getElementById('btn-add-allergy');
    if (addAllergyBtn) {
      addAllergyBtn.addEventListener('click', () => this.addAllergy());
    }

    // Add Medicine button
    const addMedBtn = document.getElementById('btn-add-med');
    if (addMedBtn) {
      addMedBtn.addEventListener('click', () => this.addMedicine());
    }

    // Cancel / Reset button
    const cancelBtn = document.getElementById('btn-profile-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        if (this.isDirty) {
          if (confirm('Discard unsaved changes?')) {
            this.loadPatientData();
            UI.showToast('Changes reverted.', 'info');
          }
        } else {
          UI.showToast('No changes to discard.', 'info');
        }
      });
    }
  },

  markDirty() {
    this.isDirty = true;
    const dirtyBadge = document.getElementById('unsaved-badge');
    if (dirtyBadge) dirtyBadge.style.display = 'inline-flex';
  },

  clearDirty() {
    this.isDirty = false;
    const dirtyBadge = document.getElementById('unsaved-badge');
    if (dirtyBadge) dirtyBadge.style.display = 'none';
  },

  setupUnsavedWarning() {
    window.addEventListener('beforeunload', (e) => {
      if (this.isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved medical profile changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    });
  },

  // Allergy item handling
  addAllergy() {
    const nameInput = document.getElementById('new-allergy-name');
    const severitySelect = document.getElementById('new-allergy-severity');
    if (!nameInput || !nameInput.value.trim()) {
      UI.showToast('Please enter an allergen name (e.g. Penicillin, Peanuts).', 'warning');
      if (nameInput) nameInput.focus();
      return;
    }

    const newAllergy = {
      id: 'a_' + Date.now(),
      name: nameInput.value.trim(),
      severity: severitySelect ? severitySelect.value : 'Moderate'
    };

    this.allergiesList.push(newAllergy);
    nameInput.value = '';
    this.renderAllergies();
    this.markDirty();
  },

  removeAllergy(id) {
    this.allergiesList = this.allergiesList.filter(item => item.id !== id);
    this.renderAllergies();
    this.markDirty();
  },

  renderAllergies() {
    const container = document.getElementById('allergies-container');
    if (!container) return;

    if (this.allergiesList.length === 0) {
      container.innerHTML = `<p style="font-size:0.85rem; color:var(--color-cool-gray); font-style:italic;">No known drug or food allergies recorded.</p>`;
      return;
    }

    container.innerHTML = this.allergiesList.map(item => `
      <div class="allergy-chip" style="margin-right:6px; margin-bottom:6px;">
        <span class="severity-badge" style="${item.severity === 'Severe' ? 'background-color:var(--color-emergency-red);' : 'background-color:#d97706;'}">${item.severity}</span>
        <strong>${item.name}</strong>
        <button type="button" onclick="ProfileManager.removeAllergy('${item.id}')" style="background:none;border:none;color:var(--color-emergency-red);cursor:pointer;padding:0 2px;" title="Remove">✕</button>
      </div>
    `).join('');
  },

  // Medicine item handling
  addMedicine() {
    const nameInput = document.getElementById('new-med-name');
    const doseInput = document.getElementById('new-med-dosage');
    const freqInput = document.getElementById('new-med-freq');
    const notesInput = document.getElementById('new-med-notes');

    if (!nameInput || !nameInput.value.trim()) {
      UI.showToast('Please specify medicine name.', 'warning');
      if (nameInput) nameInput.focus();
      return;
    }

    const newMed = {
      id: 'm_' + Date.now(),
      name: nameInput.value.trim(),
      dosage: doseInput ? doseInput.value.trim() || 'Standard' : 'Standard',
      frequency: freqInput ? freqInput.value.trim() || 'Daily' : 'Daily',
      notes: notesInput ? notesInput.value.trim() : ''
    };

    this.medicinesList.push(newMed);
    if (nameInput) nameInput.value = '';
    if (doseInput) doseInput.value = '';
    if (notesInput) notesInput.value = '';
    this.renderMedicines();
    this.markDirty();
  },

  removeMedicine(id) {
    this.medicinesList = this.medicinesList.filter(item => item.id !== id);
    this.renderMedicines();
    this.markDirty();
  },

  renderMedicines() {
    const container = document.getElementById('medicines-container');
    if (!container) return;

    if (this.medicinesList.length === 0) {
      container.innerHTML = `<p style="font-size:0.85rem; color:var(--color-cool-gray); font-style:italic;">No current prescriptions or routine medications recorded.</p>`;
      return;
    }

    container.innerHTML = this.medicinesList.map(item => `
      <div class="med-item" style="margin-bottom:8px;">
        <div>
          <div class="med-name">${item.name} <span style="font-weight:normal;color:var(--color-cool-gray);">(${item.dosage})</span></div>
          <div class="med-dosage">${item.frequency} ${item.notes ? `• <em>${item.notes}</em>` : ''}</div>
        </div>
        <button type="button" class="btn btn-ghost btn-sm" onclick="ProfileManager.removeMedicine('${item.id}')" style="color:var(--color-emergency-red);" title="Remove Medicine">✕</button>
      </div>
    `).join('');
  },

  updateBmi() {
    const h = document.getElementById('prof-height')?.value;
    const w = document.getElementById('prof-weight')?.value;
    const res = DataManager.calculateBmi(h, w);
    const badge = document.getElementById('prof-bmi-badge');
    if (badge) {
      badge.textContent = `BMI: ${res.bmi} (${res.category})`;
      badge.style.color = res.color;
    }
  },

  // Save changes
  async saveProfile(andSyncWebhook = false) {
    const patient = DataManager.getPatient();

    const getVal = (id) => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };

    const fullName = getVal('prof-name');
    if (!fullName) {
      UI.showToast('Full name is required.', 'error');
      document.getElementById('prof-name').focus();
      return;
    }

    patient.fullName = fullName;
    patient.email = getVal('prof-email');
    patient.phone = getVal('prof-phone');
    patient.dateOfBirth = getVal('prof-dob');
    patient.gender = getVal('prof-gender');
    patient.address = getVal('prof-address');
    patient.bloodGroup = getVal('prof-blood-group');
    patient.conditions = getVal('prof-conditions');
    patient.medicalHistory = getVal('prof-history');
    patient.emergencyNotes = getVal('prof-instructions');

    // Clinical Parameters
    const height = getVal('prof-height');
    const weight = getVal('prof-weight');
    const bmiRes = DataManager.calculateBmi(height, weight);
    patient.heightCm = height;
    patient.weightKg = weight;
    patient.bmi = `${bmiRes.bmi} (${bmiRes.category})`;
    patient.lifestyleHabits = getVal('prof-lifestyle');
    patient.mdr = getVal('prof-mdr');
    patient.previousHistory = getVal('prof-previous-treatment');
    patient.surgicalHistory = getVal('prof-surgical');
    patient.transplantHistory = getVal('prof-transplant');
    patient.drugToxicity = getVal('prof-drug-toxicity');
    patient.medicalInsurance = getVal('prof-insurance');

    const organEl = document.getElementById('prof-organ-donor');
    patient.organDonor = organEl ? organEl.checked : true;

    patient.allergies = this.allergiesList;
    patient.medicines = this.medicinesList;

    // Persist to local data
    DataManager.savePatient(patient);
    this.clearDirty();

    // Persist to Flask SQLite backend & regenerate Smart QR Code
    try {
      const res = await fetch('/api/patient/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: patient.fullName,
          email: patient.email,
          phone: patient.phone,
          dateOfBirth: patient.dateOfBirth,
          age: DataManager.calculateAge(patient.dateOfBirth) || patient.age,
          gender: patient.gender,
          address: patient.address,
          bloodGroup: patient.bloodGroup,
          organDonor: patient.organDonor,
          allergies: patient.allergies,
          medicines: patient.medicines,
          conditions: patient.conditions,
          medicalHistory: patient.medicalHistory,
          emergencyNotes: patient.emergencyNotes,
          emergencyContacts: patient.emergencyContacts || [],
          heightCm: parseFloat(height) || 175,
          weightKg: parseFloat(weight) || 72,
          bmi: patient.bmi,
          mdrStatus: patient.mdr,
          surgicalHistory: patient.surgicalHistory,
          transplantHistory: patient.transplantHistory,
          drugToxicity: patient.drugToxicity,
          medicalInsurance: patient.medicalInsurance
        })
      });

      const resData = await res.json();
      if (resData.success && resData.qrCodeBase64) {
        patient.qrCodeBase64 = resData.qrCodeBase64;
        DataManager.savePatient(patient);
        UI.showToast('Medical details saved & Smart QR Code regenerated via Python backend!', 'success', 'Saved & QR Updated');
      } else {
        UI.showToast('Medical profile updated and synchronized with Emergency QR card.', 'success', 'Profile Saved');
      }
    } catch (e) {
      console.warn('Backend sync failed, saved locally:', e);
      UI.showToast('Profile saved locally.', 'info');
    }

    if (andSyncWebhook) {
      const payload = {
        event: "patient_medical_profile_update",
        patient_id: patient.id,
        name: patient.fullName,
        age: DataManager.calculateAge(patient.dateOfBirth) || patient.age,
        blood_group: patient.bloodGroup,
        allergies: patient.allergies.map(a => `${a.name} (${a.severity})`).join(', ') || "None reported",
        lifestyle_habits: patient.lifestyleHabits,
        height_cm: parseFloat(height) || null,
        weight_kg: parseFloat(weight) || null,
        bmi: bmiRes.bmi,
        bmi_category: bmiRes.category,
        mdr: patient.mdr,
        previous_history: patient.previousHistory,
        surgical_history: patient.surgicalHistory,
        transplant_history: patient.transplantHistory,
        drug_toxicity: patient.drugToxicity,
        medical_insurance: patient.medicalInsurance,
        submitted_at: new Date().toISOString()
      };
      await DataManager.sendToN8nWebhook(payload);
    }
  }
};
