import { Module }          from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PermissionB2C } from '../../models/permission_b2c.model';
import { RolePermissionB2C  } from '../../models/role_permission_b2c.model';
import { RoleB2C  } from '../../models/role_b2c.model';
import { PermissionsService }    from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { Resource } from 'src/models/resource.model';

@Module({
  imports:     [SequelizeModule.forFeature([PermissionB2C, RolePermissionB2C, RoleB2C, Resource])],
  providers:   [PermissionsService],
  controllers: [PermissionsController],
  exports:     [PermissionsService],
})
export class PermissionsModule {}