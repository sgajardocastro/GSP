const { Client } = require("pg");

const client = new Client({
  connectionString: "postgresql://usr_leangsp:usr_gsp_123@servidor.leanglobal.cl:5432/postgres?schema=public"
});

async function run() {
  await client.connect();
  const { rows } = await client.query(
    "SELECT id_user, codi_user, name_frst, email, rut FROM tsec_users WHERE LOWER(email) = 'lguser@transmac.cl' OR LOWER(codi_user) = 'lguser@transmac.cl'"
  );
  console.log("Usuarios encontrados para lguser@transmac.cl:");
  console.log(rows);
  
  if (rows.length === 0) {
     const { rows: allUsers } = await client.query("SELECT id_user, codi_user, email, rut FROM tsec_users LIMIT 5");
     console.log("Primeros 5 usuarios en tsec_users:", allUsers);
  }

  await client.end();
}

run().catch(console.error);
