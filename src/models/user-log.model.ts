import { Column, Model, Table, HasMany, BelongsToMany, DataType,ForeignKey,BelongsTo } from 'sequelize-typescript';
import { UserN as User } from './UsersN';
@Table({
  tableName: 'userlogs', 
  timestamps: false,     
})
export class UserLog extends Model<UserLog> {
  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  user_id: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  user_ip: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  action_type: string;

  @Column({
    type: DataType.JSON,
    allowNull: false,
  })
  action_description: Record<string, any>;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  action_time: Date;

  // ✅ Association
  @BelongsTo(() => User, { as: 'User' })
  User: User;
}
