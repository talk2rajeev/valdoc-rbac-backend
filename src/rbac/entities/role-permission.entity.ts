import { Entity, Column, CreateDateColumn, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Role } from './role.entity';
import { Permission } from './permission.entity';

@Entity('role_permissions')
export class RolePermission {
  @PrimaryColumn({ name: 'role_permission_sys_id' })
  roleId: number;                    // Note: This is actually role_sys_id

  @PrimaryColumn({ name: 'permission_id' })
  permissionId: number;

  @CreateDateColumn({ name: 'assigned_at', type: 'timestamptz' })
  assignedAt: Date;

  // Relations
  @ManyToOne(() => Role, (role) => role.rolePermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_permission_sys_id' })
  role: Role;

  @ManyToOne(() => Permission, (permission) => permission.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;
}