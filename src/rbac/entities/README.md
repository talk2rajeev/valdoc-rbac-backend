# RBAC and Auth Tables

This document describes the current auth/RBAC table structure based on the TypeORM entities in this folder and the latest SQL updates.

Most tables in the SQL use the `auth` schema, for example `auth.users`, `auth.roles`, and `auth.tenants`. The `employees` table in the provided SQL is created without an explicit schema.

## Table Overview

| Table | Purpose |
| --- | --- |
| `auth.users` | Stores application user accounts and authentication data. |
| `auth.roles` | Defines assignable roles, such as system, vendor, engineer, plant admin, and customer roles. |
| `auth.user_roles` | Join table that assigns one or more roles to a user. |
| `auth.permission_groups` | Groups related permissions for easier organization. |
| `auth.permissions` | Defines individual permission codes used for access control. |
| `auth.role_permissions` | Join table that grants permissions to roles. |
| `auth.user_permissions` | Grants direct user-level permissions with optional JSON conditions. |
| `auth.parent_companies` | Stores parent/corporate company records. |
| `auth.tenants` | Stores plant/customer/vendor tenant records. |
| `auth.work_location_types` | Stores tenant-specific work location type names. |
| `auth.work_locations` | Stores tenant-specific work locations grouped by type. |
| `employees` | Stores employee profile details linked to tenant, user, and work location records. |

## `auth.users`

Stores user account records.

| Column | Type / Rule | Description |
| --- | --- | --- |
| `id` | Auto-increment primary key | User identifier. |
| `username` | `varchar(50)`, unique | Login username. |
| `email` | `varchar(255)`, unique | User email address. |
| `password_hash` | `varchar(255)` | Bcrypt-hashed password. Never store the plain password. |
| `full_name` | `varchar(100)`, nullable | Optional display name. |
| `is_active` | Boolean, default `true` | Disabled users cannot log in. |
| `last_login_at` | `timestamptz`, nullable | Updated after successful password validation. |
| `refresh_token` | `text`, nullable | Bcrypt-hashed current refresh token. Cleared on logout. |
| `tenant_id` | Integer, nullable FK to `auth.tenants.tenant_sys_id` | Tenant associated with the user. Added by latest SQL. |
| `user_type` | `varchar(50)`, default `CUSTOMER` | User category/type. Added by latest SQL. |
| `created_at` | `timestamptz` | Created timestamp. |
| `updated_at` | `timestamptz` | Last updated timestamp. |

Relations:

- One user can have many `auth.user_roles` records.
- One user can have many direct `auth.user_permissions` records.
- `tenant_id` references `auth.tenants.tenant_sys_id` with `ON DELETE SET NULL`.
- `employees.user_id` can reference `auth.users.id` with `ON DELETE SET NULL`.

Auth usage:

- `register` creates a user and stores `password_hash`.
- `login` validates `username`, checks `is_active`, compares the password hash, updates `last_login_at`, and stores a hashed refresh token.
- `refresh` compares the refresh token from the cookie with `refresh_token`.
- `logout` clears `refresh_token`.

Entity note:

- `tenant_id` and `user_type` are present in the latest SQL but are not yet represented in `user.entity.ts`.

## `auth.roles`

Stores role definitions.

| Column | Type / Rule | Description |
| --- | --- | --- |
| `role_sys_id` | Auto-increment primary key | Role identifier exposed as `id` in the entity. |
| `role_name` | `varchar(100)`, unique | Role name. |
| `is_internal` | Boolean, default `false` | Marks system/internal roles. |
| `created_at` | `timestamptz` | Created timestamp. |
| `updated_at` | `timestamptz` | Last updated timestamp. |

Seeded roles from the latest SQL:

- `SYSTEM_ADMIN`
- `GLOBAL_SUPER_ADMIN`
- `VENDOR_ADMIN`
- `FIELD_ENGINEER`
- `PLANT_APP_ADMIN`
- `CUSTOMER_END_USER`

Relations:

- One role can be assigned to many users through `auth.user_roles`.
- One role can have many permissions through `auth.role_permissions`.

## `auth.user_roles`

Join table between users and roles.

| Column | Type / Rule | Description |
| --- | --- | --- |
| `user_id` | Primary key column, FK to `auth.users.id` | User receiving the role. |
| `role_id` | Primary key column, FK to `auth.roles.role_sys_id` | Role assigned to the user. |
| `assigned_at` | `timestamptz` | Timestamp when the role was assigned. |

Relations:

- `user_id` references `auth.users.id` with cascade delete.
- `role_id` references `auth.roles.role_sys_id` with cascade delete.
- The composite primary key prevents duplicate role assignments for the same user.

## `auth.permission_groups`

Groups permissions into functional areas.

| Column | Type / Rule | Description |
| --- | --- | --- |
| `permission_group_sys_id` | Auto-increment primary key | Permission group identifier exposed as `id` in the entity. |
| `group_name` | `varchar(100)`, unique | Group name. |
| `description` | `text`, nullable | Optional explanation of the group. |
| `created_at` | `timestamptz` | Created timestamp. |
| `updated_at` | `timestamptz` | Last updated timestamp. |

Seeded groups from the latest SQL:

- `Global Infrastructure`
- `Identity & Access`
- `Facility Master Data`
- `Operational Assets`
- `Workflow Management`
- `Testing & Execution`
- `Compliance & Analytics`

Relations:

- One permission group can contain many permissions.

## `auth.permissions`

Stores individual access-control permissions.

| Column | Type / Rule | Description |
| --- | --- | --- |
| `permission_sys_id` | Auto-increment primary key | Permission identifier exposed as `id` in the entity. |
| `permission_code` | `varchar(100)`, unique | Stable permission code, for example `instrument.reference.view`. |
| `display_name` | `varchar(100)` | Human-readable permission name. |
| `group_id` | Nullable FK to `auth.permission_groups.permission_group_sys_id` | Optional permission group. |
| `target_tenant_type` | `varchar(50)`, default `BOTH` | Tenant type that the permission applies to. Added by latest SQL. |
| `created_at` | `timestamptz` | Created timestamp. |

Relations:

- A permission can belong to one `auth.permission_groups` record.
- If a permission group is deleted, `group_id` is set to `NULL`.
- A permission can be granted to many roles through `auth.role_permissions`.
- A permission can be granted directly to many users through `auth.user_permissions`.

Entity note:

- `target_tenant_type` is present in the latest SQL but is not yet represented in `permission.entity.ts`.

## `auth.role_permissions`

Join table between roles and permissions.

Latest SQL changes:

- Drops the old `role_permission_sys_id` foreign key constraint if it exists.
- Drops the old `role_permission_sys_id` column if it exists.
- Adds `role_id` as the role foreign key.

| Column | Type / Rule | Description |
| --- | --- | --- |
| `role_id` | Integer FK to `auth.roles.role_sys_id`, cascade delete | Role receiving the permission. |
| `permission_id` | FK to `auth.permissions.permission_sys_id`, cascade delete | Permission granted to the role. |
| `assigned_at` | `timestamptz`, default from entity/create timestamp | Timestamp when the permission was assigned. |

Relations:

- `role_id` references `auth.roles.role_sys_id` with cascade delete.
- `permission_id` references `auth.permissions.permission_sys_id` with cascade delete.

Entity note:

- `role-permission.entity.ts` still uses the older column name `role_permission_sys_id`. It should be updated to `role_id` if the latest SQL is now the database source of truth.

## `auth.user_permissions`

Direct user-to-permission assignment table. This allows a user to receive a permission outside of role membership.

| Column | Type / Rule | Description |
| --- | --- | --- |
| `user_id` | Integer FK to `auth.users.id`, cascade delete | User receiving the direct permission. |
| `permission_id` | Integer FK to `auth.permissions.permission_sys_id`, cascade delete | Permission assigned directly to the user. |
| `conditions` | `jsonb`, default `{}` | Optional rule/condition payload for scoped permissions. |
| `assigned_at` | `timestamptz`, default `now()` | Timestamp when the permission was assigned. |

Relations:

- Composite primary key: `user_id`, `permission_id`.
- Deleting the user or permission deletes the direct grant.

## `auth.parent_companies`

Stores parent or corporate company records.

| Column | Type / Rule | Description |
| --- | --- | --- |
| `parent_company_sys_id` | `serial` primary key | Parent company identifier. |
| `corporate_name` | `varchar(255)`, unique, not null | Corporate/parent company name. |
| `created_at` | `timestamptz`, default `now()` | Created timestamp. |

Relations:

- One parent company can have many `auth.tenants` records.

## `auth.tenants`

Stores tenant records, such as plants or company units.

| Column | Type / Rule | Description |
| --- | --- | --- |
| `tenant_sys_id` | `serial` primary key | Tenant identifier. |
| `parent_company_id` | Integer FK to `auth.parent_companies.parent_company_sys_id`, nullable | Parent company for this tenant. |
| `plant_name` | `varchar(255)`, not null | Plant or tenant display name. |
| `company_type` | `varchar(50)`, not null | Type/category of company or tenant. |
| `is_active` | Boolean, default `true` | Tenant active flag. |
| `created_at` | `timestamptz`, default `now()` | Created timestamp. |

Constraints and relations:

- `parent_company_id` uses `ON DELETE SET NULL`.
- Unique constraint `unique_plant_per_corp` on `parent_company_id`, `plant_name`.
- Referenced by `auth.users.tenant_id`, `auth.work_location_types.tenant_id`, `auth.work_locations.tenant_id`, and `employees.tenant_id`.

## `auth.work_location_types`

Stores tenant-specific categories for work locations.

| Column | Type / Rule | Description |
| --- | --- | --- |
| `location_type_sys_id` | `bigserial` primary key | Work location type identifier. |
| `tenant_id` | `bigint`, FK to `auth.tenants.tenant_sys_id`, not null | Tenant that owns this location type. |
| `location_type_name` | `varchar(100)`, not null | Location type name. |
| `created_at` | Timestamp with time zone, default `current_timestamp` | Created timestamp. |

Constraints and relations:

- `tenant_id` references `auth.tenants.tenant_sys_id` with cascade delete.
- Unique constraint `uq_tenant_location_type` on `tenant_id`, `location_type_name`.
- One location type can have many `auth.work_locations`.

## `auth.work_locations`

Stores tenant-specific work locations.

| Column | Type / Rule | Description |
| --- | --- | --- |
| `work_location_sys_id` | `bigserial` primary key | Work location identifier. |
| `tenant_id` | `bigint`, FK to `auth.tenants.tenant_sys_id`, not null | Tenant that owns this work location. |
| `location_type_id` | `bigint`, FK to `auth.work_location_types.location_type_sys_id`, not null | Type/category for this location. |
| `work_location_group` | `varchar(150)`, not null | Grouping label for the location. |
| `work_location_name` | `varchar(150)`, not null | Work location name. |
| `created_at` | Timestamp with time zone, default `current_timestamp` | Created timestamp. |

Constraints and relations:

- `tenant_id` references `auth.tenants.tenant_sys_id` with cascade delete.
- `location_type_id` references `auth.work_location_types.location_type_sys_id`.
- Unique constraint `uq_tenant_location_details` on `tenant_id`, `location_type_id`, `work_location_group`, `work_location_name`.
- Referenced by `employees.work_location_id` with `ON DELETE SET NULL`.

## `employees`

Stores employee profile details and optional links to application user and work location records.

| Column | Type / Rule | Description |
| --- | --- | --- |
| `employee_sys_id` | `bigserial` primary key | Employee identifier. |
| `tenant_id` | `bigint`, FK to `auth.tenants.tenant_sys_id`, not null | Tenant that owns this employee. |
| `user_id` | `bigint`, unique, nullable FK to `auth.users.id` | Optional linked login user. |
| `work_location_id` | `bigint`, nullable FK to `auth.work_locations.work_location_sys_id` | Optional assigned work location. |
| `employee_id_code` | `varchar(50)`, not null | Tenant-specific employee code. |
| `first_name` | `varchar(100)`, not null | Employee first name. |
| `last_name` | `varchar(100)`, not null | Employee last name. |
| `designation` | `varchar(150)`, nullable | Job designation/title. |
| `department` | `varchar(150)`, nullable | Department name. |
| `contact_number` | `varchar(20)`, nullable | Contact phone number. |
| `is_active` | Boolean, default `true` | Employee active flag. |
| `created_at` | Timestamp with time zone, default `current_timestamp` | Created timestamp. |

Constraints and relations:

- `tenant_id` references `auth.tenants.tenant_sys_id` with cascade delete.
- `user_id` references `auth.users.id` with `ON DELETE SET NULL`.
- `work_location_id` references `auth.work_locations.work_location_sys_id` with `ON DELETE SET NULL`.
- Unique constraint `uq_tenant_employee_code` on `tenant_id`, `employee_id_code`.

## Relationship Summary

```text
auth.parent_companies
  -> auth.tenants
    -> auth.users
      -> auth.user_roles
        -> auth.roles
          -> auth.role_permissions
            -> auth.permissions
              -> auth.permission_groups

auth.users
  -> auth.user_permissions
    -> auth.permissions

auth.tenants
  -> auth.work_location_types
    -> auth.work_locations
      -> employees

auth.tenants
  -> employees
```

In short: parent companies own tenants, tenants own users/locations/employees, users receive roles and optional direct permissions, roles receive permissions, and permissions can be grouped for organization.

## Create Tables

Create below tables for working in this project. This is the final table structure after applying the previous table changes, so this script does not include separate `ALTER TABLE` queries.

```sql
CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE auth.parent_companies (
    parent_company_sys_id SERIAL PRIMARY KEY,
    corporate_name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE auth.tenants (
    tenant_sys_id SERIAL PRIMARY KEY,
    parent_company_id INTEGER REFERENCES auth.parent_companies(parent_company_sys_id)
        ON DELETE SET NULL,
    plant_name VARCHAR(255) NOT NULL,
    company_type VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_plant_per_corp
        UNIQUE (parent_company_id, plant_name)
);

CREATE TABLE auth.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    refresh_token TEXT,
    tenant_id INTEGER REFERENCES auth.tenants(tenant_sys_id)
        ON DELETE SET NULL,
    user_type VARCHAR(50) DEFAULT 'CUSTOMER',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE auth.roles (
    role_sys_id SERIAL PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL UNIQUE,
    is_internal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE auth.permission_groups (
    permission_group_sys_id SERIAL PRIMARY KEY,
    group_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE auth.permissions (
    permission_sys_id SERIAL PRIMARY KEY,
    permission_code VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    group_id INTEGER REFERENCES auth.permission_groups(permission_group_sys_id)
        ON DELETE SET NULL,
    target_tenant_type VARCHAR(50) DEFAULT 'BOTH',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE auth.user_roles (
    user_id INTEGER NOT NULL REFERENCES auth.users(id)
        ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES auth.roles(role_sys_id)
        ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE auth.role_permissions (
    role_id INTEGER NOT NULL REFERENCES auth.roles(role_sys_id)
        ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES auth.permissions(permission_sys_id)
        ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE auth.user_permissions (
    user_id INTEGER NOT NULL REFERENCES auth.users(id)
        ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES auth.permissions(permission_sys_id)
        ON DELETE CASCADE,
    conditions JSONB DEFAULT '{}',
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, permission_id)
);

CREATE TABLE auth.work_location_types (
    location_type_sys_id BIGSERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES auth.tenants(tenant_sys_id)
        ON DELETE CASCADE,
    location_type_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_location_type
        UNIQUE (tenant_id, location_type_name)
);

CREATE TABLE auth.work_locations (
    work_location_sys_id BIGSERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES auth.tenants(tenant_sys_id)
        ON DELETE CASCADE,
    location_type_id BIGINT NOT NULL REFERENCES auth.work_location_types(location_type_sys_id),
    work_location_group VARCHAR(150) NOT NULL,
    work_location_name VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_location_details
        UNIQUE (
            tenant_id,
            location_type_id,
            work_location_group,
            work_location_name
        )
);

CREATE TABLE employees (
    employee_sys_id BIGSERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES auth.tenants(tenant_sys_id)
        ON DELETE CASCADE,
    user_id INTEGER UNIQUE REFERENCES auth.users(id)
        ON DELETE SET NULL,
    work_location_id BIGINT REFERENCES auth.work_locations(work_location_sys_id)
        ON DELETE SET NULL,
    employee_id_code VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    designation VARCHAR(150),
    department VARCHAR(150),
    contact_number VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_employee_code
        UNIQUE (tenant_id, employee_id_code)
);
```

## Dummy Data

The following INSERT queries are sample seed data from the latest SQL. These can be used as reference data when setting up a fresh local database.


Tenants
```sql
INSERT INTO auth.tenants(parent_company_id, plant_name, company_type)
values (1, 'Bangalore', 'CUSTOMER'), (1, 'Hyderabad', 'CUSTOMER'),  (2, 'Bangalore', 'CUSTOMER'), 
(2, 'Vizag', 'CUSTOMER'), (3, 'Bangalore', 'CUSTOMER'), (4, 'Bangalore', 'CUSTOMER');
```

Work location
```sql
INSERT INTO auth.work_locations (tenant_id, location_type_id, work_location_group, work_location_name)
values (4, 1, 'Castor Head Office', 'Head office- Bangalore'),
(4, 1, 'Castor Regional Site', 'Bangalore'), (4, 1, 'Castor Regional Site', 'Hyderabad'), (4, 1, 'Castor Regional Site', 'Chennai'),
(1, 2, 'Dr Reddy Lab', 'DRLB1'), (1, 2, 'Dr Reddy Lab', 'FTO3'), (1, 2, 'Dr Reddy Lab', 'FTO9'), (2, 2, 'Biocon', 'BXXB1'); 
```

users
```sql

INSERT INTO auth.users (username, email, password_hash, full_name, is_active, user_type, tenant_id) 
VALUES 
(
    'superadmin', 
    'superadmin@vaalpro.com', 
    '$2b$10$wR8Yg67CjCHx5kQ9b7tMduMbyy3PHeUj9Mh.Npx95zMh9vGZfI96O', 
    'System Administrator', 
    TRUE, 
    'INTERNAL', 
    NULL
),
(
    'admin', 
    'admin@vaalpro.com', 
    '$2b$10$wR8Yg67CjCHx5kQ9b7tMduMbyy3PHeUj9Mh.Npx95zMh9vGZfI96O', 
    'Vaalpro Admin', 
    TRUE, 
    'INTERNAL', 
    NULL
),
(
    'castor_admin', 
    'castor.v@castor.com', 
    '$2b$10$wR8Yg67CjCHx5kQ9b7tMduMbyy3PHeUj9Mh.Npx95zMh9vGZfI96O', 
    'Castor Admin', 
    TRUE, 
    'VENDOR', 
    (SELECT tenant_sys_id FROM auth.tenants WHERE plant_name = 'Bengaluru Formulation Plant - Block A')
),
(
    'amit.kumar', 
    'field.engineer@testing.com', 
    '$2b$10$wR8Yg67CjCHx5kQ9b7tMduMbyy3PHeUj9Mh.Npx95zMh9vGZfI96O', 
    'Amit Kumar', 
    TRUE, 
    'VENDOR', 
    (SELECT tenant_sys_id FROM auth.tenants WHERE plant_name = 'Bengaluru Formulation Plant - Block A')
),
(
    'Reddys.admin.bangalore.fto3', 
    'reddy.banmgalore@reddylab.com', 
    '$2b$10$wR8Yg67CjCHx5kQ9b7tMduMbyy3PHeUj9Mh.Npx95zMh9vGZfI96O', 
    'Plant Admin', 
    TRUE, 
    'CUSTOMER', 
    (SELECT tenant_sys_id FROM auth.tenants WHERE plant_name = 'Bengaluru Formulation Plant - Block A')
)
ON CONFLICT (username) DO NOTHING;
```

User roles
```sql
INSERT INTO auth.user_roles (user_id, role_id) VALUES
(
    (SELECT id FROM auth.users WHERE username = 'superadmin'),
    (SELECT role_sys_id FROM auth.roles WHERE role_name = 'GLOBAL_SUPER_ADMIN')
),
(
    (SELECT id FROM auth.users WHERE username = 'admin'),
    (SELECT role_sys_id FROM auth.roles WHERE role_name = 'SYSTEM_ADMIN')
),
(
    (SELECT id FROM auth.users WHERE username = 'castor_admin'),
    (SELECT role_sys_id FROM auth.roles WHERE role_name = 'VENDOR_ADMIN')
),
(
    (SELECT id FROM auth.users WHERE username = 'amit.kumar'),
    (SELECT role_sys_id FROM auth.roles WHERE role_name = 'FIELD_ENGINEER')
),
(
    (SELECT id FROM auth.users WHERE username = 'Reddys.admin.bangalore.fto3'),
    (SELECT role_sys_id FROM auth.roles WHERE role_name = 'PLANT_APP_ADMIN')
)
ON CONFLICT (user_id, role_id) DO NOTHING;
```

```sql
INSERT INTO auth.roles (role_name, is_internal) VALUES
('SYSTEM_ADMIN',       true),
('GLOBAL_SUPER_ADMIN', true),
('VENDOR_ADMIN',       false),
('FIELD_ENGINEER',     false),
('PLANT_APP_ADMIN',    false),
('CUSTOMER_END_USER',  false);
```

```sql
INSERT INTO auth.permission_groups (group_name, description) VALUES
('Global Infrastructure', 'Platform level system settings and tenant orchestration'),
('Identity & Access', 'User accounts, roles, and security permissions configuration'),
('Facility Master Data', 'Management of plants, units, departments, and rooms'),
('Operational Assets', 'Devices under calibration (DUC) and reference standard instruments'),
('Workflow Management', 'Service order generation, scheduling, and engineering assignments'),
('Testing & Execution', 'Field data capture, form submissions, and QR operations'),
('Compliance & Analytics', 'Certificates, MIS reporting, LIMS tracking, and immutable audit logs');
```

Role-permission seed samples:

These queries expect the roles above and matching records in `auth.permissions` to already exist.

```sql

INSERT INTO auth.permissions (permission_code, display_name, group_id) VALUES
-- Identity / Vendor Roster
('vendor.roster.manage', 'Manage Vendor Roster', (SELECT permission_group_sys_id FROM auth.permission_groups WHERE group_name = 'Identity & Access')),
('customer.staff.manage', 'Manage Customer Staff', (SELECT permission_group_sys_id FROM auth.permission_groups WHERE group_name = 'Identity & Access')),

-- Master Data & Infrastructure
('plant.config.configure', 'Configure Plant Settings', (SELECT permission_group_sys_id FROM auth.permission_groups WHERE group_name = 'Global Infrastructure')),
('plant.structure.manage', 'Manage Plant Structural Hierarchy', (SELECT permission_group_sys_id FROM auth.permission_groups WHERE group_name = 'Global Infrastructure')),
('view.master.employee', 'View Master Employee Records', (SELECT permission_group_sys_id FROM auth.permission_groups WHERE group_name = 'Facility Master Data')),
('edit.master.employee', 'Edit Master Employee Records', (SELECT permission_group_sys_id FROM auth.permission_groups WHERE group_name = 'Facility Master Data')),
('view.plant', 'View Plant Data', (SELECT permission_group_sys_id FROM auth.permission_groups WHERE group_name = 'Facility Master Data')),
('edit.plant', 'Edit Plant Data', (SELECT permission_group_sys_id FROM auth.permission_groups WHERE group_name = 'Facility Master Data')),
('view.room', 'View Rooms', (SELECT permission_group_sys_id FROM auth.permission_groups WHERE group_name = 'Facility Master Data')),
('edit.room', 'Edit Rooms', (SELECT permission_group_sys_id FROM auth.permission_groups WHERE group_name = 'Facility Master Data')),

-- Operational Assets
('instrument.reference.edit', 'Edit Reference Instruments', (SELECT permission_group_sys_id FROM auth.permission_groups WHERE group_name = 'Operational Assets')),
('instrument.reference.view', 'View Reference Instruments', (SELECT permission_group_sys_id FROM auth.permission_groups WHERE group_name = 'Operational Assets')),
('duc.master.view', 'View DUC Master List', (SELECT permission_group_sys_id FROM auth.permission_groups WHERE group_name = 'Operational Assets')),
('duc.master.edit', 'Edit DUC Master List', (SELECT permission_group_sys_id FROM auth.permission_groups WHERE group_name = 'Operational Assets')),

-- Workflows
('service_order.create', 'Create Service Orders', (SELECT permission_group_sys_id FROM auth.permission_groups WHERE group_name = 'Workflow Management')),
('service_order.schedule', 'Schedule Service Orders', (SELECT permission_group_sys_id FROM auth.permission_groups WHERE group_name = 'Workflow Management')),
('engineer.assign.job', 'Assign Jobs to Engineers', (SELECT permission_group_sys_id FROM auth.permission_groups WHERE group_name = 'Workflow Management')),

-- Testing & Field Execution
('calibration.execute.test', 'Execute Calibration Tests', (SELECT permission_group_sys_id FROM auth.permission_groups WHERE group_name = 'Testing & Execution')),
('caaldoc.submit.form', 'Submit Calibration Forms', (SELECT permission_group_sys_id FROM auth.permission_groups WHERE group_name = 'Testing & Execution')),
('label.qr.reconcile', 'Reconcile QR Labels', (SELECT permission_group_sys_id FROM auth.permission_groups WHERE group_name = 'Testing & Execution')),

-- Compliance & Dashboards
('lims.portal.dashboard', 'View LIMS Portal Dashboard', (SELECT permission_group_sys_id FROM auth.permission_groups WHERE group_name = 'Compliance & Analytics')),
('certificate.approve', 'Approve Compliance Certificates', (SELECT permission_group_sys_id FROM auth.permission_groups WHERE group_name = 'Compliance & Analytics')),
('certificate.download', 'Download Compliance Certificates', (SELECT permission_group_sys_id FROM auth.permission_groups WHERE group_name = 'Compliance & Analytics')),
('audit.trail.view', 'View Audit Trails', (SELECT permission_group_sys_id FROM auth.permission_groups WHERE group_name = 'Compliance & Analytics')),
('report.mis.export', 'Export MIS Reports', (SELECT permission_group_sys_id FROM auth.permission_groups WHERE group_name = 'Compliance & Analytics'))
ON CONFLICT (permission_code) DO NOTHING;



-- VENDOR_ADMIN mapping
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT (SELECT role_sys_id FROM auth.roles WHERE role_name = 'VENDOR_ADMIN'), permission_sys_id
FROM auth.permissions WHERE permission_code IN (
    'vendor.roster.manage', 'instrument.reference.edit', 'instrument.reference.view',
    'service_order.create', 'service_order.schedule', 'engineer.assign.job',
    'view.master.employee', 'view.plant', 'view.room', 'duc.master.view',
    'certificate.download', 'label.qr.reconcile', 'audit.trail.view', 'report.mis.export'
);

-- FIELD_ENGINEER mapping
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT (SELECT role_sys_id FROM auth.roles WHERE role_name = 'FIELD_ENGINEER'), permission_sys_id
FROM auth.permissions WHERE permission_code IN (
    'instrument.reference.view', 'calibration.execute.test', 'caaldoc.submit.form',
    'view.plant', 'view.room', 'duc.master.view', 'label.qr.reconcile'
);

-- PLANT_APP_ADMIN mapping
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT (SELECT role_sys_id FROM auth.roles WHERE role_name = 'PLANT_APP_ADMIN'), permission_sys_id
FROM auth.permissions WHERE permission_code IN (
    'plant.config.configure', 'plant.structure.manage', 'customer.staff.manage',
    'lims.portal.dashboard', 'certificate.approve', 'view.master.employee',
    'edit.master.employee', 'view.plant', 'edit.plant', 'view.room', 'edit.room',
    'duc.master.view', 'duc.master.edit', 'certificate.download', 'label.qr.reconcile',
    'audit.trail.view', 'report.mis.export'
);

-- CUSTOMER_END_USER mapping
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT (SELECT role_sys_id FROM auth.roles WHERE role_name = 'CUSTOMER_END_USER'), permission_sys_id
FROM auth.permissions WHERE permission_code IN (
    'lims.portal.dashboard', 'view.plant', 'view.room', 'duc.master.view',
    'certificate.download', 'audit.trail.view', 'report.mis.export'
);
```

## Source Files and SQL Coverage

| Source | Table coverage |
| --- | --- |
| `user.entity.ts` | `auth.users` base fields; missing latest `tenant_id` and `user_type` columns. |
| `role.entity.ts` | `auth.roles` |
| `user-role.entity.ts` | `auth.user_roles` |
| `permission-group.entity.ts` | `auth.permission_groups` |
| `permission.entity.ts` | `auth.permissions` base fields; missing latest `target_tenant_type` column. |
| `role-permission.entity.ts` | Older `auth.role_permissions` shape; should be synced to latest `role_id` column. |
| Latest SQL update | Adds/changes `auth.user_permissions`, `auth.parent_companies`, `auth.tenants`, `auth.work_location_types`, `auth.work_locations`, `employees`, `auth.users.tenant_id`, `auth.users.user_type`, `auth.permissions.target_tenant_type`, and `auth.role_permissions.role_id`. |
