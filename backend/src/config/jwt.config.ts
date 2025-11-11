import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'A9g!zR@7nC^LmV&bX2w*Uj8&eFsD',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
})); 