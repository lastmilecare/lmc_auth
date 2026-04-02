import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PermissionB2C }     from '../../models/permission_b2c.model';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectModel(PermissionB2C) private permModel: typeof PermissionB2C,
  ) {}

  findAll() {
    return this.permModel.findAll();
  }
}