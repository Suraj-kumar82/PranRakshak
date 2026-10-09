/**
 * PRANरक्षक — Public Emergency & Ambulance Assistance Workflow
 * Handles Option A (Standard Emergency Request) & Option B (Extreme Emergency 112)
 * Browser Geolocation API with graceful fallback, speech readout, and tracking bridge.
 */

const EmergencyAssistManager = {
  currentCoordinates: null,

  init() {
    this.checkPrepopulatedPatient();
    this.bindOptionAEvents();
    this.bindOptionBEvents();
  },

  checkPrepopulatedPatient() {
    // If arriving from emergency profile or QR scan with ?patientId=PRAN-7429
    const params = new URLSearchParams(window.location.search);
    const patientId = params.get('patientId') || params.get('id');
    if (patientId) {
      const patient = DataManager.getPatient();
      const patientInput = document.getElementById('emg-patient-id');
      const patientNameInput = document.getElementById('emg-patient-name');
      if (patientInput) patientInput.value = patientId;
      if (patientNameInput && patient && patient.id === patientId) {
        patientNameInput.value = patient.fullName;
      }
    }
  },

  bindOptionAEvents() {
    // Geolocation detection button
    const detectGpsBtn = document.getElementById('btn-detect-gps');
    if (detectGpsBtn) {
      detectGpsBtn.addEventListener('click', () => this.detectLocation());
    }

    // Form submission
    const form = document.getElementById('emergency-request-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitEmergencyRequest();
      });
    }
  },

  detectLocation() {
    const locInput = document.getElementById('emg-location');
    const statusText = document.getElementById('gps-status-text');

    if (!navigator.geolocation) {
      UI.showToast('Geolocation is not supported by your browser. Please type location manually.', 'warning');
      return;
    }

    if (statusText) statusText.textContent = 'Acquiring high-accuracy GPS coordinates...';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        this.currentCoordinates = { lat, lng };

        // Readable address simulation with coordinates
        const detectedAddress = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)} (Near Current Location)`;
        if (locInput) locInput.value = detectedAddress;
        if (statusText) {
          statusText.innerHTML = `<span style="color:var(--color-sage-dark); font-weight:700;">✔ GPS Locked:</span> ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        }
        UI.showToast('Current GPS coordinates detected accurately.', 'success');

        // Update Option B speech box too
        this.updateSpeechHelper(lat, lng);
      },
      (error) => {
        console.warn('Geolocation error:', error);
        let msg = 'Location access denied or unavailable. Please enter landmark manually below.';
        if (error.code === error.TIMEOUT) msg = 'Location request timed out. Please enter landmark manually.';
        if (statusText) statusText.textContent = msg;
        UI.showToast(msg, 'warning');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  },

  updateSpeechHelper(lat, lng) {
    const speechEl = document.getElementById('extreme-speech-script');
    if (speechEl) {
      speechEl.innerHTML = `<strong>Tell 112 Operator:</strong> "Medical emergency at Latitude ${lat.toFixed(4)}, Longitude ${lng.toFixed(4)}"`;
    }
  },

  submitEmergencyRequest() {
    const typeSelect = document.getElementById('emg-incident-type');
    const locationInput = document.getElementById('emg-location');
    const phoneInput = document.getElementById('emg-callback-phone');
    const nameInput = document.getElementById('emg-patient-name');
    const idInput = document.getElementById('emg-patient-id');
    const descInput = document.getElementById('emg-description');

    const incidentType = typeSelect ? typeSelect.value : 'Medical Emergency';
    const location = locationInput ? locationInput.value.trim() : '';
    const callbackPhone = phoneInput ? phoneInput.value.trim() : '';

    if (!location) {
      UI.showToast('Please enter the incident location or detect GPS.', 'error');
      if (locationInput) locationInput.focus();
      return;
    }

    if (!callbackPhone) {
      UI.showToast('Callback phone number is required so paramedics can contact you.', 'error');
      if (phoneInput) phoneInput.focus();
      return;
    }

    // Generate unique Request ID
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const requestId = `EMG-${randomNum}`;

    const newRequest = {
      id: requestId,
      incidentType,
      patientName: nameInput ? nameInput.value.trim() || 'Unidentified Patient' : 'Unidentified Patient',
      patientId: idInput ? idInput.value.trim() : null,
      location,
      coordinates: this.currentCoordinates || { lat: 28.6139, lng: 77.2090 },
      callbackPhone,
      description: descInput ? descInput.value.trim() : 'Urgent medical assistance requested.',
      status: 'Request Submitted',
      submittedAt: new Date().toISOString(),
      assignedHospital: 'City General Trauma Center',
      assignedAmbulance: 'Awaiting Provider Allocation',
      paramedicContact: 'Central Dispatch Desk',
      estimatedArrivalMins: 8,
      priority: incidentType.toLowerCase().includes('cardiac') || incidentType.toLowerCase().includes('accident') ? 'HIGH' : 'STANDARD'
    };

    // Save
    DataManager.saveEmergencyRequest(newRequest);
    UI.playEmergencyBeep();

    UI.showToast(`Emergency request ${requestId} created! Connecting to nearest trauma dispatch...`, 'success', 'Request Submitted');

    // Redirect to tracking page
    setTimeout(() => {
      window.location.href = `ambulance-tracking.html?id=${requestId}`;
    }, 1200);
  },

  bindOptionBEvents() {
    // Rapid 1-Tap SOS dispatch from Option B
    const rapidSosBtn = document.getElementById('btn-rapid-sos');
    if (rapidSosBtn) {
      rapidSosBtn.addEventListener('click', () => {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const requestId = `EMG-${randomNum}`;

        const extremeRequest = {
          id: requestId,
          incidentType: 'EXTREME EMERGENCY — Critical Life-Threatening Crisis',
          patientName: 'CRITICAL EMERGENCY PATIENT',
          patientId: null,
          location: 'Auto-detected via Rapid SOS (Near GPS Fix)',
          coordinates: this.currentCoordinates || { lat: 28.6315, lng: 77.2167 },
          callbackPhone: '112 Relayed Emergency',
          description: 'Life-threatening condition. Highest priority ALS dispatch requested immediately.',
          status: 'Request Submitted',
          submittedAt: new Date().toISOString(),
          assignedHospital: 'City General Trauma Center (Apex Level-1)',
          assignedAmbulance: 'LifeCare ALS Rapid Response #14',
          paramedicContact: 'Emergency SOS Hotline',
          estimatedArrivalMins: 4,
          priority: 'CRITICAL'
        };

        DataManager.saveEmergencyRequest(extremeRequest);
        UI.playEmergencyBeep();
        UI.showToast('Priority Rapid ALS ambulance ticket dispatched!', 'error', 'SOS BEACON SENT');

        setTimeout(() => {
          window.location.href = `ambulance-tracking.html?id=${requestId}`;
        }, 1000);
      });
    }
  }
};
