import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @Matches(/^[a-zA-Z0-9._-]{3,20}$/, {
    message: 'Username must be 3-20 characters and contain only letters, numbers, dots, underscores, or hyphens',
  })
  username: string;

  @IsString()
  @MinLength(8)
  password: string;
}
