# Work Order Management System

## 1. Overview

This application is a web-based Work Order (WO) or incident management system. It enables users to perform bulk data entry for incidents, manage active tickets, and view reports for completed tickets.

The system's primary focus is on automating business processes, such as calculating Time to Resolution (TTR) and systematically archiving tickets. This system utilizes a **React** frontend and a serverless backend powered by **Cloudflare Workers** with a **Cloudflare D1** database.

## 2. Project Structure

The repository is organized into two key directories:

-   `📁 /frontend`: The user interface (UI) application built with **React** and **Vite**. All visual components and user interactions are located here.
-   `📁 /backend`: The serverless backend application designed for the **Cloudflare Workers** platform. This directory contains all server-side logic, database connections, and API endpoints.

## 3. Tech Stack

### Frontend
-   **Framework**: React 19
-   **Build Tool**: Vite
-   **Routing**: React Router DOM
-   **Charting**: Chart.js
-   **Data Export**: `xlsx` for Excel, `jspdf` & `jspdf-autotable` for PDF

### Backend
-   **Platform**: Cloudflare Workers
-   **Database**: Cloudflare D1
-   **Routing**: Itty Router
-   **Deployment Tool**: Wrangler CLI

## 4. Setup and Installation

### Prerequisites
-   Node.js (v18 or higher recommended)
-   A Cloudflare account
-   Wrangler CLI installed globally:
    ```bash
    npm install -g wrangler
    ```

### Backend Setup (Cloudflare Workers)
1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  Authenticate Wrangler with your Cloudflare account:
    ```bash
    wrangler login
    ```
4.  Create a D1 database via the Cloudflare dashboard or CLI. Then, update the `wrangler.toml` file with your `database_id`. You can also execute the schema from `pkl_backup.sql` into your D1 database.
5.  Start the local development server:
    ```bash
    wrangler dev
    ```
    The server will be running at `http://localhost:8787`.

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
    VITE_API_BASE_URL=http://localhost:8787
    ```
    *Note: Ensure the URL matches your running Wrangler dev server.*
4.  Start the frontend development server:
    ```bash
    npm run dev
    ```
    The application will be accessible at `http://localhost:5173` (or another available port).

## 5. Database Schema (Cloudflare D1)

Based on the `backend/pkl_backup.sql` file, the following tables are required:

1.  **`incidents`**: Stores all active work order data.
    -   `incident` (PRIMARY KEY)
    -   `status` (e.g., 'OPEN', 'BACKEND', 'RESOLVED', 'CLOSED')
    -   `reported_date` (DATETIME)
    -   `resolve_date` (DATETIME, nullable)
    -   ...and other relevant fields.
2.  **`reports`**: Serves as an archive for completed incidents. Its structure is identical to the `incidents` table.
3.  **`workzone_map`**: A mapping table used to automatically populate the `sektor` field.
    -   `workzone`
    -   `sektor`
4.  **`users`**: Stores user data for authentication.
    - `id` (INTEGER PRIMARY KEY)
    - `username` (TEXT UNIQUE)
    - `password` (TEXT)
    - `role` (TEXT)

## 6. API Endpoints

The main endpoints are exposed by the Cloudflare Worker backend (`backend/src/index.js`):

| Method | Endpoint                      | Description                                                  |
| :----- | :---------------------------- | :----------------------------------------------------------- |
| `POST` | `/api/login`                  | Authenticates a user and returns a token.                    |
| `GET`  | `/api/work-orders`            | Retrieves all records from the `incidents` table.            |
| `POST` | `/api/work-orders`            | Adds new work orders in bulk.                                |
| `PUT`  | `/api/work-orders/:incident`  | Updates a single incident by its ID.                         |
| `DELETE`| `/api/work-orders/:incident` | Deletes a single incident from the `incidents` table.        |
| `POST` | `/api/work-orders/:incident/complete` | Moves an incident from `incidents` to the `reports` table.   |
| `GET`  | `/api/reports`                | Retrieves records from the `reports` table with date filters.|
| `POST` | `/api/reports/:incident/reopen`   | Moves a ticket from `reports` back to the `incidents` table. |
| `GET`  | `/api/workzone-map`           | Fetches mapping data from the `workzone_map` table.          |
| `GET`  | `/api/users`                  | Retrieves a list of all users.                               |
| `POST` | `/api/register`               | Registers a new user.                                        |


## 7. Key Frontend Logic

-   **Data Input (`InputWO.jsx`)**:
    -   This component can parse data from multiple formats (TSV, JSON, Excel).
    -   It automatically enriches data by populating the `sektor` field based on the `workzone` value using data from the `GET /api/workzone-map` endpoint.
-   **Reporting (`Report.jsx`)**:
    -   Displays data from the `reports` table with filtering capabilities by date range.
    -   Presents a data visualization using `Chart.js` to show trends of completed tickets.
    -   Provides export functionality to Excel, CSV, and PDF formats.
