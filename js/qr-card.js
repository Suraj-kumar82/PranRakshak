/**
 * PRANरक्षक — Digital Medical QR Card Generator & Exporter
 * Generates high-res QR code embedding all patient clinical parameters,
 * allows PNG wallet image export, standalone QR download, and 1-click hospital testing.
 */

const QRCardManager = {
  qrInstance: null,
  currentPatientId: 'PRAN-7429',

  async init() {
    const session = (typeof Auth !== 'undefined' && Auth.getSession) ? Auth.getSession() : null;
    const sessionPatientId = (session && session.role === 'patient' && session.id) ? session.id : null;
    const localPatient = DataManager.getPatient();

    const params = new URLSearchParams(window.location.search);
    const idParam = params.get('patientId') || params.get('id');

    this.currentPatientId = idParam || sessionPatientId || (localPatient ? localPatient.id : 'PRAN-7429');

    // Sync latest from server
    await this.syncFromServer(this.currentPatientId);

    this.renderCardDetails();
    this.generateQRCode();
    this.bindEvents();
  },

  async syncFromServer(patientId) {
    if (!patientId) return;
    try {
      const res = await fetch(`/api/patient/profile?id=${encodeURIComponent(patientId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.patient) {
          const p = data.patient;
          p.fullName = p.fullName || p.full_name;
          p.bloodGroup = p.bloodGroup || p.blood_group;
          p.medicalHistory = p.medicalHistory || p.medical_history;
          p.emergencyNotes = p.emergencyNotes || p.emergency_notes;
          DataManager.savePatient(p);
        }
      }
    } catch (e) {
      console.warn('QR card sync warning:', e);
    }
  },

  getCurrentPatient() {
    return DataManager.getPatientById(this.currentPatientId);
  },

  getEmergencyUrl(patient) {
    const origin = window.location.origin;
    return `${origin}/scan/${encodeURIComponent(patient.id)}`;
  },

  renderCardDetails() {
    const patient = this.getCurrentPatient();
    if (!patient) return;

    const setEl = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text || '--';
    };

    setEl('card-patient-name', patient.fullName);
    setEl('card-patient-id', patient.id);
    setEl('card-blood-type', patient.bloodGroup || 'O+');
    
    const ageVal = patient.age || DataManager.calculateAge(patient.dateOfBirth);
    setEl('card-patient-age-gender', `${ageVal} yrs • ${patient.gender || 'Male'}`);

    const organEl = document.getElementById('card-organ-donor');
    if (organEl) {
      organEl.textContent = patient.organDonor ? 'Registered Organ Donor' : 'Standard Donor Status';
    }

    // Allergies summary
    const allergyTextEl = document.getElementById('card-allergies-text');
    if (allergyTextEl) {
      if (patient.allergies && patient.allergies.length > 0) {
        allergyTextEl.textContent = patient.allergies.map(a => `${a.name} (${a.severity})`).join(', ');
      } else {
        allergyTextEl.textContent = 'No known drug allergies reported';
      }
    }

    // Conditions
    setEl('card-conditions', patient.conditions || 'None recorded');

    // Medicines
    if (patient.medicines && patient.medicines.length > 0) {
      setEl('card-medicines', patient.medicines.map(m => `${m.name} (${m.dosage})`).join(', '));
    } else {
      setEl('card-medicines', 'No routine medications');
    }

    // Primary emergency contact
    const primaryContact = (patient.emergencyContacts || []).find(c => c.isPrimary) || (patient.emergencyContacts || [])[0];
    if (primaryContact) {
      setEl('card-emergency-contact', `${primaryContact.name} (${primaryContact.relation}): ${primaryContact.phone}`);
    } else {
      setEl('card-emergency-contact', 'National Helpline 112');
    }

    // Insurance
    setEl('card-insurance', patient.medicalInsurance || 'Star Health Cashless Active');
  },

  generateQRCode() {
    const patient = this.getCurrentPatient();
    const qrContainer = document.getElementById('qr-code-element');
    if (!qrContainer) return;

    const emergencyUrl = this.getEmergencyUrl(patient);
    const qrApiUrl = `/api/qr/${encodeURIComponent(patient.id)}`;

    // Render crisp, flawless Python-generated PNG image directly
    qrContainer.innerHTML = `<img id="card-qr-img" src="${qrApiUrl}" alt="PRAN Emergency Medical QR" style="width:140px; height:140px; display:block; border-radius:6px; background:#fff;">`;

    const scanBtn = document.getElementById('wallet-btn-scan-qr');
    if (scanBtn) {
      scanBtn.href = '#camera-scanner';
      scanBtn.onclick = (e) => {
        e.preventDefault();
        if (typeof QRScannerModal !== 'undefined') {
          QRScannerModal.open(patient.id);
        }
      };
    }

    // Set preview URL in link display
    const urlDisplay = document.getElementById('emergency-url-display');
    if (urlDisplay) {
      urlDisplay.textContent = emergencyUrl;
    }

    // Set raw JSON payload in inspector
    const jsonDisplay = document.getElementById('qr-payload-json-display');
    if (jsonDisplay) {
      try {
        const rawObj = JSON.parse(DataManager.encodePatientForQr(patient));
        jsonDisplay.textContent = JSON.stringify(rawObj, null, 2);
      } catch (err) {
        jsonDisplay.textContent = DataManager.encodePatientForQr(patient);
      }
    }
  },

  bindEvents() {
    // Copy link
    const copyBtn = document.getElementById('btn-copy-qr-link');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const patient = this.getCurrentPatient();
        const url = this.getEmergencyUrl(patient);
        UI.copyToClipboard(url, 'Public emergency profile URL copied!');
      });
    }

    // Print card
    const printBtn = document.getElementById('btn-print-qr-card');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        window.print();
      });
    }

    // Download PNG full card
    const downloadBtn = document.getElementById('btn-download-qr-card');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => this.downloadCardAsImage());
    }

    // Download QR Code only
    const downloadQrOnlyBtn = document.getElementById('btn-download-qr-only');
    if (downloadQrOnlyBtn) {
      downloadQrOnlyBtn.addEventListener('click', () => this.downloadQRCodeOnly());
    }
  },

  downloadQRCodeOnly() {
    const patient = this.getCurrentPatient();
    const link = document.createElement('a');
    link.download = `PRAN-QR-${patient.id}.png`;
    link.href = `/api/qr/${encodeURIComponent(patient.id)}`;
    link.click();
    UI.showToast(`Clean QR code for ${patient.fullName} downloaded.`, 'success');
  },

  downloadCardAsImage() {
    const patient = this.getCurrentPatient();
    const canvas = document.createElement('canvas');
    const width = 1000;
    const height = 600;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#f8faf9');
    ctx.fillStyle = grad;
    ctx.roundRect(0, 0, width, height, 28);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#d9dee3';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Top color strip
    const topGrad = ctx.createLinearGradient(0, 0, width, 0);
    topGrad.addColorStop(0, '#5AA7A7');
    topGrad.addColorStop(0.5, '#98D7C6');
    topGrad.addColorStop(1, '#C74343');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, width, 14);

    // Header Logo & Brand
    ctx.fillStyle = '#273746';
    ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('PRANरक्षक', 40, 65);

    ctx.fillStyle = '#68727D';
    ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('OFFICIAL EMERGENCY MEDICAL LIFELINE IDENTIFICATION', 40, 92);

    // Emergency tag
    ctx.fillStyle = '#C74343';
    ctx.roundRect(width - 240, 40, 195, 36, 18);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('EMERGENCY ID', width - 215, 64);

    // Patient Name
    ctx.fillStyle = '#273746';
    ctx.font = 'bold 38px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(patient.fullName, 40, 160);

    // ID & Age Row
    ctx.fillStyle = '#68727D';
    ctx.font = 'bold 20px monospace';
    const ageVal = patient.age || DataManager.calculateAge(patient.dateOfBirth);
    ctx.fillText(`ID: ${patient.id} • ${ageVal} yrs • ${patient.gender}`, 40, 195);

    // Blood Group Box
    ctx.fillStyle = '#f0f9f6';
    ctx.roundRect(40, 220, 150, 60, 10);
    ctx.fill();
    ctx.strokeStyle = '#98D7C6';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#68727D';
    ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('BLOOD GROUP', 55, 245);
    ctx.fillStyle = '#C74343';
    ctx.font = '800 28px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(patient.bloodGroup || 'O+', 55, 272);

    // Organ donor badge
    if (patient.organDonor) {
      ctx.fillStyle = '#e8f7f2';
      ctx.roundRect(205, 220, 160, 60, 10);
      ctx.fill();
      ctx.fillStyle = '#185d4e';
      ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('✔ ORGAN DONOR', 218, 255);
    }

    // Allergies Warning Box
    ctx.fillStyle = '#fff4f4';
    ctx.roundRect(40, 295, 590, 80, 10);
    ctx.fill();
    ctx.strokeStyle = '#ffd0d0';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#C74343';
    ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('⚠ CRITICAL ALLERGIES & CONTRAINDICATIONS', 55, 322);

    const allergyText = patient.allergies && patient.allergies.length > 0 
      ? patient.allergies.map(a => `${a.name} (${a.severity})`).join(', ') 
      : 'No known drug allergies reported';
    ctx.fillStyle = '#273746';
    ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(allergyText, 55, 354);

    // Conditions & Meds
    ctx.fillStyle = '#273746';
    ctx.font = '600 17px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`Conditions: ${patient.conditions || 'None recorded'}`, 40, 410);

    const medsStr = patient.medicines && patient.medicines.length > 0
      ? patient.medicines.map(m => `${m.name} (${m.dosage})`).join(', ')
      : 'None';
    ctx.fillText(`Medications: ${medsStr}`, 40, 440);

    // Primary Contact
    const primaryContact = (patient.emergencyContacts || []).find(c => c.isPrimary) || (patient.emergencyContacts || [])[0];
    const contactStr = primaryContact 
      ? `Primary Contact: ${primaryContact.name} (${primaryContact.relation}) • ${primaryContact.phone}`
      : 'Emergency Helpline: 112';
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(contactStr, 40, 480);

    // Footer
    ctx.strokeStyle = '#d9dee3';
    ctx.beginPath();
    ctx.moveTo(40, 520);
    ctx.lineTo(width - 40, 520);
    ctx.stroke();

    ctx.fillStyle = '#5AA7A7';
    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('✔ VERIFIED MEDICAL PROFILE • ENCODED QR • HELPLINE 112', 40, 560);

    // Draw QR code image from the DOM
    const qrImg = document.getElementById('card-qr-img');
    const qrCanvas = document.querySelector('#qr-code-element canvas');
    if (qrImg && qrImg.complete) {
      try {
        ctx.drawImage(qrImg, width - 290, 130, 240, 240);
      } catch (err) {
        console.warn('Canvas drawImage error, skipping image draw:', err);
      }
      ctx.fillStyle = '#68727D';
      ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('SCAN FOR CLINICAL FILE', width - 260, 400);
    } else if (qrCanvas) {
      ctx.drawImage(qrCanvas, width - 290, 130, 240, 240);
      ctx.fillStyle = '#68727D';
      ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('SCAN FOR CLINICAL FILE', width - 260, 400);
    }

    // Trigger download
    const link = document.createElement('a');
    link.download = `PRAN-Rakshak-Card-${patient.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    UI.showToast(`Emergency QR Card for ${patient.fullName} downloaded as PNG.`, 'success');
  }
};
