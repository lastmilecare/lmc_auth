import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize, Op } from 'sequelize';

import { Tenant } from '../../models/tenant.model';
import { RoleB2C } from '../../models/role_b2c.model';
import { PermissionB2C } from '../../models/permission_b2c.model';
import { RolePermissionB2C } from '../../models/role_permission_b2c.model';

@Injectable()
export class TenantsService {
  constructor(
    private sequelize: Sequelize,

    @InjectModel(Tenant) private tenantModel: typeof Tenant,
    @InjectModel(RoleB2C) private roleModel: typeof RoleB2C,
    @InjectModel(PermissionB2C) private permModel: typeof PermissionB2C,
    @InjectModel(RolePermissionB2C) private rpModel: typeof RolePermissionB2C,
  ) {}

  // ── Create Tenant (WITH TRANSACTION) ─────────────────────────────────────
  async createTenant(dto: { name: string }) {
    const name = dto.name?.trim();

    if (!name) {
      throw new ConflictException('Tenant name is required');
    }

    const exists = await this.tenantModel.findOne({ where: { name } });
    if (exists) throw new ConflictException('Tenant already exists');

    return await this.sequelize.transaction(async (t) => {
      const tenant = await this.tenantModel.create({ name } as any, {
        transaction: t,
      });

      const adminRole = await this.roleModel.create(
        {
          name: `${name}_ADMIN`,
          tenantId: tenant.id,
        } as any,
        { transaction: t },
      );

      // ⚠️ FIX: correct Op.in usage
      const perms = await this.permModel.findAll({
        where: {
          resource: {
            [Op.in]: ['user', 'role'],
          },
        },
        transaction: t,
      });

      if (perms.length) {
        await this.rpModel.bulkCreate(
          perms.map((p) => ({
            roleId: adminRole.id,
            permissionId: p.id,
          })),
          { transaction: t, ignoreDuplicates: true },
        );
      }

      return { tenant, adminRole };
    });
  }
//Issue code
  // ── Get All Tenants ─────────────────────────────────────────────────────
  async findAll(query: {
    page?: number;
    limit?: number;
    name?: string;
    status?: any;
    startDate?: string;
    endDate?: string;
  }) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Number(query.limit) || 10, 100);
    const offset = (page - 1) * limit;

    const where: any = {};

    // ── Name filter
    if (query.name) {
      where.name = { [Op.iLike]: `%${query.name.trim()}%` };
    }

    // ── Status filter (safe parsing)
    if (query.status !== undefined) {
      if (query.status === true || query.status === 'true') {
        where.status = true;
      } else if (query.status === false || query.status === 'false') {
        where.status = false;
      }
    }

    // ── Date filter (USE createdAt — NOT created_at)
    if (query.startDate || query.endDate) {
      where.createdAt = {};

      if (query.startDate) {
        const start = new Date(query.startDate);
        if (!isNaN(start.getTime())) {
          where.createdAt[Op.gte] = start;
        }
      }

      if (query.endDate) {
        const end = new Date(query.endDate);
        if (!isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          where.createdAt[Op.lte] = end;
        }
      }
    }

    const { count, rows } = await this.tenantModel.findAndCountAll({
      where,
      attributes: ['id', 'name', 'status', 'createdAt'], // ✅ use camelCase
      include: [
        {
          model: RoleB2C,
          attributes: ['id', 'name'],
        },
      ],
      order: [['createdAt', 'DESC']], // ✅ use camelCase
      limit,
      offset,
      distinct: true,
    });

    const totalPages = Math.ceil(count / limit);

    return {
      data: JSON.parse(JSON.stringify(rows)), // ✅ removes Sequelize metadata
      pagination: {
        total: count,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  // ── Get Single Tenant ───────────────────────────────────────────────────
  async findOne(id: string) {
    const tenant = await this.tenantModel.findByPk(id, {
      attributes: ['id', 'name', 'status', 'created_at'],
      include: [
        {
          model: RoleB2C,
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  // ── Update Tenant ───────────────────────────────────────────────────────
  async updateTenant(id: string, dto: { name?: string; status?: boolean }) {
    const tenant = await this.tenantModel.findByPk(id);
    if (!tenant) throw new NotFoundException('Tenant not found');

    if (dto.name) {
      const name = dto.name.trim();

      if (name !== tenant.name) {
        const exists = await this.tenantModel.findOne({
          where: { name },
        });
        if (exists) {
          throw new ConflictException('Tenant name already taken');
        }
      }

      dto.name = name;
    }

    await tenant.update(dto);

    return {
      id: tenant.id,
      name: tenant.name,
      status: tenant.status,
    };
  }

  // ── Delete Tenant (WITH TRANSACTION) ─────────────────────────────────────
  async deleteTenant(id: string) {
    const tenant = await this.tenantModel.findByPk(id);
    if (!tenant) throw new NotFoundException('Tenant not found');

    return await this.sequelize.transaction(async (t) => {
      const roles = await this.roleModel.findAll({
        where: { tenantId: id },
        transaction: t,
      });

      const roleIds = roles.map((r) => r.id);

      if (roleIds.length) {
        await this.rpModel.destroy({
          where: { roleId: { [Op.in]: roleIds } },
          transaction: t,
        });
      }

      await this.roleModel.destroy({
        where: { tenantId: id },
        transaction: t,
      });

      await tenant.destroy({ transaction: t });

      return { message: 'Tenant deleted successfully' };
    });
  }

  // ── Toggle Tenant Status ────────────────────────────────────────────────
  async toggleStatus(id: string) {
    const tenant = await this.tenantModel.findByPk(id);
    if (!tenant) throw new NotFoundException('Tenant not found');

    const newStatus = !tenant.status;

    await tenant.update({ status: newStatus });

    return {
      id: tenant.id,
      name: tenant.name,
      status: newStatus,
      message: newStatus ? 'Tenant activated' : 'Tenant deactivated',
    };
  }
}
