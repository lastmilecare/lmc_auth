import { Controller, Post,Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './User.service';
import { PermissionsRequired } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { UserN as User } from '../../models/UsersN';
import type { Request as ExpressRequest } from 'express';
import { VerifyTokenGuard } from '../../common/middlewares/verify-token.guard';

@Controller('user')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('create')
  // @Permissions('manage_users')
  create(
    @Body()
    body: {
      username: string;
      email: string;
      phone?: string;
      password: string;
      roles?: number[];
    },
  ) {
    return this.usersService.create(body);
  }

  @Post('list')
  @PermissionsRequired(['manage_users'])
  findAll() {
    return this.usersService.findAll();
  }



  @Post('details/:id')
  // @Permissions('manage_users')
  findDetails(@Param('id') id: string) {
    return this.usersService.findByIdDetails(+id);
  }

  @Post('update/:id')
  // @Permissions('manage_users')
  update(@Param('id') id: string, @Body() body: Partial<{ username: string; email: string; phone: string }>) {
    return this.usersService.update(+id, body);
  }

  

  @UseGuards(VerifyTokenGuard, RbacGuard)
  @Get('viewRoles')
  // @PermissionsRequired(['manage_users'])
  viewUserRoles(@Request() req: ExpressRequest) {
    return this.usersService.viewUserRoles(req.user.id);
  }

  @UseGuards(VerifyTokenGuard, RbacGuard)
  @Get('viewPermissions')
  // @PermissionsRequired(['manage_users'])
  viewUserPermissions(@Request() req: ExpressRequest) {
    return this.usersService.getUserPermissions(req.user.id);
  }

  @UseGuards(VerifyTokenGuard, RbacGuard)
  @Post('roles/add')
  // @PermissionsRequired(['manage_users'])
  addUserRoles(@Request() req: ExpressRequest, @Body() body: { roles: number[] }) {
    return this.usersService.addUserRoles(req.user.id, body.roles);
  }

  @UseGuards(VerifyTokenGuard, RbacGuard)
  @Post('roles/remove')
  // @PermissionsRequired(['manage_users'])
  removeUserRoles(@Request() req: ExpressRequest, @Body() body: { roles: number[] }) {
    return this.usersService.removeUserRoles(req.user.id, body.roles);
  }

  @UseGuards(VerifyTokenGuard, RbacGuard)
  @Get('viewRolesAndPermissions')
  // @PermissionsRequired(['manage_users'])
  viewUserRolesAndPermissions(@Request() req: ExpressRequest) {
    return this.usersService.getUserRolesWithPermissions(req.user.id);
  }

}