import { Column, Model, Table, HasMany, BelongsToMany, DataType } from 'sequelize-typescript';
import { Cetuser } from './CetUser';  // Assuming you have a Cetuser model
import { UserN } from './UsersN';  // Assuming you have a User model

@Table({
  tableName: 'CETMANAGEMENTs',  // Define the table name
  timestamps: true,            // Enable timestamps
})
export class CETMANAGEMENT extends Model {
  @Column
  external_id: string;

  @Column
  cet_type: string;

  @Column
  center_id: number;

  @Column
  name: string;

  @Column
  uniqueId: string;

  @Column
  registeredAddress: string;

  @Column
  correspondenceAddress: string;

  @Column
  contactNumber: string;

  @Column
  spocName: string;

  @Column
  spocWhatsappNumber: string;

  @Column
  spocEmail: string;

  @Column
  alternateSpocName: string;

  @Column
  alternateSpocContactNumber: string;

  @Column
  alternateSpocEmail: string;

  @Column
  pan: string;

  @Column
  short_code: string;

  @Column
  attachPanCopy: string;

  @Column
  gstin: string;

  @Column
  attachGstin: string;

  @Column
  accountNumber: string;

  @Column
  ifscCode: string;

  @Column
  bankName: string;

  @Column({
    type: DataType.ENUM('Active', 'Inactive', 'Pending', 'In_Progress'),
    defaultValue: 'In_Progress',
  })
  status: string;

  @Column
  attachCancelledChequeOrPassbook: string;

  @Column
  attachCertificateOfIncorporation: string;

  // Associations
  @HasMany(() => Cetuser, { foreignKey: 'cet_id', as: 'Cetusers' })
  Cetusers: Cetuser[];

  @BelongsToMany(() => UserN, {
    through: () => Cetuser,  // Through model
    foreignKey: 'cet_id',    // Foreign key in the join table
    otherKey: 'user_id',     // Other key in the join table
    as: 'Users'              // Alias for association
  })
  Users: UserN[];
}
