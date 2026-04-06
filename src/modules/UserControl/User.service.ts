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

  async findById(id: number): Promise<User> {
    return this.userModel.findByPk(id, { include: [UserRole] });
  }

  async findByUsername(email: string): Promise<User> {
    return this.userModel.findOne({ where: { email }, raw: true });
  }

  async create(userData: {
    username: string;
    email: string;
    phone?: string;
    password: string;
    role?: number[];
  }) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await this.userModel.create({
      ...userData,
      password: hashedPassword,
    });

    if (userData.role) {
      for (const currentRole of userData.role) {
        const role = await this.roleModel.findByPk(currentRole);
        if (!role) throw new BadRequestException('Role not found');
        await this.userRoleModel.create({ userId: user.id, roleId: role.id });
      }
    }

    return user;
  }

  async getuserRoles(userId: number): Promise<number[]> {
    const userRoles = await this.userRoleModel.findAll({
      where: { userId },
    });
    return userRoles.map((ur) => ur.roleId);
  }

  async findAll(): Promise<User[]> {
    return this.userModel.findAll({ include: [UserRole] });
  }

  async update(id: number, data: Partial<User>): Promise<User> {
    const user = await this.userModel.findByPk(id);
    if (!user) throw new BadRequestException('User not found');
    return user.update(data);
  }

  async findByIdDetails(id: number): Promise<User> {
    return this.userModel.findByPk(id, { include: [UserRole] });
  }

  async addUserRoles(userId: number, roles: number[]) {
    for (const currentRole of roles) {
      const role = await this.roleModel.findByPk(currentRole);
      if (!role) throw new BadRequestException('Role not found');
      const alreadyExists = await this.userRoleModel.findOne({
        where: { userId, roleId: role.id },
      });
      if (alreadyExists) continue;
      await this.userRoleModel.create({ userId, roleId: role.id });
    }
    return true;
  }

  async removeUserRoles(userId: number, roles: number[]) {
    for (const currentRole of roles) {
      const role = await this.roleModel.findByPk(currentRole);
      if (!role) throw new BadRequestException('Role not found');
      const alreadyExists = await this.userRoleModel.findOne({
        where: { userId, roleId: role.id },
      });
      if (!alreadyExists) continue;
      await this.userRoleModel.destroy({ where: { userId, roleId: role.id } });
    }
    return true;
  }

  async viewUserRoles(userId: number) {
    const userRoles = await this.userRoleModel.findAll({
      where: { userId },
      attributes: ['userId', 'roleId'],
      include: [
        {
          model: Role,
          attributes: ['id', 'role_title', 'slug'],
        },
      ],
      raw: true,
      nest: true,
    });

    // Return array of role objects (extract from junction)
    return userRoles;
  }

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

  async getUserRolesWithPermissions(userId: number): Promise<{
    roles: any[]; // Array of unique roles with full permissions array
    permissions: string[]; // All unique permissions
  }> {
    const userRoles = await this.userRoleModel.findAll({
      where: { userId },
      attributes: ['userId', 'roleId'],
      include: [
        {
          model: Role,
          attributes: ['id', 'role_title', 'slug'],
        },
      ],
      raw: true,
      nest: true,
    });

    const uniqueRoles = await Promise.all(
      userRoles.map(async (role: any) => {
        const roles = await this.rolePermissionModel.findAll({
          where: { roleId: role.roleId },
          attributes: [],
          include: [
            {
              model: Permission,
              attributes: ['id', 'permission_name'],
            },
          ],
          raw: true,
          nest: true,
        });

        const permissions = roles.map((role: any) => {
          return {
            permission_id: role.permission.id,
            permission_name: role.permission.permission_name,
          };
        });

        return {
          id: role.role.id,
          role_title: role.role.role_title,
          slug: role.role.slug,
          permissions: permissions,
        };
      }),
    );

    // Filter out null roles (if any)
    const validRoles = uniqueRoles.filter(Boolean);

    // Get all unique permission names (flat)
    const userPermissions = await this.getUserPermissions(userId);

    return {
      roles: validRoles, // Unique roles with full permissions array of objects
      permissions: userPermissions,
    };
  }

  // -----------------------CREATE B2C USER------------------------

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
}
