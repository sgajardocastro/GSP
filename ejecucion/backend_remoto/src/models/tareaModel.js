const pool = require("../config/postgresPool");

class tareaModel {
  constructor() {
    this.pool = pool;
    this.pool.on("error", (err) => console.error(err));
  }

  sanitizeJsonData(json_data) {
    const safe = (v) => {
      if (Array.isArray(v)) {
        return v.map(safe);
      } else if (v && typeof v === "object") {
        const out = {};
        for (const [k, val] of Object.entries(v)) {
          if (val === undefined) continue;
          if (typeof val === "bigint") out[k] = String(val);
          else if (k === "fotos" && Array.isArray(val)) {
            out[k] = val.map((x) =>
              typeof x === "string" ? x : String(x ?? "")
            );
          } else if (val instanceof Date) out[k] = val.toISOString();
          else out[k] = safe(val);
        }
        return out;
      }
      return v;
    };

    return Array.isArray(json_data) ? json_data.map(safe) : [];
  }

  mergeJsonDataByFecha(currentJson, incomingJson) {
    const current = Array.isArray(currentJson) ? currentJson : [];
    const incoming = Array.isArray(incomingJson) ? incomingJson : [];
    if (!incoming.length) return current;

    const byFecha = new Map();
    const orderedFechas = [];
    const passthroughCurrent = [];

    for (const row of current) {
      if (row && typeof row === "object" && row.fecha != null && row.fecha !== "") {
        const key = String(row.fecha);
        if (!byFecha.has(key)) orderedFechas.push(key);
        byFecha.set(key, row);
      } else {
        passthroughCurrent.push(row);
      }
    }

    for (const row of incoming) {
      if (!(row && typeof row === "object")) continue;
      const fechaRaw = row.fecha;
      if (fechaRaw == null || fechaRaw === "") {
        passthroughCurrent.push(row);
        continue;
      }
      const key = String(fechaRaw);
      const prev = byFecha.get(key);
      if (!byFecha.has(key)) orderedFechas.push(key);
      byFecha.set(key, prev && typeof prev === "object" ? { ...prev, ...row } : row);
    }

    const mergedByFecha = orderedFechas.map((k) => byFecha.get(k));
    return [...mergedByFecha, ...passthroughCurrent];
  }

  async putTarea(data) {
    console.log("updateTarea:======================================>", data);

    const { id_tarea, json_data, id_survey } = data.tarea[0];
    const jsonSanitized = this.sanitizeJsonData(json_data);

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      // 1️⃣ Obtener fecha_fin_plan ANTES del update
      const beforeRes = await client.query(
        `
          SELECT fecha_fin_plan, json_data
          FROM tpry_gantt_tarea_V2
          WHERE id_tarea = $1
        `,
        [id_tarea]
      );
      const beforeRow = beforeRes.rows[0] || null;
      const fechaPlanFinAntes = beforeRow?.fecha_fin_plan || null;

      // 2️⃣ Merge por fecha: solo reemplaza/crea los días enviados.
      const currentJson = Array.isArray(beforeRow?.json_data) ? beforeRow.json_data : [];
      const jsonMerged = this.mergeJsonDataByFecha(currentJson, jsonSanitized);

      const queryUpdate = `
        UPDATE tpry_gantt_tarea_V2
        SET json_data = $1::jsonb,
        id_survey = COALESCE($3, id_survey)
        WHERE id_tarea = $2
        RETURNING *;
      `;

      // 3️⃣ UPDATE json_data
      const result = await client.query(queryUpdate, [
        JSON.stringify(jsonMerged),
        id_tarea, id_survey
      ]);

      // 4️⃣ Recalcular totales (incluye fecha_fin_plan nueva)
      await client.query(
        "SELECT fn_gantt_tarea_update_totales($1);",
        [id_tarea]
      );

      // 5️⃣ Obtener fecha_fin_plan DESPUÉS del recalculo
      const afterRes = await client.query(
        `
          SELECT fecha_fin_plan
          FROM tpry_gantt_tarea_V2
          WHERE id_tarea = $1
        `,
        [id_tarea]
      );
      const afterRow = afterRes.rows[0] || null;
      const fechaPlanFinDespues = afterRow?.fecha_fin_plan || null;

      // 6️⃣ Calcular diferencia en días
      let diasDesplazar = 0;
      if (fechaPlanFinAntes && fechaPlanFinDespues) {
        const dAntes = new Date(fechaPlanFinAntes);
        const dDespues = new Date(fechaPlanFinDespues);
        const diffMs = dDespues.getTime() - dAntes.getTime();
        diasDesplazar = Math.round(diffMs / (1000 * 60 * 60 * 24)); // puede ser positivo o negativo
      }

      // 7️⃣ Si hubo cambio en la fecha de fin, propagar desplazamiento
      if (diasDesplazar !== 0) {
        await client.query(
          "SELECT fn_gantt_tarea_propaga_desplazamiento($1, $2);",
          [id_tarea, diasDesplazar]
        );
      }

      await client.query("COMMIT");

      // si quieres devolver la fila ya recalculada:
      const finalRes = await client.query(
        "SELECT * FROM tpry_gantt_tarea_V2 WHERE id_tarea = $1",
        [id_tarea]
      );
      return finalRes.rows[0];

      // si prefieres lo del UPDATE original, podrías devolver result.rows[0]
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ json_data enviado:", JSON.stringify(jsonSanitized));
      console.error("❌ Error putTarea:", error);
      throw new Error(`Error al actualizar tarea: ${error.message}`);
    } finally {
      client.release();
    }
  }

  async putTareaV3(data) {
    console.log("updateTareaV3:======================================>", data);

    const { id_tarea, json_data, replace_json_data } = data.tarea[0];
    const jsonSanitized = this.sanitizeJsonData(json_data);

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      const beforeRes = await client.query(
        `
          SELECT json_data
          FROM tpry_gantt_tarea_v3
          WHERE id_tarea = $1
        `,
        [id_tarea]
      );
      const beforeRow = beforeRes.rows[0] || null;
      const currentJson = Array.isArray(beforeRow?.json_data) ? beforeRow.json_data : [];
      const replaceMode = Boolean(replace_json_data);
      const jsonMerged = replaceMode
        ? jsonSanitized
        : this.mergeJsonDataByFecha(currentJson, jsonSanitized);

      const queryUpdate = `
        UPDATE tpry_gantt_tarea_v3
        SET json_data = $1::jsonb
        WHERE id_tarea = $2
        RETURNING *;
      `;

      const result = await client.query(queryUpdate, [
        JSON.stringify(jsonMerged),
        id_tarea
      ]);

      await client.query("COMMIT");
      return result.rows[0] || null;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ json_data enviado V3:", JSON.stringify(jsonSanitized));
      console.error("❌ Error putTareaV3:", error);
      throw new Error(`Error al actualizar tarea V3: ${error.message}`);
    } finally {
      client.release();
    }
  }

}

module.exports = tareaModel;
