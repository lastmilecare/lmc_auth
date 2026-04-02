import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../UserControl/User.module';
import { AuthService } from './picasoid-auth.service';
import { AuthController } from './picasoid-auth.controller';
import { UserN } from 'src/models/UsersN';
import { RoleB2C } from 'src/models/role_b2c.model';
import { PermissionB2C } from 'src/models/permission_b2c.model';
import { RolePermissionB2C } from 'src/models/role_permission_b2c.model';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    PassportModule,
    SequelizeModule.forFeature([
      UserN,
      RoleB2C,
      PermissionB2C,
      RolePermissionB2C,
    ]),

    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class PicasoidAuthModule {}