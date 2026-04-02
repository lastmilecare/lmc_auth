import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UsersService } from './User.service';
import { UsersController } from './User.controller';
import { UserN as User } from '../../models/UsersN';
import { UserRole } from '../../models/user-role';
import { Role } from '../../models/Roles';
import { Permission } from '../../models/Permissions';
import { RolePermission } from '../../models/role-permission';
import { JwtModule } from '@nestjs/jwt';
import { RoleB2C } from 'src/models/role_b2c.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      User,
      UserRole,
      Role,
      Permission,
      RolePermission,
      RoleB2C,
    ]),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
