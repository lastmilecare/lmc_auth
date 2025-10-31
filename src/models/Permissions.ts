import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, HasMany } from 'sequelize-typescript';
import { RolePermission } from './role-permission';

@Table
export class Permission extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  permission_name: string;


}