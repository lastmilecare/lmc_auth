import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, BelongsToMany } from 'sequelize-typescript';
import { RolePermission } from './role-permission';
import { Permission } from './Permissions';

@Table({ tableName: 'RolesN' })
export class Role extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  role_title: string;

  @Column({ type: DataType.STRING, allowNull: true })
  slug: string;

  @BelongsToMany(() => Permission, () => RolePermission)
  permissions: Permission[];
}