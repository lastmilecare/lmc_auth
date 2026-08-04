import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsRequired } from '../decorators/permissions.decorator';
import { UsersService } from '../../modules/UserControl/User.service';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector, private userService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get the required permissions from the handler/class decorator
    const requiredPermissions = this.reflector.get(PermissionsRequired, context.getHandler());

    // If no permissions are required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Get the request object
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    // Check if user is authenticated
    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    try {

      
      const userPermissions = await this.userService.getUserPermissions(userId);
      
      // Check if user has all required permissions
      const hasAllPermissions = requiredPermissions.every(permission => 
        userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        throw new ForbiddenException('Insufficient permissions');
      }

      return true;

    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      console.error('Error in RBAC guard:', error);
      throw new ForbiddenException('Error checking permissions');
    }
  }
}