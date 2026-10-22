# Tailor Shop Management System
## Database Schema

### 1. Users

Fields:
- id
- username
- email
- password
- role
- is_active
- created_at
- updated_at

Purpose:
Stores login and role information for Admin, Staff and Customer users.

---

### 2. Customers

Fields:
- id
- user_id
- full_name
- phone
- email
- address
- notes
- created_at
- updated_at

Purpose:
Stores customer profile and contact information.

---

### 3. Staff

Fields:
- id
- user_id
- full_name
- phone
- address
- joined_date
- is_active
- created_at

Purpose:
Stores tailor and staff information.

---

### 4. Measurements

Fields:
- id
- customer_id
- clothing_type
- measurement_data
- measured_by
- measured_at
- created_at

Purpose:
Stores current clothing-specific measurements of customers.

---

### 5. MeasurementHistory

Fields:
- id
- customer_id
- measurement_id
- clothing_type
- measurement_data
- recorded_by
- recorded_at

Purpose:
Stores previous measurement records without overwriting history.

---

### 6. Services

Fields:
- id
- service_name
- description
- price
- estimated_days
- is_active
- created_at
- updated_at

Purpose:
Stores tailoring services, service prices and estimated completion time.

---

### 7. Orders

Fields:
- id
- order_number
- customer_id
- created_by
- fabric_source
- special_instructions
- discount
- final_amount
- delivery_date
- status
- created_at
- updated_at

Purpose:
Stores customer order details and current order status.

Order Status:
- Received
- Measurement Confirmed
- Cutting
- Stitching
- Finishing
- Ready
- Delivered
- Alteration
- Cancelled

---

### 8. OrderItems

Fields:
- id
- order_id
- service_id
- measurement_id
- clothing_type
- quantity
- unit_price
- subtotal

Purpose:
Stores individual items included in an order.

---

### 9. Payments

Fields:
- id
- order_id
- amount
- payment_method
- payment_date
- recorded_by
- notes
- created_at

Purpose:
Stores advance, partial and final payment records.

Payment Methods:
- Cash
- UPI
- Card
- Bank Transfer

---

### 10. Notifications

Fields:
- id
- user_id
- order_id
- notification_type
- message
- is_read
- created_at

Purpose:
Stores order, payment and delivery notifications.

---

### 11. OrderStatusHistory

Fields:
- id
- order_id
- status
- changed_by
- changed_at
- notes

Purpose:
Stores the history of order status changes.

---

## Relationships

- Users 1 : 0..1 Customers
- Users 1 : 0..1 Staff
- Customers 1 : Many Measurements
- Customers 1 : Many MeasurementHistory
- Customers 1 : Many Orders
- Orders 1 : Many OrderItems
- Services 1 : Many OrderItems
- Measurements 1 : Many OrderItems
- Orders 1 : Many Payments
- Orders 1 : Many OrderStatusHistory
- Users 1 : Many Notifications
- Orders 1 : Many Notifications

---

## Important Business Rules

- Pending Amount = Final Amount - Total Payments
- Delivered orders must have a completed delivery record.
- Overdue means the delivery date has passed and the order is not delivered.
- Customers can access only their own records.
- Previous measurement history must not be overwritten.