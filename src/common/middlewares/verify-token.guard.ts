import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { UserN as User } from '../../models/UsersN'; 
import { Logger } from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';

interface RequestWithUser extends Request {
  user: {
    id: number;
    username: string;
  };
}

@Injectable()
export class VerifyTokenGuard implements CanActivate {
  private readonly logger = new Logger(VerifyTokenGuard.name);

  constructor(
    private jwtService: JwtService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      this.logger.warn('No Authorization header provided');
      throw new UnauthorizedException('Authorization header is required');
    }

    const parts = authHeader.split(' '); // Split by space
    if (parts.length < 2 || parts[0].toLowerCase() !== 'bearer') {
      this.logger.warn('Invalid Authorization header format. Expected "Bearer <token>".');
      throw new UnauthorizedException('Authorization header must be "Bearer <token>"');
    }

    const token = parts[1].trim(); // Extract token and trim any extra spaces
    if (!token) {
      throw new UnauthorizedException('Token is required');
    }

    try {
      const decoded = await this.jwtService.verifyAsync(token) as { 
        userId: number; 
        username: string; 
      };

      // Fetch user with roles (your original query logic)
      const getUser = await User.findOne({
        where: { id: decoded.userId },
        raw: true,
        nest: true,
      });

      if (!getUser) {
        this.logger.warn(`User not found: ID ${decoded.userId}`);
        throw new UnauthorizedException('User not found or not authorized');
      }

      // Attach to req for downstream use (e.g., RBAC guard)
      req.user = {
        id: decoded.userId,
        username: decoded.username,
      };

      this.logger.debug(`User authenticated: ID ${decoded.userId}`);
      return true;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        this.logger.warn('Invalid JWT token');
        throw new UnauthorizedException('Invalid token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        this.logger.warn('Token expired');
        throw new UnauthorizedException('Token expired');
      }
      this.logger.error(`Token verification error: ${error.message}`);
      throw new HttpException('Authentication failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}