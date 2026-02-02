import { Column, Model, Table, DataType, HasMany, BelongsToMany } from 'sequelize-typescript';
import { UserN } from './UsersN';
import { CorporateUser } from './corporate-user';

@Table({ tableName: 'corporates', timestamps: true })
export class Corporate extends Model<Corporate> {
  
  @Column
  external_id: string;

  @Column
  corporate_type: string;

  // --- CHANGED HERE ---
  @Column({
    type: DataType.ARRAY(DataType.INTEGER),
    defaultValue: []
  })
  center_ids: number[];
  // --------------------

  @Column
  name: string;

  @Column({ field: 'unique_id' })
  uniqueId: string;

  // ... (Rest of the fields remain the same: address, spoc, bank, etc.)

  @HasMany(() => CorporateUser)
  corporateUsers: CorporateUser[];

  @BelongsToMany(() => UserN, () => CorporateUser)
  users: UserN[];
}