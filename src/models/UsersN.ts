import { Column, Model, Table, HasMany, BelongsTo, BelongsToMany, DataType,ForeignKey } from 'sequelize-typescript';
import { Role } from './Roles'; 
import { Permission } from './Permissions';  
import { Cetuser } from './CetUser';  
import { CETMANAGEMENT } from './CetManagement'; 
import { Tenant } from './tenant.model';
import {RoleB2C } from './role_b2c.model';
@Table({ tableName: 'Users' })

export class UserN extends Model {
  @Column
  declare username: string;

  @Column
  declare name: string;

  @Column
  declare role_id: bigint;

  @Column
  declare permission_id: bigint;

  @Column
  declare email: string;
  @Column
  declare   password: string;

  @Column
  declare phone: string;

  @Column
  declare isAdmin: boolean;

  @Column
  declare status: boolean;

  @Column
  declare external_id: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: {},
  })
  declare attributes: Record<string, any>;

  @BelongsTo(() => Role, { foreignKey: 'role_id', as: 'role' })
  role: Role;

  @BelongsTo(() => Permission, { foreignKey: 'permission_id', as: 'permission' })
  permission: Permission;

  @HasMany(() => Cetuser, { foreignKey: 'user_id', as: 'Cetusers' })
  Cetusers: Cetuser[];

  @BelongsToMany(() => CETMANAGEMENT, {
    through: () => Cetuser,
    foreignKey: 'user_id',
    otherKey: 'cet_id',
    as: 'CETManagements'
  })
  CETManagements: CETMANAGEMENT[];

  @ForeignKey(() => Tenant)
  @Column({ type: DataType.INTEGER, allowNull: true, field: 'tenant_id' })
  declare tenantId: number | null;

  @BelongsTo(() => Tenant, { as: 'tenant' })
  declare tenant: Tenant;

  @ForeignKey(() => RoleB2C)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'b2c_role_id' })
  declare b2cRoleId: number;

  @BelongsTo(() => RoleB2C, { as: 'roleb2c' })
  declare roleb2c: RoleB2C;

}