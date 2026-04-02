
import {
  Table, Column, Model, DataType,
  PrimaryKey, Default, BelongsToMany,
} from 'sequelize-typescript';
import { RoleB2C }           from './role_b2c.model';
import { RolePermissionB2C } from './role_permission_b2c.model';

@Table({
  tableName: 'permissions_b2c',
  timestamps: true,
  underscored: true,
  indexes: [{ unique: true, fields: ['action', 'resource'] }],
})
export class PermissionB2C extends Model<PermissionB2C> {

  @PrimaryKey
  @Column({ autoIncrement: true, type: DataType.INTEGER })
  declare id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare action: string;   // create, read, update, delete, assign

  @Column({ type: DataType.STRING, allowNull: false })
  declare resource: string; // user, role, permission

  @BelongsToMany(() => RoleB2C, () => RolePermissionB2C)
  declare roles: RoleB2C[];
}