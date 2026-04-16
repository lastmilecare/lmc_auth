import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  HasMany,
} from 'sequelize-typescript';
import { UserN } from './UsersN';
import { RoleB2C } from './role_b2c.model';

@Table({
  tableName: 'tenants',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Tenant extends Model<Tenant> {
  @PrimaryKey
  @Column({ autoIncrement: true, type: DataType.INTEGER })
  declare id: number;
  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  declare name: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  declare status: boolean;

  @HasMany(() => UserN)
  declare users: UserN[];

  @HasMany(() => RoleB2C)
  declare roles: RoleB2C[];

  @Column({ type: DataType.STRING, allowNull: true })
  declare tenant_type: string;
}
