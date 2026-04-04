// src/permissions/permissions.controller.ts
import {
  Controller, Get, Post,
  Patch, Delete, Req, Res,
  Param, UseGuards,
} from '@nestjs/common';
import { PermissionsService }  from './permissions.service';
import { JwtAuthGuard }        from '../../common/guards/jwt-authb2c.guard';
import { PermissionsGuard }    from '../../common/guards/permissions.guard';
import { RequirePermissions }  from '../../common/decorators/require-permissions.decorator';
const { sendSuccess, sendError } = require('../../../src/util/responseHandler');
import {
  createUserLogs,
  checkUserPassCenter
} from "src/common/helpers/auth.helper";
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private permissionsService: PermissionsService) {}

  // ── Create Permission — LMC Admin only ─────────────────────────────────
  @Post()
  @RequirePermissions('create:permission')
  async createPermission(@Req() req: any, @Res() res: any) {
    try {
      if (!req.body.action) {
        return sendError(res, 400, 'action_required', 'Action is required');
      }
      if (!req.body.resource) {
        return sendError(res, 400, 'resource_required', 'Resource is required');
      }

      const permission = await this.permissionsService.createPermission({
        action:      req.body.action.toLowerCase().trim(),
        resource:    req.body.resource.toLowerCase().trim(),
        description: req.body.description,
      });

      await createUserLogs({
        user_id:            req.user.userId,
        action_type:        'create_permission',
        action_description: `Created permission: ${permission.action}:${permission.resource}`,
        user_ip:            req.userIp,
        action_time:        new Date().toISOString(),
      });

      return sendSuccess(res, 201, permission, 'Permission created successfully');
    } catch (error) {
      if (error.status === 409) {
        return sendError(res, 409, 'permission_exists', error.message);
      }
      return sendError(res, 500, 'internal_server_error', error);
    }
  }

  // ── Get All Permissions — LMC Admin + Tenant Admin ──────────────────────
  @Get()
  @RequirePermissions('read:permission')
  async getAllPermissions(@Req() req: any, @Res() res: any) {
    try {
      const permissions = await this.permissionsService.getAllPermissions({
        resource: req.query.resource,
      });
      return sendSuccess(res, 200, permissions, 'Permissions fetched successfully');
    } catch (error) {
      return sendError(res, 500, 'internal_server_error', error);
    }
  }

  // ── Get Permissions Grouped by Resource — LMC Admin + Tenant Admin ──────
  // Frontend uses this to render checkboxes per module (user, role, tenant)
  @Get('grouped')
  @RequirePermissions('read:permission')
  async getGrouped(@Req() req: any, @Res() res: any) {
    try {
      const grouped = await this.permissionsService.getPermissionsGrouped();
      return sendSuccess(res, 200, grouped, 'Permissions fetched successfully');
    } catch (error) {
      return sendError(res, 500, 'internal_server_error', error);
    }
  }

  // ── Get Permissions by Role — LMC Admin + Tenant Admin ─────────────────
  @Get('by-role/:roleId')
  @RequirePermissions('read:permission')
  async getByRole(
    @Req() req: any,
    @Res() res: any,
    @Param('roleId') roleId: string,
  ) {
    try {
      const role = await this.permissionsService.getPermissionsByRole(roleId);
      return sendSuccess(res, 200, role, 'Role permissions fetched successfully');
    } catch (error) {
      if (error.status === 404) {
        return sendError(res, 404, 'role_not_found', error.message);
      }
      return sendError(res, 500, 'internal_server_error', error);
    }
  }

  // ── Get Single Permission ───────────────────────────────────────────────
  @Get(':id')
  @RequirePermissions('read:permission')
  async getPermission(
    @Req() req: any,
    @Res() res: any,
    @Param('id') id: string,
  ) {
    try {
      const permission = await this.permissionsService.getPermissionById(id);
      return sendSuccess(res, 200, permission, 'Permission fetched successfully');
    } catch (error) {
      if (error.status === 404) {
        return sendError(res, 404, 'permission_not_found', error.message);
      }
      return sendError(res, 500, 'internal_server_error', error);
    }
  }

  // ── Update Permission — LMC Admin only ─────────────────────────────────
  @Patch(':id')
  @RequirePermissions('update:permission')
  async updatePermission(
    @Req() req: any,
    @Res() res: any,
    @Param('id') id: string,
  ) {
    try {
      const permission = await this.permissionsService.updatePermission(id, {
        action:      req.body.action?.toLowerCase().trim(),
        resource:    req.body.resource?.toLowerCase().trim(),
        description: req.body.description,
      });

      await createUserLogs({
        user_id:            req.user.userId,
        action_type:        'update_permission',
        action_description: `Updated permission: ${id}`,
        user_ip:            req.userIp,
        action_time:        new Date().toISOString(),
      });

      return sendSuccess(res, 200, permission, 'Permission updated successfully');
    } catch (error) {
      if (error.status === 404) {
        return sendError(res, 404, 'permission_not_found', error.message);
      }
      if (error.status === 409) {
        return sendError(res, 409, 'permission_exists', error.message);
      }
      return sendError(res, 500, 'internal_server_error', error);
    }
  }

  // ── Delete Permission — LMC Admin only ─────────────────────────────────
  @Delete(':id')
  @RequirePermissions('delete:permission')
  async deletePermission(
    @Req() req: any,
    @Res() res: any,
    @Param('id') id: string,
  ) {
    try {
      const result = await this.permissionsService.deletePermission(id);

      await createUserLogs({
        user_id:            req.user.userId,
        action_type:        'delete_permission',
        action_description: `Deleted permission: ${id}`,
        user_ip:            req.userIp,
        action_time:        new Date().toISOString(),
      });

      return sendSuccess(res, 200, result, 'Permission deleted successfully');
    } catch (error) {
      if (error.status === 404) {
        return sendError(res, 404, 'permission_not_found', error.message);
      }
      return sendError(res, 500, 'internal_server_error', error);
    }
  }
}