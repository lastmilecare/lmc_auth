import { Module }          from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Tenant }          from '../../models/tenant.model';
import { RoleB2C }         from '../../models/role_b2c.model';
import { PermissionB2C }   from '../../models/permission_b2c.model';
import { RolePermissionB2C } from '../../models/role_permission_b2c.model';
import { TenantsService }    from './tenants.service';
import { TenantsController } from './tenants.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Tenant,
      RoleB2C,
      PermissionB2C,
      RolePermissionB2C,
    ]),
  ],
  providers:   [TenantsService],
  controllers: [TenantsController],
  exports:     [TenantsService],
})
export class TenantsModule {}