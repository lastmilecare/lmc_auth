// src/modules/Roles/Role.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { RolesService } from './Role.service';
import { RolesController } from './Role.controller';
import { Role } from '../../models/Roles';
import { RolePermission } from '../../models/role-permission';
import { Permission } from '../../models/Permissions';
import { UsersModule } from '../UserControl/User.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    SequelizeModule.forFeature([Role, RolePermission, Permission]),
    UsersModule, // Add this line to import UsersModule
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}