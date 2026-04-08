// src/roles/roles.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { RoleB2C as Role } from '../../models/role_b2c.model';
import { PermissionB2C as Permission } from '../../models/permission_b2c.model';
import { RolePermissionB2C as RolePermission } from '../../models/role_permission_b2c.model';
import { Tenant } from '../../models/tenant.model';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class RolesService {
  constructor(
    @InjectConnection() private sequelize: Sequelize,
    @InjectModel(Role) private roleModel: typeof Role,
    @InjectModel(Permission) private permModel: typeof Permission,
    @InjectModel(RolePermission) private rpModel: typeof RolePermission,
    @InjectModel(Tenant) private tenantModel: typeof Tenant,
  ) {}

  // ── Create Role (LMC Admin only) ────────────────────────────────────────
  async createRole(dto: {
    name: string;
    tenantId: string;
    description?: string;
  }) {
    const name = dto.name?.trim();
    if (!name) throw new ConflictException('Role name is required');

    // Verify tenant exists
    const tenant = await this.tenantModel.findByPk(dto.tenantId);
    if (!tenant) throw new NotFoundException('Tenant not found');

    // Role name must be unique within the same tenant
    const exists = await this.roleModel.findOne({
      where: { name, tenantId: dto.tenantId },
    });
    if (exists) {
      throw new ConflictException(
        `Role '${name}' already exists in this tenant`,
      );
    }

    const role = await this.roleModel.create({
      name,
      tenantId: dto.tenantId,
      description: dto.description ?? null,
    } as any);

    return role;
  }

  // ── Get All Roles (paginated + filtered) ────────────────────────────────
  async findAll(query: {
    page?: number;
    limit?: number;
    name?: string;
    tenantId?: string;
    status?: any;
    startDate?: string;
    endDate?: string;
  }) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Number(query.limit) || 10, 100);
    const offset = (page - 1) * limit;

    const where: any = {};

    // Name filter
    if (query.name) {
      where.name = { [Op.iLike]: `%${query.name.trim()}%` };
    }

    // Tenant filter — LMC Admin can filter by tenant
    if (query.tenantId) {
      where.tenantId = query.tenantId;
    }

    // Status filter
    const statusMap: Record<string, boolean> = {
      true: true,
      '1': true,
      false: false,
      '0': false,
    };
    if (query.status !== undefined && String(query.status) in statusMap) {
      where.status = statusMap[String(query.status)];
    }

    // Date range filter
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

    const { count, rows } = await this.roleModel.findAndCountAll({
      where,
      attributes: [
        'id',
        'name',
        'description',
        'status',
        'tenantId',
        'createdAt',
      ],
      include: [
        {
          model: Tenant,
          attributes: ['id', 'name'],
        },
        {
          model: Permission,
          through: { attributes: [] },
          attributes: ['id', 'action', 'resource'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    const totalPages = Math.ceil(count / limit);

    return {
      data: rows.map((r) => r.toJSON()),
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

  // ── Get Single Role ─────────────────────────────────────────────────────
  async findOne(id: string) {
    const role = await this.roleModel.findByPk(id, {
      attributes: [
        'id',
        'name',
        'description',
        'status',
        'tenantId',
        'createdAt',
      ],
      include: [
        {
          model: Tenant,
          attributes: ['id', 'name'],
        },
        {
          model: Permission,
          through: { attributes: [] },
          attributes: ['id', 'action', 'resource'],
        },
      ],
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  // ── Update Role ─────────────────────────────────────────────────────────
  async updateRole(
    id: string,
    dto: { name?: string; description?: string; status?: boolean },
  ) {
    const role = await this.roleModel.findByPk(id);
    if (!role) throw new NotFoundException('Role not found');

    if (dto.name) {
      const name = dto.name.trim();
      if (name !== role.name) {
        const exists = await this.roleModel.findOne({
          where: { name, tenantId: role.tenantId },
        });
        if (exists) {
          throw new ConflictException(
            `Role '${name}' already exists in this tenant`,
          );
        }
      }
      dto.name = name;
    }

    await role.update(dto);

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      status: role.status,
      tenantId: role.tenantId,
    };
  }

  // ── Delete Role (WITH TRANSACTION) ──────────────────────────────────────
  async deleteRole(id: string) {
    const role = await this.roleModel.findByPk(id);
    if (!role) throw new NotFoundException('Role not found');

    return await this.sequelize.transaction(async (t) => {
      // Remove all permission assignments first
      await this.rpModel.destroy({
        where: { roleId: id },
        transaction: t,
      });

      await role.destroy({ transaction: t });

      return { message: 'Role deleted successfully' };
    });
  }

  // ── Toggle Role Status ──────────────────────────────────────────────────
  async toggleStatus(id: string) {
    const role = await this.roleModel.findByPk(id);
    if (!role) throw new NotFoundException('Role not found');

    const newStatus = !role.status;
    await role.update({ status: newStatus });

    return {
      id: role.id,
      name: role.name,
      status: newStatus,
      message: newStatus ? 'Role activated' : 'Role deactivated',
    };
  }

  //   // ── Assign Permissions to Role (bulk) ───────────────────────────────────
  //   async assignPermissions(roleId: string, permissionIds: string[]) {
  //     const role = await this.roleModel.findByPk(roleId);
  //     if (!role) throw new NotFoundException('Role not found');

  //     // Validate all permissions exist
  //     const permissions = await this.permModel.findAll({
  //       where: { id: { [Op.in]: permissionIds } },
  //     });
  //     if (permissions.length !== permissionIds.length) {
  //       throw new NotFoundException('One or more permissions not found');
  //     }

  //     await this.rpModel.bulkCreate(
  //       permissionIds.map((permissionId) => ({ roleId, permissionId })),
  //       { ignoreDuplicates: true },
  //     );

  //     return {
  //       message:  'Permissions assigned successfully',
  //       role:     role.name,
  //       assigned: permissions.map((p) => `${p.action}:${p.resource}`),
  //     };
  //   }
  async assignPermissions(roleId: string, permissionIds: string[]) {
    const roleIdNum = Number(roleId);
    const permissionIdsNum = permissionIds.map(Number);

    // 🔒 Safety check (very important)
    if (isNaN(roleIdNum) || permissionIdsNum.some(isNaN)) {
      throw new BadRequestException('Invalid IDs');
    }

    const role = await this.roleModel.findByPk(roleIdNum);
    if (!role) throw new NotFoundException('Role not found');

    const permissions = await this.permModel.findAll({
      where: { id: { [Op.in]: permissionIdsNum } },
    });

    if (permissions.length !== permissionIdsNum.length) {
      throw new NotFoundException('One or more permissions not found');
    }

    await this.rpModel.bulkCreate(
      permissionIdsNum.map((permissionId) => ({
        roleId: roleIdNum,
        permissionId,
      })),
      { ignoreDuplicates: true },
    );

    return {
      message: 'Permissions assigned successfully',
      role: role.name,
      assigned: permissions.map((p) => `${p.action}:${p.resource}`),
    };
  }

  // ── Remove Single Permission from Role ──────────────────────────────────
  async removePermission(roleId: string, permissionId: string) {
    const role = await this.roleModel.findByPk(roleId);
    if (!role) throw new NotFoundException('Role not found');

    const deleted = await this.rpModel.destroy({
      where: { roleId, permissionId },
    });
    if (!deleted)
      throw new NotFoundException('Permission assignment not found');

    return { message: 'Permission removed successfully' };
  }

  // ── Sync Permissions (replace all at once) ──────────────────────────────
  // Frontend sends the full checked list — we diff and update
  //   async syncPermissions(roleId: string, permissionIds: string[]) {
  //     const role = await this.roleModel.findByPk(roleId);
  //     if (!role) throw new NotFoundException('Role not found');

  //     return await this.sequelize.transaction(async (t) => {
  //       // Remove all existing
  //       await this.rpModel.destroy({
  //         where:       { roleId },
  //         transaction: t,
  //       });

  //       // Re-assign new set
  //       if (permissionIds.length) {
  //         await this.rpModel.bulkCreate(
  //           permissionIds.map((permissionId) => ({ roleId, permissionId })),
  //           { transaction: t, ignoreDuplicates: true },
  //         );
  //       }

  //       return { message: 'Permissions synced successfully' };
  //     });
  //   }
  async syncPermissions(roleId: string, permissionIds: string[]) {
    const roleIdNum = Number(roleId);
    const permissionIdsNum = permissionIds.map(Number);

    // 🔒 Safety validation
    if (isNaN(roleIdNum) || permissionIdsNum.some(isNaN)) {
      throw new BadRequestException('Invalid IDs');
    }

    const role = await this.roleModel.findByPk(roleIdNum);
    if (!role) throw new NotFoundException('Role not found');

    return await this.sequelize.transaction(async (t) => {
      // Remove all existing
      await this.rpModel.destroy({
        where: { roleId: roleIdNum },
        transaction: t,
      });

      // Re-assign new set
      if (permissionIdsNum.length) {
        await this.rpModel.bulkCreate(
          permissionIdsNum.map((permissionId) => ({
            roleId: roleIdNum,
            permissionId,
          })),
          { transaction: t, ignoreDuplicates: true },
        );
      }

      return { message: 'Permissions synced successfully' };
    });
  }
}
