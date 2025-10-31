import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Role } from '../../models/Roles';
import { RolePermission } from '../../models/role-permission';
import { Permission } from '../../models/Permissions';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role) private roleModel: typeof Role,
    @InjectModel(RolePermission) private rolePermissionModel: typeof RolePermission,
    @InjectModel(Permission) private permissionModel: typeof Permission,
  ) {}

  async create(roleData: { role_title: string; slug?: string }): Promise<Role> {
    if (!roleData.role_title) {
      throw new BadRequestException('Role title is required');
    }
    
    const existingRole = await this.roleModel.findOne({ 
      where: { role_title: roleData.role_title } 
    });
    
    if (existingRole) {
      throw new BadRequestException('Role already exists');
    }
    
    // If slug is not provided, generate it from role_title
    const slug = roleData.slug || roleData.role_title.toLowerCase().replace(/\s+/g, '-');
    
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
  

  async removePermission(roleId: number, permissionName: string): Promise<Role> {
    const role = await this.roleModel.findByPk(roleId);
    if (!role) throw new BadRequestException('Role not found');
    const perm = await this.permissionModel.findOne({ where: { permission_name: permissionName } });
    if (!perm) throw new BadRequestException('Permission not found');
    await this.rolePermissionModel.destroy({
      where: { roleId, permissionId: perm.id },
    });
    return this.roleModel.findByPk(roleId, {
      include: [{ model: Permission, through: { attributes: [] } }],
    });
  }
}