import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Tenant } from './tenant.entity';
import { WorkLocationType } from './work-location-type.entity';

@Entity('work_locations')
@Unique('uq_tenant_location_details', ['tenantId', 'locationTypeId', 'workLocationGroup', 'workLocationName'])
export class WorkLocation {
  @PrimaryGeneratedColumn('increment', { name: 'work_location_sys_id', type: 'bigint' })
  id: number;

  @Column({ name: 'tenant_id', type: 'integer' })
  tenantId: number;

  @Column({ name: 'location_type_id', type: 'bigint' })
  locationTypeId: number;

  @Column({ name: 'work_location_group', length: 150 })
  workLocationGroup: string;

  @Column({ name: 'work_location_name', length: 150 })
  workLocationName: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => WorkLocationType, (workLocationType) => workLocationType.workLocations)
  @JoinColumn({ name: 'location_type_id' })
  locationType: WorkLocationType;
}
