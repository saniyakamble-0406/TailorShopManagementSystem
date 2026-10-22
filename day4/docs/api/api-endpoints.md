# Tailor Shop Management System
## REST API Documentation

Base URL:

/api/

---

## 1. Authentication APIs

### Login

POST /api/auth/login

Purpose:
Authenticate a user and provide access according to the user's role.

### Register

POST /api/auth/register

Purpose:
Create a new user account.

### Logout

POST /api/auth/logout

Purpose:
Logout the authenticated user.

---

## 2. Customer APIs

### Get Customers

GET /api/customers

Purpose:
Get customer records.

### Create Customer

POST /api/customers

Purpose:
Create a new customer.

### Get Customer

GET /api/customers/:id

Purpose:
Get details of a specific customer.

### Update Customer

PUT /api/customers/:id

Purpose:
Update customer information.

### Delete Customer

DELETE /api/customers/:id

Purpose:
Delete a customer when permitted.

### Search Customers

GET /api/customers/search

Purpose:
Search customers using relevant customer information.

---

## 3. Measurement APIs

### Get Measurements

GET /api/measurements

Purpose:
Get measurement records.

### Create Measurement

POST /api/measurements

Purpose:
Save a new customer measurement.

### Update Measurement

PUT /api/measurements/:id

Purpose:
Update the current measurement record.

### Measurement History

GET /api/measurements/history/:customer_id

Purpose:
View previous measurement records of a customer.

---

## 4. Service APIs

### Get Services

GET /api/services

Purpose:
Get available tailoring services.

### Create Service

POST /api/services

Purpose:
Create a new tailoring service.

### Update Service

PUT /api/services/:id

Purpose:
Update service information.

### Delete Service

DELETE /api/services/:id

Purpose:
Delete or deactivate a service when permitted.

---

## 5. Order APIs

### Get Orders

GET /api/orders

Purpose:
Get order records.

### Create Order

POST /api/orders

Purpose:
Create a new tailoring order.

### Get Order

GET /api/orders/:id

Purpose:
Get details of a specific order.

### Update Order

PUT /api/orders/:id

Purpose:
Update order information.

### Delete Order

DELETE /api/orders/:id

Purpose:
Delete an order when permitted.

### Update Order Status

PATCH /api/orders/:id/status

Purpose:
Update the current order workflow status.

Order Workflow:

Received
→ Measurement Confirmed
→ Cutting
→ Stitching
→ Finishing
→ Ready
→ Delivered

Additional Status:

Alteration
Cancelled

### Filter Orders

GET /api/orders/filter

Purpose:
Filter orders based on useful criteria.

---

## 6. Payment APIs

### Get Payments

GET /api/payments

Purpose:
Get payment records.

### Create Payment

POST /api/payments

Purpose:
Record an advance, partial or final payment.

### Get Order Payments

GET /api/orders/:id/payments

Purpose:
View all payments related to a specific order.

---

## 7. Staff APIs

### Get Staff

GET /api/staff

Purpose:
Get staff records.

### Create Staff

POST /api/staff

Purpose:
Create a new staff record.

### Get Staff

GET /api/staff/:id

Purpose:
Get details of a specific staff member.

### Update Staff

PUT /api/staff/:id

Purpose:
Update staff information.

### Delete Staff

DELETE /api/staff/:id

Purpose:
Delete or deactivate a staff record when permitted.

---

## 8. Dashboard APIs

### Admin Dashboard

GET /api/dashboard/admin

Purpose:
Get admin dashboard information.

### Staff Dashboard

GET /api/dashboard/staff

Purpose:
Get staff dashboard information.

### Customer Dashboard

GET /api/dashboard/customer

Purpose:
Get customer dashboard information.

---

## 9. Notification APIs

### Get Notifications

GET /api/notifications

Purpose:
Get notifications for the authenticated user.

### Mark Notification as Read

PATCH /api/notifications/:id/read

Purpose:
Mark a notification as read.

---

## 10. Report APIs

### Order Reports

GET /api/reports/orders

Purpose:
Get order-related reports.

### Payment Reports

GET /api/reports/payments

Purpose:
Get payment-related reports.

### Customer Reports

GET /api/reports/customers

Purpose:
Get customer-related reports.

---

## 11. API Security

- Authentication is required for protected APIs.
- Backend role-based authorization must be applied.
- Customers can access only their own records.
- Staff can access only authorized operations.
- Admin has administrative access.
- Server-side validation must be used.
- Proper HTTP status codes and error messages must be returned.
- Sensitive information must not be exposed.

---

## 12. Common HTTP Methods

GET:
Used to retrieve data.

POST:
Used to create new data.

PUT:
Used to update existing data.

PATCH:
Used for partial updates such as order status.

DELETE:
Used to delete data when permitted.