import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3003', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  databaseUrl: process.env.DATABASE_URL || '',
  firstSuperadminUsername: process.env.FIRST_SUPERADMIN_USERNAME || 'Analista_Desarrollo',
  firstSuperadminPassword: process.env.FIRST_SUPERADMIN_PASSWORD || 'Admin1234!',
};
