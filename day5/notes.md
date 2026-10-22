# Day 5 — Frontend Development

## Project
TailorShop Management System

## Objective
To develop the frontend interface for managing customers, staff, measurements, services, orders, payments, reports, and the admin dashboard.

## Technologies Used
- HTML5
- CSS3
- JavaScript
- Django REST Framework API
- Python HTTP Server for local frontend testing

## Frontend Pages Developed
1. Login Page
2. Admin Dashboard
3. Customers
4. Staff Management
5. Measurements
6. Services
7. Orders
8. Payments
9. Reports

## Features Implemented
- Login interface for accessing the application.
- Admin dashboard with navigation to management pages.
- Customer records listing and customer form.
- Staff management interface.
- Measurement management interface.
- Service listing and management interface.
- Order listing and order management interface.
- Payment listing and payment management interface.
- Reports page for viewing shop statistics.
- CSS styling for a consistent user interface.
- JavaScript integration with backend API endpoints.
- Authentication token handling through session storage.
- Navigation between frontend pages.

## Local Development Setup

Frontend directory:

`day5/frontend`

Start the frontend server using:

```powershell
python -m http.server 5500 --bind 127.0.0.1
```

Open the application in the browser:

`http://127.0.0.1:5500/pages/login.html`

Backend API base URL:

`http://127.0.0.1:8000/api/`

The Django backend must be running separately for API-connected features.

## Testing Performed
- Opened the login page.
- Verified login and dashboard navigation.
- Checked the main management pages.
- Tested frontend integration with backend APIs.
- Checked customer records and management forms.
- Verified that authentication is required for protected pages.
- Reviewed browser console output during later project verification.

## Outcome
The main frontend interface was developed and connected to the Django REST Framework backend. The pages were prepared for functional testing and subsequent verification.

## Notes
- Run the backend and frontend servers in separate PowerShell terminals.
- Keep authentication credentials private.
- Do not commit passwords, secret keys, or sensitive environment configuration files to GitHub.
- Record any future changes and testing results in the relevant project documentation.

## Status
Day 5 frontend development completed. Final functionality and integration checks were carried out during subsequent testing.