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
}
