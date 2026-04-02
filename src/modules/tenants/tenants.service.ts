import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Tenant } from '../../models/tenant.model';
import { RoleB2C }   from '../../models/role_b2c.model';
import { PermissionB2C }     from '../../models/permission_b2c.model';
import {  RolePermissionB2C} from '../../models/role_permission_b2c.model';

@Injectable()
export class TenantsService {
  constructor(
    @InjectModel(Tenant)       private tenantModel: typeof Tenant,
    @InjectModel(RoleB2C)         private roleModel: typeof RoleB2C,
    @InjectModel(PermissionB2C)   private permModel: typeof PermissionB2C,
    @InjectModel(RolePermissionB2C) private rpModel: typeof RolePermissionB2C,
  ) {}

  async createTenant(dto: { name: string }) {
    const exists = await this.tenantModel.findOne({ where: { name: dto.name } });
    if (exists) throw new ConflictException('Tenant already exists');

    const tenant = await this.tenantModel.create({ name: dto.name } as any);

    const adminRole = await this.roleModel.create({
      name:     'TENANT_ADMIN',
      tenantId: tenant.id,
    } as any);

    // Give TENANT_ADMIN all user + role permissions by default
    const perms = await this.permModel.findAll({
      where: { resource: ['user', 'role'] },
    });
    await this.rpModel.bulkCreate(
      perms.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
      { ignoreDuplicates: true },
    );

    return { tenant, adminRole };
  }

  findAll() {
    return this.tenantModel.findAll({ include: [RoleB2C] });
  }
}