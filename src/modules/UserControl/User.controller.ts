import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Req,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  Res,
} from '@nestjs/common';
import { UsersService } from './User.service';
import { JwtAuthGuard } from '../../common/guards/jwt-authb2c.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { sendSuccess, sendError } from '../../../src/util/responseHandler';
import {
  createUserLogs,
  checkUserPassCenter,
} from 'src/common/helpers/auth.helper';
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('b2c/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ── Create User ────────────────────────────────────────────────────────
  @Post()
  @RequirePermissions('create:user')
  async createUser(
    @Res() res: any,
    @Req() req: any,
    @Body()
    body: {
      email: string;
      password: string;
      roleId: string;
      tenantId?: string;
    },
    
  ) {
    const result = await this.usersService.createUser(req.user, body);
    return sendSuccess(res, 201, result, 'User created successfully');
  }

  // ── Get Users ──────────────────────────────────────────────────────────
  @Get()
  @RequirePermissions('read:user')
  async getUsers(
    @Res() res: any,
    @Req() req: any,
    @Query() query: { tenantId?: string },
  ) {
    const users = await this.usersService.getUsers(req.user, query);

    return sendSuccess(res, 200, users, 'Users fetched successfully');
  }

  // ── Update User ────────────────────────────────────────────────────────
  @Patch(':id')
  @RequirePermissions('update:user')
  async updateUser(
    @Res() res: any,
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { roleId?: string; status?: boolean },
  ) {
    const result = await this.usersService.updateUser(req.user, id, body);

    return sendSuccess(res, 200, result, 'Users updated successfully');
  }

  // ── Delete User ────────────────────────────────────────────────────────
  @Delete(':id')
  @RequirePermissions('delete:user')
  async deleteUser(@Res() res: any, @Req() req: any, @Param('id') id: string) {
    const result = await this.usersService.deleteUser(req.user, id);

    return sendSuccess(res, 200, result, 'User deleted successfully');
  }
}
