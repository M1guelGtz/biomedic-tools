// Garantiza que exista al menos un usuario admin al arrancar.
// Si no hay ningún admin, crea uno con las credenciales de entorno.
// Así no guardamos contraseñas en el SQL de seed.

import { Usuario } from '../../domain/entities/Usuario.js';

export async function ensureAdminUser({ usuarioRepo, passwordHasher, admin }) {
  const existentes = await usuarioRepo.contarPorRol('admin');
  if (existentes > 0) {
    return { creado: false };
  }

  if (!admin.email || !admin.password) {
    console.warn(
      '[BioMed] No hay admin y faltan ADMIN_EMAIL/ADMIN_PASSWORD: no se creó usuario inicial.',
    );
    return { creado: false };
  }

  const passwordHash = await passwordHasher.hash(admin.password);
  await usuarioRepo.crear(
    new Usuario({
      nombre: admin.nombre || 'Administrador',
      email: admin.email.trim().toLowerCase(),
      passwordHash,
      rol: 'admin',
    }),
  );
  console.log(`[BioMed] Usuario admin inicial creado: ${admin.email}`);
  return { creado: true };
}
