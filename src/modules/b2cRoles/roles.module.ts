import { Module }          from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { RoleB2C }         from '../../models/role_b2c.model';
import { PermissionB2C }   from '../../models/permission_b2c.model';
import { RolePermissionB2C } from '../../models/role_permission_b2c.model';
import { Tenant }          from '../../models/tenant.model';
import { RolesService }    from './roles.service';
import { RolesController } from './roles.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([
      RoleB2C,
      PermissionB2C,
      RolePermissionB2C,
      Tenant,
    ]),
  ],
  providers:   [RolesService],
  controllers: [RolesController],
  exports:     [RolesService],
})
export class B2CRolesModule {}