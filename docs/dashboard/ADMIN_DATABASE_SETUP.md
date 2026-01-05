# Admin Dashboard Authentication - Database Migrations

## SQL Scripts for Setting Up Tables

### Create Tables Script

Run these SQL commands to set up the authentication system:

```sql
-- Create admin_roles table
CREATE TABLE admin_roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_type VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create admin_users table
CREATE TABLE admin_users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    role_id BIGINT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    CONSTRAINT fk_admin_users_role FOREIGN KEY (role_id) REFERENCES admin_roles(id)
);

-- Create indexes for performance
CREATE INDEX idx_admin_users_username ON admin_users(username);
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_role_id ON admin_users(role_id);
CREATE INDEX idx_admin_users_is_active ON admin_users(is_active);
CREATE INDEX idx_admin_roles_role_type ON admin_roles(role_type);
```

## JPA Automatic Table Creation

### Option 1: Let Hibernate Auto-Create Tables (Development Only)

If you want Hibernate to automatically create tables on application startup, update `application.properties`:

```properties
# Hibernate DDL Auto (use only in development, not production)
spring.jpa.hibernate.ddl-auto=create-drop  # Recreate tables on startup
# OR
spring.jpa.hibernate.ddl-auto=update       # Add/update tables without dropping
spring.jpa.hibernate.ddl-auto=validate     # Only validate schema (recommended for production)

# Show SQL statements
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect
```

### Option 2: Liquibase Migration (Production Recommended)

Create a Liquibase changelog file at `src/main/resources/db/changelog/001-create-admin-tables.yaml`:

```yaml
databaseChangeLog:
  - changeSet:
      id: 001-create-admin-roles-table
      author: admin-team
      changes:
        - createTable:
            tableName: admin_roles
            columns:
              - column:
                  name: id
                  type: BIGINT
                  autoIncrement: true
                  constraints:
                    primaryKey: true
              - column:
                  name: role_type
                  type: VARCHAR(50)
                  constraints:
                    nullable: false
                    unique: true
              - column:
                  name: description
                  type: VARCHAR(255)
                  constraints:
                    nullable: false
              - column:
                  name: created_at
                  type: TIMESTAMP
                  defaultValue: CURRENT_TIMESTAMP
                  constraints:
                    nullable: false

  - changeSet:
      id: 001-create-admin-users-table
      author: admin-team
      changes:
        - createTable:
            tableName: admin_users
            columns:
              - column:
                  name: id
                  type: BIGINT
                  autoIncrement: true
                  constraints:
                    primaryKey: true
              - column:
                  name: username
                  type: VARCHAR(100)
                  constraints:
                    nullable: false
                    unique: true
              - column:
                  name: password_hash
                  type: VARCHAR(255)
                  constraints:
                    nullable: false
              - column:
                  name: full_name
                  type: VARCHAR(255)
              - column:
                  name: email
                  type: VARCHAR(255)
                  constraints:
                    unique: true
              - column:
                  name: role_id
                  type: BIGINT
                  constraints:
                    nullable: false
              - column:
                  name: is_active
                  type: BOOLEAN
                  defaultValue: true
                  constraints:
                    nullable: false
              - column:
                  name: created_at
                  type: TIMESTAMP
                  defaultValue: CURRENT_TIMESTAMP
                  constraints:
                    nullable: false
              - column:
                  name: updated_at
                  type: TIMESTAMP
                  defaultValue: CURRENT_TIMESTAMP
                  constraints:
                    nullable: false
              - column:
                  name: last_login_at
                  type: TIMESTAMP
        - addForeignKeyConstraint:
            constraintName: fk_admin_users_role
            baseTableName: admin_users
            baseColumnNames: role_id
            referencedTableName: admin_roles
            referencedColumnNames: id

  - changeSet:
      id: 001-create-admin-indexes
      author: admin-team
      changes:
        - createIndex:
            indexName: idx_admin_users_username
            tableName: admin_users
            columns:
              - column:
                  name: username
        - createIndex:
            indexName: idx_admin_users_email
            tableName: admin_users
            columns:
              - column:
                  name: email
        - createIndex:
            indexName: idx_admin_users_role_id
            tableName: admin_users
            columns:
              - column:
                  name: role_id
        - createIndex:
            indexName: idx_admin_users_is_active
            tableName: admin_users
            columns:
              - column:
                  name: is_active
        - createIndex:
            indexName: idx_admin_roles_role_type
            tableName: admin_roles
            columns:
              - column:
                  name: role_type
```

Then update `application.properties` to enable Liquibase:

```properties
# Liquibase Configuration
spring.liquibase.enabled=true
spring.liquibase.change-log=classpath:db/changelog/db.changelog-master.yaml
```

## Initialization of Roles and Default User

The `AdminBootstrapInitializer` class automatically:
1. Creates ADMIN and OWNER roles if they don't exist
2. Creates the default admin user with credentials:
   - Username: `admin`
   - Password: `pa55ward`
   - Full Name: `System Administrator`
   - Email: `admin@codesharing.local`
   - Role: `ADMIN`

**First Login:**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"pa55ward"}'
```

## Verification

After running the application, verify the setup:

```sql
-- Check roles created
SELECT * FROM admin_roles;
-- Expected: 2 rows (ADMIN, OWNER)

-- Check default admin user created
SELECT * FROM admin_users;
-- Expected: 1 row with username='admin'

-- Verify foreign key relationship
SELECT u.username, r.role_type
FROM admin_users u
JOIN admin_roles r ON u.role_id = r.id;
```

## Adding More Users

### Option 1: API Endpoint (Recommended)

1. Login as admin:
```bash
TOKEN=$(curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"pa55ward"}' | jq -r '.token')
```

2. Create new user:
```bash
curl -X POST http://localhost:8080/api/admin/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username":"john_owner",
    "password":"SecurePass123!",
    "fullName":"John Owner",
    "email":"john@example.com",
    "roleName":"OWNER"
  }'
```

### Option 2: Direct SQL Insert

```sql
-- Insert new OWNER user
INSERT INTO admin_users (username, password_hash, full_name, email, role_id, is_active)
VALUES (
    'john_owner',
    -- Use BCrypt hash generated via: new BCryptPasswordEncoder().encode("SecurePass123!")
    '$2a$10$3C1lnW8Wt/WpfxlCJhKymeKXy8gK3PxQwXKvDwc5Ql4SFqRJSJBfm',
    'John Owner',
    'john@example.com',
    (SELECT id FROM admin_roles WHERE role_type='OWNER'),
    TRUE
);
```

## Production Checklist

- [ ] Create tables using migration tool (Liquibase or Flyway)
- [ ] Change default admin password
- [ ] Configure JWT secret in environment variables
- [ ] Set `spring.jpa.hibernate.ddl-auto=validate` (not `create` or `update`)
- [ ] Enable HTTPS for all admin endpoints
- [ ] Configure rate limiting on `/api/auth/login`
- [ ] Set up monitoring and audit logging
- [ ] Test login and token validation
- [ ] Backup database before going live
- [ ] Document any custom changes to user management

## Troubleshooting

### "Table doesn't exist" error
- Ensure `AdminBootstrapInitializer` has run (check logs for "Initializing admin dashboard")
- Manually run SQL scripts if auto-creation is disabled
- Check `spring.jpa.hibernate.ddl-auto` setting

### "Foreign key constraint failed"
- Ensure admin_roles table is created before admin_users
- Ensure role_id references valid role ID in admin_roles table

### Duplicate key errors
- Check for existing users before creating
- Use `IF NOT EXISTS` in SQL or catch exceptions in Java

### Password hashing issues
- Ensure BCryptPasswordEncoder is used (not custom hashing)
- Verify password_hash field is at least 255 characters long
