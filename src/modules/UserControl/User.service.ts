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

    console.log('Unique Permissions:', uniquePermissions);

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

    console.log(userRoles);
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

        console.log(roles);
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
    dto: { email: string; password: string; roleId: string },
  ) {
    const tenantId = requestingUser.tenantId;

    // Verify role belongs to caller's tenant
    const role = await this.roleB2CModel.findOne({
      where: { id: dto.roleId, tenantId },
    });
    if (!role)
      throw new ForbiddenException('Role does not belong to your tenant');

    const exists = await this.userModel.findOne({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Email already in use');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.userModel.create({
      email: dto.email,
      password: hashed,
      tenantId,
      roleId: dto.roleId,
    } as any);

    return { id: user.id, email: user.email, tenantId: user.tenantId };
  }

  async getUsers(requestingUser: any) {
    const where: any = {};
    // Tenant admin only sees their own tenant's users
    if (requestingUser.tenantId) {
      where.tenantId = requestingUser.tenantId;
    }

    return this.userModel.findAll({
      where,
      attributes: ['id', 'email', 'tenantId', 'status'],
      include: [{ model: RoleB2C, attributes: ['name'] }],
    });
  }

  async updateUser(
    requestingUser: any,
    userId: string,
    dto: { roleId?: string; status?: boolean },
  ) {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');

    if (requestingUser.tenantId && user.tenantId !== requestingUser.tenantId) {
      throw new ForbiddenException('Cannot modify users outside your tenant');
    }

    await user.update(dto);
    return { id: user.id, email: user.email, status: user.status };
  }

  async deleteUser(requestingUser: any, userId: string) {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');

    if (requestingUser.tenantId && user.tenantId !== requestingUser.tenantId) {
      throw new ForbiddenException('Cannot delete users outside your tenant');
    }

    await user.destroy();
    return { message: 'User deleted successfully' };
  }
}
