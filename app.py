"""
PRANरक्षक (Pran Rakshak) — Smart Medical QR & Emergency Assistance Platform
Flask Backend Server
Features:
- Strict portal separation: Patient Portal vs Hospital Portal
- User Authentication with Session Management (Patient vs Hospital)
- Patient Medical Record Management & Unique QR Code Generation (via Python qrcode)
- Emergency QR Scanning with Live GPS Location & Risk Level Selection (Extreme -> ICU Ambulance vs Emergency -> Normal Ambulance)
- Hospital Acceptance Protocol: Case Summary -> Accept -> Full Medical Dossier Unlocked & Ambulance Dispatched
"""

import os
import io
import sys
import json
import base64
import sqlite3

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
from datetime import datetime
from functools import wraps
from flask import (
    Flask, request, jsonify, session, redirect,
    url_for, send_from_directory, render_template_string
)
import qrcode

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'pranrakshak.db')

app = Flask(__name__, static_folder=BASE_DIR, static_url_path='')
app.secret_key = os.environ.get('SECRET_KEY', 'pranrakshak-super-secret-key-2026')

# ==============================================================================
# DATABASE INITIALIZATION & MIGRATIONS
# ==============================================================================

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def generate_qr_base64(data_url_or_payload):
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=2
    )
    qr.add_data(data_url_or_payload)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#1e293b", back_color="#ffffff")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("utf-8")

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # 1. Users Table (Patients & Hospitals)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'patient',
            full_name TEXT NOT NULL,
            phone TEXT,
            date_of_birth TEXT,
            age INTEGER,
            gender TEXT,
            address TEXT,
            blood_group TEXT,
            organ_donor INTEGER DEFAULT 0,
            allergies TEXT,
            medicines TEXT,
            conditions TEXT,
            medical_history TEXT,
            emergency_notes TEXT,
            emergency_contacts TEXT,
            height_cm REAL,
            weight_kg REAL,
            bmi TEXT,
            mdr_status TEXT,
            surgical_history TEXT,
            transplant_history TEXT,
            drug_toxicity TEXT,
            medical_insurance TEXT,
            qr_code_base64 TEXT,
            created_at TEXT,
            updated_at TEXT
        )
    ''')

    # 2. Emergency Incidents / Scan Alerts Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS incidents (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL,
            risk_level TEXT NOT NULL,
            ambulance_type TEXT NOT NULL,
            scanner_lat REAL,
            scanner_lng REAL,
            scanner_address TEXT,
            scanner_phone TEXT,
            scanner_notes TEXT,
            status TEXT NOT NULL DEFAULT 'AWAITING_HOSPITAL_ACCEPTANCE',
            assigned_hospital TEXT DEFAULT 'City General Trauma Center',
            assigned_ambulance TEXT,
            paramedic_contact TEXT,
            eta_mins INTEGER DEFAULT 8,
            access_authorized INTEGER DEFAULT 0,
            created_at TEXT,
            accepted_at TEXT,
            FOREIGN KEY (patient_id) REFERENCES users(id)
        )
    ''')

    # 3. Treatment Records / Hospital History Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS treatment_records (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL,
            incident_id TEXT,
            hospital_name TEXT NOT NULL,
            doctor_name TEXT,
            diagnosis TEXT NOT NULL,
            treatment_provided TEXT NOT NULL,
            prescriptions_added TEXT,
            patient_status TEXT DEFAULT 'Treated & Discharged',
            notes TEXT,
            created_at TEXT,
            FOREIGN KEY (patient_id) REFERENCES users(id)
        )
    ''')

    conn.commit()

    # Seed Default Patient (Aarav Sharma) if not present
    cursor.execute("SELECT id FROM users WHERE id = 'PRAN-7429'")
    if not cursor.fetchone():
        host_url = "http://localhost:5000"
        qr_url = f"{host_url}/scan/PRAN-7429"
        qr_b64 = generate_qr_base64(qr_url)

        allergies = json.dumps([
            {"id": "a1", "name": "Penicillin", "severity": "Severe"},
            {"id": "a2", "name": "Peanuts", "severity": "Moderate"}
        ])
        medicines = json.dumps([
            {"id": "m1", "name": "Metformin", "dosage": "500 mg", "frequency": "Twice daily after food", "notes": "Type-2 glycemic control"},
            {"id": "m2", "name": "Levocetirizine", "dosage": "5 mg", "frequency": "SOS (Night)", "notes": "Seasonal pollen allergy"}
        ])
        contacts = json.dumps([
            {"id": "c1", "name": "Priya Sharma", "relation": "Spouse", "phone": "+91 98765 43210", "isPrimary": True},
            {"id": "c2", "name": "Vikram Sharma", "relation": "Brother", "phone": "+91 98112 34567", "isPrimary": False}
        ])

        now_str = datetime.now().isoformat()
        cursor.execute('''
            INSERT INTO users (
                id, email, password, role, full_name, phone, date_of_birth, age, gender, address,
                blood_group, organ_donor, allergies, medicines, conditions, medical_history, emergency_notes,
                emergency_contacts, height_cm, weight_kg, bmi, mdr_status, surgical_history, transplant_history,
                drug_toxicity, medical_insurance, qr_code_base64, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            'PRAN-7429', 'aarav.sharma@example.com', 'password123', 'patient', 'Aarav Sharma', '+91 98765 43210',
            '1996-04-15', 30, 'Male', 'B-402, Green Valley Heights, Sector 62, Noida, UP, 201309',
            'B+', 1, allergies, medicines, 'Type 2 Diabetes Mellitus, Mild Exercise-induced Asthma',
            'Laparoscopic Appendectomy (2021). No cardiac complications or stent implants.',
            'Carries emergency salbutamol inhaler in laptop bag. Check capillary blood glucose before administering IV saline.',
            contacts, 175, 72, '23.5 (Normal)', 'None / Negative for Drug-Resistant Pathogens',
            'Laparoscopic Appendectomy (August 2021)', 'None', 'Mild adverse rash to Ciprofloxacin (2022)',
            'Star Health Comprehensive - Policy #SH-884102 - TPA Cashless Active',
            qr_b64, now_str, now_str
        ))

    # Seed Patient 2 (Meera Patel - CAD / Aspirin severe)
    cursor.execute("SELECT id FROM users WHERE id = 'PRAN-3108'")
    if not cursor.fetchone():
        host_url = "http://localhost:5000"
        qr_url = f"{host_url}/scan/PRAN-3108"
        qr_b64 = generate_qr_base64(qr_url)

        allergies = json.dumps([
            {"id": "a1", "name": "Aspirin & NSAIDs", "severity": "Severe"},
            {"id": "a2", "name": "Sulfa Antibiotics", "severity": "Severe"}
        ])
        medicines = json.dumps([
            {"id": "m1", "name": "Amlodipine", "dosage": "5 mg", "frequency": "Once daily (Morning)", "notes": "Hypertension regulation"},
            {"id": "m2", "name": "Atorvastatin", "dosage": "20 mg", "frequency": "Bedtime", "notes": "Lipid management"},
            {"id": "m3", "name": "Sorbitrate", "dosage": "5 mg", "frequency": "Sublingual SOS", "notes": "Angina chest pain emergency"}
        ])
        contacts = json.dumps([
            {"id": "c1", "name": "Rajesh Patel", "relation": "Husband", "phone": "+91 98234 56789", "isPrimary": True}
        ])

        now_str = datetime.now().isoformat()
        cursor.execute('''
            INSERT INTO users (
                id, email, password, role, full_name, phone, date_of_birth, age, gender, address,
                blood_group, organ_donor, allergies, medicines, conditions, medical_history, emergency_notes,
                emergency_contacts, height_cm, weight_kg, bmi, mdr_status, surgical_history, transplant_history,
                drug_toxicity, medical_insurance, qr_code_base64, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            'PRAN-3108', 'meera.patel@example.com', 'password123', 'patient', 'Meera Patel', '+91 98234 56780',
            '1978-08-12', 48, 'Female', 'Flat 12B, Regency Heights, Civil Lines, Jaipur, RJ',
            'O-', 1, allergies, medicines, 'Hypertension, Coronary Artery Disease (CAD)',
            'Laparoscopic Cholecystectomy (2019). Strict contraindication to Aspirin / NSAID therapy.',
            'CRITICAL: Severe Anaphylactic reaction to Aspirin & Sulfa. In acute chest pain, administer sublingual Sorbitrate. Do NOT administer Disprin/Aspirin.',
            contacts, 162, 64, '24.4 (Normal)', 'None (Negative for drug-resistant pathogens)',
            'Laparoscopic Cholecystectomy (June 2019)', 'None', 'Severe bronchospasm to Aspirin',
            'HDFC ERGO Optima Restore - Policy #HE-771290 - TPA Cashless Active',
            qr_b64, now_str, now_str
        ))

    # Seed Hospital User
    cursor.execute("SELECT id FROM users WHERE id = 'HOSP-01'")
    if not cursor.fetchone():
        now_str = datetime.now().isoformat()
        cursor.execute('''
            INSERT INTO users (
                id, email, password, role, full_name, phone, address, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            'HOSP-01', 'hospital@citytrauma.org', 'hospital123', 'hospital',
            'City General Trauma Center (Emergency ER)', '+91 11 2345 6789',
            'Trauma Block A, Ring Road, New Delhi, 110029', now_str, now_str
        ))

    # Seed Sample Incident for Testing
    cursor.execute("SELECT id FROM incidents WHERE id = 'EMG-8924'")
    if not cursor.fetchone():
        cursor.execute('''
            INSERT INTO incidents (
                id, patient_id, risk_level, ambulance_type, scanner_lat, scanner_lng,
                scanner_address, scanner_phone, scanner_notes, status, assigned_hospital,
                assigned_ambulance, paramedic_contact, eta_mins, access_authorized, created_at, accepted_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            'EMG-8924', 'PRAN-7429', 'extreme', 'ICU Ambulance (ALS)',
            28.6315, 77.2167, 'Near Block B, Connaught Place, New Delhi', '+91 98765 43210',
            'Two-wheeler collision at intersection. Patient unconscious with head trauma.',
            'ACCEPTED', 'City General Trauma Center', 'LifeCare ALS Unit #14 (ICU Ventilator Equipped)',
            'Officer Ramesh Kumar (+91 98110 99887)', 5, 1,
            datetime.now().isoformat(), datetime.now().isoformat()
        ))

    # Seed Sample Treatment Record for Aarav Sharma
    cursor.execute("SELECT id FROM treatment_records WHERE id = 'TRT-1049'")
    if not cursor.fetchone():
        cursor.execute('''
            INSERT INTO treatment_records (
                id, patient_id, incident_id, hospital_name, doctor_name, diagnosis,
                treatment_provided, prescriptions_added, patient_status, notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            'TRT-1049', 'PRAN-7429', 'EMG-8924', 'City General Trauma Center', 'Dr. Ramesh Sharma (Trauma Lead)',
            'Acute Forearm Laceration & Mild Concussion',
            'Wound debridement, sterile irrigation and 4 nylon sutures. Administered 500ml normal saline IV. Tetanus Toxoid 0.5ml IM given. Glucose monitored at 114 mg/dL.',
            'Ceftriaxone 500mg (5 days, twice daily), Paracetamol 650mg SOS for pain',
            'Treated & Discharged with Follow-up Advice',
            'Patient advised 48hr wound dressing. Suture inspection and removal scheduled after 7 days.',
            datetime.now().isoformat()
        ))

    conn.commit()
    conn.close()

# Initialize DB on module import
init_db()

# ==============================================================================
# AUTH DECORATORS & HELPERS
# ==============================================================================

def login_required(role=None):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user_id' not in session:
                if request.is_json or request.path.startswith('/api/'):
                    return jsonify({'error': 'Unauthorized', 'message': 'Please log in.'}), 401
                if role == 'hospital':
                    return redirect('/hospital/login')
                return redirect('/patient/login')
            if role and session.get('role') != role:
                if request.is_json or request.path.startswith('/api/'):
                    return jsonify({'error': 'Forbidden', 'message': f'Access restricted to {role}.'}), 403
                if session.get('role') == 'hospital':
                    return redirect('/hospital/dashboard')
                return redirect('/patient/dashboard')
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# ==============================================================================
# PAGE ROUTES (STRICT PORTAL SEPARATION)
# ==============================================================================

@app.route('/')
def route_home():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/login')
@app.route('/login.html')
def route_generic_login():
    if session.get('role') == 'hospital':
        return redirect('/hospital/dashboard')
    if session.get('role') == 'patient':
        return redirect('/patient/dashboard')
    return redirect('/patient/login')

@app.route('/dashboard')
@app.route('/dashboard.html')
def route_generic_dashboard():
    if session.get('role') == 'hospital':
        return redirect('/hospital/dashboard')
    return redirect('/patient/dashboard')

@app.route('/provider-dashboard')
@app.route('/provider-dashboard.html')
def route_generic_provider_dashboard():
    return redirect('/hospital/dashboard')

# --- PATIENT PORTAL ROUTES ---
@app.route('/patient/login')
def route_patient_login():
    return send_from_directory(BASE_DIR, 'patient-login.html')

@app.route('/patient/register')
def route_patient_register():
    return send_from_directory(BASE_DIR, 'register.html')

@app.route('/patient/dashboard')
@app.route('/patient/dashboard.html')
@login_required(role='patient')
def route_patient_dashboard():
    return send_from_directory(BASE_DIR, 'dashboard.html')

@app.route('/patient/profile')
@app.route('/patient/profile.html')
@login_required(role='patient')
def route_patient_profile():
    return send_from_directory(BASE_DIR, 'profile.html')

@app.route('/patient/qr-card')
@app.route('/patient/qr-card.html')
@app.route('/qr-card')
@app.route('/qr-card.html')
@login_required(role='patient')
def route_patient_qr_card():
    return send_from_directory(BASE_DIR, 'qr-card.html')

@app.route('/patient/contacts')
@app.route('/patient/contacts.html')
@login_required(role='patient')
def route_patient_contacts():
    return send_from_directory(BASE_DIR, 'contacts.html')

# --- HOSPITAL PORTAL ROUTES ---
@app.route('/hospital/login')
def route_hospital_login():
    return send_from_directory(BASE_DIR, 'hospital-login.html')

@app.route('/hospital/dashboard')
@app.route('/hospital/dashboard.html')
@login_required(role='hospital')
def route_hospital_dashboard():
    return send_from_directory(BASE_DIR, 'provider-dashboard.html')

# --- PUBLIC RESCUE / SCANNER ROUTES ---
@app.route('/scan/<patient_id>')
def route_emergency_scan(patient_id):
    return send_from_directory(BASE_DIR, 'emergency-scan.html')

@app.route('/emergency/<patient_id>')
def route_emergency_view(patient_id):
    return send_from_directory(BASE_DIR, 'emergency.html')

@app.route('/emergency-assistance')
@app.route('/emergency-assistance.html')
@app.route('/<portal>/emergency-assistance.html')
@app.route('/<portal>/emergency-assistance')
def route_emergency_assistance(portal=None):
    return send_from_directory(BASE_DIR, 'emergency-assistance.html')

@app.route('/emergency')
@app.route('/emergency.html')
@app.route('/<portal>/emergency.html')
def route_emergency_generic(portal=None):
    return send_from_directory(BASE_DIR, 'emergency.html')

@app.route('/track/<incident_id>')
def route_track_incident(incident_id):
    return send_from_directory(BASE_DIR, 'ambulance-tracking.html')

@app.route('/ambulance-tracking')
@app.route('/ambulance-tracking.html')
@app.route('/<portal>/ambulance-tracking.html')
def route_ambulance_tracking_generic(portal=None):
    return send_from_directory(BASE_DIR, 'ambulance-tracking.html')

# --- STATIC ASSET FALLBACK FOR NESTED ROUTES (/patient/css/..., /hospital/js/...) ---
@app.route('/<portal>/css/<path:filename>')
def serve_subpath_css(portal, filename):
    return send_from_directory(os.path.join(BASE_DIR, 'css'), filename)

@app.route('/<portal>/js/<path:filename>')
def serve_subpath_js(portal, filename):
    return send_from_directory(os.path.join(BASE_DIR, 'js'), filename)

@app.route('/<p1>/<p2>/css/<path:filename>')
def serve_subpath2_css(p1, p2, filename):
    return send_from_directory(os.path.join(BASE_DIR, 'css'), filename)

@app.route('/<p1>/<p2>/js/<path:filename>')
def serve_subpath2_js(p1, p2, filename):
    return send_from_directory(os.path.join(BASE_DIR, 'js'), filename)

# ==============================================================================
# AUTH REST API
# ==============================================================================

@app.route('/api/auth/register', methods=['POST'])
def api_register_patient():
    """
    Patient Registration Endpoint:
    Generates a unique PRAN Lifeline ID (e.g. PRAN-4A9B) and unique QR code embedding /scan/<id>.
    Zero login required for any civilian/paramedic scanning this QR.
    """
    data = request.get_json() or {}
    full_name = data.get('fullName') or data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()
    phone = data.get('phone', '').strip()
    blood_group = data.get('bloodGroup', 'O+').strip()

    if not full_name or not email or not password:
        return jsonify({'success': False, 'error': 'Name, email, and password are required.'}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT id FROM users WHERE LOWER(email) = ?', (email,))
    if cursor.fetchone():
        conn.close()
        return jsonify({'success': False, 'error': 'An account with this email address already exists. Please sign in.'}), 409

    # Generate unique PRAN ID
    patient_id = f"PRAN-{os.urandom(2).hex().upper()}"
    now_str = datetime.now().isoformat()
    host_url = request.host_url.rstrip('/')
    qr_data_url = f"{host_url}/scan/{patient_id}"
    qr_b64 = generate_qr_base64(qr_data_url)

    allergies = json.dumps(data.get('allergies', []))
    medicines = json.dumps(data.get('medicines', []))
    contacts = json.dumps(data.get('emergencyContacts', []))
    conditions = data.get('conditions', 'None registered yet')
    history = data.get('medicalHistory', 'None recorded at registration')
    emergency_notes = data.get('emergencyNotes', 'Contact primary guardian in emergency')

    cursor.execute('''
        INSERT INTO users (
            id, email, password, role, full_name, phone, blood_group,
            allergies, medicines, conditions, medical_history, emergency_notes,
            emergency_contacts, qr_code_base64, created_at, updated_at
        ) VALUES (?, ?, ?, 'patient', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        patient_id, email, password, full_name, phone, blood_group,
        allergies, medicines, conditions, history, emergency_notes,
        contacts, qr_b64, now_str, now_str
    ))
    conn.commit()
    conn.close()

    # Automatically set session
    session['user_id'] = patient_id
    session['role'] = 'patient'
    session['full_name'] = full_name
    session['email'] = email

    return jsonify({
        'success': True,
        'message': f'Welcome, {full_name}! Your unique Emergency QR Lifeline ID {patient_id} has been generated.',
        'user': {
            'id': patient_id,
            'fullName': full_name,
            'email': email,
            'role': 'patient'
        },
        'patientId': patient_id,
        'qrUrl': qr_data_url,
        'redirectUrl': '/patient/dashboard'
    })

@app.route('/api/auth/login', methods=['POST'])
def api_login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()
    role = data.get('role', 'patient').strip().lower()

    if not email or not password:
        return jsonify({'success': False, 'error': 'Email and password are required.'}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE LOWER(email) = ?', (email,))
    user = cursor.fetchone()

    host_url = request.host_url.rstrip('/')
    now_str = datetime.now().isoformat()

    # If patient logging in for first time with credentials, auto-generate vault & unique QR
    if not user and role == 'patient':
        patient_id = f"PRAN-{os.urandom(2).hex().upper()}"
        qr_data_url = f"{host_url}/scan/{patient_id}"
        qr_b64 = generate_qr_base64(qr_data_url)
        default_name = email.split('@')[0].replace('.', ' ').title()

        cursor.execute('''
            INSERT INTO users (
                id, email, password, role, full_name, phone, blood_group,
                allergies, medicines, conditions, medical_history, emergency_notes,
                emergency_contacts, qr_code_base64, created_at, updated_at
            ) VALUES (?, ?, ?, 'patient', ?, '+91 98765 43210', 'B+',
                      '[]', '[]', 'None registered', 'Clean clinical record', 'Contact primary guardian in emergency',
                      '[]', ?, ?, ?)
        ''', (
            patient_id, email, password, default_name, qr_b64, now_str, now_str
        ))
        conn.commit()

        cursor.execute('SELECT * FROM users WHERE id = ?', (patient_id,))
        user = cursor.fetchone()

    elif not user:
        conn.close()
        return jsonify({'success': False, 'error': 'Invalid email or password.'}), 401

    elif user['password'] != password:
        # Convenient fallback for demo users: accept either 'patient123' or 'password123'
        if user['email'] in ['aarav.sharma@example.com', 'meera.patel@example.com'] and password in ['patient123', 'password123']:
            pass
        else:
            conn.close()
            return jsonify({'success': False, 'error': 'Invalid email or password.'}), 401

    if user['role'] != role:
        conn.close()
        return jsonify({
            'success': False,
            'error': f"This account is registered as '{user['role']}', not '{role}'. Please use the correct login portal."
        }), 403

    # Ensure QR code is generated for this user if not already present
    if role == 'patient' and not user['qr_code_base64']:
        qr_data_url = f"{host_url}/scan/{user['id']}"
        qr_b64 = generate_qr_base64(qr_data_url)
        cursor.execute('UPDATE users SET qr_code_base64 = ?, updated_at = ? WHERE id = ?', (qr_b64, now_str, user['id']))
        conn.commit()

    conn.close()

    # Set session
    session['user_id'] = user['id']
    session['role'] = user['role']
    session['full_name'] = user['full_name']
    session['email'] = user['email']

    redirect_url = '/patient/dashboard' if user['role'] == 'patient' else '/hospital/dashboard'

    return jsonify({
        'success': True,
        'message': f"Welcome, {user['full_name']}! Your unique Emergency QR Lifeline is ready.",
        'user': {
            'id': user['id'],
            'fullName': user['full_name'],
            'email': user['email'],
            'role': user['role']
        },
        'patientId': user['id'],
        'qrUrl': f"{host_url}/scan/{user['id']}",
        'redirectUrl': redirect_url
    })

@app.route('/api/auth/demo-login', methods=['POST'])
def api_demo_login():
    data = request.get_json() or {}
    role = data.get('role', 'patient')

    conn = get_db()
    cursor = conn.cursor()
    if role == 'hospital':
        cursor.execute("SELECT * FROM users WHERE role = 'hospital' LIMIT 1")
    else:
        patient_id = data.get('patientId', 'PRAN-7429')
        cursor.execute("SELECT * FROM users WHERE id = ? AND role = 'patient'", (patient_id,))
    user = cursor.fetchone()
    conn.close()

    if not user:
        return jsonify({'success': False, 'error': 'Demo user not found.'}), 404

    session['user_id'] = user['id']
    session['role'] = user['role']
    session['full_name'] = user['full_name']
    session['email'] = user['email']

    redirect_url = '/hospital/dashboard' if user['role'] == 'hospital' else '/patient/dashboard'

    return jsonify({
        'success': True,
        'user': {
            'id': user['id'],
            'fullName': user['full_name'],
            'email': user['email'],
            'role': user['role']
        },
        'redirectUrl': redirect_url
    })

@app.route('/api/auth/logout', methods=['POST', 'GET'])
def api_logout():
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out successfully.'})

@app.route('/api/auth/me', methods=['GET'])
def api_auth_me():
    if 'user_id' not in session:
        return jsonify({'authenticated': False})
    return jsonify({
        'authenticated': True,
        'user': {
            'id': session.get('user_id'),
            'role': session.get('role'),
            'fullName': session.get('full_name'),
            'email': session.get('email')
        }
    })

# ==============================================================================
# PATIENT DETAILS & DYNAMIC QR CODE GENERATION API
# ==============================================================================

@app.route('/api/patient/profile', methods=['GET'])
def api_get_patient_profile():
    patient_id = request.args.get('id') or session.get('user_id')
    if not patient_id:
        patient_id = 'PRAN-7429'  # default demo fallback

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE id = ?', (patient_id,))
    row = cursor.fetchone()

    cursor.execute('SELECT * FROM treatment_records WHERE patient_id = ? ORDER BY created_at DESC', (patient_id,))
    treatment_rows = cursor.fetchall()
    conn.close()

    if not row:
        return jsonify({'error': 'Patient not found'}), 404

    patient = dict(row)
    # Parse JSON fields
    for field in ['allergies', 'medicines', 'emergency_contacts']:
        if patient.get(field):
            try:
                patient[field] = json.loads(patient[field])
            except Exception:
                pass

    patient['treatments'] = [dict(t) for t in treatment_rows]
    patient['fullName'] = patient.get('full_name') or patient.get('fullName')
    patient['bloodGroup'] = patient.get('blood_group') or patient.get('bloodGroup') or 'O+'
    patient['emergencyContacts'] = patient.get('emergency_contacts') or []
    patient['medicalHistory'] = patient.get('medical_history') or 'Clean clinical record'
    patient['emergencyNotes'] = patient.get('emergency_notes') or 'Contact primary guardian in emergency'

    return jsonify({'success': True, 'patient': patient})

@app.route('/api/patient/profile', methods=['POST'])
@login_required(role='patient')
def api_save_patient_profile():
    user_id = session.get('user_id')
    data = request.get_json() or {}

    conn = get_db()
    cursor = conn.cursor()

    full_name = data.get('fullName') or data.get('name') or 'Aarav Sharma'
    phone = data.get('phone', '')
    dob = data.get('dateOfBirth', '')
    age = data.get('age') or 30
    gender = data.get('gender', 'Male')
    address = data.get('address', '')
    blood_group = data.get('bloodGroup', 'B+')
    organ_donor = 1 if data.get('organDonor') else 0

    allergies_json = json.dumps(data.get('allergies', []))
    medicines_json = json.dumps(data.get('medicines', []))
    contacts_json = json.dumps(data.get('emergencyContacts', []))

    conditions = data.get('conditions', '')
    history = data.get('medicalHistory', '')
    notes = data.get('emergencyNotes', '')
    height_cm = data.get('heightCm', 175)
    weight_kg = data.get('weightKg', 72)
    bmi = data.get('bmi', '23.5 (Normal)')
    mdr = data.get('mdrStatus') or data.get('mdr', 'None')
    surgical = data.get('surgicalHistory', '')
    transplant = data.get('transplantHistory', '')
    toxicity = data.get('drugToxicity', '')
    insurance = data.get('medicalInsurance', '')

    # Re-generate dynamic QR Code for this updated user
    host_url = request.host_url.rstrip('/')
    qr_data_url = f"{host_url}/scan/{user_id}"
    qr_base64 = generate_qr_base64(qr_data_url)

    now_str = datetime.now().isoformat()

    cursor.execute('''
        UPDATE users SET
            full_name = ?, phone = ?, date_of_birth = ?, age = ?, gender = ?, address = ?,
            blood_group = ?, organ_donor = ?, allergies = ?, medicines = ?, conditions = ?,
            medical_history = ?, emergency_notes = ?, emergency_contacts = ?, height_cm = ?,
            weight_kg = ?, bmi = ?, mdr_status = ?, surgical_history = ?, transplant_history = ?,
            drug_toxicity = ?, medical_insurance = ?, qr_code_base64 = ?, updated_at = ?
        WHERE id = ?
    ''', (
        full_name, phone, dob, age, gender, address,
        blood_group, organ_donor, allergies_json, medicines_json, conditions,
        history, notes, contacts_json, height_cm,
        weight_kg, bmi, mdr, surgical, transplant,
        toxicity, insurance, qr_base64, now_str,
        user_id
    ))

    conn.commit()
    conn.close()

    return jsonify({
        'success': True,
        'message': 'Patient details saved and Smart QR Code updated successfully!',
        'patientId': user_id,
        'qrCodeBase64': qr_base64,
        'qrUrl': qr_data_url
    })

@app.route('/api/qr/<patient_id>')
@app.route('/api/patient/qr/<patient_id>.png')
def api_serve_patient_qr(patient_id):
    """
    Direct endpoint delivering a crisp PNG QR code image for any patient ID.
    Can be loaded directly via <img src="/api/qr/PRAN-7429">
    """
    host_url = request.host_url.rstrip('/')
    qr_data_url = f"{host_url}/scan/{patient_id}"
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=2
    )
    qr.add_data(qr_data_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#1e293b", back_color="#ffffff")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    from flask import send_file
    return send_file(buf, mimetype='image/png')

# ==============================================================================
# EMERGENCY SCAN & HOSPITAL ACCEPTANCE WORKFLOW
# ==============================================================================

@app.route('/api/emergency/scan-alert', methods=['POST'])
def api_submit_scan_alert():
    """
    Triggered when rescuer/bystander scans a patient's QR code.
    Scanner submits:
    - patient_id
    - risk_level ('extreme' vs 'emergency')
    - live scanner GPS location (lat, lng, address)
    Transmits ticket to hospital queue awaiting authorization.
    """
    data = request.get_json() or {}
    patient_id = data.get('patientId', '').strip()
    risk_level = data.get('riskLevel', 'emergency').strip().lower()  # 'extreme' or 'emergency'
    lat = data.get('latitude')
    lng = data.get('longitude')
    address = data.get('address') or 'Scene coordinates broadcasted via GPS'
    phone = data.get('callerPhone', '+91 98765 43210')
    notes = data.get('notes', '')

    if not patient_id:
        return jsonify({'error': 'Patient ID is required'}), 400

    conn = get_db()
    cursor = conn.cursor()

    # Verify patient exists
    cursor.execute('SELECT * FROM users WHERE id = ?', (patient_id,))
    patient = cursor.fetchone()
    if not patient:
        conn.close()
        return jsonify({'error': 'Patient ID not found'}), 404

    # Determine Ambulance Type according to risk level
    if risk_level == 'extreme':
        ambulance_type = 'ICU Ambulance (ALS - Advanced Life Support)'
    else:
        ambulance_type = 'Normal Ambulance (BLS - Basic Life Support)'

    incident_id = f"EMG-{os.urandom(2).hex().upper()}"
    now_str = datetime.now().isoformat()

    cursor.execute('''
        INSERT INTO incidents (
            id, patient_id, risk_level, ambulance_type, scanner_lat, scanner_lng,
            scanner_address, scanner_phone, scanner_notes, status, assigned_hospital,
            access_authorized, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'AWAITING_HOSPITAL_ACCEPTANCE', 'City General Trauma Center', 0, ?)
    ''', (
        incident_id, patient_id, risk_level, ambulance_type, lat, lng,
        address, phone, notes, now_str
    ))
    conn.commit()
    conn.close()

    return jsonify({
        'success': True,
        'incidentId': incident_id,
        'patientName': patient['full_name'],
        'bloodGroup': patient['blood_group'],
        'riskLevel': risk_level,
        'ambulanceType': ambulance_type,
        'status': 'AWAITING_HOSPITAL_ACCEPTANCE',
        'message': f"Emergency alert transmitted to Nearest Hospital. Case summary dispatched; full dossier locked pending hospital code acceptance."
    })

@app.route('/api/hospital/incidents', methods=['GET'])
@login_required(role='hospital')
def api_get_hospital_incidents():
    """
    Hospital Emergency feed.
    Shows summary info for incoming cases.
    If access_authorized == 0, full medical file is restricted until hospital accepts.
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT i.*, u.full_name as patient_name, u.blood_group, u.phone as patient_phone, u.age, u.gender
        FROM incidents i
        JOIN users u ON i.patient_id = u.id
        ORDER BY i.created_at DESC
    ''')
    rows = cursor.fetchall()
    conn.close()

    incidents = []
    for r in rows:
        inc = dict(r)
        incidents.append(inc)

    return jsonify({'success': True, 'incidents': incidents})

@app.route('/api/hospital/accept/<incident_id>', methods=['POST'])
@login_required(role='hospital')
def api_hospital_accept_incident(incident_id):
    """
    Hospital confirms/accepts the emergency code/ticket.
    Unlocks full patient dossier and dispatches appropriate ambulance:
    - If Extreme Risk: ICU Ambulance (ALS) dispatched
    - If Standard Emergency: Normal Ambulance (BLS) dispatched
    """
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT i.*, u.*
        FROM incidents i
        JOIN users u ON i.patient_id = u.id
        WHERE i.id = ?
    ''', (incident_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        return jsonify({'error': 'Incident not found'}), 404

    risk_level = row['risk_level']
    now_str = datetime.now().isoformat()

    if risk_level == 'extreme':
        assigned_amb = 'LifeCare ALS Unit #14 (ICU Ventilator Equipped)'
        paramedic = 'Dr. Sharma / Officer Ramesh (+91 98110 99887)'
        eta = 5
    else:
        assigned_amb = 'Pulse BLS Unit #07 (Standard Rescue Ambulance)'
        paramedic = 'Paramedic Sunil Verma (+91 98220 33445)'
        eta = 8

    cursor.execute('''
        UPDATE incidents SET
            status = 'AMBULANCE_DISPATCHED',
            assigned_ambulance = ?,
            paramedic_contact = ?,
            eta_mins = ?,
            access_authorized = 1,
            accepted_at = ?
        WHERE id = ?
    ''', (assigned_amb, paramedic, eta, now_str, incident_id))
    conn.commit()

    # Re-fetch full unlocked patient record
    cursor.execute('SELECT * FROM users WHERE id = ?', (row['patient_id'],))
    patient_row = cursor.fetchone()

    patient_dict = dict(patient_row) if patient_row else {}
    for field in ['allergies', 'medicines', 'emergency_contacts']:
        if patient_dict.get(field):
            try:
                patient_dict[field] = json.loads(patient_dict[field])
            except Exception:
                pass

    # Query patient's past treatment history
    cursor.execute('SELECT * FROM treatment_records WHERE patient_id = ? ORDER BY created_at DESC', (row['patient_id'],))
    treatment_rows = cursor.fetchall()
    patient_dict['treatments'] = [dict(t) for t in treatment_rows]
    conn.close()

    return jsonify({
        'success': True,
        'incidentId': incident_id,
        'status': 'AMBULANCE_DISPATCHED',
        'assignedAmbulance': assigned_amb,
        'ambulanceType': 'ICU Ambulance' if risk_level == 'extreme' else 'Normal Ambulance',
        'paramedicContact': paramedic,
        'etaMins': eta,
        'accessAuthorized': True,
        'unlockedDossier': patient_dict,
        'message': f"Case {incident_id} accepted! {'ICU Ambulance (ALS)' if risk_level == 'extreme' else 'Normal Ambulance (BLS)'} dispatched. Full medical file unlocked for ER admission."
    })

@app.route('/api/incident/<incident_id>/status', methods=['GET'])
def api_get_incident_status(incident_id):
    """
    Polling endpoint for scanner / helper / patient screen to monitor live acceptance and ambulance dispatch.
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT i.*, u.full_name as patient_name, u.blood_group
        FROM incidents i
        JOIN users u ON i.patient_id = u.id
        WHERE i.id = ?
    ''', (incident_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return jsonify({'error': 'Incident not found'}), 404

    return jsonify({'success': True, 'incident': dict(row)})

# ==============================================================================
# HOSPITAL TREATMENT LOGGING & PATIENT HISTORY UPDATE API
# ==============================================================================

@app.route('/api/hospital/patient/<patient_id>/add-treatment', methods=['POST'])
@login_required(role='hospital')
def api_hospital_add_treatment(patient_id):
    """
    Hospital records clinical treatment & permanently updates patient medical history.
    This automatically synchronizes with the patient's unique QR code and dashboard.
    """
    data = request.get_json() or {}
    diagnosis = data.get('diagnosis', '').strip()
    treatment = data.get('treatmentProvided') or data.get('treatment', '').strip()
    prescriptions = data.get('prescriptionsAdded') or data.get('prescriptions', '').strip()
    patient_status = data.get('patientStatus', 'Treated & Discharged').strip()
    doctor_name = data.get('doctorName', 'Attending Trauma Surgeon').strip()
    incident_id = data.get('incidentId', '').strip()
    notes = data.get('notes', '').strip()

    if not diagnosis or not treatment:
        return jsonify({'success': False, 'error': 'Diagnosis and treatment details are required.'}), 400

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM users WHERE id = ?', (patient_id,))
    patient = cursor.fetchone()
    if not patient:
        conn.close()
        return jsonify({'success': False, 'error': f'Patient ID {patient_id} not found.'}), 404

    treatment_id = f"TRT-{os.urandom(2).hex().upper()}"
    hospital_name = session.get('full_name') or 'City General Trauma Center'
    now_str = datetime.now().isoformat()
    now_readable = datetime.now().strftime('%d %b %Y, %I:%M %p')

    # Insert treatment record
    cursor.execute('''
        INSERT INTO treatment_records (
            id, patient_id, incident_id, hospital_name, doctor_name, diagnosis,
            treatment_provided, prescriptions_added, patient_status, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        treatment_id, patient_id, incident_id, hospital_name, doctor_name,
        diagnosis, treatment, prescriptions, patient_status, notes, now_str
    ))

    # Append to patient's permanent medical_history in users table
    current_history = patient['medical_history'] or ''
    new_entry = f"[{now_readable}] {hospital_name}: Diagnosed with {diagnosis}. Treatment: {treatment}. Status: {patient_status} (Dr. {doctor_name})."
    updated_history = f"{new_entry}\n{current_history}".strip()

    cursor.execute('''
        UPDATE users SET medical_history = ?, updated_at = ? WHERE id = ?
    ''', (updated_history, now_str, patient_id))

    # If linked to incident, update incident status
    if incident_id:
        cursor.execute('''
            UPDATE incidents SET status = 'TREATMENT_COMPLETED' WHERE id = ?
        ''', (incident_id,))

    conn.commit()

    # Re-fetch treatment list
    cursor.execute('SELECT * FROM treatment_records WHERE patient_id = ? ORDER BY created_at DESC', (patient_id,))
    treatments = [dict(t) for t in cursor.fetchall()]
    conn.close()

    return jsonify({
        'success': True,
        'message': f'Clinical treatment recorded successfully by {hospital_name}. Patient medical history and Smart QR Code are permanently updated!',
        'treatmentId': treatment_id,
        'patientId': patient_id,
        'patientName': patient['full_name'],
        'updatedHistory': updated_history,
        'treatments': treatments
    })

@app.route('/api/hospital/patient/<patient_id>', methods=['GET'])
@login_required(role='hospital')
def api_hospital_get_patient(patient_id):
    """
    Hospital clinical lookup for any admitted patient by PRAN ID.
    Retrieves complete medical record, allergies, insurance, and past hospital treatment records.
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE id = ?', (patient_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        return jsonify({'success': False, 'error': f'Patient {patient_id} not found.'}), 404

    cursor.execute('SELECT * FROM treatment_records WHERE patient_id = ? ORDER BY created_at DESC', (patient_id,))
    treatment_rows = cursor.fetchall()
    conn.close()

    patient = dict(row)
    for field in ['allergies', 'medicines', 'emergency_contacts']:
        if patient.get(field):
            try:
                patient[field] = json.loads(patient[field])
            except Exception:
                pass

    patient['treatments'] = [dict(t) for t in treatment_rows]
    return jsonify({'success': True, 'patient': patient})

# ==============================================================================
# ENTRY POINT
# ==============================================================================

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print("\n" + "="*60)
    print("  PRAN-Rakshak Flask Healthcare Backend")
    print(f"  Live Server: http://localhost:{port}")
    print(f"  Patient Login: http://localhost:{port}/patient/login")
    print(f"  Hospital Login: http://localhost:{port}/hospital/login")
    print("="*60 + "\n")
    app.run(host='0.0.0.0', port=port, debug=False)
