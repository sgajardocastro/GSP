import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

const empresas = [
  {
    razon_social: "SOCIEDAD BESTMAQ VENTA DE MAQUINARIA USADA LIMITADA",
    name_empresa: "BESTMAQ",
    rut_empresa: "76209534-3",
    direccion: "CAMINO LABRANZA KM 9.5",
    giro: "ARRIENDO DE MAQUINARIAS",
    fono_contacto: "569 9443 7725",
    flag_externo: false
  },
  {
    razon_social: "SERVICIOS INTEGRADOS LOGISTICOS DEL SUR LTDA.",
    name_empresa: "LOGISTICA DEL SUR",
    rut_empresa: "76218576-8",
    direccion: "KM 9.5 CAMINO LABRANZA HJ 24 LUGAR BOTROLHUE",
    giro: "ARRIENDO DE MAQUINARIAS",
    fono_contacto: "570 9443 7725",
    flag_externo: false
  },
  {
    razon_social: "LUIS OMAR GHISELLINI JARA ARRENDAMIENTO DE MAQUINARIAS Y VEHICULOS MOTORIZADOS EN GENERAL E.I.R.L.",
    name_empresa: "SAN PABLO",
    rut_empresa: "52004162-1",
    direccion: "BOTROLHUE KM 9.5 HIJUELA 24 CAMINO LABRANZA",
    giro: "ARRIENDO DE MAQUINARIAS",
    fono_contacto: "571 9443 7725",
    flag_externo: false
  },
  {
    razon_social: "SOCIEDAD DE LOGISTICA Y MANTENCION CERRO DOROTEA LIMITADA",
    name_empresa: "DOROTEA",
    rut_empresa: "76939813-9",
    direccion: "CAMINO LABRANZA KM 9.5",
    giro: "ARRIENDO DE MAQUINARIAS",
    fono_contacto: "572 9443 7725",
    flag_externo: false
  },
  {
    razon_social: "ARRIENDO ROYAL RENTAL LIMITADA",
    name_empresa: "ROYAL RENTAL",
    rut_empresa: "78254535-3",
    direccion: "CAMINO LABRANZA KM 9.5",
    giro: "ARRIENDO DE MAQUINARIAS",
    fono_contacto: "573 9443 7725",
    flag_externo: false
  }
];

async function main() {
  try {
    console.log('Iniciando inserción/upsert de empresas hermanas...');

    for (const emp of empresas) {
      // Verificar si ya existe por rut_empresa
      const selectQuery = `
        SELECT id_empresa 
        FROM sch_leangsp.tpar_empresas 
        WHERE rut_empresa = $1;
      `;
      const check = await prisma.$queryRawUnsafe(selectQuery, emp.rut_empresa);

      if (check.length > 0) {
        // Si existe, actualizamos
        const updateQuery = `
          UPDATE sch_leangsp.tpar_empresas 
          SET 
            name_empresa = $1,
            razon_social = $2,
            giro = $3,
            direccion = $4,
            fono_contacto = $5,
            flag_externo = $6
          WHERE rut_empresa = $7
          RETURNING id_empresa;
        `;
        const result = await prisma.$queryRawUnsafe(updateQuery,
          emp.name_empresa,
          emp.razon_social,
          emp.giro,
          emp.direccion,
          emp.fono_contacto,
          emp.flag_externo,
          emp.rut_empresa
        );
        console.log(`[UPDATE] Empresa "${emp.name_empresa}" actualizada. ID:`, result[0]?.id_empresa);
      } else {
        // Si no existe, insertamos
        const insertQuery = `
          INSERT INTO sch_leangsp.tpar_empresas (name_empresa, rut_empresa, razon_social, giro, direccion, fono_contacto, flag_externo, id_pais)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 1)
          RETURNING id_empresa;
        `;
        const result = await prisma.$queryRawUnsafe(insertQuery,
          emp.name_empresa,
          emp.rut_empresa,
          emp.razon_social,
          emp.giro,
          emp.direccion,
          emp.fono_contacto,
          emp.flag_externo
        );
        console.log(`[INSERT] Empresa "${emp.name_empresa}" creada. ID:`, result[0]?.id_empresa);
      }
    }

    console.log('Proceso de seeding finalizado con éxito.');
  } catch (error) {
    console.error('Error durante la inserción:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
