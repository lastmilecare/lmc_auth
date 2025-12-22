import { Column, Model, Table, BelongsTo } from 'sequelize-typescript';
import { UserN } from './UsersN';  // Assuming you have a User model
import { CETMANAGEMENT } from './CetManagement';  // Assuming you have a CETMANAGEMENT model

@Table({
  tableName: 'Cetusers',
  timestamps: true,
})
export class Cetuser extends Model {
  @Column
  user_id: number;

  @Column
  cet_id: number;

  // Associations
  @BelongsTo(() => UserN, { foreignKey: 'user_id', as: 'user' })
  user: UserN;

  @BelongsTo(() => CETMANAGEMENT, { foreignKey: 'cet_id', as: 'cetManagement' })
  cetManagement: CETMANAGEMENT;
}
