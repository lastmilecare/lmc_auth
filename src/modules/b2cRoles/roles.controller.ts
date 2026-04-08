// src/roles/roles.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Req,
  Res,
  Param,
  UseGuards,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../../common/guards/jwt-authb2c.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { sendSuccess, sendError } from '../../../src/util/responseHandler';
import { createUserLogs } from 'src/common/helpers/auth.helper';
import { error } from 'console';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('b2c/roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  // ── Create Role ─────────────────────────────────────────────────────────
  @Post()
  @RequirePermissions('create:role')
  async createRole(@Req() req: any, @Res() res: any) {
    try {
      if (!req.body.name) {
        return sendError(res, 400, 'Role name is required');
      }
      if (!req.body.tenantId) {
        return sendError(res, 400, 'Tenant is required');
      }

      const role = await this.rolesService.createRole({
        name: req.body.name,
        tenantId: req.body.tenantId,
        description: req.body.description,
      });

      await createUserLogs({
        user_id: req.user.userId,
        action_type: 'create_role',
        action_description: `Created role: ${role.name}`,
        user_ip: req.userIp,
        action_time: new Date().toISOString(),
      });

      return sendSuccess(res, 201, role, 'Role created successfully');
    } catch (error: any) {
      if (error.status === 409) {
        return sendError(res, 409, error.message);
      }
      if (error.status === 404) {
        return sendError(res, 404, 'not_found');
      }
      return sendError(res, 500, 'internal_server_error');
    }
  }

  // ── Get All Roles ───────────────────────────────────────────────────────
  @Get()
  @RequirePermissions('read:role')
  async findAll(@Req() req: any, @Res() res: any) {
    try {
      const result = await this.rolesService.findAll({
        page: req.query.page,
        limit: req.query.limit,
        name: req.query.name,
        tenantId: req.query.tenantId,
        status: req.query.status,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      });
      return sendSuccess(res, 200, result, 'Roles fetched successfully');
    } catch (error) {
      return sendError(res, 500, 'internal_server_error');
    }
  }

  // ── Get Single Role ─────────────────────────────────────────────────────
  @Get(':id')
  @RequirePermissions('read:role')
  async findOne(@Req() req: any, @Res() res: any, @Param('id') id: string) {
    try {
      const role = await this.rolesService.findOne(id);
      return sendSuccess(res, 200, role, 'Role fetched successfully');
    } catch (error: any) {
      if (error.status === 404) {
        return sendError(res, 404, 'role_not_found');
      }
      return sendError(res, 500, 'internal_server_error');
    }
  }

  // ── Update Role ─────────────────────────────────────────────────────────
  @Patch(':id')
  @RequirePermissions('update:role')
  async updateRole(@Req() req: any, @Res() res: any, @Param('id') id: string) {
    try {
      const role = await this.rolesService.updateRole(id, {
        name: req.body.name,
        description: req.body.description,
        status: req.body.status,
      });

      await createUserLogs({
        user_id: req.user.userId,
        action_type: 'update_role',
        action_description: `Updated role: ${id}`,
        user_ip: req.userIp,
        action_time: new Date().toISOString(),
      });

      return sendSuccess(res, 200, role, 'Role updated successfully');
    } catch (error: any) {
      if (error.status === 404) {
        return sendError(res, 404, 'role_not_found');
      }
      if (error.status === 409) {
        return sendError(res, 409, 'role_exists');
      }
      return sendError(res, 500, 'internal_server_error');
    }
  }

  // ── Toggle Role Status ──────────────────────────────────────────────────
  @Patch(':id/toggle-status')
  @RequirePermissions('update:role')
  async toggleStatus(
    @Req() req: any,
    @Res() res: any,
    @Param('id') id: string,
  ) {
    try {
      const result = await this.rolesService.toggleStatus(id);

      await createUserLogs({
        user_id: req.user.userId,
        action_type: 'toggle_role_status',
        action_description: `Toggled status for role: ${id}`,
        user_ip: req.userIp,
        action_time: new Date().toISOString(),
      });

      return sendSuccess(res, 200, result, result.message);
    } catch (error: any) {
      if (error.status === 404) {
        return sendError(res, 404, 'role_not_found');
      }
      return sendError(res, 500, 'internal_server_error');
    }
  }

  // ── Assign Permissions to Role (bulk) ───────────────────────────────────
  @Post(':id/permissions')
  @RequirePermissions('assign:permission')
  async assignPermissions(
    @Req() req: any,
    @Res() res: any,
    @Param('id') id: string,
  ) {
    try {
      if (!req.body.permissionIds?.length) {
        return sendError(res, 400, 'permissions_required');
      }

      const result = await this.rolesService.assignPermissions(
        id,
        req.body.permissionIds,
      );

      await createUserLogs({
        user_id: req.user.userId,
        action_type: 'assign_permissions',
        action_description: `Assigned ${req.body.permissionIds.length} permissions to role: ${id}`,
        user_ip: req.userIp,
        action_time: new Date().toISOString(),
      });

      return sendSuccess(res, 200, result, 'Permissions assigned successfully');
    } catch (error: any) {
      if (error.status === 404) {
        return sendError(res, 404, 'not_found');
      }
      return sendError(res, 500, error);
    }
  }

  // ── Sync Permissions (replace all) ─────────────────────────────────────
  @Patch(':id/permissions/sync')
  @RequirePermissions('assign:permission')
  async syncPermissions(
    @Req() req: any,
    @Res() res: any,
    @Param('id') id: string,
  ) {
    try {
      const result = await this.rolesService.syncPermissions(
        id,
        req.body.permissionIds ?? [],
      );

      await createUserLogs({
        user_id: req.user.userId,
        action_type: 'sync_permissions',
        action_description: `Synced permissions for role: ${id}`,
        user_ip: req.userIp,
        action_time: new Date().toISOString(),
      });

      return sendSuccess(res, 200, result, 'Permissions synced successfully');
    } catch (error: any) {
      if (error.status === 404) {
        return sendError(res, 404, 'role_not_found');
      }
      return sendError(res, 500, error);
    }
  }

  // ── Remove Single Permission from Role ──────────────────────────────────
  @Delete(':id/permissions/:permissionId')
  @RequirePermissions('assign:permission')
  async removePermission(
    @Req() req: any,
    @Res() res: any,
    @Param('id') id: string,
    @Param('permissionId') permissionId: string,
  ) {
    try {
      const result = await this.rolesService.removePermission(id, permissionId);

      await createUserLogs({
        user_id: req.user.userId,
        action_type: 'remove_permission',
        action_description: `Removed permission ${permissionId} from role: ${id}`,
        user_ip: req.userIp,
        action_time: new Date().toISOString(),
      });

      return sendSuccess(res, 200, result, 'Permission removed successfully');
    } catch (error: any) {
      if (error.status === 404) {
        return sendError(res, 404, 'not_found');
      }
      return sendError(res, 500, 'internal_server_error');
    }
  }

  // ── Delete Role ─────────────────────────────────────────────────────────
  @Delete(':id')
  @RequirePermissions('delete:role')
  async deleteRole(@Req() req: any, @Res() res: any, @Param('id') id: string) {
    try {
      const result = await this.rolesService.deleteRole(id);

      await createUserLogs({
        user_id: req.user.userId,
        action_type: 'delete_role',
        action_description: `Deleted role: ${id}`,
        user_ip: req.userIp,
        action_time: new Date().toISOString(),
      });

      return sendSuccess(res, 200, result, 'Role deleted successfully');
    } catch (error: any) {
      if (error.status === 404) {
        return sendError(res, 404, 'role_not_found');
      }
      return sendError(res, 500, 'internal_server_error');
    }
  }
}
