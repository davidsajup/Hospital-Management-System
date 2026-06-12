# Hospital Management System (HMS)

A comprehensive web-based Hospital Management System built with Django, designed to streamline hospital operations by managing patients, doctors, and appointments through a multi-role interface.

## 🚀 Features

### 👤 Patient Portal
- **Self-Registration & Login:** Secure account creation for new patients.
- **Appointment Booking:** Schedule appointments with specific doctors.
- **Profile Management:** Update personal details, contact information, and medical details (gender, blood group, etc.).
- **Appointment Tracking:** View appointment history and status (Pending/Completed).

### 👨‍⚕️ Doctor Portal
- **Dashboard:** Overview of pending and total appointments.
- **Appointment Management:** View details of assigned patients and update appointment status or add medical notes.
- **Professional Profile:** Manage professional details such as education and department.

### 🛡️ Admin Dashboard
- **Comprehensive Overview:** Real-time statistics on total patients, doctors, and appointments.
- **Doctor Management:** Full CRUD operations (Add, View, Edit, Delete) for medical staff.
- **Patient Management:** Full CRUD operations for patient records.
- **Centralized Appointment Control:** Ability to book and manage appointments for any patient and doctor.

## 🛠️ Tech Stack
- **Backend:** Python, Django
- **Frontend:** HTML5, CSS3, JavaScript, Bootstrap 5
- **Database:** SQLite (Default)
- **Utilities:** Django Widget Tweaks

## ⚙️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd hms
   ```

2. **Create a virtual environment (optional but recommended):**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Dependencies:**
   ```bash
   pip install django django-widget-tweaks
   ```

4. **Apply Migrations:**
   ```bash
   python manage.py migrate
   ```

5. **Create an Admin Account:**
   ```bash
   python manage.py createsuperuser
   ```

6. **Run the Server:**
   ```bash
   python manage.py runserver
   ```

Access the application at `davidsajup.pythonanywhere.com)`.

## 📁 Project Structure
- `hospitalsystem/`: Core project settings and configuration.
- `managementsystem/`: Main application logic, including models, views, and forms.
- `uploads/`: Directory for user-uploaded photos (doctors and patients).
- `static/`: Custom CSS and image assets.
- `templates/`: Organized by role (admin, doctor, patient) and common components.
