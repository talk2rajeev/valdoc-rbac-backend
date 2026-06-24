import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany, Unique } from 'typeorm';
import { ParentCompany } from './parent-company.entity';
import { User } from './user.entity';

@Entity('tenants')
@Unique('unique_plant_per_corp', ['parentCompanyId', 'plantName'])
export class Tenant {
  @PrimaryGeneratedColumn('increment', { name: 'tenant_sys_id' })
  id: number;

  @Column({ name: 'parent_company_id', type: 'integer', nullable: true })
  parentCompanyId: number;

  @Column({ name: 'plant_name', length: 255 })
  plantName: string;

  @Column({ name: 'company_type', length: 50 })
  companyType: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => ParentCompany, (parentCompany) => parentCompany.tenants, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parent_company_id' })
  parentCompany: ParentCompany;

  @OneToMany(() => User, (user) => user.tenant)
  users: User[];
}
