
import {
  Table, Column, Model, DataType,
  ForeignKey, BelongsTo,
} from 'sequelize-typescript';
import { RoleB2C }       from './role_b2c.model';
import { PermissionB2C } from './permission_b2c.model';

@Table({
  tableName: 'role_permissions_b2c',
  timestamps: false,
})
export class RolePermissionB2C extends Model<RolePermissionB2C> {

  @ForeignKey(() => RoleB2C)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'role_id' })
  declare roleId: number;

  @ForeignKey(() => PermissionB2C)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'permission_id' })
  declare permissionId: number;

  @BelongsTo(() => RoleB2C)
  declare role: RoleB2C;

  @BelongsTo(() => PermissionB2C)
  declare permission: PermissionB2C;
}