import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ListingsModule } from './listings/listings.module';
import { GroupBuysModule } from './group-buys/group-buys.module';
import { ChatModule } from './chat/chat.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('DB_URL'),
        connectionFactory: (connection) => {
          connection.plugin((schema: any) => {
            schema.set('toJSON', {
              virtuals: true,
              transform: (_doc: any, ret: any) => {
                ret.id = ret._id?.toString();
                delete ret._id;
                delete ret._class;
                delete ret.__v;
                return ret;
              },
            });
          });
          return connection;
        },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    ListingsModule,
    GroupBuysModule,
    ChatModule,
  ],
})
export class AppModule {}
