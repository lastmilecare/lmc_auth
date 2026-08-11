// src/users/User.service.ts
import {
  Injectable,
  ForbiddenException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { UserN as User } from '../../models/UsersN';
import { RoleB2C } from '../../models/role_b2c.model';
import * as bcrypt from 'bcrypt';
import { Center } from 'src/models/center.model';
import { buildScopeWhere } from 'src/common/helpers/auth.helper';
import { Sequelize } from 'sequelize-typescript';
@Injectable()
export class UsersService {
  constructor(
    private readonly sequelize: Sequelize,
    @InjectModel(User) private userModel: typeof User,
    @InjectModel(RoleB2C) private roleB2CModel: typeof RoleB2C,
    @InjectModel(Center) private centerModel: typeof Center,
  ) {}

  // ── Create User ─────────────────────────────────────────────────────────
  async createUser(
    requestingUser: any,
    dto: {
      email: string;
      password: string;
      b2cRoleId: number; // ← b2c_role_id
      tenantId?: number; // ← tenant_id
      name?: string;
      username?: string;
      phone?: string;
      attributes?: Record<string, any>; // jsonb
      employeeNo?: string;
      center_id?: number;
      isAdmin?: boolean;
      registration_number?: string;
      qualification?: string;
    },
  ) {
    const targetTenantId = requestingUser.tenantId ?? dto.tenantId;
    if (!targetTenantId) {
      throw new ForbiddenException('tenantId is required');
    }

    // Verify role exists
    const role = await this.roleB2CModel.findByPk(dto.b2cRoleId);
    if (!role) throw new NotFoundException('Role not found');

    // Check email uniqueness
    const exists = await this.userModel.findOne({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Email already in use');

    const hashed = await bcrypt.hash(dto.password, 10);
    const isDoctor = role.name?.trim().toUpperCase() === 'DOCTOR';
    const user = await this.userModel.create({
      name: dto.name,
      username: dto.username,
      email: dto.email,
      phone: dto.phone,
      password: hashed,
      tenantId: targetTenantId,
      b2c_role_id: Number(dto.b2cRoleId),
      attributes: dto.attributes ?? {},
      status: true,
      employee_no: dto.employeeNo,
      centerId: Number(dto?.center_id) || 0,
      isAdmin: dto.isAdmin ?? false,
      role_id: isDoctor ? 4 : null,
    } as any);
    if (isDoctor) {
      await this.sequelize.query(
        `
  INSERT INTO "Doctors"
  (
    user_id,
    external_id,
    registration_number,
    qualification,
    signature,
    "createdAt",
    "updatedAt",
    contact_number
  )
  VALUES
  (
    :userId,
    :externalId,
    :registrationNumber,
    :qualification,
    :signature,
    :createdAt,
    :createdAt,
    :contact_number
  )
  `,
        {
          replacements: {
            userId: user.id,
            externalId: `DR00${user.id}`,
            registrationNumber: dto.registration_number,
            qualification: dto.qualification,
            signature: 'N/A',
            createdAt: new Date(),
            contact_number: dto.phone,
          },
        },
      );
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      username: user.username,
      tenantId: user.tenantId,
      b2cRoleId: user.b2cRoleId,
      status: user.status,
      employeeNo: user.employee_no,
    };
  }

  // ── Get Users (paginated + filtered) ────────────────────────────────────
  async getUsers(
    requestingUser: any,
    query?: {
      page?: number;
      limit?: number;
      tenantId?: number;
      name?: string;
      email?: string;
      phone?: string;
      status?: any;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const page = Math.max(Number(query?.page) || 1, 1);
    const limit = Math.min(Number(query?.limit) || 10, 100);
    const offset = (page - 1) * limit;

    // OLD LOGIC: Only return users with tenant_id set (exclude super-admins)
    // where.tenant_id = { [Op.not]: null };

    // // Tenant scoping
    // if (requestingUser.tenantId) {
    //   where.tenant_id = requestingUser.tenantId;
    // } else if (query?.tenantId) {
    //   where.tenant_id = query.tenantId;
    // }

    const scopeWhere = buildScopeWhere(
      {
        id: requestingUser.userId,
        role: requestingUser.role,
        tenant_id: requestingUser.tenantId,
        center_id: requestingUser.centerId,
      },
      this.userModel,
    );

    const where: any = {
      ...scopeWhere,
    };

    // Filters
    if (query?.name) {
      where.name = { [Op.iLike]: `%${query.name.trim()}%` };
    }
    if (query?.email) {
      where.email = { [Op.iLike]: `%${query.email.trim()}%` };
    }
    if (query?.phone) {
      where.phone = { [Op.iLike]: `%${query.phone.trim()}%` };
    }

    // Status filter
    const statusMap: Record<string, boolean> = {
      true: true,
      '1': true,
      false: false,
      '0': false,
    };
    if (query?.status !== undefined && String(query.status) in statusMap) {
      where.status = statusMap[String(query.status)];
    }

    // Date range
    if (query?.startDate || query?.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        const start = new Date(query.startDate);
        if (!isNaN(start.getTime())) where.createdAt[Op.gte] = start;
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        if (!isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          where.createdAt[Op.lte] = end;
        }
      }
    }

    const { count, rows } = await this.userModel.findAndCountAll({
      where,
      attributes: [
        'id',
        'name',
        'username',
        'email',
        'phone',
        'status',
        'tenant_id',
        'b2c_role_id',
        'attributes',
        'createdAt',
        'employee_no',
      ],
      include: [
        {
          model: RoleB2C,
          attributes: ['id', 'name'],
          foreignKey: 'b2c_role_id',
        },
        {
          model: Center,
          attributes: ['id', 'project_name', 'project_address'],
          as: 'center',
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    const totalPages = Math.ceil(count / limit);

    return {
      data: rows.map((r) => r.toJSON()),
      pagination: {
        total: count,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  // ── Update User ─────────────────────────────────────────────────────────
  async updateUser(
    requestingUser: any,
    userId: string,
    dto: {
      b2cRoleId?: number;
      status?: boolean;
      name?: string;
      username?: string;
      phone?: string;
      attributes?: Record<string, any>;
      employeeNo?: string;
      center_id?: number;
      qualification?: string;
      registration_number?: string;
    },
  ) {
    const user = await this.userModel.findByPk(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.assertTenantAccess(requestingUser, user.tenantId);

    let role = null;

    if (dto.b2cRoleId) {
      role = await this.roleB2CModel.findByPk(dto.b2cRoleId);

      if (!role) {
        throw new NotFoundException('Role not found');
      }
    }

    await user.update({
      name: dto.name,
      username: dto.username,
      phone: dto.phone,
      b2c_role_id: Number(dto.b2cRoleId),
      attributes: dto.attributes ?? {},
      employee_no: dto.employeeNo,
      centerId: Number(dto?.center_id) || 0,
    });
    const isDoctor = role?.name?.trim().toUpperCase() === 'DOCTOR';

    if (isDoctor) {
      const [doctorRows]: any = await this.sequelize.query(
        `
    SELECT id
    FROM "Doctors"
    WHERE user_id = :userId
    `,
        {
          replacements: {
            userId: user.id,
          },
        },
      );

      if (doctorRows.length > 0) {
        await this.sequelize.query(
          `
      UPDATE "Doctors"
      SET
        registration_number = :registrationNumber,
        qualification = :qualification,
        contact_number = :contactNumber,
        "updatedAt" = NOW()
      WHERE user_id = :userId
      `,
          {
            replacements: {
              userId: user.id,
              registrationNumber: dto.registration_number,
              qualification: dto.qualification,
              contactNumber: dto.phone,
            },
          },
        );
      } else {
        await this.sequelize.query(
          `
      INSERT INTO "Doctors"
      (
        user_id,
        external_id,
        registration_number,
        qualification,
        signature,
        contact_number,
        "createdAt",
        "updatedAt"
      )
      VALUES
      (
        :userId,
        :externalId,
        :registrationNumber,
        :qualification,
        'N/A',
        :contactNumber,
        NOW(),
        NOW()
      )
      `,
          {
            replacements: {
              userId: user.id,
              externalId: `DR00${user.id}`,
              registrationNumber: dto.registration_number,
              qualification: dto.qualification,
              contactNumber: dto.phone,
            },
          },
        );
      }
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      b2c_role_id: user.b2cRoleId,
      center_id: user.centerId,
    };
  }

  // ── Toggle Status ───────────────────────────────────────────────────────
  async toggleStatus(requestingUser: any, userId: string) {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');

    this.assertTenantAccess(requestingUser, user.tenantId);

    if (user.id === requestingUser.userId) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }

    const newStatus = !user.status;
    await user.update({ status: newStatus });

    return {
      id: user.id,
      status: newStatus,
      message: newStatus ? 'User activated' : 'User deactivated',
    };
  }

  // ── Delete User ─────────────────────────────────────────────────────────
  async deleteUser(requestingUser: any, userId: string) {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');

    this.assertTenantAccess(requestingUser, user.tenantId);

    if (user.id === requestingUser.userId) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    await user.destroy();
    return { message: 'User deleted successfully' };
  }

  // ── Private ─────────────────────────────────────────────────────────────
  private assertTenantAccess(requestingUser: any, targetTenantId: any) {
    if (
      requestingUser.tenantId &&
      Number(requestingUser.tenantId) !== Number(targetTenantId)
    ) {
      throw new ForbiddenException('Cannot access users outside your tenant');
    }
  }
  async getUserPermissions(userId: number): Promise<any> {}
}
