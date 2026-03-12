import {
  Controller,
  Post,
  Req,
  Res,
} from '@nestjs/common';
const { sendSuccess, sendError } = require('../../../src/util/responseHandler');
import {
  createUserLogs,
  checkUserPassCet
} from "src/common/helpers/auth.helper";
import { AuthService } from '../auth/auth.service';
import { Cetuser } from 'src/models/CetUser';
import { CorporateUser } from 'src/models/corporate-user';
@Controller('cet')
export class CetAuthController {
  constructor(
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
                sendError(res, 400, "Password Required", 'Password Required');
                return;
            }
    
            const result = await this.authService.cetAuth(req.body.email, req.body.password);
            if (result) {
                if (result.status == "account_inactive") {
                    sendError(res, 401, "account_inactive", 'Account is inactive!');
                    return;
                }
                if (result.status == "no_user_found") {
                    sendError(res, 404, "no_user_found", 'No user found!');
                    return;
                }

                const allowedRoles = ['cet', 'corporate','Camp'];
                if (!allowedRoles.includes(result.slug)) {
                    return sendError(res, 401, 'Invalid_role', 'Invalid Role');
                }
    
                const tokenData = await checkUserPassCet(req.body.password, result, res);
                if (tokenData.status == "invalid_password") {
                    sendError(res, 404, "no_user_found or invalid_password", 'Invalid Password');
                    return;
                }
    
                const cetUser = await Cetuser.findOne({ where: { user_id: result.id } });
                // console.log("cetUser", result);

                const corUser = await CorporateUser.findOne({ where: { user_id: result.id } });
                // console.log("corUser", corUser);
                if ((!cetUser) && (!corUser)) {
                    sendError(res, 404, "no_cet_id_found", 'CET ID not found for this user.');
                    return;
                }
                
                const logData = {
                    user_id: result.id,
                    action_type: "cet_login",
                    action_description: null,
                    user_ip: req.userIp,
                    action_time: new Date().toISOString(),
                };
                await createUserLogs(logData);
                sendSuccess(res, 200, tokenData, 'Login Successfully');
                return;
            } else {
                console.log("No user result found");
            }
        } catch (error) {
            sendError(res, 500, "internal_server_error", error);
            return;
        }
  }

}

