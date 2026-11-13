const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function migrate() {
  try {
    console.log('⚡ Conectando a servidor.leanglobal.cl:1295 para DDL Mantenimiento...');
    await ssh.connect({
      host: process.env.SSH_HOST || 'servidor.leanglobal.cl',
      port: Number(process.env.SSH_PORT) || 1295,
      username: process.env.SSH_USER || 'root',
      password: process.env.SSH_PASSWORD
    });
    console.log('✅ Conexión SSH establecida.');

    const schemas = ['sch_leangsp', 'sch_leangsp_prod'];

    for (const schema of schemas) {
      console.log(`\n======================================================`);
      console.log(`▶ Aplicando migración DDL en esquema: ${schema}`);
      console.log(`======================================================`);

      const ddl = `
        ALTER TABLE ${schema}.tmnt_ot 
          ADD COLUMN IF NOT EXISTS horometro_inicio NUMERIC(10,2) DEFAULT 0,
          ADD COLUMN IF NOT EXISTS horometro_cierre NUMERIC(10,2),
          ADD COLUMN IF NOT EXISTS pauta_intervalo_horas VARCHAR(50),
          ADD COLUMN IF NOT EXISTS id_supervisor BIGINT,
          ADD COLUMN IF NOT EXISTS id_tecnico_responsable BIGINT,
          ADD COLUMN IF NOT EXISTS costo_total_calculado NUMERIC(15,2) DEFAULT 0,
          ADD COLUMN IF NOT EXISTS observaciones TEXT,
          ADD COLUMN IF NOT EXISTS fecha_cierre_real TIMESTAMPTZ;

        ALTER TABLE ${schema}.tmnt_ot_actividad
          ADD COLUMN IF NOT EXISTS horas_estimadas NUMERIC(5,2) DEFAULT 1.0,
          ADD COLUMN IF NOT EXISTS orden INTEGER DEFAULT 1,
          ADD COLUMN IF NOT EXISTS observacion_tecnico TEXT;

        ALTER TABLE ${schema}.tmnt_ot_repuesto 
          ALTER COLUMN id_producto DROP NOT NULL;

        ALTER TABLE ${schema}.tmnt_ot_repuesto
          ADD COLUMN IF NOT EXISTS descripcion_material VARCHAR(255),
          ADD COLUMN IF NOT EXISTS cantidad NUMERIC(12,2) DEFAULT 1.0,
          ADD COLUMN IF NOT EXISTS unidad_medida VARCHAR(30) DEFAULT 'UNIDAD',
          ADD COLUMN IF NOT EXISTS costo_unitario NUMERIC(15,2) DEFAULT 0,
          ADD COLUMN IF NOT EXISTS costo_total NUMERIC(15,2) DEFAULT 0,
          ADD COLUMN IF NOT EXISTS proveedor_o_documento VARCHAR(255);

        ALTER TABLE ${schema}.tmnt_ot_hh
          ADD COLUMN IF NOT EXISTS descripcion_trabajo TEXT,
          ADD COLUMN IF NOT EXISTS costo_calculado NUMERIC(15,2) DEFAULT 0;

        CREATE TABLE IF NOT EXISTS ${schema}.tmnt_ot_servicio_ext (
          id_servicio_ext BIGSERIAL PRIMARY KEY,
          id_empresa BIGINT NOT NULL,
          id_ot BIGINT NOT NULL REFERENCES ${schema}.tmnt_ot(id_ot) ON DELETE CASCADE,
          proveedor VARCHAR(200) NOT NULL,
          descripcion_servicio TEXT NOT NULL,
          numero_documento_compra VARCHAR(100),
          costo NUMERIC(15,2) NOT NULL DEFAULT 0,
          fecha_registro TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        ALTER TABLE ${schema}.tmnt_ot_cierre
          ADD COLUMN IF NOT EXISTS costo_total_servicios NUMERIC(15,2) DEFAULT 0,
          ADD COLUMN IF NOT EXISTS costo_total_ot NUMERIC(15,2) DEFAULT 0,
          ADD COLUMN IF NOT EXISTS pin_hash VARCHAR(64),
          ADD COLUMN IF NOT EXISTS horometro_cierre NUMERIC(10,2);
      `;

      // Upload temporary sql file to remote /tmp
      const remoteSqlPath = `/tmp/migrate_${schema}.sql`;
      await ssh.execCommand(`cat << 'EOF' > ${remoteSqlPath}\n${ddl}\nEOF`);
      const cmd = `sudo -u postgres psql -d postgres -f ${remoteSqlPath}`;
      const res = await ssh.execCommand(cmd);
      if (res.stdout) console.log(res.stdout);
      if (res.stderr) console.error('STDERR:', res.stderr);
    }

    console.log('\n🎉 ¡Migración DDL en DEV y PROD completada exitosamente!');
  } catch (err) {
    console.error('❌ Error ejecutando migración:', err);
    process.exit(1);
  } finally {
    ssh.dispose();
  }
}

migrate();
