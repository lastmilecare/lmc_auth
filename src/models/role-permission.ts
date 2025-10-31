import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Role } from './Roles';
import { Permission } from './Permissions';

@Table({ tableName: 'role_permissions' })
export class RolePermission extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @ForeignKey(() => Role)
  @Column
  roleId: number;

  @ForeignKey(() => Permission)
  @Column
  permissionId: number;

  @BelongsTo(() => Role)
  role: Role;

  @BelongsTo(() => Permission)
  permission: Permission;
}