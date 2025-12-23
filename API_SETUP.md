# PostgreSQL API Setup

This API provides CRUD operations for a PostgreSQL database using Next.js App Router.

## Prerequisites

1. **PostgreSQL Database**: Make sure you have PostgreSQL installed and running
2. **Node.js**: Version 18 or higher
3. **Environment Variables**: Configure your database connection

## Setup Instructions

### 1. Database Setup

1. Create a PostgreSQL database:

```sql
CREATE DATABASE your_database;
```

2. Run the initialization script:

```bash
psql -d your_database -f lib/db-init.sql
```

### 2. Environment Configuration

Update the `.env.local` file with your database credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database
DB_USER=postgres
DB_PASSWORD=your_password
```

### 3. Install Dependencies

Dependencies are already installed, but if needed:

```bash
npm install pg @types/pg
```

### 4. Start the Development Server

```bash
npm run dev
```

## API Endpoints

### Health Check

- **GET** `/api/health` - Check API and database connectivity

### Users CRUD

- **GET** `/api/users` - Get all users
- **POST** `/api/users` - Create a new user
- **GET** `/api/users/[id]` - Get a specific user
- **PUT** `/api/users/[id]` - Update a user
- **DELETE** `/api/users/[id]` - Delete a user

## Example Usage

### Create a User

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
```

### Get All Users

```bash
curl http://localhost:3000/api/users
```

### Update a User

```bash
curl -X PUT http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "John Updated", "email": "john.updated@example.com"}'
```

### Delete a User

```bash
curl -X DELETE http://localhost:3000/api/users/1
```

## Database Schema

The API includes a `users` table with the following structure:

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Error Handling

All endpoints return JSON responses with the following structure:

**Success Response:**

```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**

```json
{
	"success": false,
	"error": "Error message"
}
```

## Security Considerations

- Use environment variables for database credentials
- Enable SSL in production
- Implement input validation and sanitization
- Add authentication and authorization as needed
- Use connection pooling for better performance

## Extending the API

To add new endpoints:

1. Create new route files in `app/api/[endpoint]/route.ts`
2. Use the `query` function from `@/lib/db` for database operations
3. Follow the existing error handling patterns
4. Add corresponding database tables/migrations as needed
