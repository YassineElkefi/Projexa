import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MailModule } from './mail/mail.module';
import { AdminModule } from './admin/admin.module';
import { ProjectsModule } from './projects/projects.module';
import { GatewayModule } from './gateway/gateway.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),    
    TypeOrmModule.forRootAsync({
        imports:[ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          type: 'mysql',
          host: config.get<string>('DB_HOST'),
          port: config.get<number>('DB_PORT'),
          username: config.get<string>('DB_USER'),
          password: config.get<string>('DB_PASS'),
          database: config.get<string>('DB_NAME'),
          autoLoadEntities: true,
          synchronize: true,
        })
        
     }),
    AuthModule,
    UsersModule,
    MailModule,    
    AdminModule,
    ProjectsModule,
    GatewayModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
