import { Injectable } from '@nestjs/common';
import { Role } from 'src/models/Roles';
import { UserN as User } from 'src/models/UsersN';
import { Permission } from 'src/models/Permissions';
import { Permissionmetadata } from 'src/models/PermissionsMetaData';

@Injectable()
export class AuthService {
  async adminAuth(email: string, password: string) {
    try {
      const result = await User.findOne({
        where: {
          email: email,
          isAdmin: true,
        },
        include: [
          {
            model: Permission,
            as: 'permission',
            include: [
              {
                model: Permissionmetadata,
                as: 'Permissionmetadata',
              },
            ],
          },
        ],
      });

      if (result) {
        if ((result.status || result.dataValues.status) === false) {
          return { status: 'account_inactive' };
        }
        let roleId = result.role_id || result.dataValues.role_id
        const findRole = await Role.findOne({
          where: { id: roleId },
          attributes: ['slug', 'role_title'],
        });

        const mergedData = {
          ...result.toJSON(),
          ...findRole.toJSON(),
        };
        return mergedData;
      } else {
        return { status: 'no_user_found' };
      }
    } catch (error) {
      throw new Error(error);
    }
  }

  async centerAuth(email: string, password: string) {
    try {
      const result = await User.findOne({
        where: {
          email: email,
          isAdmin: false,
        },
        include: [
          {
            model: Permission,
            as: 'permission',
            include: [
              {
                model: Permissionmetadata,
                as: 'Permissionmetadata',
              },
            ],
          },
        ],
      });

      if (result) {
        if ((result.status || result.dataValues.status) === false) {
          return { status: 'account_inactive' };
        }
        let roleId = result.role_id || result.dataValues.role_id;
        const findRole = await Role.findOne({
          where: { id: roleId },
          attributes: ['slug', 'role_title'],
        });

        const mergedData = {
          ...result.toJSON(),
          ...findRole.toJSON(),
        };

        return mergedData;
      } else {
        return { status: 'no_user_found' };
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async cetAuth(email: string, password: string) {
    try {
      const result = await User.findOne({
        where: {
          email: email,
          isAdmin: false,
        },
        include: [
          {
            model: Permission,
            as: 'permission',
            include: [
              {
                model: Permissionmetadata,
                as: 'Permissionmetadata',
              },
            ],
          },
        ],
      });

      if (result) {
        if ((result.status || result.dataValues.status) === false) {
          return { status: 'account_inactive' };
        }
        let roleId = result.role_id || result.dataValues.role_id;
        const findRole = await Role.findOne({
          where: { id: roleId },
          attributes: ['slug', 'role_title'],
        });

        const mergedData = {
          ...result.toJSON(),
          ...findRole.toJSON(),
        };

        return mergedData;
      } else {
        return { status: 'no_user_found' };
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async insertPermission(permissionData: any) {
    try {
      return await Permission.create(permissionData);
    } catch (error) {
      throw new Error(error);
    }
  }

  async insertPermissionMetadata(metadata: any) {
    try {
      return await Permissionmetadata.create(metadata);
    } catch (error) {
      throw new Error(error);
    }
  }

  async findPermission(req: any) {
    try {
      return await Permission.findAll({
        include: [
          {
            model: Permissionmetadata,
            as: 'Permissionmetadata',
          },
          {
            model: Role,
            as: 'Role',
          },
        ],
        order: [['id', 'DESC']],
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  async changeStatue(id: number, status: boolean) {
    try {
      return await User.update(
        { status: status },
        {
          where: { id: id },
        },
      );
    } catch (error) {
      throw new Error(error);
    }
  }

  async findPermissionData(id: number) {
    try {
      return await Permission.findOne({
        where: { id },
        include: {
          model: Permissionmetadata,
          as: 'Permissionmetadata',
        },
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  async updatePermission(permissionId: number, newData: any) {
    try {
      return await Permission.update(newData, {
        where: { id: permissionId },
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  async updatePermissionMetadata(metadataId: number, newData: any) {
    try {
      await Permissionmetadata.update(newData, {
        where: { id: metadataId },
      });
      return await Permissionmetadata.findByPk(metadataId);
    } catch (error) {
      throw new Error(error);
    }
  }

  async permmissionDelete(permissionId: number) {
    try {
      await Permissionmetadata.destroy({
        where: { permission_id: permissionId },
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  async permmissiondUpdate(mergedObject: any) {
    try {
      return await Permissionmetadata.create(mergedObject);
    } catch (error) {
      throw new Error(error);
    }
  }

  async checkRole(permission_id) {
    try {
      return await Permission.findOne({
        where: { id: permission_id },
        raw: true,
        nest: true
      });
    } catch (error) {
      throw new Error(error);
    }
  }
  async getRole(slug) {
    try {

      return await Role.findOne({
        where: { slug: slug },

        order: [['id', 'DESC']],
        raw: true,
        nest: true
      });
    } catch (error) {
      throw new Error(error);
    }
  }
  async getLastId(getRole) {
    try {

      return await User.findOne({
        where: { role_id: getRole.id },
        order: [['id', 'DESC']],
        raw: true,
        nest: true
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  async createUser(data) {
    try {
      return await User.create(data);
    } catch (error) {
      throw new Error(error);
    }
  }

  async roleInsert(data) {
    try {
      return await Role.create(data);
    } catch (error) {
      throw new Error(error);
    }
  }

  async rolefindAll() {
    try {
      return await Role.findAll({ order: [['id', 'DESC']] });
    } catch (error) {
      throw new Error(error);
    }
  }
  async getRoleData(id) {
    try {
      return await Role.findOne({ where: { id: id }, raw: true, nest: true });
    } catch (error) {
      throw new Error(error);
    }
  }
  async updateRole(data, id) {
    try {
      return await Role.update(data, { where: { id: id } });
    } catch (error) {
      throw new Error(error);
    }
  }

}
