# EpilepticAI Backend API

![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)
![Docker](https://img.shields.io/badge/Docker-ready-blue.svg)

A comprehensive backend API for epilepsy monitoring and seizure prediction, built with FastAPI, PostgreSQL, and AI/ML capabilities.

## 🌟 Features

- **User Management System** with role-based access control (Admin, Patient, Doctor)
- **Real-time Seizure Prediction** using AI/ML algorithms
- **Biometric Data Tracking** (heart rate, stress levels, sleep patterns)
- **Alert System** for emergency notifications
- **Medication Management** and scheduling
- **Doctor-Patient Relationship** management
- **Emergency Contact** system
- **RESTful API** with automatic documentation (Swagger/OpenAPI)
- **JWT Authentication** with secure password hashing
- **PostgreSQL Database** with SQLAlchemy ORM
- **Redis Caching** for improved performance
- **Celery Background Tasks** for async operations
- **Docker Support** for easy deployment

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [User Roles](#user-roles)
- [Default Admin Account](#default-admin-account)
- [Project Structure](#project-structure)
- [Database Migrations](#database-migrations)
- [Testing](#testing)
- [API Endpoints](#api-endpoints)

## 🚀 Prerequisites

- **Python 3.11+**
- **PostgreSQL 15+**
- **Redis** (for caching and background tasks)
- **Docker & Docker Compose** (optional, recommended)

## 📦 Installation

### Using Docker (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Chaaamah/EpilepticAI-Backend.git
   cd EpilepticAI-Backend
   ```

2. **Start all services:**
   ```bash
   docker-compose up -d
   ```

3. **Access the API:**
   - API: http://localhost:8000
   - Swagger Docs: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc
   - pgAdmin: http://localhost:5050

### Manual Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Chaaamah/EpilepticAI-Backend.git
   cd EpilepticAI-Backend
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up PostgreSQL:**
   ```bash
   createdb epileptic_ai
   ```

5. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

6. **Run migrations:**
   ```bash
   alembic upgrade head
   ```

7. **Start the server:**
   ```bash
   uvicorn app.main:app --reload
   ```

## 🏃 Running the Application

### With Docker:
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Without Docker:
```bash
# Start the FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Start Redis (separate terminal)
redis-server

# Start Celery worker (separate terminal)
celery -A app.tasks.celery_app worker --loglevel=info
```

## 📚 API Documentation

Once the application is running, visit:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## 👥 User Roles & Permissions

The system supports three user roles with specific permissions:

### 1. **Admin**

- Full system access and user management
- Can create, read, update, and delete both patients and doctors
- Access to all system statistics and analytics
- Manage all users through the `/api/v1/users` endpoints

### 2. **Doctor**

- Can create new patients with login credentials
- Full CRUD access to patient records (create, read, update, delete)
- Can view all patients in the system
- Patients created by doctors are auto-verified
- Access through `/api/v1/doctors/patients` endpoints

### 3. **Patient**

- Access only to personal health data, biometrics, and seizure logs
- Can update personal profile information
- Can add/remove emergency contacts from iPhone contacts app
- **Cannot self-register** - must be created by a doctor
- Login credentials provided by their doctor

## 🔐 Default Admin Account

After initial setup, a default admin account is created:

```
Email: admin@epilepticai.com
Password: Admin123@
```

**⚠️ IMPORTANT:** Change this password immediately in production!

## 📁 Project Structure

```
EpilepticAI-Backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── auth.py          # Authentication endpoints
│   │       ├── users.py         # User management (Admin)
│   │       ├── patients.py      # Patient endpoints
│   │       ├── doctors.py       # Doctor endpoints
│   │       ├── biometrics.py    # Biometric data
│   │       ├── seizures.py      # Seizure logs
│   │       ├── medications.py   # Medication management
│   │       ├── alerts.py        # Alert system
│   │       ├── predictions.py   # AI predictions
│   │       └── emergency.py     # Emergency contacts
│   ├── core/
│   │   ├── config.py           # Configuration
│   │   ├── security.py         # Authentication & security
│   │   └── database.py         # Database setup
│   ├── models/                 # SQLAlchemy models
│   ├── schemas/                # Pydantic schemas
│   ├── services/               # Business logic
│   ├── tasks/                  # Celery tasks
│   ├── utils/                  # Utilities
│   └── main.py                 # Application entry point
├── alembic/                    # Database migrations
├── tests/                      # Unit & integration tests
├── docker-compose.yml          # Docker orchestration
├── Dockerfile                  # Docker image
├── requirements.txt            # Python dependencies
└── .env                        # Environment variables
```

## 🗄️ Database Migrations

Using Alembic for database migrations:

```bash
# Create a new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# View migration history
alembic history
```

## 🧪 Testing

Run tests with pytest:

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/test_auth.py
```

## 🛣️ API Endpoints

### Authentication

- `POST /api/v1/auth/login` - Unified login for all user types (admin, doctor, patient)
- `POST /api/v1/auth/register/doctor` - Register new doctor (Admin only)
- `GET /api/v1/auth/me` - Get current user info

### User Management (Admin Only)

- `GET /api/v1/users/` - List all users (with filters & pagination)
- `GET /api/v1/users/stats` - Get user statistics
- `GET /api/v1/users/{id}` - Get specific user
- `POST /api/v1/users/` - Create new user (any role)
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete/deactivate user
- `POST /api/v1/users/{id}/verify` - Verify user account
- `POST /api/v1/users/{id}/activate` - Activate user

### Patient Management (Doctor & Admin)

- `POST /api/v1/doctors/patients` - Create new patient (Doctor only)
- `GET /api/v1/doctors/patients` - List all patients (Doctor only)
- `GET /api/v1/doctors/patients/{id}` - Get patient details (Doctor only)
- `PUT /api/v1/doctors/patients/{id}` - Update patient (Doctor only)
- `DELETE /api/v1/doctors/patients/{id}` - Delete patient (Doctor only)

### Patient Self-Service (Patient Only)

- `GET /api/v1/patients/me` - Get own profile
- `PUT /api/v1/patients/me` - Update own profile
- `POST /api/v1/patients/me/emergency-contacts` - Add emergency contact
- `DELETE /api/v1/patients/me/emergency-contacts/{index}` - Remove emergency contact

### Doctors

- `GET /api/v1/doctors/` - List active doctors (Public)
- `GET /api/v1/doctors/me` - Get current doctor profile
- `GET /api/v1/doctors/{id}` - Get doctor details (Public)

### Biometrics
- `POST /api/v1/biometrics/` - Record biometric data
- `GET /api/v1/biometrics/patient/{id}` - Get patient biometrics

### Seizures
- `POST /api/v1/seizures/` - Log seizure event
- `GET /api/v1/seizures/patient/{id}` - Get seizure history

### Predictions
- `POST /api/v1/predictions/` - Create prediction
- `GET /api/v1/predictions/patient/{id}` - Get predictions

### Alerts
- `GET /api/v1/alerts/` - List alerts
- `POST /api/v1/alerts/` - Create alert
- `PUT /api/v1/alerts/{id}/acknowledge` - Acknowledge alert

## 🔒 Security Features

- **JWT Authentication** with secure token generation
- **bcrypt Password Hashing** with automatic truncation for bcrypt limits
- **Role-Based Access Control (RBAC)**
- **CORS Protection** with configurable origins
- **SQL Injection Protection** via SQLAlchemy ORM
- **Rate Limiting** (configurable)
- **HTTPS Support** (in production)

## 🚢 Deployment

### Docker Production Deployment

1. **Update environment variables** for production
2. **Change default passwords**
3. **Set DEBUG=False**
4. **Use strong SECRET_KEY**
5. **Configure HTTPS**

```bash
# Build production image
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 Monitoring

- **Health Check**: `GET /health`
- **Version Info**: `GET /version`
- **Database Connection Pool** monitoring via SQLAlchemy

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- FastAPI framework
- SQLAlchemy ORM
- PostgreSQL database
- Docker for containerization
- All contributors and testers

---

**Made with ❤️ for epilepsy patients and healthcare providers**
