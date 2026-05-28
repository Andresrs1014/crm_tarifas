import prisma from './database';
import bcrypt from 'bcryptjs';
import { config } from './config';

const SERVICIOS = ['Zona Franca', 'Depósito Aduanero', 'CEDI', 'Transporte', 'Paqueteo', 'Aduana'];

async function seed() {
  console.log('🌱 Starting seed...');

  // 1. CotNumeroCounter
  const counter = await prisma.cotNumeroCounter.findFirst();
  if (!counter) {
    await prisma.cotNumeroCounter.create({ data: { valor: 0 } });
    console.log('✅ CotNumeroCounter created');
  }

  // 2. Superadmin user
  const existingUsers = await prisma.user.count();
  if (existingUsers === 0) {
    const hashed = await bcrypt.hash(config.firstSuperadminPassword, 12);
    await prisma.user.create({
      data: {
        username: config.firstSuperadminUsername,
        password: hashed,
        role: 'superadmin',
      },
    });
    console.log(`✅ Superadmin created: ${config.firstSuperadminUsername}`);
  }

  // 3. Biblioteca lines
  const existingLineas = await prisma.bibliotecaLinea.count();
  if (existingLineas === 0) {
    for (let i = 0; i < SERVICIOS.length; i++) {
      await prisma.bibliotecaLinea.create({
        data: { nombre: SERVICIOS[i], orden: i },
      });
    }
    console.log(`✅ Biblioteca lines created: ${SERVICIOS.join(', ')}`);
  }

  console.log('🎉 Seed completed!');
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
