# Day 4 - Backend API Development

## Project Name

Tailor Shop Management System

## Today's Work

On Day 4, I developed and tested REST APIs using Django REST Framework.

## Work Completed

- Reused the Django backend project from Day 3.
- Created a separate virtual environment for Day 4.
- Installed required Python packages.
- Created database models for the main system entities.
- Created serializers for API data conversion.
- Created ViewSets for CRUD operations.
- Configured REST API routes using DefaultRouter.
- Created API documentation.
- Tested the API root endpoint.
- Tested Customer GET API.
- Tested Customer POST API.
- Tested Customer GET by ID.
- Tested Customer PUT API.
- Tested Customer PATCH API.
- Tested Customer DELETE API.
- Verified successful API responses.

## Main API Modules

- Users
- Staff
- Notifications
- Customers
- Measurements
- Measurement History
- Services
- Orders
- Order Items
- Order Status History
- Payments

## API Testing

### API Root

GET /api/

Result:
HTTP 200 OK

### Customer List

GET /api/customers/

Result:
HTTP 200 OK

### Create Customer

POST /api/customers/

Result:
HTTP 201 Created

### Get Customer

GET /api/customers/1/

Result:
HTTP 200 OK

### Update Customer

PUT /api/customers/1/

Result:
HTTP 200 OK

### Partial Update

PATCH /api/customers/1/

Result:
HTTP 200 OK

### Delete Customer

DELETE /api/customers/1/

Result:
Customer deleted successfully.

After deletion, GET /api/customers/1/ returned:

HTTP 404 Not Found

## Technologies Used

- Python
- Django
- Django REST Framework
- SQLite
- VS Code

## Important Endpoints

- /api/users/
- /api/staff/
- /api/notifications/
- /api/customers/
- /api/measurements/
- /api/measurement-history/
- /api/services/
- /api/orders/
- /api/order-items/
- /api/order-status-history/
- /api/payments/

## Security Requirements

- Authentication should be applied to protected APIs.
- Role-based authorization should be implemented.
- Customers should access only their own records.
- Server-side validation should be used.
- Proper HTTP status codes should be returned.
- Sensitive information should not be exposed.

## Deliverables

- api-endpoints.md
- Django backend
- Database models
- Serializers
- API ViewSets
- API routes
- API testing screenshots
- notes.md

## Learning Outcome

I learned how to create REST APIs using Django REST Framework and how to perform GET, POST, PUT, PATCH and DELETE operations.