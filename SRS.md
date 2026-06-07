# SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
## My HR & Payroll Management System (Enterprise-Grade)

---

### TABLE OF CONTENTS
1. [System Architecture](#1-system-architecture)
2. [Database Design & ER Diagram](#2-database-design--er-diagram)
3. [Module Breakdown](#3-module-breakdown)
4. [API Documentation](#4-api-documentation)
5. [Folder Structure](#5-folder-structure)
6. [UI Wireframes & Layout Design](#6-ui-wireframes--layout-design)
7. [User Flow Diagrams](#7-user-flow-diagrams)
8. [Payroll Calculation Engine](#8-payroll-calculation-engine)
9. [Security Architecture](#9-security-architecture)
10. [Deployment & DevOps Architecture](#10-deployment--devops-architecture)
11. [Production Deployment Guide](#11-production-deployment-guide)
12. [Development Roadmap](#12-development-roadmap)

---

### 1. SYSTEM ARCHITECTURE

The My HR & Payroll Enterprise System follows a high-performance **3-Tier Layered Architecture** optimized for strict resource management, multi-role operations, and absolute ledger consistency.

```
       +--------------------------------------------------------+
       |                  CLIENT TIER (React)                   |
       |  - UI State Management                                 |
       |  - Role-Switched Portals (Super Admin to Employee)     |
       |  - Automated Micro-Interactions (Frictionless check-in)|
       +--------------------------------------------------------+
                                   |
                                   | REST Requests / SSE / JSON API
                                   v
       +--------------------------------------------------------+
       |              APPLICATION TIER (Express.ts)             |
       |  - Secure Controller Gateways                          |
       |  - Statutory Payroll & APIT Tax Engines                |
       |  - Audit Log Ledger Interceptor (writeAudit hook)      |
       |  - Strict Role-Based Access Control Checks (RBAC)      |
       +--------------------------------------------------------+
                                   |
                                   | Data Persistence Mappings
                                   v
       +--------------------------------------------------------+
       |               DATA TIER (In-Memory / SQL)              |
       |  - Thread-Safe Transactions                            |
       |  - Double-Entry Posting Ledgers                       |
       |  - Automated Roster Integrity Checks                   |
       +--------------------------------------------------------+
```

#### Layer Functions:
- **Presentation Layer**: Built on **React 19** and **Vite**, utilising Tailwind CSS utility classes and Lucide-react graphic components. Performs client-side validation rules and manages seamless role switching between Admin contexts and Employee self-service views.
- **Application Layer**: An **Express.ts** core serving as the control node. It intercepts every payload, validates data types, calculates statutory contributions (EPF, ETF), adjusts tax tiers, and registers every write action to a security ledger with actor contexts and host IPs.
- **Data Persistence Layer**: Features dynamic indexing of database relations (Roster, Clockings, Furlough Requests, Subsidies, Vouchers). Preserves strict identity integrity with referential cascaded lookups.

---

### 2. DATABASE DESIGN & ER DIAGRAM

#### Entity Relationship Concept Model:

```
    +-------------------+           1:N           +---------------------+
    |     EMPLOYEES     |------------------------>|     ATTENDANCE      |
    | (PK: id)          |                         | (PK: id, FK: empId) |
    +-------------------+                         +---------------------+
              |
              | 1:N
              +--------------------------+
              |                          |
              v 1:N                      v 1:N
    +-------------------+       +---------------------+
    |  LEAVE_REQUESTS   |       |      PAYSLIPS       |
    | (PK: id, FK: emp) |       | (PK: id, FK: empId) |
    +-------------------+       +---------------------+
              |                            |
              | N:1                        v 1:1
              |                 +---------------------+
              |                 |   LEDGER_ENTRIES    |
              |                 | (PK: id, FK: linkId)|
              |                 +---------------------+
              v 1:N                        ^
    +-------------------+                  |
    |  WELFARE_CLAIMS   |------------------+
    | (PK: id, FK: emp) |     1:1 Ledger Mapping
    +-------------------+
```

#### Table Structures, Constraints & Specifications:

##### A. Table: `employees`
Stores official staff records and structural information.
- `id` (VARCHAR(30) PRIMARY KEY / Unique Identifier): Starts with `EMP-`
- `name` (VARCHAR(150), NOT NULL)
- `designation` (VARCHAR(100), NOT NULL)
- `department` (VARCHAR(105), NOT NULL): Support "Engineering", "HR", "Operations", "Finance", "Sales"
- `baseSalary` (DECIMAL(12,2), NOT NULL): Minimum must be >= 0.00
- `role` (VARCHAR(50), NOT NULL): Linked to the RBAC authorization schema (e.g. `SUPER_ADMIN`, `HR_MANAGER`, `EMPLOYEE`)
- `status` (VARCHAR(30), DEFAULT 'Active'): Values: `Active`, `On Leave`, `Suspended`, `Terminated`
- `isDeleted` (BOOLEAN, DEFAULT FALSE): Used for auditing and safety undeletion
- `deletedAt` (TIMESTAMP, NULL)

##### B. Table: `attendance`
Maintains check-in and checkout timestamps.
- `id` (VARCHAR(30) PRIMARY KEY): Starts with `ATT-`
- `employeeId` (VARCHAR(30) FOREIGN KEY REFERENCES `employees(id)`)
- `employeeName` (VARCHAR(150))
- `date` (VARCHAR(15), NOT NULL): Format: `YYYY-MM-DD`
- `clockIn` (VARCHAR(30), NOT NULL): Standard ISO timestamp
- `clockOut` (VARCHAR(30), NULL): Standard ISO timestamp
- `status` (VARCHAR(30), DEFAULT 'On Time'): Values: `On Time`, `Late`, `Absent`
- `approvedAmount` (DECIMAL(12,2), DEFAULT 0.00): Used for overtime calculations
- `notes` (TEXT, NULL)

##### C. Table: `leaves`
Tracks vacation, emergency, short-term furloughs, carry Forwards, and encashment plans.
- `id` (VARCHAR(30) PRIMARY KEY): Starts with `LV-`
- `employeeId` (VARCHAR(30) FOREIGN KEY REFERENCES `employees(id)`)
- `employeeName` (VARCHAR(150))
- `startDate` (VARCHAR(15), NOT NULL)
- `endDate` (VARCHAR(15), NOT NULL)
- `days` (INTEGER, NOT NULL): Number of days requested
- `type` (VARCHAR(30), NOT NULL): Values: `Annual`, `Casual`, `Medical`, `Maternity`, `Unpaid`
- `status` (VARCHAR(30), DEFAULT 'Pending'): Values: `Pending`, `Approved`, `Rejected`
- `managerApproval` (VARCHAR(30), DEFAULT 'Pending')
- `hrApproval` (VARCHAR(30), DEFAULT 'Pending')
- `approvedBy` (VARCHAR(100), NULL)
- `comments` (TEXT, NULL)

##### D. Table: `payslips`
Contains complex calculated financial records for monthly payroll periods.
- `id` (VARCHAR(30) PRIMARY KEY): Starts with `PAY-`
- `employeeId` (VARCHAR(30) FOREIGN KEY REFERENCES `employees(id)`)
- `employeeName` (VARCHAR(150))
- `month` (VARCHAR(15), NOT NULL): Format: `YYYY-MM`
- `baseSalary` (DECIMAL(12,2), NOT NULL)
- `allowances` (DECIMAL(12,2), DEFAULT 0.00)
- `overtimePay` (DECIMAL(12,2), DEFAULT 0.00)
- `bonuses` (DECIMAL(12,2), DEFAULT 0.00)
- `advancesDeduction` (DECIMAL(12,2), DEFAULT 0.00): Deducted salary advances
- `recoveriesDeduction` (DECIMAL(12,2), DEFAULT 0.00): Store purchasing deductions
- `epfEmployeeDeduction` (DECIMAL(12,2), NOT NULL): Statutory 12% employee cut
- `apitDeduction` (DECIMAL(12,2), DEFAULT 0.00): Income Tax tier subtraction
- `grossEarnings` (DECIMAL(12,2), NOT NULL)
- `totalDeductions` (DECIMAL(12,2), NOT NULL)
- `netSalary` (DECIMAL(12,2), NOT NULL)
- `epfEmployerContribution` (DECIMAL(12,2), NOT NULL): Statutory 15% employer payment
- `etfEmployerContribution` (DECIMAL(12,2), NOT NULL): Statutory 3% ETF employer payment
- `status` (VARCHAR(30), DEFAULT 'Draft'): Values: `Draft`, `Approved`, `Locked`

##### E. Table: `ledger_entries`
Consolidated transaction records for clear corporate auditing trails. Supports double-entry bookkeeping validation.
- `id` (VARCHAR(30) PRIMARY KEY): Starts with `LED-`
- `timestamp` (VARCHAR(30), NOT NULL): ISO Format
- `type` (VARCHAR(30), NOT NULL): Values: `Debit` (Expenditure / Paid cash), `Credit` (Receivable / Deduction offset)
- `category` (VARCHAR(50), NOT NULL): Values: `Payroll Payout`, `Salary Advance`, `Welfare Disbursement`, `Store Purchase Deduction`
- `amount` (DECIMAL(12,2), NOT NULL)
- `referenceId` (VARCHAR(50), NOT NULL): Link back to Payslip, Advance, or Welfare claim ID
- `employeeName` (VARCHAR(150), NOT NULL)
- `description` (TEXT, NOT NULL)

##### F. Table: `audit_logs`
Cryptographically mapped read-only security records mapping all write changes.
- `id` (VARCHAR(30) PRIMARY KEY): Starts with `AUD-`
- `timestamp` (VARCHAR(30), NOT NULL)
- `actorRole` (VARCHAR(50), NOT NULL)
- `actorName` (VARCHAR(150), NOT NULL)
- `module` (VARCHAR(100), NOT NULL): e.g. "Employee Registry", "Leave Management", "Automated Payroll"
- `action` (VARCHAR(50), NOT NULL): Values: `Create`, `Update`, `Delete`, `Approve`, `Reject`, `Login`, `Logout`
- `details` (TEXT, NOT NULL)
- `status` (VARCHAR(15), DEFAULT 'Success'): Values: `Success`, `Failure`
- `ipAddress` (VARCHAR(50))
- `oldValue` (TEXT, NULL): JSON block of previous state
- `newValue` (TEXT, NULL): JSON block of updated state

#### SQL Table Indexes:
To optimize query response rates on enterprise directories, the following secondary structural indexes are established:
1. `idx_employees_status_deleted`: `CREATE INDEX idx_emp_st_del ON employees(status, isDeleted);`
2. `idx_attendance_emp_date`: `CREATE INDEX idx_att_emp_dt ON attendance(employeeId, date);`
3. `idx_payslips_month`: `CREATE INDEX idx_pay_mnth ON payslips(month);`
4. `idx_ledger_ref`: `CREATE INDEX idx_ldg_ref ON ledger_entries(referenceId);`
5. `idx_audit_timestamp`: `CREATE INDEX idx_aud_tms ON audit_logs(timestamp DESC);`

---

### 3. MODULE BREAKDOWN

```
               +-------------------------------------------------+
               |             HR PORTAL CONTROL HUB               |
               +-------------------------------------------------+
                 /          |           |            |         \
                /           |           |            |          \
  +------------+   +------------+ +------------+ +------------+  +------------+
  | Personnel  |   | Attendance | | Leaves &   | | Automated  |  | Security & |
  | Directory  |   | Tracker    | | Furloughs  | | Payroll    |  | Auditing   |
  +------------+   +------------+ +------------+ +------------+  +------------+
  - Profile Reg    - Realtime   - Multi-Level  - EPF 12%/15%  - RBAC Switch
  - Salary Setup   - Shift Stat   Approvals    - APIT Tiers   - State Log
  - Status Tag     - Overtimes  - Encashment   - Ledger sync  - Payload Pre
```

#### A. Personnel/Employee Directory
- **Functional Scope**: Complete register of staff profiles including identity, role groups, and monthly salaries. It manages standard soft-deletions to prevent historical ledger corruption when someone leaves.
- **Key Constraints**: Prevents duplication of Employee names and enforce the presence of base salary configurations.

#### B. Attendance Core
- **Functional Scope**: Interactive clock for day punching. Calculates early arrival points, late arrivals, and overtimes based on a normalized standard 8-hour shift structure.
- **Key Constraints**: Restricts staff to one check-in punch per day.

#### C. Leaves & Furloughs Board
- **Functional Scope**: A state-machine tracking leave applications. Incorporates multi-level approval workflows where Branch Managers carry out first-line triage, followed by ultimate verification by the HR Manager. Supports dynamic Leave Encashment calculations and balances.
- **Key Constraints**: Rejects leave overlaps where end date precedes start date.

#### D. Automated Payroll Engine
- **Functional Scope**: Compiles gross earnings, calculating EPF/ETF contributions, and APIT tax deductions. Also triggers automatic, real-time double-entry credit/debit posts to the central Employee Ledger when a payslip moves from "Draft" status to "Locked".
- **Key Constraints**: Payslips cannot be modified or deleted once they have been marked as `Locked`.

#### E. Security, Auditing & Control Gates
- **Functional Scope**: Implements customized access permissions suited to 7 discrete role personas. Logs historical audit actions including pre-and-post change state details, which are formatted into readable JSON objects alongside host IP credentials.

---

### 4. API DOCUMENTATION

#### 1. Appoint Staff Profile
* **HTTP Method**: `POST`
* **Route**: `/api/employees`
* **Headers**: `Content-Type: application/json`
* **JSON Request Payload**:
  ```json
  {
    "name": "Arjun Wijesinghe",
    "designation": "Staff Engineer L2",
    "department": "Engineering",
    "baseSalary": 245000,
    "role": "EMPLOYEE",
    "status": "Active"
  }
  ```
* **Validation Rules**:
  - `name`: Must be string between 2 and 150 characters, cannot be empty.
  - `baseSalary`: Must be a valid positive float limit.
  - `role`: Must fit a declared system role (`Role` enum).
* **JSON Response Output (`201 Created`)**:
  ```json
  {
    "message": "Employee appointed successfully",
    "employee": {
      "id": "EMP-384918",
      "name": "Arjun Wijesinghe",
      "designation": "Staff Engineer L2",
      "department": "Engineering",
      "baseSalary": 245000,
      "role": "EMPLOYEE",
      "status": "Active"
    }
  }
  ```

#### 2. Apply for Leave Request
* **HTTP Method**: `POST`
* **Route**: `/api/leaves`
* **JSON Request Payload**:
  ```json
  {
    "employeeId": "EMP-384918",
    "startDate": "2026-06-10",
    "endDate": "2026-06-15",
    "type": "Annual",
    "comments": "Sabbatical family leave"
  }
  ```
* **JSON Response Output (`201 Created`)**:
  ```json
  {
    "message": "Leave application recorded",
    "leave": {
      "id": "LV-194058",
      "employeeId": "EMP-384918",
      "employeeName": "Arjun Wijesinghe",
      "startDate": "2026-06-10",
      "endDate": "2026-06-15",
      "days": 5,
      "type": "Annual",
      "status": "Pending",
      "managerApproval": "Pending",
      "hrApproval": "Pending"
    }
  }
  ```

#### 3. Update Leave Status (Workflow Decision)
* **HTTP Method**: `PUT`
* **Route**: `/api/leaves/:id`
* **JSON Request Payload**:
  ```json
  {
    "action": "HrApprove",
    "actorName": "Dilshan Fernando",
    "actorRole": "HR_MANAGER",
    "comments": "Cleared by HR Management"
  }
  ```
* **JSON Response Output (`200 OK`)**:
  ```json
  {
    "message": "Leave decision recorded successfully",
    "leave": {
      "id": "LV-194058",
      "status": "Approved",
      "hrApproval": "Approved",
      "hrApprovedBy": "Dilshan Fernando",
      "hrApprovedAt": "2026-06-06T08:15:30.000Z"
    }
  }
  ```

#### 4. Lock Monthly Payslip Ledger
* **HTTP Method**: `POST`
* **Route**: `/api/payroll/:id/lock`
* **JSON Request Payload**:
  ```json
  "No payload body required (Path ID parameter drives state machine)"
  ```
* **JSON Response Output (`200 OK`)**:
  ```json
  {
    "message": "Payslip locked and ledger posted",
    "payslip": {
      "id": "PAY-702319",
      "status": "Locked",
      "netSalary": 185002.50
    },
    "ledgerEntry": {
      "id": "LED-91048",
      "type": "Debit",
      "category": "Payroll Payout",
      "amount": 185002.50,
      "referenceId": "PAY-702319",
      "description": "Posted salary payment for pay cycle 2026-06 of Arjun Wijesinghe"
    }
  }
  ```

---

### 5. FOLDER STRUCTURE

The workspace strictly enforces modular alignment of responsibilities:

```
├── .env.example                  # Environmental variables schema blueprints
├── metadata.json                 # Core system descriptor and capability configs
├── package.json                  # Script execution configurations and engine matrices
├── server.ts                     # REST Server Control plane with mock state engines
├── src
│   ├── App.tsx                   # Main layout container and central state manager
│   ├── index.css                 # Master Tailwind theme variables and typography mappings
│   ├── main.tsx                  # Document Mount orchestrator
│   ├── types.ts                  # Shared types, structs, and domain enums
│   ├── components
│   │   ├── EmployeeModule.tsx    # Personnel record panels and soft deletes
│   │   ├── AttendanceModule.tsx  # Dynamic timecards and shifts
│   │   ├── LeaveModule.tsx       # State-machine leave approval logic
│   │   ├── PayrollModule.tsx     # Salary and APIT tax calculators
│   │   ├── FinancialsModule.tsx  # Advances and claim files
│   │   ├── PerformanceModule.tsx # Appraisal sheets with smart coaching feedback
│   │   ├── SecurityModule.tsx    # RBAC configuration and audit inspector
│   │   ├── SrsSpecsModule.tsx    # Interactive architecture specs board
│   │   ├── LedgerModule.tsx      # Multi-voucher accounting ledgers
│   │   ├── ReportingModule.tsx   # Dashboard analytics and charts
│   │   └── NotificationsModule.ts# Bulletin broadcasts
│   └── data
│       └── mockData.ts           # Mock entries and role assignments
```

---

### 6. UI WIREFRAMES & LAYOUT DESIGN

```
+-----------------------------------------------------------------------------+
|  LOGO   MY HR & PAYROLL SYSTEM  [Active Role: HR Manager v] [Refresh]       |
+-----------------------------------------------------------------------------+
| CORE MODELS  |                                                              |
| > Personnel  | +---------------------------------------------------------+  |
| > Attendance | | SUMMARY INDICATORS                                      |  |
| > Furloughs  | | [ 25 Active Staff ]  [ 3 Pending Leave ] [ 2 Draft Pay ]|  |
| > Payroll    | +---------------------------------------------------------+  |
| > Financials |                                                              |
| > Appraisals | +---------------------------------------------------------+  |
| > Ledger     | | MAIN INTERACTION WORKSPACE                              |  |
| > Security   | |                                                         |  |
| > Tech Specs | |   [ Interactive Control Form / Database List Grid ]     |  |
|              | |                                                         |  |
|              | +---------------------------------------------------------+  |
+--------------+--------------------------------------------------------------+
| Core Ledger Service Online            System version: v12.4.1               |
+-----------------------------------------------------------------------------+
```

#### Wireframe Details & Responsive Behaviors:
- **Left Navigation Rail**: Fixed on large desktops, collapsing into a top header burger menu on small mobile screens.
- **Micro-Interaction Spacing**: Standardized 24px layout gutters. High contrast boundaries using slate-line grid walls.
- **Desktop Density**: Adapts seamlessly to dense configurations using interactive CSS-accordion widgets, letting the user view JSON structures alongside list filters without cluttering the screen viewport.

---

### 7. USER FLOW DIAGRAMS

#### 1. Furlough/Leave Request Approval Loop:

```
  [Employee Self-Portal]
            |
            v
   Submit Leave Request
            |
            v
  [State: Pending Approve] ---> Inform Branch Manager (Status Indicator alert)
            |
            +------------> [Manager Portal Decision]
                                    |
                         +----------+----------+
                         |                     |
                  (If Rejected)          (If Approved)
                         |                     |
                         v                     v
                 [Status: Rejected]    [State: Pending HR]
                                               |
                                               v
                                      [HR Manager Portal]
                                               |
                                     +---------+---------+
                                     |                   |
                              (If Rejected)       (If Approved)
                                     |                   |
                                     v                   v
                             [Status: Rejected]  [Status: Approved]
                                                         |
                                                         v
                                              Roster Status Updated
                                              to "On Leave"
```

#### 2. Automated Payroll Cycle:

```
  HR Officer: Generate Month Payslip Run
                    |
                    v
  [Calculations: Base Salary + OT + Bonus - Advance Deducts]
                    |
                    v
  [Statutory Deducts: APIT Income Tax + EPF Employee 12%]
                    |
                    v
  [State: Draft Payslip Entry]
                    |
                    v
  Finance Manager: Verification & "Locked" Signal
                    |
                    v
   - System auto-generates ETF 3% and EPF Employer 15% contributions
   - Pushes synchronous Debit voucher to Employee Ledger
   - Freezes current payslip from future changes
```

---

### 8. PAYROLL CALCULATION ENGINE

The system features an automated **Statutory Calculation Engine** executing formulas according to public compliance laws.

#### Mathematical Formulas & Logic:

```
Gross Earnings = Base Salary + Allowances + Overtime Pay + Bonuses
```

##### 1. Employee EPF Contribution (12%):
Deducted directly from base salary elements:
```
EPF Employee Deduction = Base Salary * 0.12
```

##### 2. Employer EPF Contribution (15%):
Paid separately by corporate entity:
```
EPF Employer Contribution = Base Salary * 0.15
```

##### 3. Employer ETF Contribution (3%):
Statutory trust fund deposit:
```
ETF Employer Contribution = Base Salary * 0.03
```

##### 4. Adjusted Personal Income Tax (APIT / PAYE):
Calculated using progressively scaled annual income brackets (calculated on Monthly Base Salary equivalents):
- Bracket 0: Salary <= $100,000 | Tax Rate = 0%
- Bracket 1: $100,000 < Salary <= $141,667 | Tax Rate = 6% on excess
- Bracket 2: $141,667 < Salary <= $183,333 | Tax Rate = $2,500 + 12% on excess
- Bracket 3: $183,333 < Salary <= $225,000 | Tax Rate = $7,500 + 18% on excess
- Bracket 4: $225,000 < Salary <= $266,667 | Tax Rate = $15,000 + 24% on excess
- Bracket 5: Salary > $266,667 | Tax Rate = $25,000 + 30% on excess

##### 5. Net Salary Calculation:
```
Net Salary = Gross Earnings - EPF Employee Deduction - APIT Deduction - Advances Deductions - Store Purchase Deductions
```

---

### 9. SECURITY ARCHITECTURE

The application implements a secure-designed ecosystem focusing on data privacy, non-repudiation of transactions, and comprehensive threat coverage.

```
                   CLIENT REQUEST (Vite / Browser)
                                 |
                                 v
               +-----------------------------------+
               |     TLS 1.3 / HTTPS ENCRYPTOR     |
               +-----------------------------------+
                                 |
                                 v
               +-----------------------------------+
               |  SECURITY GATEWAY & RBAC MODULE   |
               |  Checks matrix.permissions        |
               +-----------------------------------+
                                 |
                                 v
               +-----------------------------------+
               |      CONTROLLER SANITIZATION      |
               |  XSS Filters, JSON schemas        |
               +-----------------------------------+
                 /                               \
    (Allow Access)                           (Reject Action)
               /                                   \
              v                                     v
   +-----------------------+               +------------------+
   | TRANSACTION ENGINE    |               |  WRITE AUDIT     |
   | executes DB operation |               |  Logs violation  |
   +-----------------------+               +------------------+
              |                                     |
              +-----------------+-------------------+
                                |
                                v
                     SECURITY AUDIT LEDGER
                  (JSON diffs, IP trace bounds)
```

#### Core Safeguards:
- **RBAC Matrix Rule**: Ensures operations are allowed only if the active role's permission matrix permits the specific action.
- **Double-Entry Bookkeeping Constraints**: Enforces ledger entry matching so that every Debit (payouts or claims) has a clear category tracking key matching historical payslips.
- **Deep Audit Log diffs**: Stores historical records with both `oldValue` and `newValue` serialized states, ensuring full reversibility and trackable history.
- **IP Point Handshake Logging**: Custom IP logging validates incoming network hosts to protect against credentials spoofing.

---

### 10. DEPLOYMENT & DEVOPS ARCHITECTURE

```
                                  Git Rollout Trigger (Push main)
                                                |
                                                v
               +-----------------------------------------------------------------+
               |                    GITHUB ACTIONS CI WORKFLOW                  |
               | - Runs linter verification: 'tsc --noEmit'                      |
               | - Bundles static React client with optimized Brotli compression |
               | - Prepares production Express.ts server                         |
               +-----------------------------------------------------------------+
                                                |
                                                v
               +-----------------------------------------------------------------+
               |                        DOCKERFILE ENGINE                        |
               | - Multi-stage light container image bases (Node 22-Alpine)      |
               | - Builds source bundles and bundles server CJS output           |
               +-----------------------------------------------------------------+
                                                |
                                                v
               +-----------------------------------------------------------------+
               |                      GOOGLE CONTAINER REGISTRY                  |
               | - Signs image hash                                              |
               | - Scans container layers for vulnerabilities (CVE scanning)     |
               +-----------------------------------------------------------------+
                                                |
                                                v
               +-----------------------------------------------------------------+
               |                   GOOGLE CLOUD RUN PLATFORM                     |
               | - Serverless container execution autoscaling                    |
               | - Port 3500 isolated behind secured reverse-proxy layer         |
               +-----------------------------------------------------------------+
```

#### CI/CD Key Goals:
- **Build Compression**: Bundles all files using Vite to optimize delivery sizes down to critical performance payloads.
- **Zero-Downtime Releases**: Integrates Google Cloud Run with blue-green canary strategies, validating container handshakes before directing live public traffic.

---

### 11. PRODUCTION DEPLOYMENT GUIDE

Deploying this app inside enterprise environments requires following these step-by-step procedures:

#### Prerequisites:
- Node.js version 22.14.0 or above.
- Minimum 2GB allocated memory in host Linux nodes.

#### A. Environmental Configurations
Create a production `.env` file containing these production settings (do not commit these secrets to your repository):
```env
PORT=3000
NODE_ENV=production
GEMINI_API_KEY=AIzaSy_Simulated_Key_Your_Actual_Google_Cloud_API_Secret
SECRET_JWT_KEY=8f39bda2913e2dfbce1940a02b3149ec92d0abf3e9c9103e91d849
```

#### B. Executing the Production Build Run:
Run these commands from the root directory:
```bash
# 1. Install precise workspace packages
npm ci --only=production

# 2. Run compilation pipeline (Vite React + Esbuild server bundle)
npm run build

# 3. Spin up production server
npm run start
```

#### C. Docker Execution Steps:
Execute the following commands to build and run containerized instances:
```bash
# 1. Build Docker image
docker build -t enterprise-hrms-payroll:latest .

# 2. Spin up Docker container
docker run -d -p 3000:3000 --env-file .env enterprise-hrms-payroll:latest
```

---

### 12. DEVELOPMENT ROADMAP

This roadmap outlines the phases of development to take the system from its current form to a fully distributed, enterprise-deployed portal:

```
  PHASE 1 [Foundations]  - Schema verification, Mock databases, Core models
  PHASE 2 [Calculators]  - EPF/ETF math, PROGRESSIVE APIT Tax integration, Slip generators
  PHASE 3 [Self-Portal]  - Personal punch integrations, Leave encashments, Bulletins
  PHASE 4 [Governance]   - RBAC Permissions, Advanced Old/New state audit loggers 
  PHASE 5 [Deployment]   - Cloud Run, CVE docker audits, SSL configurations, Go-Live 
```

- **Phase 1: Database Specs & Setup** (Duration: 2 Weeks): Solidifies relational table schemas, primary key patterns, index criteria, and standard database connections.
- **Phase 2: Core Processing Calculations** (Duration: 3 Weeks): Integrates statutory Epf 12%/15%, Etf 3%, progressive APIT income tax formulas, and automated ledger sync rules upon payslip locking.
- **Phase 3: Interactive Portals & Ledger Modules** (Duration: 3 Weeks): Introduces role-specific dashboards, dynamic double-entry bookkeeping vouchers, and collaborative corporate bulletins.
- **Phase 4: Advanced Governance Auditing** (Duration: 2 Weeks): Connects the JSON-based delta audit logs, RBAC matrices, and IP verification checkpoints.
- **Phase 5: Release Ops & Clustered Deployments** (Duration: 2 Weeks): Focuses on multi-stage Docker builds, canary releases on Google Cloud Run, and load performance optimizations.
