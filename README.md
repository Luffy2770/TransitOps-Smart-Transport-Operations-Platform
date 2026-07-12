# TransitOps — Smart Transport Operations Platform

TransitOps is a modern, high-fidelity, and premium fleet dispatch and smart transport management platform. It provides real-time telemetry, role-based operations control, vehicle analytics, automated workflows, and comprehensive expense tracking.

---

## 🚀 Key Features

*   **📊 Real-time Dashboard & Telemetry**: KPI grids monitoring revenue, costs, profit margins, active fleet count, safety scores, and utilization rates.
*   **🌓 Sleek Dark Mode**: Premium, dynamic dark mode system that toggles instantly, persisting preferences using HTML classes and `localStorage`.
*   **🔐 Authentication with RBAC**: Secure credential verification utilizing `bcrypt` hashing with backend path protection for roles:
    *   *Fleet Manager* (Full administration & CRUD)
    *   *Dispatcher* (Trip creation and fleet coordination)
    *   *Safety Officer* (Safety monitoring & compliance)
    *   *Financial Analyst* (Cost structure analysis & CSV/PDF exports)
*   **🚛 Fleet & Driver Directory**: Full CRUD registries for Vehicles (Trucks, Vans, Minis) and Drivers, with advanced searching, filtering, and multi-column sorting.
*   **📂 Vehicle Document Management**: Built-in document vault to upload, track, and download registration, insurance, emission, and permit documents.
*   **⚠️ Expiry Licenses & Email Reminders**: Automated checks notifying dispatcher/manager on expired driver licenses or items expiring in 30 days, with one-click email reminder triggers.
*   **🛣️ Dynamic Trip Dispatching**: Custom routing and dispatch forms with live checks preventing double-assignment of busy vehicles/drivers or overloading of cargo capacity.
*   **⚙️ Maintenance Workflow**: Services module tracking active maintenance (moves vehicle status to "In Shop") and auto-restoring availability once service is closed.
*   **⛽ Expense & Fuel Ledger**: Fuel purchase registry tracks liters, rate per liter ($/L), and total cost, syncing directly with the financial system.
*   **📈 Recharts Financial Analytics**: Stacked bar comparison charts and expense structure donut diagrams reflecting return on investment (ROI) calculations:
    $$\text{ROI \%} = \frac{\text{Revenue} - (\text{Maintenance Costs} + \text{Fuel Costs})}{\text{Acquisition Cost}} \times 100$$
*   **📄 Direct Data Export**: Direct downloads of financial telemetry as raw CSV or high-fidelity, print-optimized PDF reports.

---

## 🛠️ Technology Stack

### Backend
*   **FastAPI**: Modern, high-performance web framework for APIs.
*   **SQLAlchemy / SQLite**: Object-relational mapping with persistent SQL storage.
*   **Pydantic**: Data validation and setting management.
*   **Bcrypt**: Robust password-hashing encryption.

### Frontend
*   **React 19 + Vite**: Next-generation frontend build tooling and framework.
*   **TailwindCSS v4**: Modern CSS utility layout engines.
*   **Recharts**: SVG chart library for React.
*   **Lucide React**: Clean and elegant iconography.
*   **jsPDF**: Direct client-side PDF document generation.

---

## ⚙️ Quick Start

### 1. Root Directory Setup
The workspace is structured into standalone `backend` and `frontend` folders:
```text
TransitOps-Smart-Transport-Operations-Platform/
├── backend/            # FastAPI Python server
├── frontend/           # React Vite application
├── transitops.db       # SQLite Database file
└── start.bat           # Quickstart automation script
```

You can use the root-level script `start.bat` on Windows to boot both services simultaneously.

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Initialize and seed the database:
   ```bash
   python -m app.database.seed
   ```
4. Start the Uvicorn ASGI server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend will run on `http://localhost:8000`.

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Boot the Vite hot-reloading development server:
   ```bash
   npm run dev
   ```
   The application will run on `http://localhost:5174` (or port `5173`).

---

## 🧪 Running Integration Tests
TransitOps features a robust integration suite validating backend route logic, database models, and RBAC constraints:
```bash
cd backend
pytest test_endpoints.py
```
