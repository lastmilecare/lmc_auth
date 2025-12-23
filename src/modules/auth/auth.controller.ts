import {
  Controller,
  Post,
  Body,
  Req,
  Res,
} from '@nestjs/common';
import slugify from 'slugify';
const { sendSuccess, sendError } = require('../../../src/util/responseHandler');
import { AuthService } from './auth.service';
import {
  checkEmailExist,
  checkUserNameExist,
  checkPhoneExist,
  checkUserPass,
  createUserLogs
} from "src/common/helpers/auth.helper";
import { UserN as User } from "src/models/UsersN";
import { UserLog as userlog } from "src/models/user-log.model";
import bcrypt from 'bcrypt';
import HttpStatusCode from 'src/const/HttpStatusCode';

@Controller('admin')
export class AuthController {
  constructor(private readonly authService: AuthService) { }
  @Post('role-details')
  async roleDetails(@Req() req: any, @Res() res: any) {
    if (!req.body.id) {
      return sendError(res, 400, 'Role ID Required', 'Role ID Required');
    }

    try {
      const result = await this.authService.getRoleData(req.body.id);
      return sendSuccess(res, 200, result, 'Role Fetch successfully');
    } catch (error) {
      return sendError(res, 500, error, 'Invalid input');
    }
  }

  @Post('update-role')
  async updateRole(@Req() req: any, @Res() res: any) {
    if (!req.body.id) {
      return sendError(res, 400, 'Role ID Required', 'Role ID Required');
    }
    if (!req.body.role_title) {
      return sendError(res, 400, 'Role Title Required', 'Role Title Required');
    }

    try {
      const data = {
        role_title: req.body.role_title,
        slug: createSlug(req.body.role_title),
      };

      const result = await this.authService.updateRole(data, req.body.id);
      return sendSuccess(res, 200, result, 'Update Role successfully');
    } catch (error) {
      return sendError(res, 500, error, 'Invalid input');
    }
  }

  @Post('create-role')
  async createRole(@Req() req: any, @Res() res: any) {
    try {
      const data = {
        role_title: req.body.role_title,
        slug: createSlug(req.body.role_title),
      };

      const result = await this.authService.roleInsert(data);
      return sendSuccess(res, 201, result, 'Create Role successfully');
    } catch (error) {
      return sendError(res, 500, error, 'Invalid input');
    }
  }

  @Post('admin-create')
  async adminCreate(@Req() req: any, @Res() res: any) {
    try {
      if (!req.body.permission_id) {
        return sendError(res, 404, 'permission id required', 'permission id required');
      }

      const phone = String(req.body.phone);

      const roleData = await this.authService.checkRole(req.body.permission_id);
      if (!roleData) {
        return sendError(res, 404, 'Invalid permission id', 'Invalid permission id');
      }

      if (await checkUserNameExist(req.body.username.trim().toLowerCase())) {
        return sendError(res, 400, 'Username Already Exists', 'Username Already Exists');
      }

      if (await checkEmailExist(req.body.email.toLowerCase())) {
        return sendError(res, 400, 'Email Already Exists', 'Email Already Exists');
      }

      if (await checkPhoneExist(phone)) {
        return sendError(res, 400, 'phone Already Exists', 'phone Already Exists');
      }

      const getRole = await this.authService.getRole('admin');
      const nextId = await this.authService.getLastId(getRole);
      const extId = nextId ? parseInt(nextId.id) + 1 : 1;

      const data = {
        external_id: `A${extId.toString().padStart(3, '0')}`,
        username: req.body.username.trim().toLowerCase(),
        role_id: roleData.role_id,
        email: req.body.email.toLowerCase(),
        name: req.body.name,
        permission_id: req.body.permission_id,
        phone,
        status: true,
        isAdmin: true,
        password: bcrypt.hashSync(req.body.password, 8),
      };

      const result = await this.authService.createUser(data);
      return sendSuccess(res, 201, result.username, 'Success');
    } catch (error) {
      return sendError(res, 500, error, 'Invalid input');
    }
  }

  @Post('login')
  async adminAuth(@Req() req: any, @Res() res: any) {
    try {
      if (!req.body.email) {
        return sendError(res, 400, 'Email ID Required', 'Email ID Required');
      }
      if (!req.body.password) {
        return sendError(res, 400, 'Password ID Required', 'Password ID Required');
      }

      const result = await this.authService.adminAuth(
        req.body.email,
        req.body.password,
      );

      if (result.status === 'no_user_found') {
        return sendError(res, 404, 'no_user_found', 'No User Found!');
      }

      if (result.status === 'account_inactive') {
        return sendError(res, 401, 'account_inactive', 'account inactive!');
      }

      const allowedRoles = ['admin', 'latehar_bdm'];
      if (!allowedRoles.includes(result.slug)) {
        return sendError(res, 401, 'Invalid_role', 'Invalid Role');
      }

      const tokenData = await checkUserPass(
        req.body.password,
        result,
        res,
      );

      if (tokenData.status === 'invalid_password') {
        return sendError(res, 404, 'invalid_password', 'Invalid Password');
      }

      await createUserLogs({
        user_id: result.id,
        action_type: 'admin_login',
        action_description: "login",
        user_ip: (req as any).userIp,
        action_time: new Date().toISOString(),
      });

      return sendSuccess(res, 200, tokenData, 'Login Successfully');
    } catch (error) {
      return sendError(res, 500, 'internal server error', error);
    }
  }

  @Post('permission/create')
  async createPermission(@Req() req: any, @Res() res: any) {
    if (!req.body.role_id || !req.body.Permissionmetadata) {
      return sendError(
        res,
        HttpStatusCode.BAD_REQUEST.code,
        'role_id and Permissionmetadata required',
      );
    }

    try {
      const permissionData = {
        role_id: req.body.role_id,
        permission_name: req.body.permission_name,
      };

      const permissionMetadata = req.body.Permissionmetadata;

      const permission =
        await this.authService.insertPermission(permissionData);

      for (const metadata of permissionMetadata) {
        metadata.permission_id = permission.id;
        await this.authService.insertPermissionMetadata(metadata);
      }

      return sendSuccess(
        res,
        HttpStatusCode.OK.code,
        permission,
        'Permission Create Successfully',
      );
    } catch (error) {
      console.error(error);
      return sendError(
        res,
        HttpStatusCode.INTERNAL_SERVER_ERROR.code,
        'internal server error',
      );
    }
  }

  @Post('permission/view')
  async viewPermission(@Req() req: any, @Res() res: any) {
    try {
      const result = await this.authService.findPermission(req);
      return sendSuccess(
        res,
        HttpStatusCode.OK.code,
        result,
        'Permission View Successfully',
      );
    } catch (error) {
      console.error(error);
      return sendError(
        res,
        HttpStatusCode.INTERNAL_SERVER_ERROR.code,
        'internal server error',
      );
    }
  }

  @Post('permission/details')
  async permissionDetails(@Req() req: any, @Res() res: any) {
    if (!req.body.id) {
      return sendError(
        res,
        HttpStatusCode.BAD_REQUEST.code,
        'ID Required',
      );
    }

    try {
      const result = await this.authService.findPermissionData(req.body.id);
      return sendSuccess(
        res,
        HttpStatusCode.OK.code,
        result,
        'Permission View Successfully',
      );
    } catch (error) {
      console.error(error);
      return sendError(
        res,
        HttpStatusCode.INTERNAL_SERVER_ERROR.code,
        'internal server error',
      );
    }
  }

  @Post('permission/update')
  async permissionUpdate(@Req() req: any, @Res() res: any) {
    if (!req.body.permission_id || !req.body.Permissionmetadata) {
      return sendError(
        res,
        HttpStatusCode.BAD_REQUEST.code,
        'permission_id and Permissionmetadata are required',
      );
    }

    try {
      const permissionId = req.body.permission_id;
      const permissionMetadata = req.body.Permissionmetadata;

      const pData = {
        permission_name: req.body.permission_name,
        role_id: req.body.role_id,
      };

      await this.authService.updatePermission(permissionId, pData);
      await this.authService.permmissionDelete(permissionId);

      for (const metadata of permissionMetadata) {
        await this.authService.permmissiondUpdate({
          ...metadata,
          permission_id: permissionId,
        });
      }

      return sendSuccess(
        res,
        HttpStatusCode.OK.code,
        pData,
        'Permission updated successfully',
      );
    } catch (error) {
      console.error(error);
      return sendError(
        res,
        HttpStatusCode.INTERNAL_SERVER_ERROR.code,
        'Internal server error',
      );
    }
  }

  // ---------------- USER ----------------

  @Post('user/status-update')
  async userStatusUpdate(@Req() req: any, @Res() res: any) {
    if (!req.body.id) {
      return sendError(
        res,
        HttpStatusCode.BAD_REQUEST.code,
        'id required',
      );
    }

    if (typeof req.body.status !== 'boolean') {
      return sendError(
        res,
        HttpStatusCode.BAD_REQUEST.code,
        'status required',
      );
    }

    try {
      const result = await this.authService.changeStatue(
        req.body.id,
        req.body.status,
      );

      return sendSuccess(
        res,
        HttpStatusCode.OK.code,
        result,
        'Status Update Successfully',
      );
    } catch (error) {
      console.error(error);
      return sendError(
        res,
        HttpStatusCode.INTERNAL_SERVER_ERROR.code,
        'internal server error',
      );
    }
  }

  @Post('user/details')
  async userDetails(@Req() req: any, @Res() res: any) {
    if (!req.body.id) {
      return sendError(
        res,
        HttpStatusCode.BAD_REQUEST.code,
        'ID Required',
      );
    }

    try {
      const result = await User.findOne({
        where: { id: req.body.id },
        attributes: { exclude: ['password'] },
        raw: true,
        nest: true,
      });

      return sendSuccess(
        res,
        HttpStatusCode.OK.code,
        result,
        'User data get Successfully',
      );
    } catch (error) {
      console.error(error);
      return sendError(
        res,
        HttpStatusCode.INTERNAL_SERVER_ERROR.code,
        'internal server error',
      );
    }
  }

  @Post('user/update')
  async userUpdate(@Req() req: any, @Res() res: any) {
    if (!req.body.id) {
      return sendError(
        res,
        HttpStatusCode.BAD_REQUEST.code,
        'ID Required',
      );
    }

    if (!req.body.permission_id) {
      return sendError(
        res,
        HttpStatusCode.NOT_FOUND.code,
        'permission id required',
      );
    }

    try {
      const getData = await this.authService.checkRole(
        req.body.permission_id,
      );

      if (!getData) {
        return sendError(
          res,
          HttpStatusCode.NOT_FOUND.code,
          'Invalid permission id',
        );
      }

      const data: any = {
        username: req.body.username.trim().toLowerCase(),
        role_id: getData.role_id,
        permission_id: req.body.permission_id,
        email: req.body.email,
        name: req.body.name,
        phone: req.body.phone,
        isAdmin: true,
      };

      if (req.body.password) {
        data.password = bcrypt.hashSync(req.body.password, 8);
      }

      await User.update(data, { where: { id: req.body.id } });

      return sendSuccess(
        res,
        HttpStatusCode.OK.code,
        req.body.username,
        'User data updated successfully',
      );
    } catch (error) {
      console.error(error);
      return sendError(
        res,
        HttpStatusCode.INTERNAL_SERVER_ERROR.code,
        'Internal server error',
      );
    }
  }

  @Post('user/logs')
  async userLogs(@Req() req: any, @Res() res: any) {
    try {
      const data = await userlog.findAll({
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id', 'username', 'email'],
          },
        ],
        order: [['id', 'DESC']],
      });

      return sendSuccess(
        res,
        HttpStatusCode.OK.code,
        data,
        'success',
      );
    } catch (error) {
      console.error(error);
      return sendError(
        res,
        HttpStatusCode.INTERNAL_SERVER_ERROR.code,
        'Internal server error',
      );
    }
  }

}



function createSlug(input: string): string {
  return slugify(input, {
    replacement: '-',
    remove: /[$*_+~.()'"!\-:@]/g,
    lower: true,
  });
}
