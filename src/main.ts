import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loadPermissionsMap } from './const/permissions.map';
import { PermissionB2C } from './models/permission_b2c.model';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await loadPermissionsMap(PermissionB2C);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: '*',
    credentials: false,
  });

  app.setGlobalPrefix('api/v1');
  await app.listen(3005);
}
bootstrap();
