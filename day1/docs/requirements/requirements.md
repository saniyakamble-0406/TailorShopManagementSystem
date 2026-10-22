# Tailor Shop Management System
## Requirements Document

### 1. Project Title

Tailor Shop Management System

### 2. Project Type

Full Stack Web Application

### 3. Project Objective

The main objective of this project is to develop a digital system for a local tailor shop.

The system will help the shop manage customers, measurements, tailoring services, orders, order status, payments, delivery tracking and customer communication in one place.

### 4. User Roles

The system will have three main users:

1. Admin / Shop Owner
2. Tailor / Staff
3. Customer

### 5. Functional Requirements

#### Authentication and Roles

- User login and logout
- Role-based access
- Password management
- Separate access for Admin, Staff and Customer

#### Customer Management

- Add customer
- Edit customer details
- Search customer
- View customer profile
- View customer order history
- Store phone number, email, address and notes

#### Measurement Management

- Store clothing-specific measurements
- Support shirt, pant, kurta and blouse measurements
- Add new measurements
- View measurements
- Maintain measurement history
- Do not overwrite previous measurement history

#### Service Management

- Add tailoring service
- Edit service
- View services
- Manage service price
- Manage estimated completion time
- Activate or deactivate services

#### Order Management

- Create order
- Store clothing type
- Store quantity
- Store fabric source
- Store measurements
- Store special instructions
- Store discount
- Store final amount
- Store delivery date
- View orders
- Edit orders
- Search and filter orders

#### Order Workflow

The order status will be tracked through:

Received → Measurement Confirmed → Cutting → Stitching → Finishing → Ready → Delivered

The system will also support:

- Alteration
- Cancellation

#### Payment Management

- Record advance payment
- Record partial payment
- Record final payment
- Support Cash, UPI, Card and Bank Transfer
- View payment history
- Calculate pending amount

Pending Amount = Final Amount - Total Payments

#### Customer Portal

Customers will be able to:

- View their orders
- View order status
- View delivery date
- View payments
- View saved measurements

#### Notifications

The system will provide notifications for:

- Order updates
- Payment updates
- Delivery reminders
- General notifications

#### Reports

The system will provide:

- Order reports
- Payment reports
- Customer reports
- Pending payment information
- Delivery information

### 6. Non-Functional Requirements

- Responsive design for desktop, tablet and mobile
- Secure password handling
- Server-side validation
- Clear success and error messages
- Role-based authorization
- Database consistency
- Search and filtering
- Audit and history for important changes
- Clean project structure
- Basic accessibility
- Proper documentation

### 7. Business Rules

- Pending amount = Final amount - Total payments
- A delivered order must have a completed delivery record
- An order is overdue when the delivery date has passed and it is not delivered
- Customers can access only their own records
- Measurement history must be preserved when new measurements are added

### 8. Suggested Technologies

Frontend:
- HTML
- CSS
- JavaScript
- Bootstrap

Backend:
- Python
- Django
- Django REST Framework

Database:
- SQLite initially

Tools:
- VS Code
- Git
- GitHub
- Postman

### 9. Expected MVP

The first working version should include:

- Authentication and roles
- Customer management
- Measurement management
- Services
- Order workflow
- Search and filtering
- Payments
- Dashboard
- Responsive frontend
- Backend validation
- Database persistence
- Testing
- Documentation