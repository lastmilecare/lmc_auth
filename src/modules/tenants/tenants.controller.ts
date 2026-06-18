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
  Put,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../../common/guards/jwt-authb2c.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { sendSuccess, sendError } from '../../../src/util/responseHandler';
import { createUserLogs } from '../../common/helpers/auth.helper';
import { get } from 'http';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('b2c/tenants')
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Post()
  @RequirePermissions('create:tenant')
  async createTenant(@Req() req: any, @Res() res: any) {
    try {
      if (!req.body.name.trim()) {
        return sendError(res, 400, 'name_required');
      }
      if (!req.body.tenant_type.trim()) {
        return sendError(res, 400, 'tenant_type_required');
      }

      const result = await this.tenantsService.createTenant({
        name: req.body.name.trim(),
        tenant_type: req.body.tenant_type.trim(),
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
  @RequirePermissions('read:center')
  async findAll(@Res() res: any, @Query() query: any) {
    try {
      const tenants = await this.tenantsService.findAll(query);
      return sendSuccess(res, 200, tenants, 'Tenants fetched successfully');
    } catch (error: any) {
      return sendError(res, 500, 'internal_server_error');
    }
  }

  @Get('all')
  @RequirePermissions('read:center')
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
  @Get('/centers')
  @RequirePermissions('read:center')
  async getCenters(@Req() req: any, @Res() res: any, @Query() query: any) {
    try {
      const result = await this.tenantsService.getCenters(req?.user, query);

      return sendSuccess(res, 200, result, 'Centers fetched successfully');
    } catch (error) {
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

  @Post('/centers')
  @RequirePermissions('create:center')
  async createCenter(@Req() req: any, @Res() res: any) {
    try {
      const body = req.body;

      if (!body.project_name?.trim()) {
        return sendError(res, 400, 'project_name_required');
      }

      if (!body.short_code?.trim()) {
        return sendError(res, 400, 'center_id_required');
      }

      if (body.short_code.trim().length > 3) {
        return sendError(res, 400, 'center_id_max_3_characters');
      }

      if (!body.tenant_id) {
        return sendError(res, 400, 'tenant_required');
      }

      const result = await this.tenantsService.createCenter({
        ...body,
        createdBy: req.user.userId,
      });

      await createUserLogs({
        user_id: req.user.userId,
        action_type: 'create_center',
        action_description: `Created center: ${result.project_name}`,
        user_ip: req.userIp,
        action_time: new Date().toISOString(),
      });

      return sendSuccess(res, 201, result, 'Center created successfully');
    } catch (error: any) {
      if (error.status === 409) {
        return sendError(res, 409, 'center_exists');
      }

      return sendError(res, 500, 'internal_server_error');
    }
  }

  @Get('/centers/detail/:id')
  @RequirePermissions('read:center')
  async getCenterById(@Param('id') id: number, @Res() res: any) {
    try {
      const result = await this.tenantsService.getCenterById(id);

      if (!result) {
        return sendError(res, 404, 'center_not_found');
      }

      return sendSuccess(res, 200, result, 'Center fetched successfully');
    } catch (error) {
      return sendError(res, 500, 'internal_server_error');
    }
  }

  @Put('/centers/update/:id')
  @RequirePermissions('update:center')
  async updateCenter(
    @Param('id') id: number,
    @Req() req: any,
    @Res() res: any,
  ) {
    try {
      const result = await this.tenantsService.updateCenter(id, req.body);

      await createUserLogs({
        user_id: req.user.userId,
        action_type: 'update_center',
        action_description: `Updated center ID: ${id}`,
        user_ip: req.userIp,
        action_time: new Date().toISOString(),
      });

      return sendSuccess(res, 200, result, 'Center updated successfully');
    } catch (error) {
      return sendError(res, 500, 'internal_server_error');
    }
  }

  @Delete('/centers/delete/:id')
  @RequirePermissions('delete:center')
  async deleteCenter(
    @Param('id') id: number,
    @Req() req: any,
    @Res() res: any,
  ) {
    try {
      await this.tenantsService.deleteCenter(id);

      await createUserLogs({
        user_id: req.user.userId,
        action_type: 'delete_center',
        action_description: `Deleted center ID: ${id}`,
        user_ip: req.userIp,
        action_time: new Date().toISOString(),
      });

      return sendSuccess(res, 200, {}, 'Center deleted successfully');
    } catch (error) {
      return sendError(res, 500, 'internal_server_error');
    }
  }
  @Get('/centers/combo')
  @RequirePermissions('read:center')
  async centerComboList(@Req() req: any, @Res() res: any) {
    try {
      const tenantId = req.user.tenantId;
      const centers = await this.tenantsService.centerComboList(
        req.user,
        tenantId,
      );
      return sendSuccess(
        res,
        200,
        centers,
        'Center combo list fetched successfully',
      );
    } catch (error) {
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
}
