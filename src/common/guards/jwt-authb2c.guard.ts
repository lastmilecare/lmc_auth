// src/common/guards/jwt-auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { getPermissionsMap } from 'src/const/permissions.map';
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Token not provided');
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_CENTER) as any;

      // Attach decoded payload to req.user — same shape across all controllers
      request.user = {
        userId:      decoded.data.id,
        email:       decoded.data.email,
        tenantId:    decoded.data.tenantId,    // null = LMC Admin
        role:        decoded.data.role,
          permissions: (decoded.data.p || [])
    .map((id: number) => getPermissionsMap()[id])
    .filter(Boolean),  // ['create:user', 'read:role', ...]
      };

      return true;
    } catch (error:any) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      }
      throw new UnauthorizedException('Token verification failed');
    }
  }
}