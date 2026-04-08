import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Op } from 'sequelize';
import { Tenant } from '../../models/tenant.model';
import { RoleB2C } from '../../models/role_b2c.model';
import { PermissionB2C } from '../../models/permission_b2c.model';
import { RolePermissionB2C } from '../../models/role_permission_b2c.model';
import { InjectConnection, InjectModel } from '@nestjs/sequelize'; // 👈
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class TenantsService {
  constructor(
    @InjectConnection() private sequelize: Sequelize,
    @InjectModel(Tenant) private tenantModel: typeof Tenant,
    @InjectModel(RoleB2C) private roleModel: typeof RoleB2C,
    @InjectModel(PermissionB2C) private permModel: typeof PermissionB2C,
    @InjectModel(RolePermissionB2C) private rpModel: typeof RolePermissionB2C,
  ) {}

  async createTenant(dto: { name: string }) {
    const name = dto.name?.trim();

    if (!name) {
      throw new ConflictException('Tenant name is required');
    }

    const exists = await this.tenantModel.findOne({ where: { name } });
    if (exists) throw new ConflictException('Tenant already exists');

    return await this.sequelize.transaction(async (t) => {
      const tenant = await this.tenantModel.create(
        { name },
        { transaction: t },
      );

      const adminRole = await this.roleModel.create(
        {
          name: `${name}_ADMIN`,
          tenantId: tenant.id,
        },
        { transaction: t },
      );

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

  async findAll(filters: any) {
    const page = Math.max(parseInt(filters.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(filters.limit) || 10, 1), 100);
    const offset = (page - 1) * limit;

    const { name, status, startDate, endDate } = filters;

    const where: any = {};

    if (name?.trim()) {
      where.name = { [Op.iLike]: `%${name.trim()}%` };
    }

    if (status !== undefined && status !== null && status !== '') {
      if (status === 'true' || status === true) where.status = true;
      else if (status === 'false' || status === false) where.status = false;
    }

    // Date filtering
    if (startDate || endDate) {
      const parseDate = (val: string): Date | null => {
        if (!val || typeof val !== 'string') return null;
        const parsed = new Date(val);
        return isNaN(parsed.getTime()) ? null : parsed;
      };

      const from = parseDate(startDate);
      const to = parseDate(endDate);

      if (from && to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        where.created_at = { [Op.between]: [from, end] };
      } else if (from) {
        const end = new Date(from);
        end.setHours(23, 59, 59, 999);
        where.created_at = { [Op.between]: [from, end] };
      } else if (to) {
        const start = new Date(to);
        start.setHours(0, 0, 0, 0);
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        where.created_at = { [Op.between]: [start, end] };
      }
    }

    const { count, rows } = await this.tenantModel.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    return {
      total: count,
      page: +page,
      pageSize: +limit,
      data: rows,
    };
  }

  async findOne(id: string | number) {
    const tenantId = typeof id === 'string' ? parseInt(id, 10) : id;

    if (isNaN(tenantId)) {
      throw new NotFoundException('Invalid tenant ID');
    }

    const tenant = await this.tenantModel.findByPk(tenantId, {
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

  async updateTenant(id: number, dto: { name?: string; status?: boolean }) {
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

  async deleteTenant(id: number) {
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

  async toggleStatus(id: number) {
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

  async getAllTenant() {
    const { count, rows } = await this.tenantModel.findAndCountAll();

    if (!count) throw new NotFoundException('Tenant not found');
    return {
      total: count,
      data: rows,
    };
  }
}
