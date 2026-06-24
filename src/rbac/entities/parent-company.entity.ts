import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Tenant } from './tenant.entity';

@Entity('parent_companies')
export class ParentCompany {
  @PrimaryGeneratedColumn('increment', { name: 'parent_company_sys_id' })
  id: number;

  @Column({ name: 'corporate_name', length: 255, unique: true })
  corporateName: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  // Relations
  @OneToMany(() => Tenant, (tenant) => tenant.parentCompany)
  tenants: Tenant[];
}
