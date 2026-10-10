/**
 * PRANरक्षक — Data Store & Demo State Layer
 * Provides robust localStorage persistence with pre-configured seed data.
 * Designed for hackathon demonstration with complete CRUD operations.
 */

const DEFAULT_PATIENT = {
  id: "PRAN-7429",
  fullName: "Aarav Sharma",
  email: "aarav.sharma@example.com",
  phone: "+91 98765 43210",
  dateOfBirth: "1996-04-15",
  gender: "Male",
  address: "B-402, Green Valley Heights, Sector 62, Noida, UP, 201309",
  bloodGroup: "B+",
  organDonor: true,
  allergies: [
    { id: "a1", name: "Penicillin", severity: "Severe" },
    { id: "a2", name: "Peanuts", severity: "Moderate" }
  ],
  medicines: [
    { id: "m1", name: "Metformin", dosage: "500 mg", frequency: "Twice daily after food", notes: "Type-2 glycemic control" },
    { id: "m2", name: "Levocetirizine", dosage: "5 mg", frequency: "SOS (Night)", notes: "Seasonal pollen allergy" }
  ],
  conditions: "Type 2 Diabetes Mellitus, Mild Exercise-induced Asthma",
  medicalHistory: "Laparoscopic Appendectomy (2021). No cardiac complications or stent implants.",
  emergencyNotes: "Carries emergency salbutamol inhaler in laptop bag. In case of sudden collapse, check capillary blood glucose immediately before administering IV saline.",
  emergencyContacts: [
    {
      id: "c1",
      name: "Priya Sharma",
      relation: "Spouse",
      phone: "+91 98765 43210",
      alternatePhone: "+91 98765 43219",
      isPrimary: true
    },
    {
      id: "c2",
      name: "Vikram Sharma",
      relation: "Brother",
      phone: "+91 98112 34567",
      alternatePhone: "",
      isPrimary: false
    }
  ],
  age: 30,
  lifestyleHabits: "Occasional Alcohol (Social), Non-smoker",
  heightCm: 175,
  weightKg: 72,
  bmi: "23.5 (Normal)",
  mdr: "None / Negative for Drug-Resistant Pathogens",
  previousHistory: "Treated for Acute Viral Bronchitis (Aug 2025). Full recovery.",
  surgicalHistory: "Laparoscopic Appendectomy (August 2021).",
  transplantHistory: "None",
  drugToxicity: "Mild adverse rash to Ciprofloxacin (2022)",
  medicalInsurance: "Star Health Comprehensive - Policy #SH-884102 - TPA Cashless Active",
  qrCardIssued: true,
  lastUpdated: new Date().toISOString()
};

const DEMO_PATIENTS = {
  "PRAN-7429": DEFAULT_PATIENT,
  "PRAN-3108": {
    id: "PRAN-3108",
    fullName: "Meera Patel",
    email: "meera.patel@example.com",
    phone: "+91 98234 56780",
    dateOfBirth: "1978-08-12",
    age: 48,
    gender: "Female",
    address: "Flat 12B, Regency Heights, Civil Lines, Jaipur, RJ",
    bloodGroup: "O-",
    organDonor: true,
    allergies: [
      { id: "a1", name: "Aspirin & NSAIDs", severity: "Severe" },
      { id: "a2", name: "Sulfa Antibiotics", severity: "Severe" }
    ],
    medicines: [
      { id: "m1", name: "Amlodipine", dosage: "5 mg", frequency: "Once daily (Morning)", notes: "Hypertension regulation" },
      { id: "m2", name: "Atorvastatin", dosage: "20 mg", frequency: "Bedtime", notes: "Lipid management" },
      { id: "m3", name: "Sorbitrate", dosage: "5 mg", frequency: "Sublingual SOS", notes: "Angina chest pain emergency" }
    ],
    conditions: "Hypertension, Coronary Artery Disease (CAD)",
    medicalHistory: "Laparoscopic Cholecystectomy (2019). Strict contraindication to Aspirin / NSAID therapy.",
    emergencyNotes: "CRITICAL: Severe Anaphylactic reaction to Aspirin & Sulfa. In acute chest pain, administer sublingual Sorbitrate. Do NOT administer Disprin/Aspirin.",
    emergencyContacts: [
      { id: "c1", name: "Rajesh Patel", relation: "Husband", phone: "+91 98234 56789", alternatePhone: "+91 98234 56799", isPrimary: true },
      { id: "c2", name: "Dr. Ananya Patel", relation: "Daughter (Cardiologist)", phone: "+91 98119 88776", alternatePhone: "", isPrimary: false }
    ],
    lifestyleHabits: "Non-smoker, Vegetarian, Yoga practitioner",
    heightCm: 162,
    weightKg: 64,
    bmi: "24.4 (Normal)",
    mdr: "None (Negative for drug-resistant pathogens)",
    previousHistory: "Angina evaluation at Fortis Jaipur (Nov 2025). Mild LAD stenosis (35%).",
    surgicalHistory: "Laparoscopic Cholecystectomy (June 2019). No vascular stents.",
    transplantHistory: "None",
    drugToxicity: "Severe bronchospasm to Aspirin (2017); Erythema to Bactrim/Sulfa",
    medicalInsurance: "HDFC ERGO Optima Restore - Policy #HE-771290 (TPA Cashless Pre-Approved)",
    qrCardIssued: true,
    lastUpdated: new Date().toISOString()
  },
  "PRAN-9521": {
    id: "PRAN-9521",
    fullName: "Kabir Mehta",
    email: "kabir.mehta@example.com",
    phone: "+91 97110 44330",
    dateOfBirth: "2004-11-20",
    age: 22,
    gender: "Male",
    address: "Hostel 4, Room 210, North Campus, Delhi University, Delhi",
    bloodGroup: "AB+",
    organDonor: false,
    allergies: [
      { id: "a1", name: "Peanuts & Tree Nuts", severity: "Severe" },
      { id: "a2", name: "Shellfish / Crustaceans", severity: "Severe" }
    ],
    medicines: [
      { id: "m1", name: "Budecort Inhaler", dosage: "200 mcg", frequency: "Twice daily", notes: "Maintenance steroid inhaler" },
      { id: "m2", name: "Asthalin / Salbutamol", dosage: "100 mcg", frequency: "SOS (Emergency)", notes: "Acute bronchospasm relief" },
      { id: "m3", name: "EpiPen Auto-Injector", dosage: "0.3 mg", frequency: "Emergency IM", notes: "Immediate anaphylaxis reversal" }
    ],
    conditions: "Severe Atopic Asthma, Life-Threatening Food Allergy",
    medicalHistory: "Emergency ER resuscitation for accidental peanut ingestion (2023).",
    emergencyNotes: "ANAPHYLAXIS DANGER: Patient carries EpiPen in backpack. If throat swelling, hives, or stridor occurs, inject EpiPen 0.3mg IM into mid-outer thigh immediately and dial 112.",
    emergencyContacts: [
      { id: "c1", name: "Sunita Mehta", relation: "Mother", phone: "+91 97110 44332", alternatePhone: "+91 97110 44335", isPrimary: true },
      { id: "c2", name: "Rohan Kapoor", relation: "Roommate", phone: "+91 98114 55667", alternatePhone: "", isPrimary: false }
    ],
    lifestyleHabits: "College Athlete (Soccer), Non-smoker, Alcohol-free",
    heightCm: 180,
    weightKg: 70,
    bmi: "21.6 (Normal)",
    mdr: "None (Negative)",
    previousHistory: "Anaphylaxis admission at AIIMS Delhi (Feb 2023). Treated with Epinephrine + Hydrocortisone.",
    surgicalHistory: "None",
    transplantHistory: "None",
    drugToxicity: "None reported",
    medicalInsurance: "Care Health Protect Plus - Policy #CP-990421 (Cashless Network Active)",
    qrCardIssued: true,
    lastUpdated: new Date().toISOString()
  }
};

const DEFAULT_REQUESTS = [
  {
    id: "EMG-8924",
    incidentType: "Road Accident (Motorbike Collision)",
    patientName: "Aarav Sharma",
    patientId: "PRAN-7429",
    location: "Near Inner Circle, Block B, Connaught Place, New Delhi",
    coordinates: { lat: 28.6315, lng: 77.2167 },
    callbackPhone: "+91 98765 43210",
    description: "Two-wheeler collision at intersection. Helmet dislodged. Conscious but bleeding from left leg.",
    status: "Ambulance Dispatched",
    submittedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    assignedHospital: "City General Trauma Center",
    assignedAmbulance: "LifeCare ALS Unit #14 (DL 01 AB 1122)",
    paramedicContact: "Officer Ramesh Kumar (+91 98110 99887)",
    estimatedArrivalMins: 6,
    priority: "HIGH"
  },
  {
    id: "EMG-4102",
    incidentType: "Sudden Severe Chest Pain / Cardiac Distress",
    patientName: "Unknown Civilian",
    patientId: null,
    location: "Metro Station Gate 3, Sector 18, Noida",
    coordinates: { lat: 28.5708, lng: 77.3260 },
    callbackPhone: "+91 99990 12345",
    description: "Elderly male collapsed on sidewalk. Breathing shallow, bystander performing CPR.",
    status: "Awaiting Response",
    submittedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    assignedHospital: "Metro Heart & Trauma Institute",
    assignedAmbulance: "Pending Dispatch",
    paramedicContact: "Triage Desk",
    estimatedArrivalMins: 10,
    priority: "CRITICAL"
  }
];

const MOCK_AMBULANCE_FLEET = [
  { id: "AMB-01", name: "LifeCare ALS #14", type: "ALS (Advanced Life Support)", regNo: "DL 01 AB 1122", driver: "Ramesh Kumar", phone: "+91 98110 99887", status: "En Route" },
  { id: "AMB-02", name: "Pulse BLS #07", type: "BLS (Basic Life Support)", regNo: "UP 16 CD 4567", driver: "Sunil Verma", phone: "+91 98220 33445", status: "Available" },
  { id: "AMB-03", name: "MedExpress ALS #03", type: "ALS (Advanced Life Support)", regNo: "DL 04 EF 8901", driver: "Amit Yadav", phone: "+91 98330 55667", status: "Available" }
];

const DataManager = {
  getPatient(id) {
    const session = (typeof Auth !== 'undefined' && Auth.getSession) ? Auth.getSession() : null;
    const targetId = id || (session && session.role === 'patient' ? session.id : null);

    if (targetId && DEMO_PATIENTS[targetId]) {
      return JSON.parse(JSON.stringify(DEMO_PATIENTS[targetId]));
    }
    const raw = localStorage.getItem("pran_patient");
    if (raw) {
      try {
        const p = JSON.parse(raw);
        if (!targetId || p.id === targetId) {
          return p;
        }
      } catch (e) {}
    }
    if (targetId) {
      return {
        id: targetId,
        fullName: session && session.fullName ? session.fullName : "Patient",
        email: session && session.email ? session.email : "",
        phone: "+91 98765 43210",
        dateOfBirth: "1995-01-01",
        gender: "Male",
        address: "New Delhi, India",
        bloodGroup: "B+",
        organDonor: true,
        allergies: [],
        medicines: [],
        conditions: "None registered",
        medicalHistory: "Clean clinical record",
        emergencyNotes: "Contact primary guardian in emergency",
        emergencyContacts: [],
        lastUpdated: new Date().toISOString()
      };
    }
    this.savePatient(DEFAULT_PATIENT);
    return JSON.parse(JSON.stringify(DEFAULT_PATIENT));
  },

  getPatientById(id) {
    if (!id) return this.getPatient();
    const cleanId = id.trim().toUpperCase();
    if (DEMO_PATIENTS[cleanId]) {
      return JSON.parse(JSON.stringify(DEMO_PATIENTS[cleanId]));
    }
    const current = this.getPatient(cleanId);
    if (current && current.id && current.id.toUpperCase() === cleanId) {
      return current;
    }
    return current;
  },

  getAllDemoPatients() {
    return [
      JSON.parse(JSON.stringify(DEMO_PATIENTS["PRAN-7429"])),
      JSON.parse(JSON.stringify(DEMO_PATIENTS["PRAN-3108"])),
      JSON.parse(JSON.stringify(DEMO_PATIENTS["PRAN-9521"]))
    ];
  },

  savePatient(patient) {
    patient.lastUpdated = new Date().toISOString();
    localStorage.setItem("pran_patient", JSON.stringify(patient));
    if (DEMO_PATIENTS[patient.id]) {
      DEMO_PATIENTS[patient.id] = JSON.parse(JSON.stringify(patient));
    }
    return patient;
  },

  normalizePatientData(raw) {
    if (!raw) return this.getPatient();
    return {
      id: raw.id || "PRAN-" + Math.floor(1000 + Math.random() * 9000),
      fullName: raw.name || raw.fullName || "Emergency Patient",
      email: raw.email || "",
      phone: raw.phone || "",
      dateOfBirth: raw.dob || raw.dateOfBirth || "1995-01-01",
      age: raw.age || 30,
      gender: raw.gender || "Unspecified",
      address: raw.address || "New Delhi, India",
      bloodGroup: raw.blood || raw.bloodGroup || "O+",
      organDonor: !!(raw.donor !== undefined ? raw.donor : raw.organDonor),
      allergies: raw.allergies || [],
      medicines: raw.meds || raw.medicines || [],
      conditions: raw.cond || raw.conditions || "None recorded",
      medicalHistory: raw.medicalHistory || raw.prevHistory || "",
      emergencyNotes: raw.notes || raw.emergencyNotes || "No emergency instructions recorded.",
      emergencyContacts: raw.contacts || raw.emergencyContacts || [],
      heightCm: raw.heightCm || 170,
      weightKg: raw.weightKg || 70,
      bmi: raw.bmi || "22.5 (Normal)",
      mdr: raw.mdr || "Negative / None Reported",
      previousHistory: raw.previousHistory || raw.prev || "None",
      surgicalHistory: raw.surgicalHistory || raw.surg || "None",
      transplantHistory: raw.transplantHistory || "None",
      drugToxicity: raw.drugToxicity || raw.tox || "None",
      medicalInsurance: raw.insurance || raw.medicalInsurance || "Standard Cashless Active",
      qrCardIssued: true,
      lastUpdated: new Date().toISOString()
    };
  },

  encodePatientForQr(patient) {
    if (!patient) patient = this.getPatient();
    const payload = {
      v: 1,
      id: patient.id,
      name: patient.fullName,
      dob: patient.dateOfBirth,
      age: patient.age || this.calculateAge(patient.dateOfBirth),
      gender: patient.gender,
      blood: patient.bloodGroup,
      donor: patient.organDonor,
      allergies: (patient.allergies || []).map(a => ({ name: a.name, severity: a.severity })),
      meds: (patient.medicines || []).map(m => ({ name: m.name, dosage: m.dosage, frequency: m.frequency, notes: m.notes || '' })),
      cond: patient.conditions || "",
      notes: patient.emergencyNotes || "",
      contacts: (patient.emergencyContacts || []).map(c => ({ name: c.name, relation: c.relation, phone: c.phone, isPrimary: c.isPrimary })),
      ins: patient.medicalInsurance || "",
      mdr: patient.mdr || "",
      surg: patient.surgicalHistory || "",
      tox: patient.drugToxicity || "",
      bmi: patient.bmi || ""
    };
    return JSON.stringify(payload);
  },

  decodePatientFromQr(rawText) {
    if (!rawText) return this.getPatient();
    const trimmed = String(rawText).trim();

    // 1. Direct JSON String
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        return this.normalizePatientData(parsed);
      } catch (e) {
        console.warn('JSON parse error from QR string', e);
      }
    }

    // 2. URL containing query parameters (?id=... or ?data=...)
    if (trimmed.includes('?') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      try {
        const url = new URL(trimmed, 'http://localhost');
        const dataParam = url.searchParams.get('data');
        if (dataParam) {
          try {
            const jsonStr = decodeURIComponent(escape(atob(dataParam)));
            const parsed = JSON.parse(jsonStr);
            return this.normalizePatientData(parsed);
          } catch (e) {
            console.warn('Base64 parse error from QR data param', e);
          }
        }
        const idParam = url.searchParams.get('id');
        if (idParam) {
          return this.getPatientById(idParam);
        }
      } catch (e) {
        // Fallback simple regex
        const idMatch = trimmed.match(/[?&]id=([^&#]+)/i);
        if (idMatch) {
          return this.getPatientById(decodeURIComponent(idMatch[1]));
        }
      }
    }

    // 3. Regex match for PRAN-XXXX
    const match = trimmed.match(/PRAN-\d{4}/i);
    if (match) {
      return this.getPatientById(match[0].toUpperCase());
    }

    // 4. Default fallback
    return this.getPatient();
  },

  getEmergencyRequests() {
    const raw = localStorage.getItem("pran_emergency_requests");
    if (!raw) {
      localStorage.setItem("pran_emergency_requests", JSON.stringify(DEFAULT_REQUESTS));
      return JSON.parse(JSON.stringify(DEFAULT_REQUESTS));
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      return JSON.parse(JSON.stringify(DEFAULT_REQUESTS));
    }
  },

  saveEmergencyRequest(request) {
    const list = this.getEmergencyRequests();
    // Prepend new request
    list.unshift(request);
    localStorage.setItem("pran_emergency_requests", JSON.stringify(list));
    return request;
  },

  getEmergencyRequestById(id) {
    const list = this.getEmergencyRequests();
    return list.find(r => r.id === id) || null;
  },

  updateRequestStatus(id, newStatus, extraData = {}) {
    const list = this.getEmergencyRequests();
    const idx = list.findIndex(r => r.id === id);
    if (idx !== -1) {
      list[idx].status = newStatus;
      Object.assign(list[idx], extraData);
      localStorage.setItem("pran_emergency_requests", JSON.stringify(list));
      return list[idx];
    }
    return null;
  },

  getAmbulanceFleet() {
    return MOCK_AMBULANCE_FLEET;
  },

  calculateAge(dateOfBirth) {
    if (!dateOfBirth) return "";
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age >= 0 ? age : "";
  },

  calculateBmi(heightCm, weightKg) {
    const h = parseFloat(heightCm);
    const w = parseFloat(weightKg);
    if (!h || !w || h <= 0 || w <= 0) return { bmi: "--", category: "--", color: "var(--color-cool-gray)" };
    const heightInMeters = h / 100;
    const bmiVal = (w / (heightInMeters * heightInMeters)).toFixed(1);
    let category = "Normal weight";
    let color = "var(--color-sage-dark)";
    if (bmiVal < 18.5) {
      category = "Underweight";
      color = "#d97706";
    } else if (bmiVal >= 25 && bmiVal < 30) {
      category = "Overweight";
      color = "#e67e22";
    } else if (bmiVal >= 30) {
      category = "Obesity";
      color = "var(--color-emergency-red)";
    }
    return { bmi: bmiVal, category, color };
  },

  async sendToN8nWebhook(payload) {
    const webhookUrl = "https://aizen56.app.n8n.cloud/webhook-test/emergency";
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      return {
        success: response.ok || response.type === 'opaque',
        status: response.status,
        statusText: response.statusText,
        url: webhookUrl
      };
    } catch (err) {
      console.warn("Direct fetch error (likely CORS in browser test mode):", err);
      // Attempt with no-cors as backup if required by endpoint
      try {
        await fetch(webhookUrl, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });
        return {
          success: true,
          status: 200,
          statusText: "Delivered (no-cors transmission)",
          url: webhookUrl
        };
      } catch (backupErr) {
        return {
          success: false,
          error: err.message,
          url: webhookUrl
        };
      }
    }
  },

  calculateProfileCompletion(patient) {
    let score = 0;
    const weights = {
      fullName: 10,
      dateOfBirth: 5,
      phone: 10,
      bloodGroup: 15,
      allergies: 15,
      emergencyContacts: 15,
      emergencyNotes: 10,
      bmi: 10,
      medicalInsurance: 10
    };

    if (patient.fullName && patient.fullName.trim()) score += weights.fullName;
    if (patient.dateOfBirth) score += weights.dateOfBirth;
    if (patient.phone && patient.phone.trim()) score += weights.phone;
    if (patient.bloodGroup && patient.bloodGroup !== "Unknown") score += weights.bloodGroup;
    if (patient.allergies && patient.allergies.length > 0) score += weights.allergies;
    if (patient.emergencyContacts && patient.emergencyContacts.length > 0) score += weights.emergencyContacts;
    if (patient.emergencyNotes && patient.emergencyNotes.trim()) score += weights.emergencyNotes;
    if (patient.bmi && patient.bmi !== "--") score += weights.bmi;
    if (patient.medicalInsurance && patient.medicalInsurance.trim()) score += weights.medicalInsurance;

    return Math.min(100, score);
  },

  resetDemoData() {
    localStorage.setItem("pran_patient", JSON.stringify(DEFAULT_PATIENT));
    localStorage.setItem("pran_emergency_requests", JSON.stringify(DEFAULT_REQUESTS));
    return true;
  }
};
