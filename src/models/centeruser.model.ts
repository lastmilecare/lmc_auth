import {
    Table,
    Column,
    Model,
    DataType,
    ForeignKey,
    BelongsTo,
} from 'sequelize-typescript';
import { UserN as User } from './UsersN';
import { Center } from './center.model';

@Table({
    tableName: 'Centerusers', // ⚠️ use exact table name from DB
    timestamps: true, // set false if your table doesn't use timestamps
})
export class Centeruser extends Model<Centeruser> {
    @ForeignKey(() => User)
    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    user_id: string;

    @ForeignKey(() => Center)
    @Column({
        type: DataType.BIGINT,
        allowNull: false,
    })
    center_id: number;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    signature: string;

    /* ---------------- Associations ---------------- */

    @BelongsTo(() => User, {
        foreignKey: 'user_id',
        as: 'user',
    })
    user: User;

    @BelongsTo(() => Center, {
        foreignKey: 'center_id',
        as: 'center',
    })
    center: Center;
}
