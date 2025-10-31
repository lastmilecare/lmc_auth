import { Controller, Post, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Response } from 'express';

@Controller('login')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post()
  async login(@Body() body: { username: string; password: string }, @Res() res: Response) {
    const { user, token } = await this.authService.validateUser(body.username, body.password);

    res.json({ message: 'Login successful', userId: user.id, token: token });
  }
}