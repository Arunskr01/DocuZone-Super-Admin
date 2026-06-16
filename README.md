# Super Admin Customer Management System

This is a full-stack web application designed for administrators to manage **Customers** (organizations/tenants) and their corresponding **Users**. It serves as an administrative control panel to orchestrate client entities, user credentials, and monitor API/model consumption.

## 🚀 Technology Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database Driver**: `pyodbc` (connecting to Microsoft SQL Server)
- **Data Validation**: Pydantic
- **Server**: Uvicorn

### Frontend
- **Framework**: React (TypeScript)
- **Build Tool**: Vite
- **Styling**: TailwindCSS & PostCSS
- **State Management & Fetching**: React Query (`@tanstack/react-query`)
- **Routing**: React Router DOM (`react-router-dom`)
- **UI Components**: Shadcn UI
- **Charts**: Recharts

## 📁 Directory Structure

```text
SuperAdmin/
├── .env                       # Database connection credentials
├── requirements.txt           # Python dependency file
├── start.bat                  # Batch script to launch both frontend and backend
├── backend/                   # FastAPI backend application
│   ├── database.py            # SQL Server database connection & driver setup
│   ├── main.py                # FastAPI app instances, CORS middleware, and API endpoints
│   └── schemas.py             # Pydantic schemas for request validation & API responses
└── frontend/                  # React Vite frontend application
    ├── src/
    │   ├── api.ts             # API client functions using fetch()
    │   ├── pages/
    │   │   ├── CustomerList.tsx    # Customer dashboard, grid view, create/edit modals
    │   │   ├── CustomerDetails.tsx # Detailed view of a customer (Billing & Users)
    │   │   └── CustomerUsers.tsx   # User management for a specific customer
    │   └── ...
    └── ...
```

## 🛠️ Features

- **Customer Management**: Create, read, update, and delete customer (tenant) records.
- **User Management**: Add, update, and remove users under a specific customer, including assigning roles and verifying active statuses.
- **Billing Dashboard**: Track and visualize the processing consumption (total documents and total pages) for different models and projects configured per customer.
- **Interactive Charts**: Day-by-day trend analysis of documents and pages processed using interactive area charts.

## ⚙️ How to Run

1. **Database Configuration**:
   Ensure your `.env` file is present in the root directory with the correct Microsoft SQL Server credentials:
   ```env
   DB_SERVER=...
   DB_NAME=...
   DB_USER=...
   DB_PASSWORD=...
   ```

2. **Start the Application**:
   Simply run the `start.bat` script located in the root directory. This script will automatically:
   - Activate the Python virtual environment (`venv`).
   - Boot up the FastAPI backend via `uvicorn` on port `8000`.
   - Start the Vite React development server for the frontend.

## 📝 Prerequisites

- Python 3.8+
- Node.js (v18+)
- Microsoft SQL Server (with the appropriate ODBC driver installed, e.g., ODBC Driver 17)
