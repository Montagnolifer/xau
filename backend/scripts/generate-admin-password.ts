import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { Admin } from '../src/admin/entities/admin.entity';

function loadEnvironment() {
  const customPath = process.env.ENV_PATH
    ? resolve(process.cwd(), process.env.ENV_PATH)
    : undefined;

  const defaultPath = resolve(__dirname, '../.env');

  const envPath = customPath && existsSync(customPath) ? customPath : defaultPath;

  loadEnv({ path: envPath });

  if (!existsSync(envPath)) {
    console.warn(
      `Arquivo .env não encontrado em ${envPath}. Variáveis de ambiente padrões serão usadas.`,
    );
  }
}

loadEnvironment();

const ADMIN_NAME = process.env.ADMIN_NAME ?? 'Fernando';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'xaucenter@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Xau1999@';
const ADMIN_IS_ACTIVE = process.env.ADMIN_IS_ACTIVE
  ? process.env.ADMIN_IS_ACTIVE.toLowerCase() === 'true'
  : true;

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_DATABASE ?? 'postgres',
  entities: [resolve(__dirname, '../src/**/*.entity.{ts,js}')],
  synchronize: false,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});

async function upsertAdmin() {
  const repository = dataSource.getRepository(Admin);

  const existingAdmin = await repository.findOne({
    where: { email: ADMIN_EMAIL },
  });

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  if (existingAdmin) {
    existingAdmin.name = ADMIN_NAME;
    existingAdmin.password = hashedPassword;
    existingAdmin.isActive = ADMIN_IS_ACTIVE;
    await repository.save(existingAdmin);
    console.log(`Administrador atualizado: ${existingAdmin.email}`);
    return existingAdmin;
  }

  const newAdmin = repository.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: hashedPassword,
    isActive: ADMIN_IS_ACTIVE,
  });

  await repository.save(newAdmin);
  console.log(`Administrador criado: ${newAdmin.email}`);
  return newAdmin;
}

async function bootstrap() {
  try {
    await dataSource.initialize();
    console.log('Conexão com o banco estabelecida.');
    await dataSource.synchronize();
    console.log('Estrutura do banco sincronizada.');
    await upsertAdmin();
    console.log('Operação concluída com sucesso!');
    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Erro ao criar/atualizar administrador:', error);
    try {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
    } catch (closeError) {
      console.error('Erro ao encerrar conexão com o banco:', closeError);
    }
    process.exit(1);
  }
}

bootstrap();

//npx ts-node scripts/generate-admin-password.ts