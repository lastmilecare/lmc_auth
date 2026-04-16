// src/users/User.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Req,
  Res,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './User.service';
import { JwtAuthGuard } from '../../common/guards/jwt-authb2c.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { sendSuccess, sendError } from '../../../src/util/responseHandler';
import { createUserLogs } from 'src/common/helpers/auth.helper';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('b2c/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ── Create User ─────────────────────────────────────────────────────────
  @Post()
  @RequirePermissions('create:staff_form')
  async createUser(@Res() res: any, @Req() req: any, @Body() body: any) {
    try {
      if (!body.email) {
        return sendError(res, 400, 'Email is required');
      }
      if (!body.password) {
        return sendError(res, 400, 'Password is required');
      }
      if (!body.b2cRoleId) {
        return sendError(res, 400, 'Role is required');
      }
      if (!req.user.tenantId && !body.tenantId) {
        return sendError(res, 400, 'Tenant ID is required');
      }

      const result = await this.usersService.createUser(req.user, body);

      await createUserLogs({
        user_id: req.user.userId,
        action_type: 'create_user',
        action_description: `Created user: ${body.email}`,
        user_ip: req.userIp,
        action_time: new Date().toISOString(),
      });

      return sendSuccess(res, 201, result, 'User created successfully');
    } catch (error: any) {
      if (error.status === 409) {
        return sendError(res, 409, 'Email already in use');
      }
      if (error.status === 404) {
        return sendError(res, 404, error.message);
      }
      if (error.status === 403) {
        return sendError(res, 403, 'forbidden');
      }
      return sendError(res, 500, 'internal_server_error');
    }
  }

  // ── Get Users ───────────────────────────────────────────────────────────
  @Get()
  @RequirePermissions('read:staff_list')
  async getUsers(@Res() res: any, @Req() req: any, @Query() query: any) {
    try {
      const result = await this.usersService.getUsers(req.user, {
        page: query.page,
        limit: query.limit,
        tenantId: query.tenantId,
        name: query.name,
        email: query.email,
        phone: query.phone,
        status: query.status,
        startDate: query.startDate,
        endDate: query.endDate,
      });
      return sendSuccess(res, 200, result, 'Users fetched successfully');
    } catch (error: any) {
      return sendError(res, 500, 'internal_server_error');
    }
  }

  // ── Update User ─────────────────────────────────────────────────────────
  @Patch(':id')
  @RequirePermissions('update:staff_list')
  async updateUser(
    @Res() res: any,
    @Req() req: any,
    @Param('id') id: string,
    @Body()
    body: {
      b2cRoleId?: number; // ← fixed from roleId
      status?: boolean;
      name?: string;
      username?: string;
      phone?: string;
      attributes?: Record<string, any>;
    },
  ) {
    try {
      const result = await this.usersService.updateUser(req.user, id, body);

      await createUserLogs({
        user_id: req.user.userId,
        action_type: 'update_user',
        action_description: `Updated user: ${id}`,
        user_ip: req.userIp,
        action_time: new Date().toISOString(),
      });

      return sendSuccess(res, 200, result, 'User updated successfully');
    } catch (error: any) {
      if (error.status === 404) {
        return sendError(res, 404, 'user_not_found');
      }
      if (error.status === 403) {
        return sendError(res, 403, 'forbidden');
      }
      return sendError(res, 500, 'internal_server_error');
    }
  }

  // ── Toggle Status ───────────────────────────────────────────────────────
  @Patch(':id/toggle-status')
  @RequirePermissions('update:staff_list')
  async toggleStatus(
    @Res() res: any,
    @Req() req: any,
    @Param('id') id: string,
  ) {
    try {
      const result = await this.usersService.toggleStatus(req.user, id);

      await createUserLogs({
        user_id: req.user.userId,
        action_type: 'toggle_user_status',
        action_description: `Toggled status for user: ${id}`,
        user_ip: req.userIp,
        action_time: new Date().toISOString(),
      });

      return sendSuccess(res, 200, result, result.message);
    } catch (error: any) {
      if (error.status === 404) {
        return sendError(res, 404, 'user_not_found');
      }
      if (error.status === 403) {
        return sendError(res, 403, 'forbidden');
      }
      return sendError(res, 500, 'internal_server_error');
    }
  }

  // ── Delete User ─────────────────────────────────────────────────────────
  @Delete(':id')
  @RequirePermissions('delete:staff_list')
  async deleteUser(@Res() res: any, @Req() req: any, @Param('id') id: string) {
    try {
      const result = await this.usersService.deleteUser(req.user, id);

      await createUserLogs({
        user_id: req.user.userId,
        action_type: 'delete_user',
        action_description: `Deleted user: ${id}`,
        user_ip: req.userIp,
        action_time: new Date().toISOString(),
      });

      return sendSuccess(res, 200, result, 'User deleted successfully');
    } catch (error: any) {
      if (error.status === 404) {
        return sendError(res, 404, 'user_not_found');
      }
      if (error.status === 403) {
        return sendError(res, 403, 'forbidden');
      }
      return sendError(res, 500, 'internal_server_error');
    }
  }
}
