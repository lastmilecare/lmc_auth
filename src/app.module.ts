import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { UserN } from './models/UsersN';
import { Role } from './models/Roles';
import { Permission } from './models/Permissions';
import { RolePermission } from './models/role-permission';
import { UserRole } from './models/user-role';
import { UsersModule } from './modules/UserControl/User.module';
import { AuthModule } from './modules/auth/auth.module';
import { RolesModule } from './modules/Roles/Role.module';
import { CETMANAGEMENT } from './models/CetManagement';
import { Cetuser } from './models/CetUser';
import { Permissionmetadata } from './models/PermissionsMetaData';
import { UserLog } from './models/user-log.model';
import { Center } from './models/center.model';
import { Centeruser } from './models/centeruser.model';
import { TestAccount } from './models/test-account.model';
import { CenterAuthModule } from './modules/CenterAuth/centerauth.module';
import { CetAuthModule } from './modules/CetAuth/cetauth.module';
import { CorporateUser } from './models/corporate-user';
import { Corporate } from './models/corporate';
import {PicasoidAuthModule} from './modules/PicasoidAuth/picasoid-auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      models: [UserN, Role, Permission, RolePermission, UserRole, CETMANAGEMENT, Cetuser,
        Permissionmetadata, UserLog, Center, Centeruser, TestAccount, CorporateUser, Corporate],
      autoLoadModels: true,
      synchronize: false, // Use only in development; use migrations in prod
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false, // Use only in development
        },
      },
    }),
    UsersModule,
    AuthModule,
    RolesModule,
    CenterAuthModule,
    CetAuthModule,
    PicasoidAuthModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(private sequelize: Sequelize) {
    // this.seedPermissions();
  }

}
