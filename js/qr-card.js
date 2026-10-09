/**
 * PRANरक्षक — Digital Medical QR Card Generator & Exporter
 * Generates high-res QR code, allows PNG download via HTML5 Canvas, wallet print, and link copy.
 */

const QRCardManager = {
  qrInstance: null,

  init() {
    this.renderCardDetails();
    this.generateQRCode();
    this.bindEvents();
  },

  getEmergencyUrl(patientId) {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const dir = pathname.substring(0, pathname.lastIndexOf('/'));
    // Works both with live server and local file structure
    return `${origin}${dir}/emergency.html?id=${encodeURIComponent(patientId)}`;
  },

  renderCardDetails() {
    const patient = DataManager.getPatient();
    if (!patient) return;

    const setEl = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text || '--';
    };

    setEl('card-patient-name', patient.fullName);
    setEl('card-patient-id', patient.id);
    setEl('card-blood-type', patient.bloodGroup || 'O+');
    
    // Allergies snippet
    const allergyBox = document.getElementById('card-allergies-summary');
    if (allergyBox) {
      if (patient.allergies && patient.allergies.length > 0) {
        allergyBox.innerHTML = `<strong>CRITICAL ALLERGIES:</strong> ` + 
          patient.allergies.map(a => `${a.name} (${a.severity})`).join(', ');
        allergyBox.style.display = 'block';
      } else {
        allergyBox.innerHTML = `<strong>CRITICAL ALLERGIES:</strong> No known drug allergies`;
        allergyBox.style.display = 'block';
      }
    }

    // Primary emergency contact
    const primaryContact = (patient.emergencyContacts || []).find(c => c.isPrimary) || (patient.emergencyContacts || [])[0];
    const contactEl = document.getElementById('card-emergency-contact');
    if (contactEl) {
      if (primaryContact) {
        contactEl.textContent = `${primaryContact.name} (${primaryContact.relation}): ${primaryContact.phone}`;
      } else {
        contactEl.textContent = 'Contact: Not Configured';
      }
    }
  },

  generateQRCode() {
    const patient = DataManager.getPatient();
    const qrContainer = document.getElementById('qr-code-element');
    if (!qrContainer) return;

    qrContainer.innerHTML = '';
    const emergencyUrl = this.getEmergencyUrl(patient.id);

    try {
      this.qrInstance = new QRCode(qrContainer, {
        text: emergencyUrl,
        width: 130,
        height: 130,
        colorDark: "#273746",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M
      });
    } catch (e) {
      console.error('QR generation error:', e);
      qrContainer.innerHTML = `<div style="font-size:0.75rem; color:red; padding:10px;">QR Error</div>`;
    }

    // Set preview URL in link display if available
    const urlDisplay = document.getElementById('emergency-url-display');
    if (urlDisplay) {
      urlDisplay.textContent = emergencyUrl;
    }
  },

  bindEvents() {
    // Copy link
    const copyBtn = document.getElementById('btn-copy-qr-link');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const patient = DataManager.getPatient();
        const url = this.getEmergencyUrl(patient.id);
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

    // Download PNG card
    const downloadBtn = document.getElementById('btn-download-qr-card');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => this.downloadCardAsImage());
    }

    // Refresh QR
    const refreshBtn = document.getElementById('btn-refresh-qr');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.generateQRCode();
        UI.showToast('Emergency QR Code regenerated.', 'info');
      });
    }
  },

  downloadCardAsImage() {
    const patient = DataManager.getPatient();
    const cardEl = document.querySelector('.medical-qr-card');
    if (!cardEl) return;

    // Render using an offscreen canvas for high-DPI export
    const canvas = document.createElement('canvas');
    const width = 1000;
    const height = 580;
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
    ctx.fillText('PRANरक्षक', 40, 70);

    ctx.fillStyle = '#68727D';
    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('SMART MEDICAL EMERGENCY IDENTIFICATION', 40, 98);

    // Emergency tag
    ctx.fillStyle = '#C74343';
    ctx.roundRect(width - 240, 45, 195, 36, 18);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('EMERGENCY ID', width - 215, 69);

    // Patient Name
    ctx.fillStyle = '#273746';
    ctx.font = 'bold 42px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(patient.fullName, 40, 180);

    // ID
    ctx.fillStyle = '#68727D';
    ctx.font = 'bold 22px monospace';
    ctx.fillText(`ID: ${patient.id}`, 40, 220);

    // Blood Group Box
    ctx.fillStyle = '#f0f9f6';
    ctx.roundRect(40, 250, 160, 60, 10);
    ctx.fill();
    ctx.strokeStyle = '#98D7C6';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#68727D';
    ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('BLOOD GROUP', 55, 275);
    ctx.fillStyle = '#C74343';
    ctx.font = '800 28px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(patient.bloodGroup || 'O+', 55, 302);

    // Allergies Box
    ctx.fillStyle = '#fff4f4';
    ctx.roundRect(40, 330, 560, 90, 10);
    ctx.fill();
    ctx.strokeStyle = '#ffd0d0';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#C74343';
    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('CRITICAL ALLERGIES & WARNINGS', 55, 360);

    const allergyText = patient.allergies && patient.allergies.length > 0 
      ? patient.allergies.map(a => `${a.name} (${a.severity})`).join(', ') 
      : 'No known drug allergies';
    ctx.fillStyle = '#273746';
    ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(allergyText, 55, 395);

    // Primary Contact
    const primaryContact = (patient.emergencyContacts || []).find(c => c.isPrimary) || (patient.emergencyContacts || [])[0];
    const contactStr = primaryContact 
      ? `Emergency Contact: ${primaryContact.name} (${primaryContact.relation}) • ${primaryContact.phone}`
      : 'Emergency Contact: 112 National Helpline';
    ctx.fillStyle = '#273746';
    ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(contactStr, 40, 460);

    // Footer Security Notice
    ctx.strokeStyle = '#d9dee3';
    ctx.beginPath();
    ctx.moveTo(40, 500);
    ctx.lineTo(width - 40, 500);
    ctx.stroke();

    ctx.fillStyle = '#5AA7A7';
    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('✔ VERIFIED MEDICAL PROFILE • SCAN QR IN MEDICAL CRISIS', 40, 538);

    // Draw QR code image from the DOM canvas
    const qrCanvas = document.querySelector('#qr-code-element canvas');
    if (qrCanvas) {
      ctx.drawImage(qrCanvas, width - 290, 140, 240, 240);
      ctx.fillStyle = '#68727D';
      ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('SCAN FOR LIVE PROFILE', width - 250, 410);
    }

    // Trigger download
    const link = document.createElement('a');
    link.download = `PRAN-Rakshak-Card-${patient.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    UI.showToast('Emergency QR Wallet Card downloaded as high-res PNG image.', 'success');
  }
};
