import { Column, Model, Table, BelongsTo, HasMany } from 'sequelize-typescript';
import { Role } from './Roles';
import { Permissionmetadata } from './PermissionsMetaData';
@Table({
  tableName: 'Permissions',
  timestamps: true,
})
export class Permission extends Model {
  @Column
  role_id: bigint;

  @Column
  permission_name: string;

  @BelongsTo(() => Role, { foreignKey: 'role_id', as: 'Role' })
  role: Role;

  @HasMany(() => Permissionmetadata, { foreignKey: 'permission_id', as: 'Permissionmetadata' })
  permissionMetadata: Permissionmetadata[];
}
