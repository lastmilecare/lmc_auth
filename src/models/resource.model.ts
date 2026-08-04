import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
} from 'sequelize-typescript';

@Table({
  tableName: 'resources',
  timestamps: true,
  underscored: true,
})
export class Resource extends Model<Resource> {
  
  @PrimaryKey
  @Column({
    autoIncrement: true,
    type: DataType.INTEGER,
  })
  declare id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true, 
  })
  declare name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare description: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  declare status: boolean;
}