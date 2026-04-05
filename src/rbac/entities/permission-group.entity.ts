import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Permission } from './permission.entity';

@Entity('permission_groups')
export class PermissionGroup {
  @PrimaryGeneratedColumn('increment', { name: 'permission_group_sys_id' })
  id: number;

  @Column({ name: 'group_name', length: 100, unique: true })
  groupName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Permission, (permission) => permission.group)
  permissions: Permission[];
}