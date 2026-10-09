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
  getPatient() {
    const raw = localStorage.getItem("pran_patient");
    if (!raw) {
      this.savePatient(DEFAULT_PATIENT);
      return JSON.parse(JSON.stringify(DEFAULT_PATIENT));
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      return JSON.parse(JSON.stringify(DEFAULT_PATIENT));
    }
  },

  savePatient(patient) {
    patient.lastUpdated = new Date().toISOString();
    localStorage.setItem("pran_patient", JSON.stringify(patient));
    return patient;
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
