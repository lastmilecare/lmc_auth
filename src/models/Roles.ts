import { Column, Model, Table, HasMany } from 'sequelize-typescript';
import { Permission } from './Permissions';  // Assuming you have a Permission model

@Table({
  tableName: 'Roles',
  timestamps: true,
})
export class Role extends Model {
  @Column
  declare role_title: string;

  @Column
  declare slug: string;

  @HasMany(() => Permission, { foreignKey: 'role_id', as: 'permissions' })
  declare permissions: Permission[];
}
