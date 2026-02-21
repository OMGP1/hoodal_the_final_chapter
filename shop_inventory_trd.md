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
- **Frontend:** Lighthouse, Web Vitals,