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
  Query,
  ParseIntPipe,
  Body,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../../common/guards/jwt-authb2c.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { sendSuccess, sendError } from '../../../src/util/responseHandler';
import { createUserLogs } from '../../common/helpers/auth.helper';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('b2c/tenants')
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

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
    } catch (error: any) {
      if (error.status === 409) {
        return sendError(res, 409, 'tenant_exists');
      }
      return sendError(res, 500, 'internal_server_error');
    }
  }

  @Get()
  @RequirePermissions('read:tenant')
  async findAll(@Res() res: any, @Query() query: any) {
    try {
      const tenants = await this.tenantsService.findAll(query);
      return sendSuccess(res, 200, tenants, 'Tenants fetched successfully');
    } catch (error: any) {
      return sendError(res, 500, 'internal_server_error');
    }
  }

  @Get('all')
  @RequirePermissions('read:tenant')
  async getAllTenant(@Req() req: any, @Res() res: any) {
    try {
      const tenant = await this.tenantsService.getAllTenant();
      return sendSuccess(res, 200, tenant, 'Tenant fetched successfully');
    } catch (error: any) {
      if (error.status === 404) {
        return sendError(res, 404, 'tenant_not_found');
      }
      return sendError(res, 500, 'internal_server_error');
    }
  }

  @Get(':id')
  @RequirePermissions('read:tenant')
  async findOne(
    @Req() req: any,
    @Res() res: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    try {
      const tenant = await this.tenantsService.findOne(id);
      return sendSuccess(res, 200, tenant, 'Tenant fetched successfully');
    } catch (error: any) {
      if (error.status === 404) {
        return sendError(res, 404, 'tenant_not_found');
      }
      return sendError(res, 500, 'internal_server_error');
    }
  }

  @Patch(':id')
  @RequirePermissions('update:tenant')
  async updateTenant(
    @Req() req: any,
    @Res() res: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { name?: string; status?: boolean },
  ) {
    try {
      const tenant = await this.tenantsService.updateTenant(id, {
        name: body.name?.trim(),
        status: body.status,
      });

      await createUserLogs({
        user_id: req.user.userId,
        action_type: 'update_tenant',
        action_description: `Updated tenant: ${id}`,
        user_ip: req.userIp,
        action_time: new Date().toISOString(),
      });

      return sendSuccess(res, 200, tenant, 'Tenant updated successfully');
    } catch (error: any) {
      if (error.status === 404) {
        return sendError(res, 404, 'tenant_not_found');
      }
      if (error.status === 409) {
        return sendError(res, 409, 'tenant_exists');
      }
      return sendError(res, 500, 'internal_server_error');
    }
  }

  @Patch(':id/toggle-status')
  @RequirePermissions('update:tenant')
  async toggleStatus(
    @Req() req: any,
    @Res() res: any,
    @Param('id', ParseIntPipe) id: number,
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
    } catch (error: any) {
      if (error.status === 404) {
        return sendError(res, 404, 'tenant_not_found');
      }
      return sendError(res, 500, 'internal_server_error');
    }
  }

  @Delete(':id')
  @RequirePermissions('delete:tenant')
  async deleteTenant(
    @Req() req: any,
    @Res() res: any,
    @Param('id', ParseIntPipe) id: number,
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
    } catch (error: any) {
      if (error.status === 404) {
        return sendError(res, 404, 'tenant_not_found');
      }
      return sendError(res, 500, 'internal_server_error');
    }
  }
}
