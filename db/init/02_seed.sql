-- =====================================================================
--  Datos de ejemplo (seed) - solo para desarrollo / demo
--  Se puede borrar en producción.
-- =====================================================================

-- NOTA: el usuario admin inicial NO se crea aquí. Lo crea automáticamente el
-- backend al arrancar, usando ADMIN_EMAIL y ADMIN_PASSWORD del archivo .env
-- (ver application/auth/ensureAdminUser.js). Así no guardamos contraseñas en SQL.

-- Equipos de ejemplo (coinciden con el diseño de la landing).
INSERT INTO equipos (nombre, modelo, fabricante, categoria, descripcion)
VALUES
  ('Monitor de signos vitales', 'VS-2000', 'GenericMed', 'Monitoreo',
   'Monitor multiparamétrico para SpO2, ECG, presión no invasiva y temperatura.'),
  ('Microscopio óptico', 'MX-100', 'OptiLab', 'Laboratorio',
   'Microscopio binocular de laboratorio para análisis clínico.'),
  ('Máquina de anestesia', 'AN-500', 'GenericMed', 'Quirófano',
   'Estación de anestesia con ventilador integrado y monitoreo de gases.'),
  ('Electrocardiógrafo', 'ECG-12', 'CardioTech', 'Diagnóstico',
   'Electrocardiógrafo de 12 derivaciones con impresión y exportación digital.')
ON DUPLICATE KEY UPDATE nombre = nombre;
