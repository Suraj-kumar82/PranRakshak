/**
 * PRANरक्षक — Hospital & Ambulance Provider Triage Console
 * Allows emergency hospital dispatchers to review incoming incidents, accept cases,
 * allocate ALS/BLS ambulances, and broadcast live status updates.
 */

const ProviderManager = {
  init() {
    this.renderRequestsTable();
    this.renderFleetStatus();
    this.bindEvents();
  },

  renderRequestsTable() {
    const requests = DataManager.getEmergencyRequests();
    const tbody = document.getElementById('provider-requests-tbody');
    if (!tbody) return;

    if (requests.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--color-cool-gray);">No incoming emergency tickets active.</td></tr>`;
      return;
    }

    tbody.innerHTML = requests.map(r => {
      let badgeClass = 'badge-dusty';
      if (r.status === 'Ambulance Dispatched') badgeClass = 'badge-emergency';
      else if (r.status === 'Accepted') badgeClass = 'badge-teal';
      else if (r.status === 'Completed') badgeClass = 'badge-sage';

      return `
        <tr style="border-bottom:1px solid var(--border-light);">
          <td style="padding:1rem; font-weight:700; font-family:var(--font-mono);">${r.id}</td>
          <td style="padding:1rem;">
            <div style="font-weight:700; color:var(--color-deep-slate);">${r.incidentType}</div>
            <div style="font-size:0.8rem; color:var(--color-cool-gray);">${r.description || ''}</div>
          </td>
          <td style="padding:1rem; font-size:0.875rem;">
            <div>${r.location}</div>
            <span style="font-size:0.75rem; color:var(--color-teal-dark);">GPS Lat: ${r.coordinates?.lat?.toFixed(3) || '28.61'}, Lng: ${r.coordinates?.lng?.toFixed(3) || '77.21'}</span>
          </td>
          <td style="padding:1rem; font-size:0.875rem;">
            <div>${r.patientName}</div>
            <a href="tel:${r.callbackPhone}" style="font-size:0.8rem; color:var(--color-deep-slate);">${r.callbackPhone}</a>
          </td>
          <td style="padding:1rem;"><span class="badge ${badgeClass}">${r.status}</span></td>
          <td style="padding:1rem; font-size:0.85rem; color:var(--color-cool-gray);">${UI.timeAgo(r.submittedAt)}</td>
          <td style="padding:1rem; text-align:right;">
            <div style="display:flex; gap:0.4rem; justify-content:flex-end;">
              ${r.status === 'Request Submitted' || r.status === 'Awaiting Response' ? `
                <button class="btn btn-primary btn-sm" onclick="ProviderManager.acceptCase('${r.id}')">Accept Case</button>
              ` : ''}
              ${r.status === 'Accepted' ? `
                <button class="btn btn-emergency btn-sm" onclick="ProviderManager.dispatchAmbulance('${r.id}')">Dispatch Unit</button>
              ` : ''}
              ${r.status === 'Ambulance Dispatched' ? `
                <button class="btn btn-mint btn-sm" onclick="ProviderManager.markCompleted('${r.id}')">Mark Reached</button>
              ` : ''}
              <a href="ambulance-tracking.html?id=${r.id}" target="_blank" class="btn btn-secondary btn-sm" title="View Patient Tracking">
                ${Icons.externalLink}
              </a>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    renderIcons(tbody);
  },

  renderFleetStatus() {
    const fleet = DataManager.getAmbulanceFleet();
    const container = document.getElementById('provider-fleet-container');
    if (!container) return;

    container.innerHTML = fleet.map(unit => `
      <div style="padding:0.85rem; background:var(--color-off-white); border:1px solid var(--border-light); border-radius:var(--radius-md); margin-bottom:0.65rem; display:flex; align-items:center; justify-content:space-between;">
        <div>
          <div style="font-weight:700; font-size:0.95rem; color:var(--color-deep-slate);">${unit.name}</div>
          <div style="font-size:0.8rem; color:var(--color-cool-gray);">${unit.type} • Reg: ${unit.regNo}</div>
          <div style="font-size:0.8rem; color:var(--color-teal-dark);">Driver: ${unit.driver} (${unit.phone})</div>
        </div>
        <span class="badge ${unit.status === 'Available' ? 'badge-sage' : 'badge-dusty'}">${unit.status}</span>
      </div>
    `).join('');
  },

  acceptCase(id) {
    const updated = DataManager.updateRequestStatus(id, 'Accepted', {
      assignedHospital: 'City General Trauma Center',
      assignedAmbulance: 'LifeCare ALS #14 (Assigned)'
    });
    if (updated) {
      UI.showToast(`Emergency case ${id} accepted. Preparing ambulance crew.`, 'success', 'Case Accepted');
      this.renderRequestsTable();
    }
  },

  dispatchAmbulance(id) {
    const updated = DataManager.updateRequestStatus(id, 'Ambulance Dispatched', {
      assignedAmbulance: 'LifeCare ALS #14 (En Route)',
      paramedicContact: 'Officer Ramesh Kumar (+91 98110 99887)',
      estimatedArrivalMins: 5
    });
    if (updated) {
      UI.playEmergencyBeep();
      UI.showToast(`Ambulance unit dispatched for ${id}! Tracking broadcast active.`, 'error', 'Unit Dispatched');
      this.renderRequestsTable();
    }
  },

  markCompleted(id) {
    const updated = DataManager.updateRequestStatus(id, 'Completed', {
      estimatedArrivalMins: 0
    });
    if (updated) {
      UI.showToast(`Case ${id} marked as Reached Scene / Completed.`, 'success');
      this.renderRequestsTable();
    }
  },

  bindEvents() {
    const refreshBtn = document.getElementById('btn-provider-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.renderRequestsTable();
        UI.showToast('Triage queue refreshed.', 'info');
      });
    }
  }
};
