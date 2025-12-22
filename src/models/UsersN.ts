import { Column, Model, Table, HasMany, BelongsTo, BelongsToMany, DataType } from 'sequelize-typescript';
import { Role } from './Roles'; 
import { Permission } from './Permissions';  
import { Cetuser } from './CetUser';  
import { CETMANAGEMENT } from './CetManagement'; 
@Table({ tableName: 'Users' })

export class UserN extends Model {
  @Column
  username: string;

  @Column
  name: string;

  @Column
  role_id: bigint;

  @Column
  permission_id: bigint;

  @Column
  email: string;

  @Column
  password: string;

  @Column
  phone: string;

  @Column
  isAdmin: boolean;

  @Column
  status: boolean;

  @Column
  external_id: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: {},
  })
  attributes: Record<string, any>;

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
}