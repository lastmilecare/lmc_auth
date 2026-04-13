import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { PermissionB2C as Permission } from '../../models/permission_b2c.model';
import { RolePermissionB2C as RolePermission } from '../../models/role_permission_b2c.model';
import { RoleB2C as Role } from '../../models/role_b2c.model';
import { Sequelize } from 'sequelize-typescript';
import { Op, QueryTypes } from 'sequelize';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectConnection() private sequelize: Sequelize,
    @InjectModel(Permission) private permModel: typeof Permission,
    @InjectModel(RolePermission) private rpModel: typeof RolePermission,
    @InjectModel(Role) private roleModel: typeof Role,
  ) {}

  // ── Create Permission (LMC Admin only) ──────────────────────────────────
  async createPermission(dto: {
    action: string;
    resource: string;
    description?: string;
  }) {
    const exists = await this.permModel.findOne({
      where: {
        action: dto.action,
        resource: dto.resource,
      },
    });
    if (exists) {
      throw new ConflictException(
        `Permission '${dto.action}:${dto.resource}' already exists`,
      );
    }

    const permission = await this.permModel.create({
      action: dto.action,
      resource: dto.resource,
      description: dto.description ?? null,
    } as any);

    return permission;
  }

  async getAllPermissions(query?: {
    page?: number;
    limit?: number;
    action?: string;
    resource?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = Math.max(Number(query?.page) || 1, 1);
    const limit = Math.min(Number(query?.limit) || 10, 100);
    const offset = (page - 1) * limit;

    const where: any = {};

    if (query?.action)
      where.action = { [Op.iLike]: `%${query.action.trim()}%` };
    if (query?.resource)
      where.resource = { [Op.iLike]: `%${query.resource.trim()}%` };

    if (query?.startDate || query?.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        const start = new Date(query.startDate);
        if (!isNaN(start.getTime())) where.createdAt[Op.gte] = start;
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        if (!isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          where.createdAt[Op.lte] = end;
        }
      }
    }

    const { count, rows } = await this.permModel.findAndCountAll({
      where,
      attributes: ['id', 'action', 'resource', 'description', 'createdAt'],
      order: [
        ['resource', 'ASC'],
        ['action', 'ASC'],
      ],
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

  // ── Get Single Permission ───────────────────────────────────────────────
  async getPermissionById(id: string) {
    const permission = await this.permModel.findByPk(id, {
      attributes: ['id', 'action', 'resource', 'description'],
    });
    if (!permission) throw new NotFoundException('Permission not found');
    return permission;
  }

  // ── Get Permissions grouped by resource ────────────────────────────────
  // Useful for frontend to render permission checkboxes per module
  async getPermissionsGrouped() {
    const permissions = await this.permModel.findAll({
      attributes: ['id', 'action', 'resource', 'description'],
      order: [
        ['resource', 'ASC'],
        ['action', 'ASC'],
      ],
    });

    // Group by resource → { user: [...], role: [...], tenant: [...] }
    return permissions.reduce((groups: any, perm) => {
      const key = perm.resource;
      if (!groups[key]) groups[key] = [];
      groups[key].push({
        id: perm.id,
        action: perm.action,
        description: perm.description,
        key: `${perm.action}:${perm.resource}`,
      });
      return groups;
    }, {});
  }

  // ── Get Permissions by Role ─────────────────────────────────────────────
  // Both admins can view — Tenant Admin can see what a role can do
  async getPermissionsByRole(roleId: string) {
    const role = await this.roleModel.findByPk(roleId, {
      attributes: ['id', 'name'],
      include: [
        {
          model: Permission,
          through: { attributes: [] },
          attributes: ['id', 'action', 'resource', 'description'],
        },
      ],
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  // ── Update Permission (LMC Admin only) ──────────────────────────────────
  async updatePermission(
    id: string,
    dto: { action?: string; resource?: string; description?: string },
  ) {
    const permission = await this.permModel.findByPk(id);
    if (!permission) throw new NotFoundException('Permission not found');

    // Check uniqueness if action or resource is changing
    if (dto.action || dto.resource) {
      const newAction = dto.action ?? permission.action;
      const newResource = dto.resource ?? permission.resource;

      const exists = await this.permModel.findOne({
        where: { action: newAction, resource: newResource },
      });
      if (exists && exists.id != (id as any)) {
        throw new ConflictException(
          `Permission '${newAction}:${newResource}' already exists`,
        );
      }
    }

    await permission.update(dto);
    return {
      id: permission.id,
      action: permission.action,
      resource: permission.resource,
      description: permission.description,
    };
  }

  // ── Delete Permission (LMC Admin only) ──────────────────────────────────
  async deletePermission(id: string) {
    const permission = await this.permModel.findByPk(id);
    if (!permission) throw new NotFoundException('Permission not found');

    // Remove all role assignments first
    await this.rpModel.destroy({ where: { permissionId: id } });
    await permission.destroy();

    return { message: 'Permission deleted successfully' };
  }
  async getAllPermissionsCombo() {
    const { count, rows } = await this.permModel.findAndCountAll({
      attributes: ['id', 'action', 'resource', 'description'],
      order: [
        ['resource', 'ASC'],
        ['action', 'ASC'],
      ],
    });
    return {
      total: count,
      data: rows,
    };
  }
  async getResourceCombo() {
    const resources = await this.sequelize.query(
      `SELECT id, name, description
     FROM "resources"
     WHERE status = true
     ORDER BY name ASC`,
      {
        type: QueryTypes.SELECT,
      },
    );

    return {
      total: resources.length,
      data: resources,
    };
  }
}
