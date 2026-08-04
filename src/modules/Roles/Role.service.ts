import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Role } from '../../models/Roles';
import { RolePermission } from '../../models/role-permission';
import { Permission } from '../../models/Permissions';
import { RoleB2C } from '../../models/role_b2c.model';
import { PermissionB2C } from '../../models/permission_b2c.model';
import { RolePermissionB2C } from '../../models/role_permission_b2c.model';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role) private roleModel: typeof Role,
    @InjectModel(RolePermission)
    private rolePermissionModel: typeof RolePermission,
    @InjectModel(Permission) private permissionModel: typeof Permission,
    @InjectModel(RoleB2C) private roleB2CModel: typeof RoleB2C,
    @InjectModel(PermissionB2C)
    private permissionB2CModel: typeof PermissionB2C,
    @InjectModel(RolePermissionB2C)
    private rolePermissionB2CModel: typeof RolePermissionB2C,
  ) {}

  async create(roleData: { role_title: string; slug?: string }): Promise<Role> {
    if (!roleData.role_title) {
      throw new BadRequestException('Role title is required');
    }

    const existingRole = await this.roleModel.findOne({
      where: { role_title: roleData.role_title },
    });

    if (existingRole) {
      throw new BadRequestException('Role already exists');
    }

    // If slug is not provided, generate it from role_title
    const slug =
      roleData.slug || roleData.role_title.toLowerCase().replace(/\s+/g, '-');

    return this.roleModel.create({ ...roleData, slug });
  }

  async findAll(): Promise<Role[]> {
    return this.roleModel.findAll({
      attributes: ['id', 'role_title', 'slug'],
      include: [{ model: Permission, through: { attributes: [] } }],
    });
  }

  async findById(id: number): Promise<Role> {
    return this.roleModel.findByPk(id, {
      include: [{ model: Permission, through: { attributes: [] } }],
    });
  }

  async update(id: number, data: Partial<Role>): Promise<Role> {
    const role = await this.roleModel.findByPk(id);
    if (!role) throw new BadRequestException('Role not found');
    return role.update(data);
  }

  async addPermission(roleId: number, permissionName: string): Promise<Role> {
    const role = await this.roleModel.findByPk(roleId);
    if (!role) throw new BadRequestException('Role not found');

    const perm = await this.permissionModel.findOne({
      where: { permission_name: permissionName },
    });
    if (!perm) throw new BadRequestException('Permission not found');

    // Create relation if not exists
    await this.rolePermissionModel.findOrCreate({
      where: { roleId, permissionId: perm.id },
      defaults: { roleId, permissionId: perm.id },
    });

    // ✅ Correct query — no `through`
    return this.roleModel.findByPk(roleId, {
      include: [{ model: Permission, through: { attributes: [] } }],
    });
  }

  async removePermission(
    roleId: number,
    permissionName: string,
  ): Promise<Role> {
    const role = await this.roleModel.findByPk(roleId);
    if (!role) throw new BadRequestException('Role not found');
    const perm = await this.permissionModel.findOne({
      where: { permission_name: permissionName },
    });
    if (!perm) throw new BadRequestException('Permission not found');
    await this.rolePermissionModel.destroy({
      where: { roleId, permissionId: perm.id },
    });
    return this.roleModel.findByPk(roleId, {
      include: [{ model: Permission, through: { attributes: [] } }],
    });
  }

  // -------------------B@C Role Management-------------------
  async createRole(requestingUser: any, dto: { name: string }) {
    const tenantId = requestingUser.tenantId;

    const exists = await this.roleB2CModel.findOne({
      where: { name: dto.name, tenantId },
    });
    if (exists)
      throw new ConflictException('Role already exists in this tenant');

    return this.roleB2CModel.create({ name: dto.name, tenantId } as any);
  }

  async getRoles(requestingUser: any) {
    const where: any = {};
    if (requestingUser.tenantId) where.tenantId = requestingUser.tenantId;

    return this.roleB2CModel.findAll({
      where,
      include: [{ model: PermissionB2C, through: { attributes: [] } }],
    });
  }

  async assignPermission(
    requestingUser: any,
    roleId: string,
    permissionId: string,
  ) {
    await this.assertRoleOwnership(requestingUser, roleId);

    const perm = await this.permissionB2CModel.findByPk(permissionId);
    if (!perm) throw new NotFoundException('Permission not found');

    const [record] = await this.rolePermissionB2CModel.findOrCreate({
      where: { roleId, permissionId },
    });
    return record;
  }

  async removePermissionB2C(
    requestingUser: any,
    roleId: string,
    permissionId: string,
  ) {
    await this.assertRoleOwnership(requestingUser, roleId);

    const deleted = await this.rolePermissionB2CModel.destroy({
      where: { roleId, permissionId },
    });
    if (!deleted)
      throw new NotFoundException('Permission assignment not found');
    return { message: 'Permission removed' };
  }

  async deleteRole(requestingUser: any, roleId: string) {
    const role = await this.assertRoleOwnership(requestingUser, roleId);
    await role.destroy();
    return { message: 'Role deleted' };
  }

  // ── private helper ─────────────────────────────────────────────────────
  private async assertRoleOwnership(requestingUser: any, roleId: string) {
    const where: any = { id: roleId };
    if (requestingUser.tenantId) where.tenantId = requestingUser.tenantId;

    const role = await this.roleB2CModel.findOne({ where });
    if (!role)
      throw new ForbiddenException('Role not found or not in your tenant');
    return role;
  }
}
