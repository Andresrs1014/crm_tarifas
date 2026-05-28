import app from './app';
import { config } from './config';
import prisma from './database';

async function main() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    app.listen(config.port, () => {
      console.log(`🚀 CRM Backend running on port ${config.port} [${config.nodeEnv}]`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

main();
