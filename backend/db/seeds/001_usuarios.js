import bcrypt from 'bcryptjs';
import { pool } from '../../src/config/database.js';

const usersToSeed = [
  {
    nome: 'Professora Ana Silva',
    email: 'professor@escola.local',
    telefone: '(11) 90000-0001',
    senha: 'Professor@123',
    perfil: 'Professor',
  },
  {
    nome: 'Coordenador Bruno Costa',
    email: 'coordenador@escola.local',
    telefone: '(11) 90000-0002',
    senha: 'Coordenador@123',
    perfil: 'Coordenador',
  },
];

async function seedUsers() {
  for (const user of usersToSeed) {
    const senhaHash = await bcrypt.hash(user.senha, 10);

    await pool.query(
      `
        INSERT INTO usuarios (nome, email, telefone, senha_hash, perfil)
        VALUES ($1, $2, $3, $4, $5::perfil_usuario)
        ON CONFLICT (email) DO UPDATE SET
          nome = EXCLUDED.nome,
          telefone = EXCLUDED.telefone,
          senha_hash = EXCLUDED.senha_hash,
          perfil = EXCLUDED.perfil,
          updated_at = NOW()
      `,
      [user.nome, user.email, user.telefone, senhaHash, user.perfil],
    );
  }

  const result = await pool.query('SELECT COUNT(*)::int AS total FROM usuarios');
  console.log(`Seeded ${result.rows[0].total} users.`);
}

try {
  await seedUsers();
} catch (error) {
  console.error('Failed to seed local users:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
