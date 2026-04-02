import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RoleB2C as Role } from 'src/models/role_b2c.model';
import { UserN as User } from 'src/models/UsersN';
import { PermissionB2C as Permission } from 'src/models/permission_b2c.model';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User) private userModel: typeof User,
    private jwtService: JwtService,
  ) {}

  async adminAuth(email: string, password: string) {
    const user = await this.userModel.findOne({
      where: { email },
      include: [
        {
          model: Role,
          include: [Permission],
        },
      ],
    });

    // No user found
    if (!user) {
      return { status: 'no_user_found' };
    }

    // Account inactive — your column is `status` not `isActive`
    if (!user.status) {
      return { status: 'account_inactive' };
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    // Build "action:resource" permission strings for JWT
    const permissions = user.roleb2c.permissions.map(
      (p: Permission) => `${p.action}:${p.resource}`,
    );

    return {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.roleb2c.name, 
      permissions,
      password: user.password, 
    };
  }
}
