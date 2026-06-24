import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany, Unique } from 'typeorm';
import { Tenant } from './tenant.entity';
import { WorkLocation } from './work-location.entity';

@Entity('work_location_types')
@Unique('uq_tenant_location_type', ['tenantId', 'locationTypeName'])
export class WorkLocationType {
  @PrimaryGeneratedColumn('increment', { name: 'location_type_sys_id', type: 'bigint' })
  id: number;

  @Column({ name: 'tenant_id', type: 'integer' })
  tenantId: number;

  @Column({ name: 'location_type_name', length: 100 })
  locationTypeName: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @OneToMany(() => WorkLocation, (workLocation) => workLocation.locationType)
  workLocations: WorkLocation[];
}
