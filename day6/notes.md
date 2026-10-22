# Day 6 - Reports & Analytics

## Project Name
Tailor Shop Management System

## Objective
To develop a dynamic Reports & Analytics page connected to the Django REST API backend.

## Tasks Completed

### 1. Reports & Analytics Page
- Updated `reports.html`.
- Connected the report page to the backend API.
- Added dynamic report data loading.
- Added error handling for API requests.

### 2. Shop Overview
Added the following summary cards:
- Total Customers
- Total Orders
- Delivered Orders
- Total Order Amount
- Pending Payments

### 3. Order Status Report
Added dynamic order counts for:
- Received
- Measurement Confirmed
- Cutting
- Stitching
- Finishing
- Ready
- Delivered
- Alteration
- Cancelled

### 4. Payment Summary
Added the following details:
- Total Order Amount
- Total Payments Received
- Pending Amount

### 5. Testing
- Verified that report data loads successfully from the backend.
- Checked the customer count.
- Verified order status counts.
- Verified payment summary calculations.
- Refreshed the Reports page and checked the displayed values.
- No report loading error was displayed during testing.

## Test Results

| Report Item | Result |
|---|---:|
| Total Customers | 4 |
| Total Orders | 4 |
| Delivered Orders | 0 |
| Total Order Amount | ₹2,500.00 |
| Total Payments Received | ₹800.00 |
| Pending Amount | ₹1,700.00 |

## Screenshot
Screenshot saved as:

`day6/screenshots/day6_reports.png`

## Files Updated
- `day5/frontend/pages/reports.html`
- `day6/note.md`

## Current Status
The Reports & Analytics page is connected to the backend and displaying customer, order, status, and payment information successfully.

Remaining Day 6 tasks, if any, should be verified before declaring the entire day complete.

## Conclusion
The Reports & Analytics module was updated to display dynamic data from the backend. The report page was tested successfully with the available project records.