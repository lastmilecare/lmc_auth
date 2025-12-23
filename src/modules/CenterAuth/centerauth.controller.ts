import {
  Controller,
  Post,
  Body,
  Req,
  Res,
} from '@nestjs/common';
const { sendSuccess, sendError } = require('../../../src/util/responseHandler');
import { CenterAuthService } from './centerauth.service';
import {
  createUserLogs,
  checkUserPassCenter
} from "src/common/helpers/auth.helper";
import { Permission } from 'src/models/Permissions';
import { Permissionmetadata } from 'src/models/PermissionsMetaData';
import * as jwt from 'jsonwebtoken';
import {
  JWT_ADMIN as configJwttoken,
  JWT_CENTER as configJwttokenCenter,
} from 'config/envConfig';
import { AuthService } from '../auth/auth.service';
import { Centeruser } from 'src/models/centeruser.model';

@Controller('center')
export class CenterAuthController {
  constructor(
    private readonly testAccountService: CenterAuthService,
    private readonly authService: AuthService
  ) { }


  @Post('login')
  async adminAuth(@Req() req: any, @Res() res: any) {
    try {
      if (!req.body.email) {
        sendError(res, 400, "Email ID Required", 'Email ID Required');
        return;
      }
      if (!req.body.password) {
        sendError(res, 400, "Password ID Required", 'Password ID Required');
        return;
      }

      const email = req.body.email;
      const password = req.body.password;

      const isTestAccount = await this.testAccountService.isTestAccountByEmail(email);

      if (isTestAccount) {
         const isValid = await this.testAccountService.verifyTestAccountPassword(email, password);

        if (!isValid) {
          sendError(res, 401, "invalid_password", 'Invalid password for test account');
          return;
        }
        await this.testAccountService.getTestAccountByEmail(email);

         const centerRole = await this.testAccountService.getRole("center");
        if (!centerRole) {
          sendError(res, 500, "center_role_not_found", 'Center role not found in database');
          return;
        }

        let mockPermission = null;
        try {
          const defaultPermission = await Permission.findOne({
            where: { permission_name: 'CenterAllPageAllPermission' },
            include: [
              {
                model: Permissionmetadata,
                as: 'Permissionmetadata'
              }
            ],
            raw: false,
            nest: true
          });
          if (defaultPermission) {
            mockPermission = defaultPermission.toJSON();
          }
        } catch (permissionError) {
          console.error('Error fetching default permission for test account:', permissionError);
        }

         const mockUser = {
          id: 999999, 
          email: email,
          username: `test_${email.split('@')[0]}`,
          name: 'Test Account User',
          isAdmin: false,
          status: true,
          role_id: centerRole.id,
          slug: 'center',
          role_title: centerRole.role_title || 'Center',
          password: password,
          permission: mockPermission
        };

         const token = jwt.sign(
          {
            data: {
              id: mockUser.id,
            },
          },
          configJwttoken,
          { expiresIn: '10d' }
        );

        const tokenData = {
          token,
          role: mockUser.slug,
          username: mockUser.username,
          isAdmin: mockUser.isAdmin,
          permission: mockUser.permission || null,
          isTestAccount: true
        };

        const cookie = require('cookie');
        const cookieOptions = {
          maxAge: 10 * 24 * 60 * 60 * 1000, 
          httpOnly: true,
        };
        res.setHeader('Set-Cookie', cookie.serialize('center_token', token, cookieOptions));

        sendSuccess(res, 200, tokenData, 'Login successful (Test Account)');
        return;
      }

      const result = await this.authService.centerAuth(email, password);
      if (result.status == "account_inactive") {
        sendError(res, 401, "account_inactive", 'account inactive!');
        return
      } if (result.status == "no_user_found") {
        sendError(res, 404, "no_user_found", 'No User Found!');
        return
      }
      if (result.slug != "center") {
        sendError(res, 401, "Invalid_role", 'Invalid ROle');
        return
      }

      const tokenData = await checkUserPassCenter(password, result, res);
      if (tokenData.status == "invalid_password") {
        sendError(res, 404, "no_user_found or invalid_password", 'Invalid Password');
        return;
      }
      const logData = {
        user_id: result.id,
        action_type: "center_login",
        action_description: "center_login",
        user_ip: req.userIp,
        action_time: new Date().toISOString(),
      }
      await createUserLogs(logData);
      sendSuccess(res, 200, tokenData, 'Login Successfully');
      return;
    } catch (error) {
      sendError(res, 500, "internal server error", error.message || error);
      return;
    }
  }

  // @Post('getCenterId')
  // async getCenterId(@Req() req: any, @Res() res: any) {
  //   try {
  //     const userId = req.userId;
  //     if (!userId) {
  //       return sendError(res, 400, "User ID is required.", "User ID not found in request.");
  //     }

  //     const centerUser = await Centeruser.findOne({
  //       where: { user_id: userId },
  //       attributes: ['center_id'],
  //     });

  //     if (!centerUser) {
  //       return sendError(res, 404, "Center not found for this user.", "Center user mapping not found.");
  //     }

  //     sendSuccess(res, 200, { center_id: centerUser.center_id }, "Center ID retrieved successfully.");
  //   } catch (error) {
  //     console.error("Error in getCenterId:", error);
  //     sendError(res, 500, "Internal server error.", error.message);
  //   }
  // }

}

