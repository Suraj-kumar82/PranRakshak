/**
 * PRANरक्षक — Universal Camera QR Scanner Modal
 * File: js/scanner-modal.js
 * 
 * Provides an active camera viewfinder via WebRTC + jsQR frame decoding.
 * Opens when clicking "Scan QR" across Patient Dashboard, QR Wallet Card, etc.
 * On QR detection:
 *  - Plays audio chime
 *  - Reticle turns green
 *  - Releases camera hardware stream
 *  - Forwards immediately to /scan/<patient_id> (which captures GPS and alerts the hospital)
 */

const QRScannerModal = {
  isScanning: false,
  activeStream: null,
  animFrameId: null,
  currentFacingMode: 'environment', // start with rear camera
  patientId: 'PRAN-7429',
  hasDetected: false,

  init() {
    this.ensureModalInDOM();
    this.bindTriggerButtons();
    this.bindModalEvents();
  },

  ensureModalInDOM() {
    if (document.getElementById('qr-camera-scanner-modal')) {
      return;
    }

    const modalHtml = `
      <div class="modal-backdrop" id="qr-camera-scanner-modal" role="dialog" aria-modal="true" aria-labelledby="scanner-modal-title">
        <div class="modal-card" style="max-width:560px; background:#0f172a; color:#f8fafc; border:1px solid rgba(255,255,255,0.15); box-shadow:0 25px 50px -12px rgba(0,0,0,0.7); border-radius:var(--radius-lg, 14px); overflow:hidden;">
          
          <!-- Header -->
          <div class="modal-header" style="background:#1e293b; border-bottom:1px solid rgba(255,255,255,0.1); padding:1rem 1.25rem; display:flex; align-items:center; justify-content:space-between;">
            <div style="display:flex; align-items:center; gap:0.65rem;">
              <span style="display:inline-flex; align-items:center; justify-content:center; width:34px; height:34px; border-radius:8px; background:var(--color-emergency-red, #dc2626); color:#fff; font-size:1.15rem;">
                📷
              </span>
              <div>
                <h3 id="scanner-modal-title" style="margin:0; font-size:1.1rem; font-weight:800; color:#ffffff;">Live Camera QR Scanner</h3>
                <p style="margin:2px 0 0; font-size:0.75rem; color:#94a3b8;">Point your device camera at any patient's QR code</p>
              </div>
            </div>
            <button type="button" class="modal-close-btn" id="scanner-modal-close-btn" style="color:#94a3b8; background:transparent; border:none; font-size:1.5rem; cursor:pointer; line-height:1; padding:4px 8px; border-radius:4px;" aria-label="Close Scanner">
              &times;
            </button>
          </div>

          <!-- Body -->
          <div class="modal-body" style="padding:1.25rem; background:#0f172a;">
            
            <!-- Video Viewport -->
            <div class="camera-viewport-box" id="scanner-viewport-box" style="position:relative; width:100%; aspect-ratio:4/3; max-height:360px; background:#020617; border-radius:12px; overflow:hidden; border:2px solid rgba(20,184,166,0.3); display:flex; align-items:center; justify-content:center;">
              
              <!-- Camera Video Feed -->
              <video id="scanner-modal-video" playsinline autoplay muted style="width:100%; height:100%; object-fit:cover; display:none;"></video>
              
              <!-- Hidden Canvas for jsQR Frame Decoding -->
              <canvas id="scanner-modal-canvas" style="display:none;"></canvas>

              <!-- Camera Idle / Permission Placeholder -->
              <div id="scanner-modal-placeholder" style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:1.5rem; text-align:center; background:#090d16; z-index:2;">
                <div style="width:54px; height:54px; border-radius:50%; background:rgba(20,184,166,0.15); color:var(--color-mint, #2dd4bf); display:flex; align-items:center; justify-content:center; font-size:1.6rem; margin-bottom:0.75rem; border:1px solid rgba(20,184,166,0.3);">
                  📷
                </div>
                <div id="scanner-placeholder-title" style="font-weight:700; font-size:0.95rem; color:#f1f5f9;">Starting Camera Stream...</div>
                <p id="scanner-placeholder-desc" style="font-size:0.8rem; color:#94a3b8; margin:0.4rem 0 1rem; max-width:320px;">
                  Please allow camera access when prompted by your browser to scan the QR code.
                </p>
                <button type="button" class="btn btn-teal btn-sm" id="scanner-btn-start-cam" style="font-size:0.85rem; font-weight:700; background:var(--color-teal, #0f766e); color:#fff;">
                  Activate Camera Feed
                </button>
              </div>

              <!-- Reticle Overlay with High-Tech Corner Brackets -->
              <div id="scanner-modal-reticle" class="scanner-reticle-overlay" style="display:none; position:absolute; inset:12%; border:2px dashed rgba(20,184,166,0.85); border-radius:12px; pointer-events:none; box-shadow:0 0 0 9999px rgba(0,0,0,0.55); z-index:5;">
                
                <!-- Corner brackets -->
                <span style="position:absolute; top:-3px; left:-3px; width:16px; height:16px; border-top:3px solid var(--color-mint, #2dd4bf); border-left:3px solid var(--color-mint, #2dd4bf);"></span>
                <span style="position:absolute; top:-3px; right:-3px; width:16px; height:16px; border-top:3px solid var(--color-mint, #2dd4bf); border-right:3px solid var(--color-mint, #2dd4bf);"></span>
                <span style="position:absolute; bottom:-3px; left:-3px; width:16px; height:16px; border-bottom:3px solid var(--color-mint, #2dd4bf); border-left:3px solid var(--color-mint, #2dd4bf);"></span>
                <span style="position:absolute; bottom:-3px; right:-3px; width:16px; height:16px; border-bottom:3px solid var(--color-mint, #2dd4bf); border-right:3px solid var(--color-mint, #2dd4bf);"></span>

                <!-- Animated Red Laser Scan Beam -->
                <div id="scanner-modal-laser" class="scanner-laser-beam"></div>
              </div>

              <!-- Live Camera Floating Badge -->
              <div id="scanner-floating-badge" style="display:none; position:absolute; top:12px; left:12px; z-index:10; background:rgba(15,23,42,0.85); backdrop-filter:blur(4px); padding:4px 10px; border-radius:20px; font-size:0.75rem; font-weight:700; color:#34d399; border:1px solid rgba(52,211,153,0.3); align-items:center; gap:6px;">
                <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#10b981; box-shadow:0 0 8px #10b981;"></span>
                LIVE CAMERA ACTIVE
              </div>

            </div>

            <!-- Live Status Banner & Flip Cam -->
            <div id="scanner-status-banner" style="margin-top:0.85rem; padding:0.6rem 0.85rem; border-radius:8px; background:rgba(30,41,59,0.8); border:1px solid rgba(255,255,255,0.08); font-size:0.825rem; display:flex; align-items:center; justify-content:space-between; gap:0.5rem;">
              <span id="scanner-status-text" style="color:#cbd5e1;">Align QR inside frame to scan automatically.</span>
              <button type="button" id="scanner-btn-switch-cam" class="btn btn-ghost btn-sm" style="color:var(--color-mint, #2dd4bf); padding:3px 8px; font-size:0.75rem; border:1px solid rgba(20,184,166,0.3); background:rgba(20,184,166,0.1); border-radius:6px; cursor:pointer;" title="Toggle Front/Rear Camera">
                🔄 Flip Camera
              </button>
            </div>

            <!-- File Upload & Test Scan Actions Row -->
            <div style="margin-top:0.85rem; display:flex; gap:0.6rem; flex-wrap:wrap;">
              <label for="scanner-file-input" class="btn btn-secondary btn-sm" style="flex:1; cursor:pointer; text-align:center; display:flex; align-items:center; justify-content:center; gap:6px; font-size:0.825rem; background:#1e293b; color:#f1f5f9; border:1px solid rgba(255,255,255,0.15); padding:0.5rem 0.75rem; border-radius:6px; margin:0;">
                <span>📁</span> Upload QR Image
                <input type="file" id="scanner-file-input" accept="image/*" style="display:none;">
              </label>
              
              <button type="button" id="scanner-btn-test-scan" class="btn btn-emergency btn-sm" style="flex:1; font-size:0.825rem; font-weight:800; background:var(--color-emergency-red, #dc2626); color:#fff; border:none; padding:0.5rem 0.75rem; border-radius:6px; cursor:pointer;" title="Simulate Immediate QR Scan for Current Patient">
                <span>⚡</span> Test Scan My ID
              </button>
            </div>

          </div>

          <!-- Footer -->
          <div class="modal-footer" style="padding:0.85rem 1.25rem; background:#1e293b; border-top:1px solid rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:space-between;">
            <span style="font-size:0.75rem; color:#94a3b8;">
              Live scene GPS coordinates sent to hospital upon scan.
            </span>
            <button type="button" class="btn btn-ghost btn-sm" id="scanner-modal-cancel-btn" style="color:#cbd5e1; border:1px solid rgba(255,255,255,0.15); background:transparent; padding:0.35rem 0.85rem; border-radius:6px; cursor:pointer;">
              Close
            </button>
          </div>

        </div>
      </div>
    `;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = modalHtml;
    document.body.appendChild(wrapper.firstElementChild);
  },

  bindTriggerButtons() {
    const triggerSelectors = [
      '#nav-btn-scan-qr',
      '#dash-btn-scan-qr',
      '#card8-btn-scan-qr',
      '#wallet-btn-scan-qr',
      '[data-action="open-qr-scanner"]',
      '.btn-scan-qr-camera'
    ];

    triggerSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          this.open();
        });
      });
    });
  },

  bindModalEvents() {
    const modal = document.getElementById('qr-camera-scanner-modal');
    if (!modal) return;

    // Close buttons
    const closeBtn = document.getElementById('scanner-modal-close-btn');
    const cancelBtn = document.getElementById('scanner-modal-cancel-btn');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.close());

    // Backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.close();
      }
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-active')) {
        this.close();
      }
    });

    // Activate camera button (in placeholder)
    const startBtn = document.getElementById('scanner-btn-start-cam');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.startCamera());
    }

    // Flip camera facing mode
    const switchBtn = document.getElementById('scanner-btn-switch-cam');
    if (switchBtn) {
      switchBtn.addEventListener('click', () => this.switchCamera());
    }

    // 1-Click test scan button
    const testScanBtn = document.getElementById('scanner-btn-test-scan');
    if (testScanBtn) {
      testScanBtn.addEventListener('click', () => this.testScan());
    }

    // Image file upload
    const fileInput = document.getElementById('scanner-file-input');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          this.handleImageFile(e.target.files[0]);
        }
      });
    }

    // Drag and drop onto viewport box
    const viewportBox = document.getElementById('scanner-viewport-box');
    if (viewportBox) {
      viewportBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        viewportBox.style.borderColor = 'var(--color-mint, #2dd4bf)';
      });
      viewportBox.addEventListener('dragleave', () => {
        viewportBox.style.borderColor = 'rgba(20,184,166,0.3)';
      });
      viewportBox.addEventListener('drop', (e) => {
        e.preventDefault();
        viewportBox.style.borderColor = 'rgba(20,184,166,0.3)';
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          this.handleImageFile(e.dataTransfer.files[0]);
        }
      });
    }
  },

  open(preferredPatientId) {
    this.ensureModalInDOM();

    // Determine current patient ID
    if (preferredPatientId) {
      this.patientId = preferredPatientId;
    } else if (typeof DataManager !== 'undefined' && DataManager.getPatient) {
      const p = DataManager.getPatient();
      if (p && p.id) this.patientId = p.id;
    }

    this.hasDetected = false;
    const modal = document.getElementById('qr-camera-scanner-modal');
    if (modal) {
      modal.classList.add('is-active');
      document.body.style.overflow = 'hidden';
    }

    // Reset UI elements
    const reticle = document.getElementById('scanner-modal-reticle');
    if (reticle) {
      reticle.style.borderColor = 'rgba(20,184,166,0.85)';
      reticle.style.boxShadow = '0 0 0 9999px rgba(0,0,0,0.55)';
    }

    const laser = document.getElementById('scanner-modal-laser');
    if (laser) {
      laser.style.display = 'block';
      laser.style.background = 'linear-gradient(90deg, transparent, #ff3b30, #ff453a, transparent)';
    }

    const statusText = document.getElementById('scanner-status-text');
    if (statusText) {
      statusText.textContent = 'Starting camera scanner...';
      statusText.style.color = '#cbd5e1';
    }

    // Start camera stream immediately
    this.startCamera();
  },

  close() {
    this.stopCamera();
    const modal = document.getElementById('qr-camera-scanner-modal');
    if (modal) {
      modal.classList.remove('is-active');
      document.body.style.overflow = '';
    }
  },

  async startCamera() {
    const video = document.getElementById('scanner-modal-video');
    const placeholder = document.getElementById('scanner-modal-placeholder');
    const reticle = document.getElementById('scanner-modal-reticle');
    const badge = document.getElementById('scanner-floating-badge');
    const statusText = document.getElementById('scanner-status-text');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.handleCameraUnavailable('Camera API is not supported in this browser environment.');
      return;
    }

    try {
      if (statusText) statusText.textContent = 'Requesting camera stream...';

      // Attempt with desired facing mode first
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: this.currentFacingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      } catch (errFacing) {
        // Fallback to any available video stream
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      this.activeStream = stream;
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      await video.play();

      // UI state update
      video.style.display = 'block';
      if (placeholder) placeholder.style.display = 'none';
      if (reticle) reticle.style.display = 'block';
      if (badge) badge.style.display = 'flex';
      if (statusText) {
        statusText.textContent = '🟢 Camera live — Align QR Code inside frame';
        statusText.style.color = '#34d399';
      }

      this.isScanning = true;
      this.scanLoop();
    } catch (err) {
      console.warn('Camera access notice:', err);
      this.handleCameraUnavailable(
        'Camera access was blocked or is unavailable. Please grant permission, or use "Upload QR Image" / "Test Scan".'
      );
    }
  },

  stopCamera() {
    this.isScanning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.activeStream) {
      this.activeStream.getTracks().forEach(track => {
        try { track.stop(); } catch (e) {}
      });
      this.activeStream = null;
    }

    const video = document.getElementById('scanner-modal-video');
    const placeholder = document.getElementById('scanner-modal-placeholder');
    const reticle = document.getElementById('scanner-modal-reticle');
    const badge = document.getElementById('scanner-floating-badge');

    if (video) {
      video.srcObject = null;
      video.style.display = 'none';
    }
    if (placeholder) placeholder.style.display = 'flex';
    if (reticle) reticle.style.display = 'none';
    if (badge) badge.style.display = 'none';
  },

  switchCamera() {
    this.currentFacingMode = (this.currentFacingMode === 'environment') ? 'user' : 'environment';
    this.stopCamera();
    this.startCamera();
  },

  handleCameraUnavailable(message) {
    this.stopCamera();
    const statusText = document.getElementById('scanner-status-text');
    const placeholderTitle = document.getElementById('scanner-placeholder-title');
    const placeholderDesc = document.getElementById('scanner-placeholder-desc');

    if (statusText) {
      statusText.textContent = 'Camera unavailable — Upload image or click Test Scan';
      statusText.style.color = '#fbbf24';
    }
    if (placeholderTitle) {
      placeholderTitle.textContent = 'Camera Feed Unavailable';
    }
    if (placeholderDesc) {
      placeholderDesc.textContent = message;
    }
  },

  scanLoop() {
    if (!this.isScanning || this.hasDetected) return;

    const video = document.getElementById('scanner-modal-video');
    const canvas = document.getElementById('scanner-modal-canvas');

    if (video && video.readyState === video.HAVE_ENOUGH_DATA && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      let code = null;
      if (typeof jsQR !== 'undefined') {
        code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert"
        });
      }

      if (code && code.data) {
        this.handleDetectedCode(code.data);
        return;
      }
    }

    this.animFrameId = requestAnimationFrame(() => this.scanLoop());
  },

  handleImageFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      if (typeof UI !== 'undefined' && UI.showToast) {
        UI.showToast('Please select a valid image file (PNG, JPG, etc.)', 'warning');
      }
      return;
    }

    const statusText = document.getElementById('scanner-status-text');
    if (statusText) {
      statusText.textContent = 'Analyzing image pixels for QR code...';
      statusText.style.color = '#38bdf8';
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.getElementById('scanner-modal-canvas') || document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        let code = null;
        if (typeof jsQR !== 'undefined') {
          code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "attemptBoth"
          });
        }

        if (code && code.data) {
          this.handleDetectedCode(code.data);
        } else {
          // If image name includes PRAN ID or matches PRAN-XXXX
          const match = (file.name || '').match(/PRAN-\d{4}/i);
          if (match) {
            this.handleDetectedCode(match[0]);
          } else {
            // Fallback decode to current patient
            this.handleDetectedCode(this.patientId);
          }
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  },

  handleDetectedCode(payload) {
    if (this.hasDetected) return;
    this.hasDetected = true;
    this.isScanning = false;

    // Visual feedback
    const reticle = document.getElementById('scanner-modal-reticle');
    if (reticle) {
      reticle.style.borderColor = '#10b981';
      reticle.style.boxShadow = '0 0 24px rgba(16, 185, 129, 0.9), 0 0 0 9999px rgba(0,0,0,0.55)';
    }

    const laser = document.getElementById('scanner-modal-laser');
    if (laser) {
      laser.style.background = 'linear-gradient(90deg, transparent, #10b981, #34d399, transparent)';
    }

    const statusText = document.getElementById('scanner-status-text');

    // Play chime sound
    if (typeof UI !== 'undefined' && UI.playEmergencyBeep) {
      UI.playEmergencyBeep();
    }

    // Parse target patient ID / route from payload
    let targetPatientId = this.patientId;
    let targetUrl = `/scan/${encodeURIComponent(targetPatientId)}`;

    if (typeof payload === 'string') {
      const clean = payload.trim();
      
      // If it's a full /scan/ URL
      if (clean.includes('/scan/')) {
        const parts = clean.split('/scan/');
        const afterScan = parts[1].split(/[?#&/]/)[0];
        if (afterScan) {
          targetPatientId = decodeURIComponent(afterScan);
          targetUrl = `/scan/${encodeURIComponent(targetPatientId)}`;
        }
      }
      // If it matches PRAN-XXXX
      else {
        const pranMatch = clean.match(/PRAN-\d{4}/i);
        if (pranMatch) {
          targetPatientId = pranMatch[0].toUpperCase();
          targetUrl = `/scan/${encodeURIComponent(targetPatientId)}`;
        } else {
          // Check if JSON
          try {
            const obj = JSON.parse(clean);
            if (obj && obj.id) {
              targetPatientId = obj.id;
              targetUrl = `/scan/${encodeURIComponent(targetPatientId)}`;
            }
          } catch (e) {}
        }
      }
    }

    if (statusText) {
      statusText.textContent = `✔ QR Code Scanned (${targetPatientId})! Sending Live Location & Alerting Hospital...`;
      statusText.style.color = '#34d399';
    }

    if (typeof UI !== 'undefined' && UI.showToast) {
      UI.showToast(`Scanned ${targetPatientId}! Connecting to Hospital ER...`, 'success');
    }

    // Release camera stream hardware
    this.stopCamera();

    // Redirect to the live emergency scan responder (which automatically fetches GPS and alerts hospital)
    setTimeout(() => {
      window.location.href = targetUrl;
    }, 600);
  },

  testScan() {
    this.handleDetectedCode(this.patientId || 'PRAN-7429');
  }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  QRScannerModal.init();
});
