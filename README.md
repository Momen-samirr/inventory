# Production-Ready Inventory Management System

A comprehensive, enterprise-grade inventory management system with authentication, role-based access control, image uploads, stock tracking, and audit logging.

## Features

- 🔐 **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (Admin, Manager, Employee)
  - Secure password hashing with bcrypt
  - Protected routes and API endpoints

- 📦 **Product Management**
  - Create, read, update, delete products
  - Image upload with Cloudinary integration
  - Product categories with proper database relationships
  - Category management (Admin/Manager)
  - Product descriptions and metadata
  - Stock quantity tracking

- 👥 **User Management**
  - Admin can create, edit, and delete users
  - Role assignment (Admin, Manager, Employee)
  - User activation/deactivation
  - Secure password management
  - Profile settings and preferences

- 🏷️ **Category Management**
  - Create, edit, delete categories
  - Category-product relationships
  - Prevent deletion of categories with products
  - Category-based product filtering

- 📊 **Inventory Management**
  - Real-time stock tracking
  - Stock movement history
  - Low stock alerts
  - Prevent negative stock

- 📈 **Dashboard & Analytics**
  - Sales summary charts
  - Purchase tracking
  - Expense management
  - Popular products display

- 🔍 **Audit Logging**
  - Track all critical actions
  - User activity monitoring
  - Filterable audit logs

- 🎨 **Modern UI/UX**
  - Responsive design
  - Loading states
  - Error handling
  - Toast notifications
  - Role-based UI elements

## Tech Stack

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Redux Toolkit** - State management
- **RTK Query** - API data fetching
- **React Hook Form** - Form handling
- **Zod** - Validation
- **React Hot Toast** - Notifications

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **Prisma** - ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Cloudinary** - Image hosting
- **Zod** - Validation
- **Multer** - File uploads

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or Neon, Supabase, etc.)
- Cloudinary account (for image uploads)
- Git

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd inv
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/inventory_db
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

Run database migrations:

```bash
npx prisma migrate dev
```

Seed the database (creates admin user):

```bash
npm run seed
```

Default admin credentials:
- Email: `admin@inventory.com`
- Password: `admin123`

**⚠️ Change these credentials in production!**

Start the backend server:

```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd ../client
npm install
```

Create a `.env.local` file in the `client` directory:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
```

Start the frontend development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
inv/
├── client/                 # Next.js frontend
│   ├── src/
│   │   ├── app/            # Next.js app router
│   │   │   ├── auth/       # Authentication pages
│   │   │   ├── dashboard/  # Dashboard components
│   │   │   └── ...
│   │   ├── components/     # Reusable components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   ├── state/          # Redux store
│   │   └── middleware.ts  # Next.js middleware
│   └── package.json
│
└── server/                 # Express backend
    ├── src/
    │   ├── config/         # Configuration files
    │   ├── controllers/    # Route controllers
    │   ├── middleware/    # Express middleware
    │   ├── routes/         # API routes
    │   ├── services/       # Business logic
    │   ├── types/         # TypeScript types
    │   └── utils/         # Utility functions
    ├── prisma/
    │   ├── schema.prisma   # Database schema
    │   └── seed.ts        # Seed script
    └── package.json
```

## API Documentation

### Authentication

#### POST `/api/auth/login`
Login user and get JWT token.

**Request Body:**
```json
{
  "email": "admin@inventory.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt-token",
    "user": {
      "userId": "uuid",
      "name": "Admin User",
      "email": "admin@inventory.com",
      "role": "ADMIN"
    }
  }
}
```

#### POST `/api/auth/register`
Register new user (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "New User",
  "email": "user@example.com",
  "password": "password123",
  "role": "EMPLOYEE"
}
```

#### GET `/api/auth/me`
Get current user information.

**Headers:** `Authorization: Bearer <token>`

### Products

#### GET `/api/products`
Get all products (with optional search and category filters).

**Query Parameters:**
- `search` - Search term
- `categoryId` - Filter by category ID

**Headers:** `Authorization: Bearer <token>`

#### POST `/api/products`
Create a new product.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Product Name",
  "description": "Product description",
  "price": 99.99,
  "stockQuantity": 100,
  "categoryId": "uuid",
  "rating": 4.5
}
```

### Categories

#### GET `/api/categories`
Get all categories.

**Headers:** `Authorization: Bearer <token>`

#### POST `/api/categories`
Create a new category (Admin/Manager only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Electronics",
  "description": "Electronic products"
}
```

#### PUT `/api/categories/:id`
Update a category (Admin/Manager only).

**Headers:** `Authorization: Bearer <token>`

#### DELETE `/api/categories/:id`
Delete a category (Admin only). Cannot delete if category has products.

**Headers:** `Authorization: Bearer <token>`

### Users

#### GET `/api/users`
Get all users (Admin only).

**Headers:** `Authorization: Bearer <token>`

#### POST `/api/users`
Create a new user (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "New User",
  "email": "user@example.com",
  "password": "password123",
  "role": "EMPLOYEE",
  "isActive": true
}
```

#### PUT `/api/users/:id`
Update a user (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "role": "MANAGER",
  "isActive": true,
  "password": "newpassword123"
}
```

#### DELETE `/api/users/:id`
Delete a user (Admin only). Cannot delete own account.

**Headers:** `Authorization: Bearer <token>`

#### PUT `/api/products/:id`
Update a product.

**Headers:** `Authorization: Bearer <token>`

#### DELETE `/api/products/:id`
Delete a product.

**Headers:** `Authorization: Bearer <token>`

#### POST `/api/products/:id/image`
Upload product image.

**Headers:** `Authorization: Bearer <token>`

**Request:** `multipart/form-data` with `image` file

### Inventory

#### GET `/api/inventory/movements`
Get stock movement history.

**Query Parameters:**
- `productId` - Filter by product
- `userId` - Filter by user
- `movementType` - Filter by type (SALE, PURCHASE, ADJUSTMENT, RETURN)
- `limit` - Results limit
- `offset` - Results offset

**Headers:** `Authorization: Bearer <token>`

#### POST `/api/inventory/adjust`
Adjust stock quantity.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "productId": "uuid",
  "quantity": 10,
  "movementType": "ADJUSTMENT",
  "reason": "Stock correction"
}
```

#### GET `/api/inventory/low-stock`
Get products with low stock.

**Query Parameters:**
- `threshold` - Stock threshold (default: 10)

**Headers:** `Authorization: Bearer <token>`

### Audit Logs

#### GET `/api/audit-logs`
Get audit logs (Admin only).

**Query Parameters:**
- `userId` - Filter by user
- `action` - Filter by action
- `entityType` - Filter by entity type
- `startDate` - Start date filter
- `endDate` - End date filter
- `limit` - Results limit
- `offset` - Results offset

**Headers:** `Authorization: Bearer <token>`

## Roles & Permissions

### Admin
- Full access to all features
- User management
- Audit logs access
- All CRUD operations

### Manager
- Product management
- Inventory management
- Expense management
- View reports
- No user management

### Employee
- View products
- View inventory
- View expenses
- Limited actions

## Environment Variables

### Server (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `JWT_EXPIRES_IN` | Token expiration time | No (default: 7d) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes |
| `PORT` | Server port | No (default: 3001) |
| `NODE_ENV` | Environment | No (default: development) |
| `CLIENT_URL` | Frontend URL for CORS | No |

### Client (.env.local)

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API URL | Yes |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name (optional) | No |

## Database Schema

The system uses Prisma ORM with PostgreSQL. Key models include:

- **Users** - User accounts with roles and authentication
- **Categories** - Product categories with proper relationships
- **Products** - Product catalog with category relationships
- **StockMovements** - Stock change history
- **Sales** - Sales transactions
- **Purchases** - Purchase transactions
- **Expenses** - Expense tracking
- **AuditLogs** - System audit trail

See `server/prisma/schema.prisma` for full schema.

## Deployment

### Production Deployment

For detailed production deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

**Quick Start:**
- **Frontend**: Deploy to Vercel (recommended for Next.js)
- **Backend**: Deploy to Render (Node.js/Express)
- **Database**: Use Neon PostgreSQL (serverless PostgreSQL)
- **Images**: Use Cloudinary for image hosting

### Environment Variables

See `.env.example` files in `client/` and `server/` directories for required environment variables.

**Backend Required Variables:**
- `DATABASE_URL` - PostgreSQL connection string (from Neon)
- `JWT_SECRET` - Strong secret for JWT tokens (32+ characters)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` - Cloudinary credentials
- `CLIENT_URL` - Frontend URL for CORS

**Frontend Required Variables:**
- `NEXT_PUBLIC_API_BASE_URL` - Backend API URL

### Quick Deployment Steps

1. **Set up Neon database** and get connection string
2. **Deploy backend to Render** with environment variables
3. **Run migrations**: `npm run migrate:deploy` in Render shell
4. **Deploy frontend to Vercel** with environment variables
5. **Update backend CORS** with frontend URL
6. **Verify deployment** by testing health endpoints

For complete step-by-step instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting on API endpoints
- Input validation with Zod
- SQL injection prevention (Prisma)
- XSS protection (Helmet)
- CORS configuration
- Role-based access control

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For issues and questions, please open an issue on GitHub.
