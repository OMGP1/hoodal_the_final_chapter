# Product Requirements Document (PRD)
## Shop Inventory & Order Management System MVP

**Version:** 1.0  
**Date:** January 24, 2026  
**Product Owner:** [Your Name]  
**Status:** Draft

---

## 1. Executive Summary

### 1.1 Product Overview
A comprehensive web-based inventory management and ecommerce solution designed for retail shops with physical and online sales channels. The system integrates inventory tracking, point-of-sale, supplier management, customer orders, and staff management into a unified platform.

### 1.2 Business Objectives
- Streamline inventory management with real-time stock tracking
- Reduce stock wastage through damage and expiry tracking
- Enable seamless online ordering and booking system
- Automate billing and payment tracking
- Provide actionable insights through reports and dashboards
- Manage daily milk delivery subscriptions
- Track staff attendance and expenses

### 1.3 Target Users
- **Primary:** Shop owners and managers
- **Secondary:** Sales staff, delivery personnel, customers

---

## 2. Product Scope

### 2.1 In Scope (MVP)
- Inventory management with stock tracking
- Product/item catalog management
- Purchase order management
- Point of Sale (POS) system
- Supplier management
- Billing and invoicing
- Dashboard with key metrics
- Online customer orders
- Customer booking system with advance payments
- Monthly subscription tracker
- Daily milk delivery management
- Expense tracking (salaries, rent, bills)
- Sales and inventory reports
- Staff management and attendance

### 2.2 Out of Scope (Post-MVP)
- Mobile native applications
- Multi-store management
- Advanced analytics and AI predictions
- Third-party marketplace integrations
- Accounting software integration
- Barcode/QR code scanning
- Customer loyalty programs

---

## 3. Functional Requirements

### 3.1 Inventory Management

#### 3.1.1 Stock Tracking
**Priority:** P0 (Critical)

**Requirements:**
- Real-time stock level tracking for all products
- Multi-location/bin storage support
- Stock alerts for low inventory (configurable thresholds)
- Track stock movements (in, out, transfer, adjustment)
- Batch/lot number tracking
- Serial number tracking for specific items

**Stock Status Categories:**
- Available
- Reserved (for orders)
- Damaged
- Expired
- In-transit

#### 3.1.2 Damage & Expiry Management
**Priority:** P0 (Critical)

**Requirements:**
- Record damaged items with reason, quantity, and date
- Track expiry dates for perishable items
- Auto-alerts 7, 3, and 1 day before expiry
- Expired stock auto-flagging
- Damage/expiry loss reports
- Photo upload support for damaged items
- Disposal tracking

### 3.2 Products/Items Management

**Priority:** P0 (Critical)

**Requirements:**
- Add/edit/delete products
- Product categorization (categories and subcategories)
- Product variants (size, color, flavor, etc.)
- Product details: SKU, barcode, description, images
- Pricing (purchase price, selling price, MRP, discount)
- Tax/GST configuration per product
- Unit of measurement (kg, liter, piece, box)
- Minimum and maximum stock levels
- Supplier association
- Product status (active/inactive)
- Bulk product import/export (CSV)

### 3.3 Purchase Management

**Priority:** P0 (Critical)

**Requirements:**
- Create purchase orders
- Supplier selection
- Add multiple items to purchase order
- Purchase order status tracking (draft, sent, received, completed, cancelled)
- Record received quantities vs ordered quantities
- Update inventory upon receiving goods
- Record purchase invoices
- Payment tracking for purchases
- Purchase history by supplier
- Purchase return management

### 3.4 Point of Sale (POS)

**Priority:** P0 (Critical)

**Requirements:**
- Fast product search and selection
- Barcode scanning support (manual entry for MVP)
- Add multiple items to cart
- Apply discounts (percentage or fixed amount)
- Multiple payment methods (cash, card, UPI, credit)
- Split payment support
- Print receipt/invoice
- Hold and retrieve sales
- Customer selection (walk-in or registered)
- Exchange and return processing
- Daily cash reconciliation
- Opening and closing cash register

### 3.5 Supplier Management

**Priority:** P1 (High)

**Requirements:**
- Add/edit supplier details (name, contact, address, GST, email)
- Supplier performance tracking
- Outstanding payments to suppliers
- Purchase history by supplier
- Supplier notes and documents
- Supplier status (active/inactive)

### 3.6 Billing & Invoicing

**Priority:** P0 (Critical)

**Requirements:**
- Auto-generate invoice numbers
- GST-compliant invoice format
- Tax calculation (CGST, SGST, IGST)
- Customer details on invoice
- Itemized billing
- Discount application
- Multiple payment methods
- Partial payment support
- Credit note generation
- Invoice download (PDF)
- Email invoice to customer
- Invoice history and search

### 3.7 Dashboard

**Priority:** P0 (Critical)

**Metrics to Display:**
- **Today's Sales:** Total revenue, number of orders, items sold
- **Weekly Sales:** Revenue trend, comparison with previous week
- **Monthly Sales:** Revenue, targets vs actual
- **Low Stock Alerts:** Products below minimum level
- **Expired/Expiring Items:** Count and value
- **Pending Orders:** Online orders awaiting fulfillment
- **Outstanding Payments:** From customers
- **Top Selling Products:** By quantity and revenue
- **Recent Transactions:** Last 10 sales
- **Cash Flow:** Today's cash in/out

**Filters:**
- Date range selection
- Product category filter
- Payment method filter

### 3.8 Online Orders from Customers

**Priority:** P0 (Critical)

**Requirements:**

**Customer-Facing:**
- Browse product catalog
- Search and filter products
- Add items to cart
- View cart and modify quantities
- Place order
- Select delivery or pickup
- Enter delivery address
- Choose payment method
- Order confirmation (email/SMS)
- Track order status
- Order history

**Admin-Facing:**
- View all online orders
- Order status management (pending, confirmed, processing, ready, dispatched, delivered, cancelled)
- Order details view
- Update inventory on order confirmation
- Generate picking list
- Mark order as delivered
- Order notifications
- Cancellation and refund handling

### 3.9 Customer Booking System

**Priority:** P1 (High)

**Description:** Allow customers to book/reserve products with advance payment, especially for items currently out of stock.

**Requirements:**
- Customer can request to book products
- Specify quantity and preferred delivery/pickup date
- Advance payment (full or partial)
- Booking status (pending, confirmed, ready, completed, cancelled)
- Admin approval workflow
- Notifications when stock becomes available
- Convert booking to sale
- Booking expiry (auto-cancel if not fulfilled within timeframe)
- Booking history
- Refund management for cancelled bookings

### 3.10 Monthly Payers Tracker (Subscription Management)

**Priority:** P1 (High)

**Description:** Track customers with monthly recurring orders/subscriptions.

**Requirements:**
- Add customer subscription
- Define subscription details (products, quantity, frequency, amount)
- Subscription start and end dates
- Auto-generate monthly invoices
- Payment status tracking (paid, pending, overdue)
- Payment reminder notifications
- Payment collection recording
- Subscription renewal
- Subscription pause/resume
- Outstanding balance tracking
- Subscription history
- Monthly payment reports

### 3.11 Daily Milk Delivery System

**Priority:** P1 (High)

**Requirements:**
- Add customer to milk delivery service
- Define delivery schedule (daily, alternate days, specific days)
- Quantity per delivery (e.g., 1 liter, 2 liters)
- Delivery address
- Monthly rate calculation
- Mark delivery as completed each day
- Delivery exceptions (skip days, extra quantity)
- Generate delivery routes for delivery personnel
- Monthly bill generation
- Payment tracking (daily, weekly, monthly)
- Delivery history
- Pause/resume delivery
- SMS notifications for delivery confirmation

### 3.12 Expense Tracking

**Priority:** P1 (High)

**Expense Categories:**
- Salaries
- Rent
- Electricity bill
- Water bill
- Internet/phone bill
- Maintenance
- Transportation
- Office supplies
- Miscellaneous

**Requirements:**
- Record expenses with category, amount, date, description
- Attach receipts/documents
- Recurring expense setup
- Payment method tracking
- Vendor/payee tracking
- Expense approval workflow
- Monthly expense summary
- Expense reports by category and date range
- Budget vs actual tracking

### 3.13 Reports

**Priority:** P1 (High)

**Report Types:**

1. **Sales Reports**
   - Daily/weekly/monthly sales summary
   - Sales by product
   - Sales by category
   - Sales by payment method
   - Sales by customer
   - Hourly sales trend

2. **Inventory Reports**
   - Current stock levels
   - Stock movement report
   - Low stock report
   - Expiry report
   - Damage/loss report
   - Stock valuation
   - Dead stock analysis

3. **Purchase Reports**
   - Purchase summary by supplier
   - Purchase vs sales comparison
   - Purchase order status report

4. **Financial Reports**
   - Profit and loss statement
   - Revenue vs expense
   - Outstanding receivables
   - Outstanding payables
   - Tax summary (GST)

5. **Customer Reports**
   - Top customers by revenue
   - Customer order history
   - Subscription report
   - Outstanding customer payments

6. **Staff Reports**
   - Attendance summary
   - Sales by staff member
   - Staff performance

**Report Features:**
- Date range filter
- Export to PDF/Excel
- Email reports
- Scheduled reports (auto-send weekly/monthly)
- Visual charts and graphs

### 3.14 Staff Management

**Priority:** P1 (High)

**Requirements:**

**Staff Profile:**
- Add/edit staff details (name, contact, role, joining date)
- Role-based access control (admin, manager, sales staff, delivery)
- Salary information
- Documents upload

**Attendance:**
- Daily check-in/check-out
- Attendance status (present, absent, half-day, leave)
- Leave management (apply, approve, reject)
- Attendance calendar view
- Monthly attendance report
- Late coming tracking
- Overtime tracking

**Performance:**
- Sales target vs achievement
- Customer feedback
- Warnings/appreciation notes

---

## 4. Non-Functional Requirements

### 4.1 Performance
- Page load time: < 2 seconds
- POS transaction processing: < 1 second
- Support 100 concurrent users
- Dashboard refresh: Real-time or max 30 seconds delay

### 4.2 Security
- User authentication (username/password)
- Role-based access control (RBAC)
- Secure password storage (hashed)
- HTTPS encryption
- Session timeout after 30 minutes of inactivity
- Audit logs for critical operations

### 4.3 Usability
- Responsive design (desktop, tablet, mobile)
- Intuitive navigation
- Minimal clicks to complete common tasks
- Keyboard shortcuts for POS
- Multi-language support (English, Hindi, Marathi - post MVP)

### 4.4 Reliability
- 99.5% uptime
- Daily automated backups
- Data recovery mechanism
- Error logging and monitoring

### 4.5 Scalability
- Support up to 10,000 products
- Support up to 5,000 customers
- Handle 500 transactions per day

---

## 5. User Roles & Permissions

### 5.1 Admin/Owner
- Full access to all modules
- Configure system settings
- Add/remove users
- View all reports
- Financial data access

### 5.2 Manager
- Inventory management
- Purchase orders
- Supplier management
- Staff management
- Reports viewing
- Cannot delete transactions

### 5.3 Sales Staff
- POS access
- View product catalog
- Create sales orders
- Process returns
- View own sales reports

### 5.4 Delivery Personnel
- View delivery schedule
- Mark deliveries as completed
- Update delivery status
- Access customer contact info

### 5.5 Customer (Online)
- Browse products
- Place orders
- Track orders
- View order history
- Manage bookings

---

## 6. Technology Stack Recommendations

### 6.1 Frontend
- **Framework:** React.js or Next.js
- **UI Library:** Tailwind CSS, shadcn/ui, Material-UI
- **State Management:** React Context or Redux
- **Charts:** Recharts or Chart.js

### 6.2 Backend
- **Framework:** Node.js with Express or Python with Django/FastAPI
- **Database:** PostgreSQL (relational data) or MongoDB (flexibility)
- **Authentication:** JWT tokens
- **File Storage:** AWS S3 or local storage

### 6.3 Deployment
- **Hosting:** AWS, Google Cloud, or DigitalOcean
- **Container:** Docker
- **CI/CD:** GitHub Actions

---

## 7. User Stories

### 7.1 Inventory Management
- As a shop owner, I want to track stock levels in real-time so I can avoid stockouts
- As a manager, I want to be alerted about expiring items so I can plan discounts
- As a shop owner, I want to record damaged items so I can track losses

### 7.2 Sales
- As a sales staff, I want to quickly search products in POS so I can serve customers faster
- As a shop owner, I want to view today's sales summary so I can track daily performance

### 7.3 Online Orders
- As a customer, I want to browse products online so I can order from home
- As a manager, I want to view pending online orders so I can prepare them for delivery

### 7.4 Bookings
- As a customer, I want to book out-of-stock items with advance payment so I can secure my order
- As a manager, I want to track customer bookings so I can fulfill them when stock arrives

### 7.5 Milk Delivery
- As a customer, I want to subscribe to daily milk delivery so I don't have to order every day
- As a delivery person, I want to see my delivery route so I can plan efficiently

### 7.6 Reports
- As a shop owner, I want to generate monthly sales reports so I can analyze business performance
- As an accountant, I want to export GST reports so I can file returns

---

## 8. Wireframe Requirements

### 8.1 Key Screens
1. Login page
2. Dashboard (main)
3. Product listing and detail
4. POS interface
5. Inventory management
6. Purchase order form
7. Online order management
8. Customer booking form
9. Milk delivery schedule
10. Expense entry form
11. Reports page
12. Staff attendance
13. Supplier management

---

## 9. MVP Development Phases

### Phase 1 (Weeks 1-3): Core Foundation
- User authentication
- Dashboard skeleton
- Product/inventory management
- Basic POS

### Phase 2 (Weeks 4-6): Sales & Purchases
- Complete POS with billing
- Purchase management
- Supplier management
- Stock updates on sales/purchase

### Phase 3 (Weeks 7-9): Customer Features
- Online order system
- Customer booking system
- Monthly payers tracker
- Milk delivery system

### Phase 4 (Weeks 10-12): Operations & Reports
- Expense tracking
- Staff management and attendance
- Reports generation
- Final testing and deployment

---

## 10. Success Metrics

### 10.1 Business Metrics
- 50% reduction in stock wastage within 3 months
- 30% increase in online orders within 2 months
- 100% accurate inventory tracking
- 20% improvement in order fulfillment time

### 10.2 User Adoption
- 80% of staff actively using the system daily
- 100 online customers within first month
- 50 milk delivery subscriptions within first month

### 10.3 System Performance
- 99% uptime
- <2 second page load times
- Zero critical bugs in production

---

## 11. Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss | High | Daily automated backups, redundant storage |
| Staff resistance to new system | Medium | Training sessions, gradual rollout |
| Complex feature scope creeping | High | Strict MVP scope, prioritization framework |
| Internet connectivity issues | Medium | Offline mode for POS (future enhancement) |
| Integration complexity | Medium | Modular architecture, API-first design |

---

## 12. Support & Maintenance

### 12.1 User Training
- Video tutorials for each module
- User manual (PDF)
- In-app help tooltips
- Live onboarding session

### 12.2 Ongoing Support
- Email support
- Bug reporting system
- Monthly feature updates
- Quarterly system review

---

## 13. Future Enhancements (Post-MVP)

1. Mobile apps (iOS/Android)
2. WhatsApp integration for order notifications
3. Barcode scanner integration
4. Customer loyalty program
5. Multi-location support
6. Advanced analytics and forecasting
7. Integration with accounting software
8. Marketplace integration (Amazon, Flipkart)
9. Voice commands for POS
10. AI-based demand prediction

---

## 14. Appendix

### 14.1 Glossary
- **SKU:** Stock Keeping Unit - unique identifier for products
- **POS:** Point of Sale - system for processing sales
- **GST:** Goods and Services Tax
- **MRP:** Maximum Retail Price
- **EOD:** End of Day - daily closing procedures

### 14.2 References
- GST billing guidelines
- Inventory management best practices
- E-commerce standards

---

**Document Control:**
- Last Updated: January 24, 2026
- Next Review: February 24, 2026
- Approval Status: Pending

**Sign-off:**
- Product Owner: _________________
- Technical Lead: _________________
- Business Stakeholder: _________________