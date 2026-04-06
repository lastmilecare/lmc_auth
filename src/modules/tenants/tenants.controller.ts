// src/tenants/tenants.controller.ts
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
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../../common/guards/jwt-authb2c.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { sendError, sendSuccess } from '../../../src/util/responseHandler';
import { createUserLogs } from 'src/common/helpers/auth.helper';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('b2c/tenants')
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  // ── Create Tenant ───────────────────────────────────────────────────────
  @Post()
  @RequirePermissions('create:tenant')
  async createTenant(@Req() req: any, @Res() res: any) {
    try {
      if (!req.body.name) {
        return sendError(res, 400, 'name_required');
      }

      const result = await this.tenantsService.createTenant({
        name: req.body.name.trim(),
      });

      await createUserLogs({
        user_id: req.user.userId,
        action_type: 'create_tenant',
        action_description: `Created tenant: ${result.tenant.name}`,
        user_ip: req.userIp,
        action_time: new Date().toISOString(),
      });

      return sendSuccess(res, 201, result, 'Tenant created successfully');
    } catch (error) {
      if (error.status === 409) {
        return sendError(res, 409, 'tenant_exists');
      }
      return sendError(res, 500, 'internal_server_error');
    }
  }

  // ── Get All Tenants ─────────────────────────────────────────────────────
  @Get()
  @RequirePermissions('read:tenant')
  async findAll(@Req() req: any) {
    const result = await this.tenantsService.findAll({
      page: req.query.page,
      limit: req.query.limit,
      name: req.query.name,
      status:
        req.query.status !== undefined
          ? req.query.status === 'true'
          : undefined,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    });

    return {
      statusCode: 200,
      message: 'Tenants fetched successfully',
      data: result,
    };
  }

  // ── Get Single Tenant ───────────────────────────────────────────────────
  @Get(':id')
  @RequirePermissions('read:tenant')
  async findOne(@Req() req: any, @Res() res: any, @Param('id') id: string) {
    try {
      const tenant = await this.tenantsService.findOne(id);
      return sendSuccess(res, 200, tenant, 'Tenant fetched successfully');
    } catch (error) {
      if (error.status === 404) {
        return sendError(res, 404, 'tenant_not_found');
      }
      return sendError(res, 500, 'internal_server_error');
    }
  }

  // ── Update Tenant ───────────────────────────────────────────────────────
  @Patch(':id')
  @RequirePermissions('update:tenant')
  async updateTenant(
    @Req() req: any,
    @Res() res: any,
    @Param('id') id: string,
  ) {
    try {
      const tenant = await this.tenantsService.updateTenant(id, {
        name: req.body.name?.trim(),
        status: req.body.status,
      });

      await createUserLogs({
        user_id: req.user.userId,
        action_type: 'update_tenant',
        action_description: `Updated tenant: ${id}`,
        user_ip: req.userIp,
        action_time: new Date().toISOString(),
      });

      return sendSuccess(res, 200, tenant, 'Tenant updated successfully');
    } catch (error) {
      if (error.status === 404) {
        return sendError(res, 404, 'tenant_not_found');
      }
      if (error.status === 409) {
        return sendError(res, 409, 'tenant_exists');
      }
      return sendError(res, 500, 'internal_server_error');
    }
  }

  // ── Toggle Tenant Status ────────────────────────────────────────────────
  @Patch(':id/toggle-status')
  @RequirePermissions('update:tenant')
  async toggleStatus(
    @Req() req: any,
    @Res() res: any,
    @Param('id') id: string,
  ) {
    try {
      const result = await this.tenantsService.toggleStatus(id);

      await createUserLogs({
        user_id: req.user.userId,
        action_type: 'toggle_tenant_status',
        action_description: `Toggled status for tenant: ${id}`,
        user_ip: req.userIp,
        action_time: new Date().toISOString(),
      });

      return sendSuccess(res, 200, result, result.message);
    } catch (error) {
      if (error.status === 404) {
        return sendError(res, 404, 'tenant_not_found');
      }
      return sendError(res, 500, 'internal_server_error');
    }
  }

  // ── Delete Tenant ───────────────────────────────────────────────────────
  @Delete(':id')
  @RequirePermissions('delete:tenant')
  async deleteTenant(
    @Req() req: any,
    @Res() res: any,
    @Param('id') id: string,
  ) {
    try {
      const result = await this.tenantsService.deleteTenant(id);

      await createUserLogs({
        user_id: req.user.userId,
        action_type: 'delete_tenant',
        action_description: `Deleted tenant: ${id}`,
        user_ip: req.userIp,
        action_time: new Date().toISOString(),
      });

      return sendSuccess(res, 200, result, 'Tenant deleted successfully');
    } catch (error) {
      if (error.status === 404) {
        return sendError(res, 404, 'tenant_not_found');
      }
      return sendError(res, 500, 'internal_server_error');
    }
  }
}
