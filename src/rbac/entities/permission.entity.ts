import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PermissionGroup } from './permission-group.entity';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('increment', { name: 'permission_sys_id' })
  id: number;

  @Column({ name: 'permission_code', length: 100, unique: true })
  permissionCode: string;        // e.g., 'EQUIPMENT_VIEW'

  @Column({ name: 'display_name', length: 100 })
  displayName: string;

  @Column({ name: 'group_id', nullable: true })
  groupId: number;

  @Column({ name: 'target_tenant_type', length: 50, default: 'BOTH' })
  targetTenantType: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => PermissionGroup, (group) => group.permissions, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'group_id' })
  group: PermissionGroup;
}