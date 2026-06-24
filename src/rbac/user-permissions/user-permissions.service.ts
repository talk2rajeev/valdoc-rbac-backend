import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface UserPermissionResponse {
    permission_code: string;
    display_name: string;
    source: 'ROLE' | 'DIRECT';
    conditions: Record<string, any>;
}

@Injectable()
export class UserPermissionsService {
    constructor(private readonly dataSource: DataSource) { }

    async findAllByUserId(userId: number): Promise<UserPermissionResponse[]> {
        // 1. Verify user exists first to throw correct REST exception patterns
        const userExists = await this.dataSource.query(
            `SELECT 1 FROM auth.users WHERE id = $1 LIMIT 1`,
            [userId]
        );

        if (!userExists || userExists.length === 0) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        // 2. Unify permissions from both Role-assignments and Direct user overrides
        const rawPermissions = await this.dataSource.query(
            `
      -- Get all permissions assigned via user roles
      SELECT 
        p.permission_code,
        p.display_name,
        'ROLE' AS source,
        '{}'::jsonb AS conditions
      FROM auth.users u
      INNER JOIN auth.user_roles ur ON u.id = ur.user_id
      INNER JOIN auth.roles r ON ur.role_id = r.role_sys_id
      INNER JOIN auth.role_permissions rp ON r.role_sys_id = rp.role_id
      INNER JOIN auth.permissions p ON rp.permission_id = p.permission_sys_id
      WHERE u.id = $1

      UNION ALL

      -- Get all direct override permissions with their custom JSONB scoping rules
      SELECT 
        p.permission_code,
        p.display_name,
        'DIRECT' AS source,
        up.conditions
      FROM auth.user_permissions up
      INNER JOIN auth.permissions p ON up.permission_id = p.permission_sys_id
      WHERE up.user_id = $1
      `,
            [userId]
        );

        // 3. Consolidate duplicates gracefully (If a permission is granted by both, Direct configs override)
        const permissionMap = new Map<string, UserPermissionResponse>();

        for (const perm of rawPermissions) {
            const existing = permissionMap.get(perm.permission_code);
            if (!existing || perm.source === 'DIRECT') {
                permissionMap.set(perm.permission_code, {
                    permission_code: perm.permission_code,
                    display_name: perm.display_name,
                    source: perm.source,
                    conditions: perm.conditions || {},
                });
            }
        }

        return Array.from(permissionMap.values());
    }
}