import {
    Table,
    Column,
    Model,
    DataType,
    HasMany,
    BelongsToMany,
} from 'sequelize-typescript';
import { UserN as User } from './UsersN';
import { Centeruser } from './centeruser.model';

@Table({
    tableName: 'Centers',
    timestamps: true,
})
export class Center extends Model<Center> {
    @Column(DataType.STRING)
    external_id: string;

    @Column(DataType.BIGINT)
    createdBy: number;

    @Column(DataType.STRING)
    project_start_date: string;

    @Column(DataType.STRING)
    project_name: string;

    @Column(DataType.STRING)
    project_unique_id: string;

    @Column(DataType.STRING)
    project_district: string;

    @Column(DataType.STRING)
    project_state: string;

    @Column(DataType.STRING)
    project_address: string;

    @Column(DataType.STRING)
    agency_name: string;

    @Column(DataType.STRING)
    agency_address: string;

    @Column(DataType.STRING)
    agency_district: string;

    @Column(DataType.STRING)
    agency_state: string;

    @Column(DataType.STRING)
    agency_spoc_name: string;

    @Column(DataType.STRING)
    agency_spoc_email: string;

    @Column(DataType.STRING)
    agency_spoc_contact_number: string;

    @Column(DataType.BOOLEAN)
    status: boolean;

    @Column(DataType.STRING)
    project_end_date: string;

    @Column(DataType.STRING)
    agency_spoc_alternate_name: string;

    @Column(DataType.STRING)
    agency_spoc_alternate_contact_number: string;

    @Column(DataType.STRING)
    project_signed_agreement_file: string;

    @Column(DataType.STRING)
    short_code: string;

    @Column(DataType.STRING)
    center_shortcode: string;

    @Column(DataType.STRING)
    center_address: string;

    @BelongsToMany(
        () => User,
        () => Centeruser,
        'center_id',
        'user_id',
    )
    users: User[];

    @HasMany(() => Centeruser, {
        foreignKey: 'center_id',
        as: 'centerusers',
    })
    centerusers: Centeruser[];
}
