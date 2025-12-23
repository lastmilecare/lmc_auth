import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../UserControl/User.module';
import { CenterAuthService } from './centerauth.service';
import { CenterAuthController } from './centerauth.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { TestAccount } from 'src/models/test-account.model';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    PassportModule,
    AuthModule,
    SequelizeModule.forFeature([TestAccount]),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  providers: [CenterAuthService],
  controllers: [CenterAuthController],
  exports: [CenterAuthService],
})
export class CenterAuthModule { }