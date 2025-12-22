import { Column, Model, Table, BelongsTo } from 'sequelize-typescript';
import { Permission } from './Permissions';  // Assuming you have a Permission model

@Table({
  tableName: 'Permissionmetadata',
  timestamps: true,
})
export class Permissionmetadata extends Model {
  @Column
  permission_id: bigint;

  @Column
  page_name: string;

  @Column({
    type: 'ARRAY',
  })
  permission_type: string[];

  @BelongsTo(() => Permission, { foreignKey: 'permission_id', as: 'Permission' })
  permission: Permission;
}
