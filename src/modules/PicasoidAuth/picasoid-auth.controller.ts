import { Controller, Post, Body, Req, Res } from '@nestjs/common';
import slugify from 'slugify';
const { sendSuccess, sendError } = require('../../../src/util/responseHandler');
import { AuthService } from './picasoid-auth.service';
import { checkUserPass, createUserLogs,checkUserPassB2C } from 'src/common/helpers/auth.helper';

@Controller('b2c/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('login')
  async adminAuth(@Req() req: any, @Res() res: any) {
    try {
      if (!req.body.email) {
        return sendError(res, 400, 'Email ID Required', 'Email ID Required');
      }
      if (!req.body.password) {
        return sendError(res, 400, 'Password Required', 'Password Required');
      }

      const result = await this.authService.adminAuth(
        req.body.email,
        req.body.password,
      );

      if (result.status === 'no_user_found') {
        return sendError(res, 404, 'no_user_found', 'No User Found!');
      }

      if (result.status === 'account_inactive') {
        return sendError(res, 401, 'account_inactive', 'Account Inactive!');
      }

      // Role-based access — using role name instead of slug now
      const allowedRoles = ['LMC_ADMIN', 'TENANT_ADMIN'];
      if (!allowedRoles.includes(result.role)) {
        return sendError(res, 401, 'Invalid_role', 'Invalid Role');
      }

      // checkUserPass handles bcrypt compare + JWT signing
      const tokenData = await checkUserPassB2C(req.body.password, result, res);

      if (tokenData.status === 'invalid_password') {
        return sendError(res, 404, 'invalid_password', 'Invalid Password');
      }

      await createUserLogs({
        user_id: result.id,
        action_type: 'admin_login',
        action_description: 'login',
        user_ip: (req as any).userIp,
        action_time: new Date().toISOString(),
      });

      return sendSuccess(res, 200, tokenData, 'Login Successfully');
    } catch (error) {
      return sendError(res, 500, 'internal server error', error);
    }
  }
}
