import { Column, Model, Table, HasMany } from 'sequelize-typescript';
import { Permission } from './Permissions';  // Assuming you have a Permission model

@Table({
  tableName: 'Roles',
  timestamps: true,
})
export class Role extends Model {
  @Column
  role_title: string;

  @Column
  slug: string;

  @HasMany(() => Permission, { foreignKey: 'role_id', as: 'permissions' })
  permissions: Permission[];
}
