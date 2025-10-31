import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { UserN } from './UsersN';
import { Role } from './Roles';

@Table({ tableName: 'user_roles' })
export class UserRole extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @ForeignKey(() => UserN)
  @Column
  userId: number;

  @ForeignKey(() => Role)
  @Column
  roleId: number;

  @BelongsTo(() => UserN)
  user: UserN;

  @BelongsTo(() => Role)
  role: Role;
}