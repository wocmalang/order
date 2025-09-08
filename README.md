# Work Order Management System

## 1. Overview

This application is a web-based Work Order (WO) or incident management system. It enables users to perform bulk data entry for incidents, manage active tickets, and view reports for completed tickets.

The system's primary focus is on automating business processes, such as calculating Time to Resolution (TTR) and systematically archiving tickets. Based on the existing codebase, this system primarily utilizes an **Express.js backend** with a **MySQL database**.

## 2. Project Structure

The repository is organized into several key directories:

-   `📁 /frontend`: The user interface (UI) application built with **React** and **Vite**. All visual components and user interactions are located here.
-   `📁 /express`: The main backend of the application, built with **Express.js**. This directory contains all server-side logic, the connection to the MySQL database, and the API endpoints.
-   `📁 /backend`: An alternative backend designed for the **Cloudflare Workers** serverless platform with a D1 database. The currently active backend is the one in the `/express` directory.

## 3. Tech Stack

### Frontend
-   **Framework**: React 19
-   **Build Tool**: Vite
-   **Routing**: React Router DOM
-   **Charting**: Chart.js
-   **Data Export**: `xlsx` for Excel, `jspdf` & `jspdf-autotable` for PDF

### Backend (Express)
-   **Framework**: Express.js
-   **Database**: MySQL
-   **MySQL Driver**: `mysql2/promise`
-   **Date/Time Handling**: `moment-timezone`

## 4. Setup and Installation

### Prerequisites
-   Node.js (v18 or higher recommended)
-   A running MySQL database server

### Backend Setup (Express)
1.  Navigate to the `express` directory:
    ```bash
    cd express
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the `express` directory and provide your database configuration:
    ```env
    MYSQL_HOST=localhost
    MYSQL_USER=root
    MYSQL_DB=your_database_name
    MYSQL_PASSWORD=your_password
    PORT=3001
    ```
4.  Start the backend server:
    ```bash
    npm start
    ```
    The server will be running at `http://localhost:3001`.

### Frontend Setup
1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the `frontend` directory to connect to the backend:
    ```env
    VITE_API_BASE_URL=http://localhost:3001
    ```
4.  Start the frontend development server:
    ```bash
    npm run dev
    ```
    The application will be accessible at `http://localhost:5173` (or another available port).

## 5. Database Schema (MySQL)

Based on the code analysis, the following tables are required by the application:

1.  **`incidents`**: Stores all active work order data.
    -   `incident` (PRIMARY KEY)
    -   `status` (e.g., 'OPEN', 'BACKEND', 'RESOLVED', 'CLOSED')
    -   `reported_date` (DATETIME)
    -   `resolve_date` (DATETIME, nullable)
    -   `workzone` (VARCHAR)
    -   `sektor` (VARCHAR, nullable)
    -   `ttr_customer`, `ttr_agent`, etc. (VARCHAR, nullable)
    -   ...and other fields as defined in the `allowedFields` array in `InputWO.jsx`.
2.  **`reports`**: Serves as an archive for completed incidents. Its structure is identical to the `incidents` table.
3.  **`workzone_map`**: A mapping table used to automatically populate the `sektor` field.
    -   `workzone`
    -   `sektor`

## 6. API Endpoints (Express)

The following are the main endpoints exposed by the Express backend (`/express/routes/apiRoutes.js`):

| Method | Endpoint                      | Description                                                                                                                                                                                                                                                                                             |
| :----- | :---------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET`  | `/view-mysql`                 | Retrieves all records from the `incidents` table.                                                                                                                                                                     |
| `GET`  | `/workzone-map`               | Fetches mapping data from the `workzone_map` table.                                                                                                                                                             |
| `PUT`  | `/work-orders/:incident`      | Updates an incident by its ID. **Business Logic**: Automatically calculates TTR and sets `resolve_date` when the status changes to `RESOLVED` or `CLOSED`. It clears these fields if the ticket is reopened. |
| `DELETE`| `/work-orders/:incident`    | Deletes a single incident from the `incidents` table.                                                                                                                                                           |
| `POST` | `/work-orders/:incident/complete` | Moves an incident from the `incidents` table to the `reports` table. This is executed within a database transaction to ensure data integrity.                                                               |
| `POST` | `/reports/:incident/reopen`   | *Inferred from frontend code*: Moves a ticket from the `reports` archive back to the active `incidents` list.                                                                                                        |

## 7. Key Frontend Logic

-   **Data Input (`InputWO.jsx`)**:
    -   This component can parse data from multiple formats (TSV, JSON, Excel).
    -   Before sending data to the backend, it is automatically enriched: the `sektor` field is populated based on the `workzone` value by using data from the `GET /workzone-map` endpoint.
-   **Reporting (`Report.jsx`)**:
    -   Displays data from the `reports` table with filtering capabilities by date range.
    -   Presents a data visualization using `Chart.js` to show trends of completed tickets.
    -   Provides export functionality to Excel, CSV, and PDF formats.
