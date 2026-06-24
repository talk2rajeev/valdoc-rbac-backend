import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.entity';
import { Role } from './entities/role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Permission } from './entities/permission.entity';
import { PermissionGroup } from './entities/permission-group.entity';
import { UserPermission } from './entities/user-permission.entity';
import { ParentCompany } from './entities/parent-company.entity';
import { Tenant } from './entities/tenant.entity';
import { WorkLocationType } from './entities/work-location-type.entity';
import { WorkLocation } from './entities/work-location.entity';
import { Employee } from './entities/employee.entity';
import { UserPermissionsModule } from './user-permissions/user-permissions.module';

const RBAC_ENTITIES = [
  User,
  UserRole,
  Role,
  RolePermission,
  Permission,
  PermissionGroup,
  UserPermission,
  ParentCompany,
  Tenant,
  WorkLocationType,
  WorkLocation,
  Employee,
];

@Module({
  imports: [
    TypeOrmModule.forFeature(RBAC_ENTITIES),
    UserPermissionsModule
  ],
  exports: [TypeOrmModule],
})
export class RbacModule { }
