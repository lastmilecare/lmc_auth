import { Controller, Post, Body, Param, UseGuards, Get, UseInterceptors } from '@nestjs/common';
import { RolesService } from './Role.service';
import { PermissionsRequired } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { VerifyTokenGuard } from '../../common/middlewares/verify-token.guard';

@Controller('role')
@UseGuards(VerifyTokenGuard, RbacGuard)
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Post('create')
  @PermissionsRequired(['create_role'])
  create(@Body() body: { role_title: string; slug?: string }) {
    return this.rolesService.create(body);
  }

  @Get('view')
//   @Permissions('view_roles')
  findAll() {
    return this.rolesService.findAll();
  }

  @Post('details/:id')
//   @Permissions('view_roles')
  findById(@Param('id') id: string) {
    return this.rolesService.findById(+id);
  }

  @Post('update/:id')
//   @Permissions('update_role')
  update(@Param('id') id: string, @Body() body: Partial<{ role_title: string; slug: string }>) {
    return this.rolesService.update(+id, body);
  }

  @Post('permission/add/:roleId')
//   @Permissions('add_permission')
  addPermission(@Param('roleId') roleId: string, @Body() body: { permission_name: string }) {
    return this.rolesService.addPermission(+roleId, body.permission_name);
  }

  @Post('permission/remove/:roleId')
//   @Permissions('remove_permission')
  removePermission(@Param('roleId') roleId: string, @Body() body: { permission_name: string }) {
    return this.rolesService.removePermission(+roleId, body.permission_name);
  }
}