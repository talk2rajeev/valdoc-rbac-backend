import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Tenant } from './tenant.entity';
import { User } from './user.entity';
import { WorkLocation } from './work-location.entity';

@Entity('employees')
@Unique('uq_tenant_employee_code', ['tenantId', 'employeeIdCode'])
export class Employee {
  @PrimaryGeneratedColumn('increment', { name: 'employee_sys_id', type: 'bigint' })
  id: number;

  @Column({ name: 'tenant_id', type: 'integer' })
  tenantId: number;

  @Column({ name: 'user_id', type: 'integer', nullable: true, unique: true })
  userId: number;

  @Column({ name: 'work_location_id', type: 'bigint', nullable: true })
  workLocationId: number;

  @Column({ name: 'employee_id_code', length: 50 })
  employeeIdCode: string;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ length: 150, nullable: true })
  designation: string;

  @Column({ length: 150, nullable: true })
  department: string;

  @Column({ name: 'contact_number', length: 20, nullable: true })
  contactNumber: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => WorkLocation, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'work_location_id' })
  workLocation: WorkLocation;
}
