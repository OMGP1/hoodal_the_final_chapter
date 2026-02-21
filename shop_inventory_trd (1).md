# Technical Requirements Document (TRD)
## Shop Inventory & Order Management System MVP

**Version:** 1.0  
**Date:** January 24, 2026  
**Technical Lead:** [Your Name]  
**Status:** Draft

---

## 1. Technical Overview

### 1.1 System Architecture
**Architecture Pattern:** Microservices-oriented Monolith (Modular Monolith for MVP)

**Rationale:** Start with a well-structured monolith that can be split into microservices post-MVP if needed. This approach provides faster development, easier debugging, and simpler deployment while maintaining clear module boundaries.

### 1.2 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
├──────────────────┬──────────────────┬──────────────────────┤
│   Web Browser    │   Mobile Browser │  PWA (Future)        │
│   (React SPA)    │   (Responsive)   │                      │
└──────────────────┴──────────────────┴──────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway / Load Balancer              │
│                    (Nginx / AWS ALB)                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Application Layer                          │
├──────────────────────────────────────────────────────────────┤
│  Backend API Server (Node.js/Express or Python/FastAPI)    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │           Module Services (Business Logic)           │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │ Auth │ Inventory │ POS │ Orders │ Billing │ Reports │  │
│  │ Staff│ Suppliers │ Expenses │ Milk │ Booking │ etc │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                              │
├──────────────┬──────────────┬──────────────┬───────────────┤
│  PostgreSQL  │    Redis     │  File Storage│  Search Engine│
│  (Primary DB)│   (Cache)    │   (S3/Local) │ (Future: ES)  │
└──────────────┴──────────────┴──────────────┴───────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  External Services                          │
├──────────────┬──────────────┬──────────────┬───────────────┤
│  Email (SMTP)│   SMS Gateway│  Payment GW  │  Notification │
│  SendGrid    │   Twilio     │  Razorpay    │  Service      │
└──────────────┴──────────────┴──────────────┴───────────────┘
```

---

## 2. Technology Stack

### 2.1 Frontend Stack

#### Core Framework
**Technology:** React 18+ with TypeScript  
**Routing:** React Router v6  
**Build Tool:** Vite (faster than CRA)

**Rationale:** React provides component reusability, large ecosystem, and excellent developer experience. TypeScript adds type safety reducing runtime errors.

#### UI Framework & Styling
**CSS Framework:** Tailwind CSS 3.x  
**Component Library:** shadcn/ui + Radix UI  
**Icons:** Lucide React  
**Charts:** Recharts + Chart.js

**Rationale:** Tailwind provides utility-first styling for rapid development. shadcn/ui offers accessible, customizable components without vendor lock-in.

#### State Management
**Global State:** Zustand (lightweight alternative to Redux)  
**Server State:** TanStack Query (React Query v5)  
**Form State:** React Hook Form + Zod validation

**Rationale:** Zustand is simpler than Redux for small-medium apps. React Query handles API caching, synchronization, and updates elegantly.

#### Additional Libraries
- **Date Handling:** date-fns
- **Tables:** TanStack Table (React Table v8)
- **PDF Generation:** react-pdf or jsPDF
- **Notifications:** react-hot-toast
- **Image Upload:** react-dropzone
- **Excel Export:** xlsx
- **Barcode:** react-barcode

### 2.2 Backend Stack

#### Primary Option: Node.js
**Runtime:** Node.js 20 LTS  
**Framework:** Express.js 4.x  
**Language:** TypeScript

**Structure:**
```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── services/        # Business logic
├── models/          # Database models
├── middleware/      # Custom middleware
├── routes/          # API routes
├── utils/           # Helper functions
├── validators/      # Request validation schemas
└── types/           # TypeScript types
```

#### Alternative Option: Python
**Language:** Python 3.11+  
**Framework:** FastAPI  
**ORM:** SQLAlchemy 2.0

**Rationale for Node.js (Recommended):** JavaScript across full stack, better for real-time features, large ecosystem, easier to find developers.

#### API Design
**Style:** RESTful API  
**Documentation:** OpenAPI 3.0 (Swagger)  
**Versioning:** URL-based (`/api/v1/`)

#### Authentication & Authorization
**Authentication:** JWT (JSON Web Tokens)  
**Password Hashing:** bcrypt  
**Session Management:** Redis for token storage  
**Authorization:** RBAC (Role-Based Access Control)

**JWT Structure:**
```json
{
  "userId": "uuid",
  "role": "admin|manager|staff|customer",
  "permissions": ["inventory.read", "pos.write"],
  "exp": 1234567890
}
```

#### Core Backend Libraries (Node.js)
- **Validation:** Joi or Zod
- **ORM:** Prisma or TypeORM
- **File Upload:** Multer
- **Email:** Nodemailer
- **Logging:** Winston
- **Cron Jobs:** node-cron
- **PDF Generation:** PDFKit or Puppeteer
- **Excel:** ExcelJS
- **Rate Limiting:** express-rate-limit

### 2.3 Database Architecture

#### Primary Database: PostgreSQL 15+

**Rationale:** ACID compliance, excellent for financial data, supports complex queries, JSON support, mature ecosystem.

#### Database Schema Overview

**Core Tables (30+ tables):**

1. **User Management**
   - users
   - roles
   - permissions
   - user_roles
   - user_sessions

2. **Product & Inventory**
   - products
   - product_categories
   - product_variants
   - inventory_items
   - inventory_locations
   - stock_movements
   - damaged_stock
   - expiry_tracking
   - stock_alerts

3. **Purchase Management**
   - purchase_orders
   - purchase_order_items
   - purchase_invoices
   - purchase_returns

4. **Sales & POS**
   - sales_orders
   - sales_order_items
   - invoices
   - payments
   - payment_methods
   - returns
   - cash_register_sessions

5. **Supplier Management**
   - suppliers
   - supplier_contacts
   - supplier_documents

6. **Customer Management**
   - customers
   - customer_addresses
   - customer_bookings
   - booking_payments

7. **Subscription & Delivery**
   - subscriptions
   - subscription_plans
   - milk_delivery_customers
   - delivery_schedules
   - delivery_routes
   - delivery_logs

8. **Expense Management**
   - expenses
   - expense_categories
   - expense_attachments

9. **Staff Management**
   - employees
   - attendance_records
   - leave_applications
   - salary_records

10. **Reporting**
    - audit_logs
    - notifications
    - system_settings

#### Sample Database Schema (Key Tables)

```sql
-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    role_id UUID REFERENCES roles(id),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES product_categories(id),
    barcode VARCHAR(100),
    unit_of_measure VARCHAR(20), -- kg, liter, piece, box
    purchase_price DECIMAL(10,2),
    selling_price DECIMAL(10,2),
    mrp DECIMAL(10,2),
    tax_rate DECIMAL(5,2), -- GST percentage
    reorder_level INTEGER,
    max_stock_level INTEGER,
    is_perishable BOOLEAN DEFAULT false,
    shelf_life_days INTEGER,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Items Table
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    location_id UUID REFERENCES inventory_locations(id),
    batch_number VARCHAR(100),
    quantity INTEGER NOT NULL DEFAULT 0,
    available_quantity INTEGER NOT NULL DEFAULT 0, -- Excluding reserved
    reserved_quantity INTEGER DEFAULT 0,
    damaged_quantity INTEGER DEFAULT 0,
    expiry_date DATE,
    manufacturing_date DATE,
    status VARCHAR(50) DEFAULT 'available', -- available, reserved, damaged, expired
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock Movements Table (Audit Trail)
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    inventory_item_id UUID REFERENCES inventory_items(id),
    movement_type VARCHAR(50) NOT NULL, -- purchase, sale, return, adjustment, damage, expiry
    quantity INTEGER NOT NULL,
    from_location_id UUID REFERENCES inventory_locations(id),
    to_location_id UUID REFERENCES inventory_locations(id),
    reference_type VARCHAR(50), -- purchase_order, sales_order, etc.
    reference_id UUID,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales Orders Table
CREATE TABLE sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    order_type VARCHAR(50) DEFAULT 'pos', -- pos, online, booking
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, partial, paid, refunded
    order_status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, processing, ready, delivered, cancelled
    delivery_address TEXT,
    delivery_type VARCHAR(50), -- pickup, delivery
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions Table (Monthly Payers)
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id),
    subscription_type VARCHAR(50) NOT NULL, -- monthly_order, milk_delivery
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active', -- active, paused, cancelled, completed
    billing_cycle VARCHAR(50) DEFAULT 'monthly', -- daily, weekly, monthly
    amount DECIMAL(10,2) NOT NULL,
    last_billing_date DATE,
    next_billing_date DATE,
    auto_renew BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Milk Delivery Table
CREATE TABLE milk_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES subscriptions(id),
    customer_id UUID REFERENCES customers(id),
    delivery_date DATE NOT NULL,
    quantity_liters DECIMAL(5,2) NOT NULL,
    delivery_status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, completed, skipped, cancelled
    delivery_time TIME,
    route_id UUID REFERENCES delivery_routes(id),
    delivered_by UUID REFERENCES employees(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expenses Table
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES expense_categories(id),
    expense_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    vendor_name VARCHAR(255),
    payment_method VARCHAR(50),
    is_recurring BOOLEAN DEFAULT false,
    recurrence_frequency VARCHAR(50), -- daily, weekly, monthly, yearly
    receipt_url TEXT,
    approved_by UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance Table
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id),
    attendance_date DATE NOT NULL,
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    status VARCHAR(50) DEFAULT 'present', -- present, absent, half_day, leave
    work_hours DECIMAL(5,2),
    overtime_hours DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, attendance_date)
);
```

#### Indexing Strategy

```sql
-- High-frequency query indexes
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_inventory_product ON inventory_items(product_id);
CREATE INDEX idx_inventory_expiry ON inventory_items(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX idx_sales_customer ON sales_orders(customer_id);
CREATE INDEX idx_sales_date ON sales_orders(order_date);
CREATE INDEX idx_sales_status ON sales_orders(order_status);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(created_at);
CREATE INDEX idx_attendance_employee_date ON attendance_records(employee_id, attendance_date);
```

#### Caching Strategy
**Cache Layer:** Redis 7.x

**Cache Usage:**
- Session storage (JWT tokens)
- Frequently accessed product data
- Dashboard metrics (TTL: 5 minutes)
- User permissions
- Low stock alerts
- API rate limiting counters

**Cache Keys Pattern:**
```
user:session:{userId}
product:details:{productId}
dashboard:metrics:{date}
inventory:low_stock
user:permissions:{userId}
```

### 2.4 File Storage

**Options:**
1. **Local Storage** (MVP - Development)
   - Path: `/uploads/{category}/{year}/{month}/`
   - Categories: products, receipts, documents, invoices

2. **Cloud Storage** (Production)
   - **Recommended:** AWS S3 or DigitalOcean Spaces
   - **Alternative:** Cloudinary (for images)

**File Types:**
- Product images (JPG, PNG, WebP)
- Receipts/Invoices (PDF)
- Expense attachments (PDF, JPG, PNG)
- Staff documents (PDF)

**Storage Structure:**
```
shop-inventory-storage/
├── products/
│   └── {productId}/
│       ├── main.jpg
│       └── variants/
├── invoices/
│   └── {year}/{month}/
├── receipts/
│   └── {year}/{month}/
└── documents/
    ├── staff/
    └── suppliers/
```

### 2.5 API Architecture

#### REST API Endpoints Structure

**Base URL:** `https://api.yourshop.com/api/v1`

**Authentication:**
```
POST   /auth/login
POST   /auth/register
POST   /auth/logout
POST   /auth/refresh-token
POST   /auth/forgot-password
POST   /auth/reset-password
GET    /auth/me
```

**Products:**
```
GET    /products                    # List all products (with pagination)
GET    /products/:id                # Get product details
POST   /products                    # Create product
PUT    /products/:id                # Update product
DELETE /products/:id                # Delete product
GET    /products/search?q=          # Search products
POST   /products/bulk-import        # Bulk import CSV
GET    /products/low-stock          # Low stock products
```

**Inventory:**
```
GET    /inventory                   # List inventory items
GET    /inventory/:id               # Get inventory item
PUT    /inventory/:id/adjust        # Adjust stock
GET    /inventory/movements         # Stock movement history
POST   /inventory/damage            # Record damaged stock
GET    /inventory/expiring          # Expiring items
GET    /inventory/expired           # Expired items
```

**POS:**
```
POST   /pos/cart                    # Create cart
PUT    /pos/cart/:id                # Update cart
POST   /pos/checkout                # Process sale
POST   /pos/return                  # Process return
GET    /pos/held-transactions       # Get held sales
POST   /pos/cash-register/open      # Open register
POST   /pos/cash-register/close     # Close register
```

**Orders:**
```
GET    /orders                      # List orders
GET    /orders/:id                  # Get order details
POST   /orders                      # Create order
PUT    /orders/:id/status           # Update order status
POST   /orders/:id/cancel           # Cancel order
GET    /orders/pending              # Pending orders
```

**Bookings:**
```
GET    /bookings                    # List bookings
POST   /bookings                    # Create booking
PUT    /bookings/:id                # Update booking
PUT    /bookings/:id/confirm        # Confirm booking
POST   /bookings/:id/payment        # Record payment
```

**Subscriptions:**
```
GET    /subscriptions               # List subscriptions
POST   /subscriptions               # Create subscription
PUT    /subscriptions/:id           # Update subscription
PUT    /subscriptions/:id/pause     # Pause subscription
PUT    /subscriptions/:id/resume    # Resume subscription
GET    /subscriptions/:id/invoices  # Get subscription invoices
```

**Milk Delivery:**
```
GET    /milk-delivery/schedule      # Get delivery schedule
POST   /milk-delivery               # Add delivery customer
PUT    /milk-delivery/:id/complete  # Mark delivery complete
GET    /milk-delivery/routes        # Get delivery routes
POST   /milk-delivery/:id/skip      # Skip delivery
```

**Expenses:**
```
GET    /expenses                    # List expenses
POST   /expenses                    # Create expense
PUT    /expenses/:id                # Update expense
DELETE /expenses/:id                # Delete expense
GET    /expenses/categories         # Get categories
GET    /expenses/summary            # Monthly summary
```

**Staff:**
```
GET    /staff                       # List employees
POST   /staff                       # Add employee
PUT    /staff/:id                   # Update employee
GET    /staff/:id/attendance        # Get attendance
POST   /staff/attendance            # Mark attendance
GET    /staff/:id/leaves            # Get leave records
POST   /staff/leaves                # Apply leave
```

**Reports:**
```
GET    /reports/sales               # Sales report
GET    /reports/inventory           # Inventory report
GET    /reports/purchases           # Purchase report
GET    /reports/expenses            # Expense report
GET    /reports/profit-loss         # P&L statement
GET    /reports/tax                 # Tax summary
POST   /reports/export              # Export report
```

**Dashboard:**
```
GET    /dashboard/overview          # Dashboard metrics
GET    /dashboard/sales-trend       # Sales trend data
GET    /dashboard/alerts            # System alerts
```

#### API Request/Response Format

**Standard Request:**
```json
{
  "data": {
    "name": "Product Name",
    "price": 100
  }
}
```

**Standard Success Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Product Name",
    "price": 100
  },
  "message": "Product created successfully",
  "timestamp": "2026-01-24T10:30:00Z"
}
```

**Standard Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "price",
        "message": "Price must be greater than 0"
      }
    ]
  },
  "timestamp": "2026-01-24T10:30:00Z"
}
```

**Pagination Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalPages": 10,
    "totalRecords": 200
  }
}
```

#### API Error Codes

```
400 - Bad Request (validation errors)
401 - Unauthorized (authentication failed)
403 - Forbidden (insufficient permissions)
404 - Not Found
409 - Conflict (duplicate entry)
422 - Unprocessable Entity (business logic error)
429 - Too Many Requests (rate limit)
500 - Internal Server Error
503 - Service Unavailable
```

### 2.6 Real-time Features

**Technology:** WebSocket (Socket.io)

**Real-time Updates:**
- Dashboard metrics updates
- New order notifications
- Low stock alerts
- POS synchronization across devices
- Staff attendance updates

**Socket Events:**
```javascript
// Client → Server
socket.emit('dashboard:subscribe')
socket.emit('orders:subscribe')

// Server → Client
socket.on('dashboard:update', (metrics) => {})
socket.on('order:new', (order) => {})
socket.on('inventory:low_stock', (product) => {})
socket.on('notification', (notification) => {})
```

### 2.7 Background Jobs & Scheduling

**Technology:** node-cron or Bull (Redis-based queue)

**Scheduled Jobs:**

```javascript
// Daily Jobs
- 00:00 - Generate daily sales report
- 00:30 - Check expiring products (next 7 days)
- 01:00 - Database backup
- 06:00 - Generate milk delivery routes for today
- 07:00 - Send delivery reminders to delivery staff

// Weekly Jobs
- Sunday 23:00 - Generate weekly sales summary
- Monday 09:00 - Send subscription payment reminders

// Monthly Jobs
- 1st 00:00 - Generate monthly invoices for subscriptions
- 1st 09:00 - Send monthly payment reminders
- 5th 00:00 - Generate monthly reports
- Last day 23:00 - Archive old data
```

**Job Queue (Bull):**
```javascript
// Job Types
- email:send
- sms:send
- invoice:generate
- report:export
- notification:push
- data:backup
```

---

## 3. Security Architecture

### 3.1 Authentication Flow

```
1. User Login → Credentials
2. Backend validates → bcrypt compare
3. Generate JWT (access + refresh tokens)
4. Store refresh token in Redis
5. Return tokens to client
6. Client stores access token (memory) + refresh token (httpOnly cookie)
7. Subsequent requests → Bearer token in Authorization header
8. Token expiry → Use refresh token to get new access token
```

**Token Expiry:**
- Access Token: 15 minutes
- Refresh Token: 7 days

### 3.2 Authorization (RBAC)

**Permission System:**
```javascript
const permissions = {
  // Products
  'products.read': ['admin', 'manager', 'staff'],
  'products.write': ['admin', 'manager'],
  'products.delete': ['admin'],
  
  // Inventory
  'inventory.read': ['admin', 'manager', 'staff'],
  'inventory.write': ['admin', 'manager'],
  'inventory.adjust': ['admin', 'manager'],
  
  // POS
  'pos.access': ['admin', 'manager', 'staff'],
  'pos.refund': ['admin', 'manager'],
  
  // Reports
  'reports.view': ['admin', 'manager'],
  'reports.financial': ['admin'],
  
  // Staff
  'staff.read': ['admin', 'manager'],
  'staff.write': ['admin'],
  'staff.salary': ['admin']
}
```

**Middleware Implementation:**
```javascript
const authorize = (permission) => {
  return async (req, res, next) => {
    const userRole = req.user.role;
    const userPermissions = await getPermissions(userRole);
    
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Insufficient permissions' }
      });
    }
    next();
  };
};

// Usage
router.delete('/products/:id', 
  authenticate, 
  authorize('products.delete'), 
  deleteProduct
);
```

### 3.3 Data Security

**Encryption:**
- Passwords: bcrypt (salt rounds: 12)
- Sensitive data at rest: AES-256
- Data in transit: TLS 1.3

**SQL Injection Prevention:**
- Use ORM (Prisma/TypeORM) with parameterized queries
- Input validation and sanitization
- Never concatenate user input in queries

**XSS Prevention:**
- Content Security Policy (CSP) headers
- Sanitize user input
- Escape output in templates
- Use React (auto-escapes)

**CSRF Prevention:**
- CSRF tokens for state-changing operations
- SameSite cookie attribute
- Verify origin header

**Rate Limiting:**
```javascript
// General API
- 100 requests per 15 minutes per IP

// Authentication endpoints
- 5 login attempts per 15 minutes per IP
- 3 password reset requests per hour per IP

// POS endpoints
- 200 requests per minute per user
```

### 3.4 Audit Logging

**Log Events:**
- User login/logout
- Permission changes
- Inventory adjustments
- Financial transactions
- Data deletion
- Configuration changes

**Log Structure:**
```json
{
  "id": "uuid",
  "timestamp": "2026-01-24T10:30:00Z",
  "user_id": "uuid",
  "action": "inventory.adjust",
  "resource_type": "inventory_item",
  "resource_id": "uuid",
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "changes": {
    "before": {"quantity": 100},
    "after": {"quantity": 95}
  },
  "status": "success"
}
```

---

## 4. Performance Optimization

### 4.1 Database Optimization

**Query Optimization:**
- Use appropriate indexes
- Avoid N+1 queries (use eager loading)
- Implement pagination (limit, offset)
- Use database views for complex reports
- Connection pooling (max: 20 connections)

**Example - Prisma Query Optimization:**
```javascript
// Bad - N+1 Query
const orders = await prisma.order.findMany();
for (const order of orders) {
  order.items = await prisma.orderItem.findMany({
    where: { orderId: order.id }
  });
}

// Good - Single Query with Include
const orders = await prisma.order.findMany({
  include: {
    items: true,
    customer: true
  }
});
```

### 4.2 Caching Strategy

**Cache Layers:**

1. **Browser Cache** (Static assets)
   - Images: 1 year
   - CSS/JS: 1 year (with hash versioning)
   - HTML: No cache

2. **CDN Cache** (Future)
   - Product images
   - Static assets

3. **Application Cache** (Redis)
   ```javascript
   // Dashboard metrics - 5 minutes
   cache.set('dashboard:metrics:today', data, 300);
   
   // Product details - 1 hour
   cache.set('product:details:' + productId, product, 3600);
   
   // Low stock alert - 10 minutes
   cache.set('inventory:low_stock', products, 600);
   ```

4. **Database Query Cache**
   - Enable PostgreSQL query result cache

### 4.3 API Performance

**Optimization Techniques:**
- Response compression (gzip/brotli)
- Field filtering (allow clients to request specific fields)
- Batch requests for multiple operations
- Implement ETags for conditional requests
- Use pagination for list endpoints
- Lazy loading for images

**Response Compression:**
```javascript
const compression = require('compression');
app.use(compression());
```

**Field Filtering:**
```
GET /products?fields=id,name,price
```

### 4.4 Frontend Performance

**Optimization Techniques:**
- Code splitting (React.lazy)
- Image optimization (WebP format, lazy loading)
- Bundle size optimization (tree shaking)
- Memoization (React.memo, useMemo, useCallback)
- Virtual scrolling for long lists (react-window)
- Debouncing search inputs

**Example - Code Splitting:**
```javascript
const Dashboard = React.lazy(() => import('./Dashboard'));
const Inventory = React.lazy(() => import('./Inventory'));
const POS = React.lazy(() => import('./POS'));

<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/inventory" element={<Inventory />} />
    <Route path="/pos" element={<POS />} />
  </Routes>
</Suspense>
```

### 4.5 Monitoring & Performance Metrics

**Metrics to Track:**
- API response time (target: < 200ms for 95th percentile)
- Database query time (target: < 100ms for 95th percentile)
- Page load time (target: < 2 seconds)
- Time to Interactive (target: < 3 seconds)
- Error rate (target: < 0.1%)
- Uptime (target: 99.5%)

**Tools:**
- **Backend:** New Relic, Datadog, or PM2 monitoring
- **Frontend:** Lighthouse, Web Vitals, Sentry
- **Database:** pg_stat_statements, pgAdmin
- **Uptime:** UptimeRobot, Pingdom

---

## 5. Deployment Architecture

### 5.1 Environment Setup

**Environments:**
1. **Development** - Local developer machines
2. **Staging** - Pre-production testing
3. **Production** - Live system

**Environment Variables:**
```bash
# Application
NODE_ENV=production
PORT=3000
API_URL=https://api.yourshop.com

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_URL=redis://host:6379

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# File Storage
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_BUCKET_NAME=shop-inventory
AWS_REGION=us-east-1

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password

# SMS
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890

# Payment Gateway
RAZORPAY_KEY_ID=your-key
RAZORPAY_KEY_SECRET=your-secret

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

### 5.2 Deployment Options

#### Option 1: Traditional VPS (Recommended for MVP)

**Provider:** DigitalOcean, Linode, or Vultr

**Server Specs (Production):**
- CPU: 4 vCPUs
- RAM: 8 GB
- Storage: 160 GB SSD
- Bandwidth: 5 TB

**Stack Setup:**
```
Ubuntu 22.04 LTS
├── Nginx (Reverse Proxy + SSL)
├── Node.js 20 (Backend)
├── PM2 (Process Manager)
├── PostgreSQL 15
├── Redis 7
└── Certbot (SSL Certificates)
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name yourshop.com www.yourshop.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourshop.com www.yourshop.com;

    ssl_certificate /etc/letsencrypt/live/yourshop.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourshop.com/privkey.pem;

    # Frontend (React SPA)
    location / {
        root /var/www/shop-frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

#### Option 2: Containerized Deployment (Docker)

**Docker Compose Structure:**
```yaml
version: '3.8'

services:
  # Backend API
  api:
    build: ./backend
    container_name: shop-api
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./uploads:/app/uploads
    networks:
      - shop-network

  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: shop-postgres
    restart: always
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=${DB_NAME}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - shop-network

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: shop-redis
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - shop-network

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: shop-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./frontend/dist:/usr/share/nginx/html
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api
    networks:
      - shop-network

volumes:
  postgres-data:
  redis-data:

networks:
  shop-network:
    driver: bridge
```

#### Option 3: Cloud Platform (Future Scale)

**AWS Architecture:**
```
Route 53 (DNS)
    ↓
CloudFront (CDN)
    ↓
Application Load Balancer
    ↓
ECS/EKS (Container Orchestration)
    ├── API Containers (Auto-scaling)
    ├── Worker Containers (Background Jobs)
    └── WebSocket Containers
    ↓
RDS PostgreSQL (Multi-AZ)
ElastiCache Redis
S3 (File Storage)
CloudWatch (Monitoring)
```

### 5.3 CI/CD Pipeline

**Tools:** GitHub Actions

**Workflow File:** `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci
      
      - name: Run backend tests
        run: cd backend && npm test
      
      - name: Run frontend tests
        run: cd frontend && npm test
      
      - name: Lint code
        run: |
          cd backend && npm run lint
          cd ../frontend && npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build backend
        run: cd backend && npm run build
      
      - name: Build frontend
        run: cd frontend && npm run build
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-files
          path: |
            backend/dist
            frontend/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Download artifacts
        uses: actions/download-artifact@v3
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/shop-inventory
            git pull origin main
            cd backend
            npm ci --production
            npm run migrate
            pm2 reload shop-api
            cd ../frontend
            npm ci
            npm run build
            sudo systemctl reload nginx
```

### 5.4 Database Migration Strategy

**Tool:** Prisma Migrate or TypeORM Migrations

**Migration Workflow:**
```bash
# Development
npm run migrate:dev

# Generate migration
npm run migrate:generate -- --name add_booking_table

# Production deployment
npm run migrate:deploy
```

**Rollback Strategy:**
```bash
# Rollback last migration
npm run migrate:rollback

# Rollback to specific version
npm run migrate:rollback -- --to 20260124000001
```

**Best Practices:**
- Always backup database before migration
- Test migrations in staging first
- Use transactions in migrations
- Keep migrations small and focused
- Version control all migrations

### 5.5 Backup Strategy

**Database Backups:**
```bash
# Daily automated backup (cron job)
0 2 * * * /usr/bin/pg_dump -U postgres shop_inventory > /backups/db_$(date +\%Y\%m\%d).sql

# Retention policy
- Daily backups: Keep for 7 days
- Weekly backups: Keep for 4 weeks
- Monthly backups: Keep for 12 months
```

**Backup Script:**
```bash
#!/bin/bash
BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="shop_inventory"

# Create backup
pg_dump -U postgres $DB_NAME | gzip > $BACKUP_DIR/db_$TIMESTAMP.sql.gz

# Upload to S3
aws s3 cp $BACKUP_DIR/db_$TIMESTAMP.sql.gz s3://shop-backups/database/

# Cleanup old local backups (keep 7 days)
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete

# Verify backup
if [ -f "$BACKUP_DIR/db_$TIMESTAMP.sql.gz" ]; then
    echo "Backup successful: db_$TIMESTAMP.sql.gz"
else
    echo "Backup failed!" | mail -s "Backup Alert" admin@yourshop.com
fi
```

**File Storage Backups:**
- Sync uploads to S3 daily
- Enable S3 versioning
- Cross-region replication for critical data

### 5.6 Disaster Recovery Plan

**Recovery Time Objective (RTO):** 4 hours  
**Recovery Point Objective (RPO):** 24 hours

**Recovery Steps:**
1. Provision new server/infrastructure
2. Restore latest database backup
3. Restore application code from Git
4. Restore file uploads from S3
5. Update DNS records
6. Verify system functionality
7. Monitor for issues

---

## 6. Testing Strategy

### 6.1 Testing Levels

#### Unit Tests
**Coverage Target:** 70%+

**Backend (Jest):**
```javascript
// Example: Product Service Test
describe('ProductService', () => {
  describe('createProduct', () => {
    it('should create a product with valid data', async () => {
      const productData = {
        name: 'Test Product',
        sku: 'TEST-001',
        price: 100
      };
      
      const result = await productService.create(productData);
      
      expect(result).toHaveProperty('id');
      expect(result.name).toBe('Test Product');
    });
    
    it('should throw error for duplicate SKU', async () => {
      const productData = { sku: 'DUPLICATE-001' };
      
      await expect(
        productService.create(productData)
      ).rejects.toThrow('SKU already exists');
    });
  });
});
```

**Frontend (React Testing Library):**
```javascript
// Example: Product Form Test
describe('ProductForm', () => {
  it('should submit form with valid data', async () => {
    const onSubmit = jest.fn();
    render(<ProductForm onSubmit={onSubmit} />);
    
    await userEvent.type(screen.getByLabelText('Product Name'), 'Test');
    await userEvent.type(screen.getByLabelText('Price'), '100');
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Test',
      price: 100
    });
  });
});
```

#### Integration Tests
**Coverage Target:** 50%+

**API Integration Tests:**
```javascript
describe('POST /api/v1/products', () => {
  it('should create product and update inventory', async () => {
    const response = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Product',
        sku: 'TEST-001',
        price: 100,
        initialStock: 50
      });
    
    expect(response.status).toBe(201);
    expect(response.body.data.id).toBeDefined();
    
    // Verify inventory was created
    const inventory = await getInventory(response.body.data.id);
    expect(inventory.quantity).toBe(50);
  });
});
```

#### End-to-End Tests
**Coverage Target:** Critical user flows

**Tool:** Playwright or Cypress

```javascript
// Example: POS Flow
test('complete sale transaction', async ({ page }) => {
  await page.goto('/pos');
  
  // Add products to cart
  await page.fill('[data-testid="product-search"]', 'Milk');
  await page.click('[data-testid="product-item-1"]');
  await page.fill('[data-testid="quantity"]', '2');
  await page.click('[data-testid="add-to-cart"]');
  
  // Checkout
  await page.click('[data-testid="checkout"]');
  await page.click('[data-testid="payment-cash"]');
  await page.fill('[data-testid="amount-received"]', '200');
  await page.click('[data-testid="complete-sale"]');
  
  // Verify success
  await expect(page.locator('[data-testid="success-message"]'))
    .toBeVisible();
});
```

### 6.2 Performance Testing

**Tool:** Apache JMeter or Artillery

**Load Test Scenarios:**
```yaml
# artillery.yml
config:
  target: "https://api.yourshop.com"
  phases:
    - duration: 60
      arrivalRate: 10  # 10 requests/second
    - duration: 120
      arrivalRate: 50  # Ramp up to 50 req/s
    - duration: 60
      arrivalRate: 100 # Peak load

scenarios:
  - name: "Get Products"
    flow:
      - get:
          url: "/api/v1/products"
          
  - name: "Create Sale"
    flow:
      - post:
          url: "/api/v1/pos/checkout"
          json:
            items: [...]
```

### 6.3 Security Testing

**Tools:**
- OWASP ZAP (Automated security scanning)
- npm audit (Dependency vulnerabilities)
- Snyk (Code and dependency scanning)

**Security Checklist:**
- [ ] SQL Injection testing
- [ ] XSS testing
- [ ] CSRF protection verification
- [ ] Authentication bypass attempts
- [ ] Authorization testing (role boundaries)
- [ ] Rate limiting verification
- [ ] SSL/TLS configuration
- [ ] Sensitive data exposure
- [ ] File upload security

---

## 7. Development Workflow

### 7.1 Git Workflow

**Branching Strategy:** Git Flow

```
main (production)
  ↓
develop (staging)
  ↓
feature/inventory-management
feature/pos-system
bugfix/cart-calculation
hotfix/critical-security-issue
```

**Branch Naming Convention:**
```
feature/short-description
bugfix/issue-number-description
hotfix/critical-issue
release/v1.0.0
```

**Commit Message Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Examples:**
```
feat(inventory): add expiry date tracking
fix(pos): correct tax calculation for multiple items
docs(api): update authentication documentation
refactor(orders): optimize query performance
```

### 7.2 Code Review Process

**Requirements:**
- At least 1 approval required
- All CI checks must pass
- No merge conflicts
- Code coverage maintained or improved

**Review Checklist:**
- [ ] Code follows style guide
- [ ] Tests included for new features
- [ ] Documentation updated
- [ ] No security vulnerabilities
- [ ] Performance considered
- [ ] Error handling implemented
- [ ] Logging added for critical operations

### 7.3 Development Tools

**Backend:**
- ESLint (linting)
- Prettier (code formatting)
- Husky (Git hooks)
- Nodemon (auto-reload)
- Postman/Insomnia (API testing)

**Frontend:**
- ESLint + Prettier
- React DevTools
- Redux DevTools (if using Redux)
- Storybook (component development)

**Pre-commit Hook:**
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ]
  }
}
```

---

## 8. Monitoring & Logging

### 8.1 Application Logging

**Log Levels:**
- ERROR: System errors, exceptions
- WARN: Warning conditions
- INFO: Informational messages
- DEBUG: Debug information (development only)

**Winston Logger Configuration:**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Write errors to error.log
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    // Write all logs to combined.log
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

// Console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

**Log Structure:**
```json
{
  "timestamp": "2026-01-24T10:30:00.000Z",
  "level": "info",
  "message": "Sale completed successfully",
  "userId": "uuid",
  "orderId": "uuid",
  "amount": 150.00,
  "metadata": {
    "ip": "192.168.1.100",
    "userAgent": "Mozilla/5.0..."
  }
}
```

### 8.2 Error Tracking

**Tool:** Sentry

**Integration:**
```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Error handler middleware
app.use(Sentry.Handlers.errorHandler());
```

**Custom Error Classes:**
```javascript
class ValidationError extends Error {
  constructor(message, errors) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.errors = errors;
  }
}

class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
    this.statusCode = 401;
  }
}
```

### 8.3 Performance Monitoring

**Metrics to Track:**

**Backend:**
- API response times (avg, p50, p95, p99)
- Database query times
- Error rates
- Request rates
- CPU and memory usage

**Frontend:**
- Page load time
- Time to Interactive (TTI)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)

**Tools:**
- Application: New Relic, Datadog
- Infrastructure: Prometheus + Grafana
- Frontend: Google Analytics, Sentry Performance

### 8.4 Alerting Rules

**Critical Alerts (PagerDuty/SMS):**
- System down (uptime check fails)
- Error rate > 5%
- Database connection failures
- Payment processing failures

**Warning Alerts (Email):**
- API response time > 1 second
- CPU usage > 80%
- Memory usage > 90%
- Disk space < 10%
- Failed background jobs

**Info Alerts (Dashboard):**
- Low stock items
- Expiring products
- Pending orders > 50

---

## 9. Documentation Requirements

### 9.1 Technical Documentation

**Required Documents:**
1. **API Documentation** (OpenAPI/Swagger)
2. **Database Schema Documentation**
3. **Architecture Diagrams**
4. **Deployment Guide**
5. **Development Setup Guide**
6. **Contributing Guidelines**

### 9.2 User Documentation

**Required Documents:**
1. **User Manual** (per role)
2. **Admin Guide**
3. **Training Videos**
4. **FAQ**
5. **Troubleshooting Guide**

### 9.3 Code Documentation

**Standards:**
- JSDoc comments for all public functions
- README in each module directory
- Inline comments for complex logic
- Type definitions (TypeScript)

**Example:**
```typescript
/**
 * Creates a new product and initializes inventory
 * @param {CreateProductDTO} productData - Product information
 * @param {number} initialStock - Initial stock quantity
 * @returns {Promise<Product>} Created product with inventory
 * @throws {ValidationError} If product data is invalid
 * @throws {DuplicateError} If SKU already exists
 */
async function createProduct(
  productData: CreateProductDTO,
  initialStock: number = 0
): Promise<Product> {
  // Implementation
}
```

---

## 10. Third-Party Integrations

### 10.1 Payment Gateway

**Provider:** Razorpay (India) or Stripe (International)

**Features:**
- Accept online payments
- Subscription billing
- Refunds processing
- Payment analytics

**Integration Points:**
- Online orders checkout
- Subscription payments
- Booking advance payments

### 10.2 Notification Services

**Email:** SendGrid or Amazon SES
- Order confirmations
- Invoice delivery
- Password reset
- Subscription reminders

**SMS:** Twilio
- OTP verification
- Delivery notifications
- Payment reminders
- Low stock alerts (to admin)

**Push Notifications:** Firebase Cloud Messaging (Future)

### 10.3 Communication APIs

**WhatsApp Business API** (Future)
- Order updates
- Delivery status
- Customer support

---

## 11. Scalability Considerations

### 11.1 Horizontal Scaling

**Backend API:**
- Stateless design (no session affinity required)
- Load balancer distribution
- Multiple server instances

**Database:**
- Read replicas for reporting
- Connection pooling
- Query optimization

### 11.2 Vertical Scaling

**When to Scale Up:**
- CPU usage consistently > 70%
- Memory usage > 80%
- Database connections maxed out

**Scaling Path:**
```
Tier 1: 2 vCPU, 4 GB RAM    → Up to 100 concurrent users
Tier 2: 4 vCPU, 8 GB RAM    → Up to 500 concurrent users
Tier 3: 8 vCPU, 16 GB RAM   → Up to 2000 concurrent users
Tier 4: 16 vCPU, 32 GB RAM  → Up to 5000 concurrent users
```

### 11.3 Future Architecture (Post-MVP)

**Microservices Breakdown:**
```
API Gateway
    ├── Auth Service
    ├── Product Service
    ├── Inventory Service
    ├── Order Service
    ├── Payment Service
    ├── Notification Service
    ├── Reporting Service
    └── Analytics Service
```

---

## 12. Compliance & Standards

### 12.1 Data Privacy

**GDPR Compliance** (if applicable):
- User consent for data collection
- Right to data export
- Right to deletion
- Data breach notification

**India - Data Protection:**
- PII data encryption
- Secure data storage
- Access controls

### 12.2 Tax Compliance

**GST (India):**
- GST-compliant invoicing
- GSTR reports generation
- HSN/SAC codes
- Tax calculation (CGST, SGST, IGST)

---

## 13. Project Timeline & Milestones

### 13.1 Development Phases

**Phase 1: Foundation (Weeks 1-3)**
- [ ] Project setup (repos, CI/CD)
- [ ] Database schema design
- [ ] Authentication system
- [ ] Basic API structure
- [ ] Frontend boilerplate

**Phase 2: Core Features (Weeks 4-6)**
- [ ] Product management
- [ ] Inventory tracking
- [ ] POS system
- [ ] Basic reporting

**Phase 3: Advanced Features (Weeks 7-9)**
- [ ] Online orders
- [ ] Booking system
- [ ] Subscriptions
- [ ] Milk delivery

**Phase 4: Operations (Weeks 10-12)**
- [ ] Staff management
- [ ] Expense tracking
- [ ] Advanced reports
- [ ] Testing & bug fixes
- [ ] Deployment

---

## 14. Appendices

### 14.1 Technology Alternatives

**Backend Alternatives:**
- Django (Python) - Better admin panel
- Laravel (PHP) - Mature ecosystem
- Ruby on Rails - Rapid development

**Database Alternatives:**
- MySQL - More common, easier hosting
- MongoDB - Flexible schema
- CockroachDB - Distributed SQL

**Frontend Alternatives:**
- Vue.js - Easier learning curve
- Svelte - Better performance
- Angular - Enterprise-grade

### 14.2 Estimated Costs (Monthly)

**MVP Hosting:**
- VPS Server: $40-80
- Database (managed): $15-30
- File Storage (S3): $5-15
- Email Service: $10-20
- SMS Service: $10-50
- Domain & SSL: $2-5
- Monitoring: $0-30 (free tier initially)

**Total: $82-230/month**

### 14.3 Team Requirements

**MVP Team:**
- 1 Full-stack Developer (or 1 Backend + 1 Frontend)
- 1 UI/UX Designer (part-time/contract)
- 1 QA Tester (part-time)
- 1 DevOps Engineer (part-time/contract)

**Post-MVP Team:**
- 2-3 Backend Developers
- 2 Frontend Developers
- 1 Mobile Developer
- 1 UI/UX Designer
- 1-2 QA Engineers
- 1 DevOps Engineer
- 1 Product Manager

---

**Document Control:**
- Last Updated: January 24, 2026
- Next Review: February 24, 2026
- Approval Status: Pending

**Sign-off:**
- Technical Lead: _________________
- Backend Lead: _________________
- Frontend Lead: _________________
- DevOps Lead: _________________