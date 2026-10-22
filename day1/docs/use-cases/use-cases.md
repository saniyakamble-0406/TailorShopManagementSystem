# Tailor Shop Management System
## Use Cases

### UC-01: User Login

Actor:
Admin, Staff, Customer

Description:
The user logs into the system using valid login credentials.

Precondition:
The user must have a registered account.

Main Flow:
1. User opens the login page.
2. User enters username or email.
3. User enters password.
4. User clicks Login.
5. System verifies the credentials.
6. System checks the user's role.
7. System opens the appropriate dashboard.

Alternative Flow:
- If the credentials are incorrect, the system displays an error message.

---

### UC-02: Manage Customers

Actor:
Admin / Staff

Description:
Authorized users can create, view, update and search customer records.

Precondition:
User must be logged in and authorized.

Main Flow:
1. User opens Customer Management.
2. User selects Add Customer or View Customers.
3. User enters or views customer details.
4. System validates the data.
5. System saves or displays the customer information.

---

### UC-03: Manage Measurements

Actor:
Admin / Staff

Description:
Authorized users can store and view clothing measurements.

Precondition:
Customer must exist in the system.

Main Flow:
1. User selects a customer.
2. User selects the clothing type.
3. User enters the measurements.
4. System validates the measurement information.
5. System saves the new measurement.
6. Previous measurement history remains available.

---

### UC-04: Manage Services

Actor:
Admin

Description:
Admin can manage tailoring services, prices and estimated completion time.

Main Flow:
1. Admin opens Services.
2. Admin adds a new service or selects an existing service.
3. Admin enters service information.
4. System validates the information.
5. System saves the service details.

---

### UC-05: Create Order

Actor:
Admin / Staff

Description:
Authorized users create a tailoring order for a customer.

Precondition:
Customer and required service information must exist.

Main Flow:
1. User selects a customer.
2. User selects the required service.
3. User enters clothing type and quantity.
4. User selects or enters measurement information.
5. User enters fabric source and special instructions.
6. User enters discount and delivery date.
7. System calculates the final amount.
8. System creates the order.

---

### UC-06: Update Order Status

Actor:
Admin / Staff

Description:
Authorized users update the current stage of an order.

Main Flow:
1. User opens an order.
2. User selects the new status.
3. System validates the status change.
4. System saves the new status.
5. System records the user and time of the status change.

Order Status Flow:

Received
→ Measurement Confirmed
→ Cutting
→ Stitching
→ Finishing
→ Ready
→ Delivered

Additional Status:
- Alteration
- Cancelled

---

### UC-07: Record Payment

Actor:
Admin / Authorized Staff

Description:
The user records advance, partial or final payment for an order.

Main Flow:
1. User opens an order.
2. User selects Record Payment.
3. User enters payment amount.
4. User selects payment method.
5. System validates the payment.
6. System saves the payment record.
7. System updates the pending amount.

Payment Methods:
- Cash
- UPI
- Card
- Bank Transfer

---

### UC-08: View Customer Portal

Actor:
Customer

Description:
Customer views their own orders, measurements, payments and notifications.

Main Flow:
1. Customer logs into the system.
2. Customer opens the dashboard.
3. Customer views personal information.
4. Customer views saved measurements.
5. Customer views orders and order status.
6. Customer views payment information.
7. Customer views notifications.

Security Rule:
Customer can access only their own records.

---

### UC-09: View Reports

Actor:
Admin

Description:
Admin views business-related reports.

Main Flow:
1. Admin opens Reports.
2. Admin selects a report type.
3. System retrieves relevant information.
4. System displays the report.

Report Types:
- Order Reports
- Payment Reports
- Customer Reports
- Pending Payment Reports
- Delivery Reports

---

### UC-10: Notifications

Actor:
System / User

Description:
The system provides notifications related to orders, payments and delivery.

Main Flow:
1. A relevant event occurs.
2. System creates a notification.
3. User opens notifications.
4. User views the message.
5. User can mark the notification as read.