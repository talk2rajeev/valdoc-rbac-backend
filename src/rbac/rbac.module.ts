import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.entity';
import { Role } from './entities/role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Permission } from './entities/permission.entity';
import { PermissionGroup } from './entities/permission-group.entity';

const RBAC_ENTITIES = [User, UserRole, Role, RolePermission, Permission, PermissionGroup];

@Module({
  imports: [TypeOrmModule.forFeature(RBAC_ENTITIES)],
  exports: [TypeOrmModule],
})
export class RbacModule {}
