import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UserN as User } from '../../models/UsersN';
import { UserRole } from '../../models/user-role';
import { Role } from '../../models/Roles';
import { Permission } from '../../models/Permissions';
import { RolePermission } from '../../models/role-permission';
import * as bcrypt from 'bcrypt';
import { RoleB2C } from 'src/models/role_b2c.model';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User) private userModel: typeof User,
    @InjectModel(UserRole) private userRoleModel: typeof UserRole,
    @InjectModel(Role) private roleModel: typeof Role,
    @InjectModel(Permission) private permissionModel: typeof Permission,
    @InjectModel(RolePermission)
    private rolePermissionModel: typeof RolePermission,
    @InjectModel(RoleB2C) private roleB2CModel: typeof RoleB2C,
  ) {}

  async createUser(
    requestingUser: any,
    dto: {
      email: string;
      password: string;
      roleId: string;
      tenantId?: string; // required when LMC Admin is creating
    },
  ) {
    // Tenant Admin locked to own tenant — LMC Admin must pass tenantId in body
    const targetTenantId = requestingUser.tenantId ?? dto.tenantId;
    if (!targetTenantId) {
      throw new ForbiddenException('tenantId is required');
    }

    // Roles are global (no tenantId on roles) — just verify role exists
    const role = await this.roleB2CModel.findByPk(dto.roleId);
    if (!role) throw new NotFoundException('Role not found');

    const exists = await this.userModel.findOne({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Email already in use');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.userModel.create({
      email: dto.email,
      password: hashed,
      tenantId: targetTenantId,
      roleId: dto.roleId,
    } as any);

    return { id: user.id, email: user.email, tenantId: user.tenantId };
  }

  // ── Get Users ───────────────────────────────────────────────────────────
  async getUsers(requestingUser: any, query?: { tenantId?: string }) {
    const where: any = {};

    if (requestingUser.tenantId) {
      // Tenant Admin — always scoped, ignore any query params
      where.tenantId = requestingUser.tenantId;
    } else if (query?.tenantId) {
      // LMC Admin — optional filter by tenantId
      where.tenantId = query.tenantId;
    }
    // LMC Admin with no filter → all users across all tenants

    return this.userModel.findAll({
      where,
      attributes: ['id', 'email', 'tenantId', 'status'],
      include: [{ model: RoleB2C, attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
    });
  }

  // ── Update User ─────────────────────────────────────────────────────────
  async updateUser(
    requestingUser: any,
    userId: string,
    dto: { roleId?: string; status?: boolean },
  ) {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');

    this.assertTenantAccess(requestingUser, user.tenantId as any);

    // Validate new role if being changed
    if (dto.roleId) {
      const role = await this.roleB2CModel.findByPk(dto.roleId);
      if (!role) throw new NotFoundException('Role not found');
    }

    await user.update(dto);
    return { id: user.id, email: user.email, status: user.status };
  }

  // ── Delete User ─────────────────────────────────────────────────────────
  async deleteUser(requestingUser: any, userId: string) {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');

    this.assertTenantAccess(requestingUser, user.tenantId as any);

    // Prevent self-deletion
    if (user.id === requestingUser.userId) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    await user.destroy();
    return { message: 'User deleted successfully' };
  }

  // ── Private: block cross-tenant access ─────────────────────────────────
  private assertTenantAccess(requestingUser: any, targetTenantId: string) {
    if (
      requestingUser.tenantId && // is a Tenant Admin
      requestingUser.tenantId !== targetTenantId // targeting another tenant
    ) {
      throw new ForbiddenException('Cannot access users outside your tenant');
    }
  }
  // Use less method
  async getUserPermissions(userId: number): Promise<any> {
    const userRoles = await this.userRoleModel.findAll({
      where: { userId },
      attributes: ['userId', 'roleId'],
      include: [
        {
          model: Role,
          attributes: ['id', 'role_title', 'slug'],
          required: false, // Allow roles without permissions (prevents undefined)
          include: [
            {
              model: Permission,
              through: { attributes: [] }, // No junction fields
              attributes: ['permission_name'],
              required: false, // Allow roles without permissions
            },
          ],
        },
      ],
      raw: true,
      nest: true,
    });

    const allPermissions = userRoles
      .flatMap((ur: any) => {
        return ur.role.permissions.permission_name; // Filter out undefined names
      })
      .filter(Boolean);

    const uniquePermissions = [...new Set(allPermissions)];

    return uniquePermissions;
  }
}
