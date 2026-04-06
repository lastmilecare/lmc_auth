import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  HasMany,
  BelongsToMany,
} from 'sequelize-typescript';
import { Tenant } from './tenant.model';
import { UserN } from './UsersN';
import { PermissionB2C } from './permission_b2c.model';
import { RolePermissionB2C } from './role_permission_b2c.model';

@Table({
  tableName: 'roles_b2c',
  timestamps: true,
  underscored: true,
  indexes: [{ unique: true, fields: ['name', 'tenant_id'] }],
})
export class RoleB2C extends Model<RoleB2C> {
  @PrimaryKey
  @Column({ autoIncrement: true, type: DataType.INTEGER })
  declare id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  @ForeignKey(() => Tenant)
  @Column({ type: DataType.INTEGER, allowNull: true, field: 'tenant_id' })
  declare tenantId: number | null; // null = system-wide

  @BelongsTo(() => Tenant)
  declare tenant: Tenant;

  @HasMany(() => UserN)
  declare users: UserN[];

  // @BelongsToMany(() => PermissionB2C, () => RolePermissionB2C)
  // declare permissions: PermissionB2C[];
  @BelongsToMany(() => PermissionB2C, {
    through: () => RolePermissionB2C,
    foreignKey: 'role_id',
    otherKey: 'permission_id',
    as: 'permissions', 
  })
  declare permissions: PermissionB2C[];
}
