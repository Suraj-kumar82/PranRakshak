/**
 * PRANरक्षक — Emergency Contacts CRUD Management
 * Add, edit, remove emergency contacts with primary designation.
 */

const ContactsManager = {
  activeContactId: null,

  init() {
    this.renderContacts();
    this.bindEvents();
  },

  renderContacts() {
    const patient = DataManager.getPatient();
    const list = patient.emergencyContacts || [];
    const container = document.getElementById('contacts-list-container');
    if (!container) return;

    if (list.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding: 2.5rem; background:#fff; border-radius:var(--radius-lg); border:1px dashed var(--border-light);">
          <div style="color:var(--color-cool-gray); margin-bottom:1rem;">${Icons.users}</div>
          <h3 style="margin-bottom:0.5rem;">No Emergency Contacts Added</h3>
          <p style="margin-bottom:1.5rem;">Add trusted family members or physicians who will be immediately contacted during emergency rescue.</p>
          <button class="btn btn-primary" onclick="ContactsManager.openAddModal()">Add First Contact</button>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(c => `
      <div class="card ${c.isPrimary ? 'card-contacts-summary' : ''}" style="margin-bottom:1rem;">
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem;">
          <div style="display:flex; align-items:center; gap:1rem;">
            <div class="card-icon-badge" style="background:${c.isPrimary ? 'var(--color-teal-subtle)' : 'var(--color-silver-light)'}; color:${c.isPrimary ? 'var(--color-teal-dark)' : 'var(--color-deep-slate)'};">
              ${Icons.user}
            </div>
            <div>
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <h4 style="margin:0; font-size:1.1rem;">${c.name}</h4>
                ${c.isPrimary ? `<span class="badge badge-teal">PRIMARY</span>` : ''}
                <span class="badge badge-dusty" style="font-size:0.75rem;">${c.relation}</span>
              </div>
              <div style="color:var(--color-cool-gray); font-size:0.9rem; margin-top:3px; display:flex; align-items:center; gap:1rem; flex-wrap:wrap;">
                <span><strong>Phone:</strong> <a href="tel:${c.phone}" style="color:var(--color-deep-slate); font-weight:600;">${c.phone}</a></span>
                ${c.alternatePhone ? `<span><strong>Alt:</strong> <a href="tel:${c.alternatePhone}">${c.alternatePhone}</a></span>` : ''}
              </div>
            </div>
          </div>

          <div style="display:flex; align-items:center; gap:0.5rem;">
            ${!c.isPrimary ? `
              <button class="btn btn-ghost btn-sm" onclick="ContactsManager.setPrimary('${c.id}')" title="Set as Primary Contact">
                Make Primary
              </button>
            ` : ''}
            <a href="tel:${c.phone}" class="btn btn-primary btn-sm" title="Test Call">
              ${Icons.phoneCall} Call
            </a>
            <button class="btn btn-secondary btn-sm" onclick="ContactsManager.openEditModal('${c.id}')" title="Edit Contact">
              ${Icons.edit}
            </button>
            <button class="btn btn-ghost btn-sm" onclick="ContactsManager.deleteContact('${c.id}')" style="color:var(--color-emergency-red);" title="Delete Contact">
              ${Icons.trash}
            </button>
          </div>
        </div>
      </div>
    `).join('');

    renderIcons(container);
  },

  bindEvents() {
    const addBtn = document.getElementById('btn-open-add-contact');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.openAddModal());
    }

    const form = document.getElementById('contact-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveContact();
      });
    }
  },

  openAddModal() {
    this.activeContactId = null;
    const titleEl = document.getElementById('contact-modal-title');
    if (titleEl) titleEl.textContent = 'Add Emergency Contact';

    document.getElementById('contact-name').value = '';
    document.getElementById('contact-relation').value = 'Spouse';
    document.getElementById('contact-phone').value = '';
    document.getElementById('contact-alt-phone').value = '';
    document.getElementById('contact-is-primary').checked = false;

    UI.openModal('contact-modal');
  },

  openEditModal(id) {
    const patient = DataManager.getPatient();
    const contact = (patient.emergencyContacts || []).find(c => c.id === id);
    if (!contact) return;

    this.activeContactId = id;
    const titleEl = document.getElementById('contact-modal-title');
    if (titleEl) titleEl.textContent = 'Edit Emergency Contact';

    document.getElementById('contact-name').value = contact.name || '';
    document.getElementById('contact-relation').value = contact.relation || 'Spouse';
    document.getElementById('contact-phone').value = contact.phone || '';
    document.getElementById('contact-alt-phone').value = contact.alternatePhone || '';
    document.getElementById('contact-is-primary').checked = !!contact.isPrimary;

    UI.openModal('contact-modal');
  },

  saveContact() {
    const name = document.getElementById('contact-name').value.trim();
    const relation = document.getElementById('contact-relation').value;
    const phone = document.getElementById('contact-phone').value.trim();
    const altPhone = document.getElementById('contact-alt-phone').value.trim();
    const isPrimary = document.getElementById('contact-is-primary').checked;

    if (!name || !phone) {
      UI.showToast('Name and phone number are required.', 'error');
      return;
    }

    const patient = DataManager.getPatient();
    if (!patient.emergencyContacts) patient.emergencyContacts = [];

    if (this.activeContactId) {
      // Edit
      const idx = patient.emergencyContacts.findIndex(c => c.id === this.activeContactId);
      if (idx !== -1) {
        patient.emergencyContacts[idx].name = name;
        patient.emergencyContacts[idx].relation = relation;
        patient.emergencyContacts[idx].phone = phone;
        patient.emergencyContacts[idx].alternatePhone = altPhone;
        if (isPrimary) {
          patient.emergencyContacts.forEach(c => c.isPrimary = false);
          patient.emergencyContacts[idx].isPrimary = true;
        }
      }
    } else {
      // Add
      if (isPrimary || patient.emergencyContacts.length === 0) {
        patient.emergencyContacts.forEach(c => c.isPrimary = false);
      }
      const newContact = {
        id: 'c_' + Date.now(),
        name,
        relation,
        phone,
        alternatePhone: altPhone,
        isPrimary: isPrimary || patient.emergencyContacts.length === 0
      };
      patient.emergencyContacts.push(newContact);
    }

    DataManager.savePatient(patient);
    UI.closeModal('contact-modal');
    this.renderContacts();
    UI.showToast('Emergency contact saved successfully.', 'success');
  },

  setPrimary(id) {
    const patient = DataManager.getPatient();
    (patient.emergencyContacts || []).forEach(c => {
      c.isPrimary = (c.id === id);
    });
    DataManager.savePatient(patient);
    this.renderContacts();
    UI.showToast('Primary emergency contact updated.', 'success');
  },

  deleteContact(id) {
    if (!confirm('Are you sure you want to remove this emergency contact?')) return;
    const patient = DataManager.getPatient();
    patient.emergencyContacts = (patient.emergencyContacts || []).filter(c => c.id !== id);
    // If deleted one was primary and others exist, set first as primary
    if (patient.emergencyContacts.length > 0 && !patient.emergencyContacts.some(c => c.isPrimary)) {
      patient.emergencyContacts[0].isPrimary = true;
    }
    DataManager.savePatient(patient);
    this.renderContacts();
    UI.showToast('Emergency contact removed.', 'info');
  }
};
