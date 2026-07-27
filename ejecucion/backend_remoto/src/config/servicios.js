module.exports =
[
  {
    "uri": "/ejemplo",
    "tipo": "normal",
    "query": "SELECT 'Hola desde SQL' AS mensaje",
    "where": false
  },
  {
    "uri": "/ejemplo2",
    "tipo": "normal",
    "query": "SELECT * FROM tsec_users",
    "where": false
  },
  {
    "uri": "/prueba",
    "tipo": "normal",
    "query": "SELECT * FROM prueba WHERE id = 1"
  },
  {
    "nombre": "/leandglobal/prueba2",
    "uri": "/prueba2",
    "comentario": "Llenado de la vista/tabla de Stock",
    "tipo": "indicador",
    "secatrib": "nombre",
    "teratrib": "edad",
    "in": "ciudad",
    "indicador": "select 1 valor",
    "datos": "select * from prueba where 1=1 AND fecha_desde >= TO_DATE('$fecha_desde', 'yyyy-mm-dd') AND fecha_hasta <= TO_DATE('$fecha_hasta', 'yyyy-mm-dd') $secatrib $teratrib $in"
  },
  {
    "uri": "/leanglobal/archivos",
    "tipo": "normal",
    "query": "SELECT * FROM sch_leansurvey.tfmg_file",
    "where": true
  }
  ,
  {
    "uri": "/leanglobal/procesosSurvey",
    "tipo": "normal",
    "query": "select ts.id_survey, ar.name_area, te.name_template_srv , te.codi_template_srv , te.desc_template_srv, py.nombre_proyecto, em.name_empresa name_empresa_cliente, to_char(ts.fecha_plan_ini, 'yyyy-mm-dd') fecha_plan_ini, ts.id_user, ts.estado_srv from sch_leangsp.tsrv_survey ts join sch_leangsp.tsrv_templates te on ts.id_template = te.id_template join sch_leangsp.tsrv_tipo_template tt on ts.id_tipo_srv = tt.id_tipo_srv join sch_leangsp.tpar_area ar on tt.id_area = ar.id_area join sch_leangsp.tpar_empresas em on ts.id_empresa_cliente = em.id_empresa left join sch_leangsp.tpry_proyecto py on ts.id_proyecto = py.id_proyecto order by ts.id_survey",
    "where": true
  }

  ,
  {
    "uri": "/leanglobal/procesosSurveyDetail",
    "tipo": "normal",
    "query": "select te.id_template, ts.id_survey, ar.name_area, ts.fecha_ejec_fin, tt.name_tipo_srv, tt.codi_tipo_srv , te.name_template_srv , te.codi_template_srv , te.desc_template_srv, te.desc_template_srv, py.nombre_proyecto, em.name_empresa name_empresa_cliente, to_char(ts.fecha_plan_ini, 'yyyy-mm-dd') fecha_plan_ini, to_char(ts.fecha_plan_fin, 'yyyy-mm-dd') fecha_plan_fin, to_char(ts.fecha_real_ini, 'yyyy-mm-dd') fecha_real_ini, to_char(ts.fecha_real_fin, 'yyyy-mm-dd') fecha_real_fin, ts.id_user, ts.estado_srv, ts.latitud, ts.longitud, ts.header_exec, ts.body_exec, ts.approval_exec from tsrv_survey ts, tsrv_templates te, tsrv_tipo_template tt, tpar_area ar, tpar_empresas em, tpry_proyecto py where ts.id_template = te.id_template and ts.id_tipo_srv = tt.id_tipo_srv and tt.id_area = ar.id_area and ts.id_empresa_cliente = em.id_empresa and ts.id_proyecto = py.id_proyecto",
    "where": true
  }

  ,
  {
    "uri": "/leanglobal/obtenerAreas",
    "tipo": "normal",
    "query": "select * from tpar_area where estado = 'A'",
    "where": true
  }

  ,
  {
    "uri": "/leanglobal/obtenerTipoTemplate",
    "tipo": "normal",
    "query": "select * from tsrv_tipo_template",
    "where": true
  }

  ,
  {
    "uri": "/leanglobal/obtenerTemplates",
    "tipo": "normal",
    "query": "select * from tsrv_templates",
    "where": false
  }

  ,
  {
    "uri": "/leanglobal/obtenerEmpresas",
    "tipo": "normal",
    "query": "select * from tpar_empresas",
    "where": true
  }
  ,
  {
  uri: '/leanglobal/obtenerProyectos',
  tipo: 'normal',
  where: true,
  query: `
    select
    vp.id_proyecto,
    vp.id_proyecto_padre,
    vp.nombre_proyecto,
    vp.objetivo_proyecto,
    vp.observacion_proyecto,
    vp.fecha_plan_ini,
    vp.fecha_plan_fin,
    vp.fecha_real_ini,
    vp.fecha_real_fin,
    vp.fecha_creacion,
    vp.fecha_modificacion,
    vp.duracion_plan,
    vp.duracion_real,
    vp.id_usuario_jefe_proyecto,
    vp.nombre_jefe_proyecto,
    vp.id_usuario_creacion,
    vp.id_usuario_modificacion,
    vp.id_usuario_cliente,
    vp.id_proyecto_tipo,
    vp.id_proyecto_estado,
    vp.id_empresa,
    vp.id_empresa_cliente,
    vp.name_empresa_cliente,
    vp.centro_costo,
    vp.codi_proyecto,
    va.unidades_reales,
    va.unidades_planificadas,
    '% ' ||to_char(va.pct_desviacion, 'FM999,999,990.00') pct_desviacion,
    vp.json_field
    from vw_proyectos_full vp
        left join vw_gantt_avance_proyecto va on va.id_proyecto = vp.id_proyecto
    where vp.id_proyecto > -1
  `
}
  ,
  {
    "uri": "/leanglobal/obtenerAreas",
    "tipo": "normal",
    "query": "select id_area, name_area, id_empresa from tpar_area",
    "where": true
  }
  ,
  {
    "uri": "/leanglobal/obtenerAreasAutonomos",
    "tipo": "normal",
    "query": `
      select
        a.name_area,
        a.id_area,
        t1.id_tipo_srv,
        t1.name_tipo_srv,
        t2.id_template,
        t2.name_template_srv
      from tpar_area a,
           tsrv_tipo_template t1,
           tsrv_templates t2
      where a.id_area = t1.id_area
        and t1.id_tipo_srv = t2.id_tipo_srv
        and t2.flag_autonomo
    `,
    "where": true
  }
  ,
  {
    "uri": "/leanglobal/obtenerFamilias",
    "tipo": "normal",
    "query": "select t.id_tipo_srv, t.name_tipo_srv, t.id_area, a.name_area, t.id_empresa, t.flag_personalizado from tsrv_tipo_template t, tpar_area a where a.id_area  = t.id_area",
    "where": true
  }

  ,
  {
    nombre: "/leandglobal/procesosSurveyV3",
    uri: "/leanglobal/procesosSurveyV3",
    tipo: "indicador",
    filtro: "ts.id_empresa_cliente",
    secatrib: "ts.id_proyecto",
    indicador: "select 1 valor from vw_procesossurvey ts",
    cumplimiento: "select 1 valor from vw_procesossurvey ts",
    datos: `
      SELECT *
      FROM vw_procesossurvey ts
      WHERE DATE(ts.fecha_plan_ini) >= DATE('$fecha_desde')
        AND DATE(ts.fecha_plan_fin) <= DATE('$fecha_hasta')
        $filtro
        $secatrib
      ORDER BY ts.id_survey
    `,
    where: true
  }
  ,
  {
    nombre: "/leandglobal/procesosSurveyV4",
    uri: "/leanglobal/procesosSurveyV4",
    tipo: "indicador",
    filtro: "v.id_empresa_cliente",
    secatrib: "v.id_proyecto",
    in: "v.id_survey",
    indicador: `
      SELECT COUNT(*)::int AS valor
      FROM vw_procesossurvey v
      WHERE DATE(v.fecha_plan_ini) >= DATE('$fecha_desde')
        AND DATE(v.fecha_plan_fin) <= DATE('$fecha_hasta')
        $filtro
        $secatrib
        $in
    `,
    datos: `
      WITH base AS (
        SELECT
          v.*,
          s.header_exec,
          s.body_exec,
          s.approval_exec,
          COALESCE(
            s.body_exec::jsonb->'asignaciones'->0->>'Contratista',
            s.body_exec::jsonb->'asignaciones'->0->>'contratista',
            s.body_exec::jsonb->'asignaciones'->0->>'id_user_contratista',
            s.body_exec::jsonb->'asignaciones'->0->>'id_user_contratista_asignado',
            ''
          ) AS id_user_contratista_txt,
          COALESCE(
            s.body_exec::jsonb->'asignaciones'->0->>'Supervisor',
            s.body_exec::jsonb->'asignaciones'->0->>'supervisor',
            s.body_exec::jsonb->'asignaciones'->0->>'id_user_supervisor',
            s.body_exec::jsonb->'asignaciones'->0->>'id_user_supervisor_asignado',
            ''
          ) AS id_user_supervisor_txt,
          COALESCE(
            s.body_exec::jsonb->'asignaciones'->0->>'Tecnico',
            s.body_exec::jsonb->'asignaciones'->0->>'Técnico',
            s.body_exec::jsonb->'asignaciones'->0->>'tecnico',
            s.body_exec::jsonb->'asignaciones'->0->>'id_user_tecnico',
            s.body_exec::jsonb->'asignaciones'->0->>'id_user_tecnico_asignado',
            ''
          ) AS id_user_tecnico_txt
        FROM vw_procesossurvey v
        INNER JOIN tsrv_survey s ON s.id_survey = v.id_survey
        WHERE DATE(v.fecha_plan_ini) >= DATE('$fecha_desde')
          AND DATE(v.fecha_plan_fin) <= DATE('$fecha_hasta')
          $filtro
          $secatrib
          $in
      ),
      typed AS (
        SELECT
          base.*,
          CASE WHEN base.id_user_contratista_txt ~ '^[0-9]+$' THEN base.id_user_contratista_txt::int ELSE NULL END AS id_user_contratista,
          CASE WHEN base.id_user_supervisor_txt ~ '^[0-9]+$' THEN base.id_user_supervisor_txt::int ELSE NULL END AS id_user_supervisor,
          CASE WHEN base.id_user_tecnico_txt ~ '^[0-9]+$' THEN base.id_user_tecnico_txt::int ELSE NULL END AS id_user_tecnico
        FROM base
      )
      SELECT
        typed.*,
        TRIM(
          COALESCE(uc.name_frst, '') || ' ' ||
          COALESCE(uc.name_sec, '') || ' ' ||
          COALESCE(uc.apellido_pat, '') || ' ' ||
          COALESCE(uc.apellido_mat, '')
        ) AS nombre_contratista_asignado,
        TRIM(
          COALESCE(us.name_frst, '') || ' ' ||
          COALESCE(us.name_sec, '') || ' ' ||
          COALESCE(us.apellido_pat, '') || ' ' ||
          COALESCE(us.apellido_mat, '')
        ) AS nombre_supervisor_asignado,
        TRIM(
          COALESCE(ut.name_frst, '') || ' ' ||
          COALESCE(ut.name_sec, '') || ' ' ||
          COALESCE(ut.apellido_pat, '') || ' ' ||
          COALESCE(ut.apellido_mat, '')
        ) AS nombre_tecnico_asignado
      FROM typed
      LEFT JOIN tsec_users uc ON uc.id_user = typed.id_user_contratista
      LEFT JOIN tsec_users us ON us.id_user = typed.id_user_supervisor
      LEFT JOIN tsec_users ut ON ut.id_user = typed.id_user_tecnico
      ORDER BY typed.id_survey
    `,
    where: true
  }
  ,
  {
    "uri": "/leanglobal/obtenerUsuarios",
    "tipo": "normal",
    "query": "select id_user, email, name_frst, name_sec, apellido_pat, apellido_mat, rut, id_empresa, movil, activo, id_user_creacion, fecha_creacion, fecha_actualizacion, codi_user, COALESCE(name_frst, '') || ' ' || COALESCE(name_sec, '') || ' ' || COALESCE(apellido_pat, '') AS nombre_user, pass_hash_fes, flag_proc_enrol, json_data FROM tsec_users",
    "where": true
  }

    ,
  {
    "nombre": "/leandglobal/flujosAprobacion",
    "uri": "/leanglobal/flujosAprobacion",
    "comentario": "",
    "tipo": "indicador",
    "secatrib": "nombre",
    "teratrib": "edad",
    "in": "ciudad",
    "indicador": "select 1 valor from tsrv_survey ts",
    "datos": "SELECT ts.id_survey, fl.id_flow, ar.name_area, tt.name_tipo_srv, te.name_template_srv, te.codi_template_srv, te.desc_template_srv, py.nombre_proyecto, ts.id_empresa_cliente, ts.id_proyecto, em.name_empresa as name_empresa_cliente, ts.id_user, ts.longitud, ts.latitud, us.name_frst || ' ' || us.name_sec || ' ' || us.apellido_pat AS nombre_user, TO_CHAR(ts.fecha_plan_ini, 'yyyy-mm-dd') as fecha_plan_ini, TO_CHAR(ts.fecha_plan_fin, 'yyyy-mm-dd') as fecha_plan_fin, TO_CHAR(ts.fecha_real_ini, 'yyyy-mm-dd hh24:mi') as fecha_real_ini, TO_CHAR(ts.fecha_real_fin, 'yyyy-mm-dd hh24:mi') as fecha_real_fin, TO_CHAR(ts.fecha_ejec_fin, 'yyyy-mm-dd hh24:mi') as fecha_ejec_fin, TO_CHAR(ts.fecha_verif_fin, 'yyyy-mm-dd hh24:mi') as fecha_verif_fin, COALESCE(avance.pct_avance, 0) AS pct_avance, ts.estado_srv, CASE WHEN ts.fecha_real_fin IS NULL THEN CASE WHEN ts.fecha_plan_fin < CURRENT_DATE THEN 'Rojo' WHEN ts.fecha_plan_fin BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '1 day' THEN 'Amarillo' WHEN ts.fecha_plan_fin > CURRENT_DATE + INTERVAL '1 day' THEN 'Azul' ELSE 'Desconocido' END ELSE 'Verde' END AS estado_color FROM tsrv_survey ts JOIN tsrv_templates te ON ts.id_template = te.id_template JOIN tsrv_tipo_template tt ON ts.id_tipo_srv = tt.id_tipo_srv JOIN tpar_area ar ON tt.id_area = ar.id_area JOIN tpar_empresas em ON ts.id_empresa_cliente = em.id_empresa JOIN tpry_proyecto py ON ts.id_proyecto = py.id_proyecto JOIN tsec_users us ON ts.id_user = us.id_user JOIN tflw_flows fl ON ts.id_survey = fl.id_survey LEFT JOIN ( SELECT id_flow, CASE WHEN COUNT(*) = 0 THEN 0 ELSE ROUND( 100.0 * SUM( CASE WHEN UPPER(estado) = 'APROBADO' THEN 1 ELSE 0 END ) / COUNT(*) , 2) END AS pct_avance FROM tflw_flow_steps GROUP BY id_flow ) avance ON avance.id_flow = fl.id_flow WHERE DATE(ts.fecha_plan_ini) >= DATE('$fecha_desde') AND DATE(ts.fecha_plan_fin) <= DATE('$fecha_hasta') ORDER BY ts.id_survey",
    "where": true
  }

  ,
  {
    "uri": "/leanglobal/flujosAprobacionSteps",
    "tipo": "normal",
    "query": "select fws.id_flow, fws.id_flow_stp, fws.flow_tmpl_step_orden, fws.flow_tmpl_step_fase, tmpl.flow_tmpl_step_name, fws.flag_equipo, fws.flag_flow_fin, fws.id_user, us.name_frst || ' ' || us.name_sec || ' ' || us.apellido_pat as nombre_user, fws.id_rol, fws.flow_step_obs, fws.fecha_event, fws.id_doc_in, fl1.name_doc_orig name_doc_orig_in, fl1.name_doc_interno name_doc_interno_in, fws.id_doc_out, fl2.name_doc_orig name_doc_orig_out, fl2.name_doc_interno name_doc_interno_out, fws.estado, fws.id_motivo_rechazo, rl.name_rol, mr.motivo_rechazo from tflw_flow_steps fws left join tsec_users us on fws.id_user = us.id_user left join tsec_roles rl on fws.id_rol = rl.id_rol left join tflw_motivo_rechazo mr on fws.id_motivo_rechazo = mr.id_motivo_rechazo left join tfmg_file fl1 on fws.id_doc_in = fl1.id_doc left join tfmg_file fl2 on fws.id_doc_out = fl2.id_doc left join tflw_template_steps tmpl on fws.id_flow_tmpl_step = tmpl.id_flow_tmpl_step order by flow_tmpl_step_orden",
    "where": true
  }

  ,
  {
    "uri": "/leanglobal/obtnerMotivosRechazo",
    "tipo": "normal",
    "query": "select id_motivo_rechazo, id_empresa, motivo_rechazo from tflw_motivo_rechazo",
    "where": true
  }

  ,
  {
    "uri": "/leanglobal/obtenerRoles",
    "tipo": "normal",
    "query": "select id_rol, name_rol, description, flag_externo from tsec_roles",
    "where": false
  }
  ,
  {
    "uri": "/leanglobal/obtenerPermisos",
    "tipo": "normal",
    "query": "SELECT * FROM tsec_perm",
    "where": false
  }

 ,
  {
    "uri": "/leanglobal/obtenerUsuariosRoles",
    "tipo": "normal",
    "query": "select id_user, id_rol from tsec_user_roles",
    "where": false
  }

  ,
  {
    "nombre": "/calidad/dashboard/general/protocolosPlanificados",
    "uri": "/calidad/dashboard/general/protocolosPlanificados",
    "comentario": "",
    "tipo": "indicador",
    "filtro": "v.id_empresa_cliente",
    "secatrib": "v.id_proyecto",
    "indicador": "SELECT COUNT(*) AS valor FROM vw_procesosSurvey v WHERE v.id_area = 1 and (v.fecha_plan_ini::timestamp)::date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (v.fecha_plan_ini::timestamp)::date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD') $filtro $secatrib ",
    "datos": " SELECT (v.fecha_real_fin::timestamp)::date AS serie, COUNT(*) AS cantidad FROM vw_procesosSurvey v WHERE v.id_area = 2 and (v.fecha_plan_ini::timestamp)::date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (v.fecha_plan_fin::timestamp)::date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD') $filtro $secatrib GROUP BY serie ORDER BY serie",
    "where": true
  },
  {
    "nombre": "/calidad/dashboard/general/protocolosAprobados",
    "uri": "/calidad/dashboard/general/protocolosAprobados",
    "comentario": "",
    "tipo": "indicador",
    "filtro": "v.id_empresa_cliente",
    "secatrib": "v.id_proyecto",
    "indicador": "SELECT COUNT(*) AS valor FROM vw_procesosSurvey v WHERE v.id_area = 1 and v.estado_srv = 'APROBADO' and (v.fecha_real_ini::timestamp)::date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (v.fecha_real_ini::timestamp)::date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD') $filtro $secatrib ",
    "datos": " SELECT (v.fecha_real_fin::timestamp)::date AS serie, COUNT(*) AS cantidad FROM vw_procesosSurvey v WHERE v.id_area = 2 and v.estado_srv = 'APROBADO' and  (v.fecha_real_ini::timestamp)::date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (v.fecha_real_fin::timestamp)::date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD') $filtro $secatrib GROUP BY serie ORDER BY serie",
    "where": true
  }
  ,
  {
    "nombre": "/calidad/dashboard/general/protocolosRechazados",
    "uri": "/calidad/dashboard/general/protocolosRechazados",
    "comentario": "",
    "tipo": "indicador",
    "filtro": "v.id_empresa_cliente",
    "secatrib": "v.id_proyecto",
    "indicador": "SELECT COUNT(*) AS valor FROM vw_procesosSurvey v WHERE v.id_area = 1 and v.estado_srv = 'RECHAZADO' and (v.fecha_real_ini::timestamp)::date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (v.fecha_real_ini::timestamp)::date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD') $filtro $secatrib",
    "datos": " SELECT (v.fecha_real_fin::timestamp)::date AS serie, COUNT(*) AS cantidad FROM vw_procesosSurvey v WHERE v.id_area = 2 and v.estado_srv = 'RECHAZADO' and  (v.fecha_real_ini::timestamp)::date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (v.fecha_real_fin::timestamp)::date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD') $filtro $secatrib GROUP BY serie ORDER BY serie",
    "where": true
  }
  ,
  {
    "nombre": "/calidad/dashboard/general/protocolosPendientes",
    "uri": "/calidad/dashboard/general/protocolosPendientes",
    "comentario": "",
    "tipo": "indicador",
    "filtro": "v.id_empresa_cliente",
    "secatrib": "v.id_proyecto",
    "indicador": "SELECT COUNT(*) AS valor FROM vw_procesosSurvey v WHERE v.id_area = 1 and v.estado_srv not in ('APROBADO','RECHAZADO') and (v.fecha_plan_ini::timestamp)::date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (v.fecha_plan_ini::timestamp)::date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD') $filtro $secatrib ",
    "datos": " SELECT (v.fecha_real_fin::timestamp)::date AS serie, COUNT(*) AS cantidad FROM vw_procesosSurvey v WHERE v.id_area = 2 and v.estado_srv not in ('APROBADO','RECHAZADO') and  (v.fecha_plan_ini::timestamp)::date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (v.fecha_plan_fin::timestamp)::date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD') $filtro $secatrib GROUP BY serie ORDER BY serie",
    "where": true
  }
  ,
  {
    "nombre": "/calidad/dashboard/familias/movimientoTierras",
    "uri": "/calidad/dashboard/familias/movimientoTierras",
    "comentario": "",
    "tipo": "indicador",
    "filtro": "v.id_empresa_cliente",
    "secatrib": "v.id_proyecto",
    "indicador": "SELECT COUNT(*) AS valor FROM vw_procesosSurvey v WHERE v.name_tipo_srv = 'Movimiento de tierras' and (v.fecha_plan_ini::timestamp)::date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (v.fecha_plan_ini::timestamp)::date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD') $filtro $secatrib",
    "datos": " SELECT (v.fecha_real_fin::timestamp)::date AS serie, COUNT(*) AS cantidad FROM vw_procesosSurvey v WHERE v.name_tipo_srv = 'Movimiento de tierras' and  (v.fecha_plan_ini::timestamp)::date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (v.fecha_plan_fin::timestamp)::date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD') $filtro $secatrib GROUP BY serie ORDER BY serie",
    "where": true
  }

  ,
  {
    "nombre": "/calidad/dashboard/familias/areaMecanica",
    "uri": "/calidad/dashboard/familias/areaMecanica",
    "comentario": "",
    "tipo": "indicador",
    "filtro": "v.id_empresa_cliente",
    "secatrib": "v.id_proyecto",
    "indicador": "SELECT COUNT(*) AS valor FROM vw_procesosSurvey v WHERE v.name_tipo_srv = 'Area Mecánica' and (v.fecha_plan_ini::timestamp)::date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (v.fecha_plan_ini::timestamp)::date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD') $filtro $secatrib",
    "datos": " SELECT (v.fecha_real_fin::timestamp)::date AS serie, COUNT(*) AS cantidad FROM vw_procesosSurvey v WHERE v.name_tipo_srv = 'Area Mecánica' and  (v.fecha_plan_ini::timestamp)::date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (v.fecha_plan_fin::timestamp)::date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD') $filtro $secatrib GROUP BY serie ORDER BY serie",
    "where": true
  }

  ,
  {
    "nombre": "/calidad/dashboard/familias/cierreReconstruccion",
    "uri": "/calidad/dashboard/familias/cierreReconstruccion",
    "comentario": "",
    "tipo": "indicador",
    "filtro": "v.id_empresa_cliente",
    "secatrib": "v.id_proyecto",
    "indicador": "SELECT COUNT(*) AS valor FROM vw_procesosSurvey v WHERE v.name_tipo_srv = 'Cierre y Restitución' and (v.fecha_plan_ini::timestamp)::date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (v.fecha_plan_ini::timestamp)::date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD') $filtro $secatrib",
    "datos": " SELECT (v.fecha_real_fin::timestamp)::date AS serie, COUNT(*) AS cantidad FROM vw_procesosSurvey v WHERE v.name_tipo_srv = 'Cierre y Restitución' and  (v.fecha_plan_ini::timestamp)::date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (v.fecha_plan_fin::timestamp)::date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD') $filtro $secatrib GROUP BY serie ORDER BY serie",
    "where": true
  }

  ,
  {
    "nombre": "/calidad/dashboard/familias/ensayosPruebas",
    "uri": "/calidad/dashboard/familias/ensayosPruebas",
    "comentario": "",
    "tipo": "indicador",
    "filtro": "v.id_empresa_cliente",
    "secatrib": "v.id_proyecto",
    "indicador": "SELECT COUNT(*) AS valor FROM vw_procesosSurvey v WHERE v.name_tipo_srv = 'Ensayos y Pruebas' and (v.fecha_plan_ini::timestamp)::date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (v.fecha_plan_ini::timestamp)::date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD') $filtro $secatrib",
    "datos": " SELECT (v.fecha_real_fin::timestamp)::date AS serie, COUNT(*) AS cantidad FROM vw_procesosSurvey v WHERE v.name_tipo_srv = 'Ensayos y Pruebas' and  (v.fecha_plan_ini::timestamp)::date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (v.fecha_plan_fin::timestamp)::date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD') $filtro $secatrib GROUP BY serie ORDER BY serie",
    "where": true
  }

  ,
  {
    "nombre": "/calidad/dashboard/familias/crucesTuneles",
    "uri": "/calidad/dashboard/familias/crucesTuneles",
    "comentario": "",
    "tipo": "indicador",
    "filtro": "v.id_empresa_cliente",
    "secatrib": "v.id_proyecto",
    "indicador": "SELECT COUNT(*) AS valor FROM vw_procesosSurvey v WHERE v.name_tipo_srv = 'Cruces y Túneles' and (v.fecha_plan_ini::timestamp)::date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (v.fecha_plan_ini::timestamp)::date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD') $filtro $secatrib",
    "datos": " SELECT (v.fecha_real_fin::timestamp)::date AS serie, COUNT(*) AS cantidad FROM vw_procesosSurvey v WHERE v.name_tipo_srv = 'Cruces y Túneles' and  (v.fecha_plan_ini::timestamp)::date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (v.fecha_plan_fin::timestamp)::date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD') $filtro $secatrib GROUP BY serie ORDER BY serie",
    "where": true
  }

   ,
  {
    "nombre": "/calidad/dashboard/familias/conexiones",
    "uri": "/calidad/dashboard/familias/conexiones",
    "comentario": "",
    "tipo": "indicador",
    "filtro": "v.id_empresa_cliente",
    "secatrib": "v.id_proyecto",
    "indicador": "SELECT COUNT(*) AS valor FROM vw_procesosSurvey v WHERE v.name_tipo_srv = 'Conexiones y Reparaciones' and (v.fecha_plan_ini::timestamp)::date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (v.fecha_plan_ini::timestamp)::date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD') $filtro $secatrib",
    "datos": " SELECT (v.fecha_real_fin::timestamp)::date AS serie, COUNT(*) AS cantidad FROM vw_procesosSurvey v WHERE v.name_tipo_srv = 'Conexiones y Reparaciones' and  (v.fecha_plan_ini::timestamp)::date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (v.fecha_plan_fin::timestamp)::date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD') $filtro $secatrib GROUP BY serie ORDER BY serie",
    "where": true
  }

  ,
  {
    "nombre": "/calidad/dashboard/familias/senalizacion",
    "uri": "/calidad/dashboard/familias/senalizacion",
    "comentario": "",
    "tipo": "indicador",
    "filtro": "v.id_empresa_cliente",
    "secatrib": "v.id_proyecto",
    "indicador": "SELECT COUNT(*) AS valor FROM vw_procesosSurvey v WHERE v.name_tipo_srv = 'Señalización y Control' and (v.fecha_plan_ini::timestamp)::date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (v.fecha_plan_ini::timestamp)::date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD') $filtro $secatrib",
    "datos": " SELECT (v.fecha_real_fin::timestamp)::date AS serie, COUNT(*) AS cantidad FROM vw_procesosSurvey v WHERE v.name_tipo_srv = 'Señalización y Control' and  (v.fecha_plan_ini::timestamp)::date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (v.fecha_plan_fin::timestamp)::date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD') $filtro $secatrib GROUP BY serie ORDER BY serie",
    "where": true
  }

  ,
  {
    "nombre": "/calidad/dashboard/familias/previas",
    "uri": "/calidad/dashboard/familias/previas",
    "comentario": "",
    "tipo": "indicador",
    "filtro": "v.id_empresa_cliente",
    "secatrib": "v.id_proyecto",
    "indicador": "SELECT COUNT(*) AS valor FROM vw_procesosSurvey v WHERE v.name_tipo_srv = 'Obras Previas' and (v.fecha_plan_ini::timestamp)::date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (v.fecha_plan_ini::timestamp)::date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD') $filtro $secatrib",
    "datos": " SELECT (v.fecha_real_fin::timestamp)::date AS serie, COUNT(*) AS cantidad FROM vw_procesosSurvey v WHERE v.name_tipo_srv = 'Obras Previas' and  (v.fecha_plan_ini::timestamp)::date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (v.fecha_plan_fin::timestamp)::date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD') $filtro $secatrib GROUP BY serie ORDER BY serie",
    "where": true
  }

  ,
  {
    "nombre": "/calidad/dashboard/familias/obras",
    "uri": "/calidad/dashboard/familias/obras",
    "comentario": "",
    "tipo": "indicador",
    "filtro": "v.id_empresa_cliente",
    "secatrib": "v.id_proyecto",    "indicador": "SELECT COUNT(*) AS valor FROM vw_procesosSurvey v WHERE v.name_tipo_srv = 'Obras Civiles' and (v.fecha_plan_ini::timestamp)::date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (v.fecha_plan_ini::timestamp)::date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD') $filtro $secatrib",
    "datos": " SELECT (v.fecha_real_fin::timestamp)::date AS serie, COUNT(*) AS cantidad FROM vw_procesosSurvey v WHERE v.name_tipo_srv = 'Obras Civiles' and  (v.fecha_plan_ini::timestamp)::date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (v.fecha_plan_fin::timestamp)::date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD') $filtro $secatrib GROUP BY serie ORDER BY serie",
    "where": true
  }

  ,
  {
    "nombre": "/flow/general/cantidadFlujos",
    "uri": "/flow/general/cantidadFlujos",
    "comentario": "",
    "tipo": "indicador",
    "secatrib": "nombre",
    "teratrib": "edad",
    "in": "ciudad",
    "indicador": " SELECT COUNT(*) AS valor FROM tflw_flows WHERE (fecha_inicio :: timestamp) :: date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (fecha_cierre :: timestamp) :: date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD')",
    "datos": " SELECT (v.fecha_real_fin::timestamp)::date AS serie, COUNT(*) AS cantidad FROM vw_procesosSurvey v WHERE v.name_tipo_srv = 'Obras Civiles' and  (v.fecha_plan_ini::timestamp)::date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (v.fecha_plan_fin::timestamp)::date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD') GROUP BY serie ORDER BY serie",
    "where": true
  }

  ,
  {
    uri: '/ma/kpi/medioAmbiente',
    tipo: 'indicador',
		filtro: 'id_empresa_cliente',
		secatrib: 'id_proyecto',

    indicador: `
      SELECT avg(desempeno_num) AS valor
      FROM vw_ma_kpi_medio_ambiente
      WHERE (fecha_real_ini :: timestamp) :: date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD')
        AND (fecha_real_ini :: timestamp) :: date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD')
        $filtro
        $secatrib
    `,
    datos: `
      SELECT desempeno_num AS valor, fecha_real_ini AS fecha
      FROM vw_ma_kpi_medio_ambiente
      WHERE (fecha_real_ini :: timestamp) :: date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD')
        AND (fecha_real_ini :: timestamp) :: date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD')
    `,
    where: true
  }

  ,
  {
    "nombre": "/ma/kpi/medioAmbienteDocumentos",
    "uri": "/ma/kpi/medioAmbienteDocumentos",
    "comentario": "",
    "tipo": "indicador",
    "secatrib": "nombre",
    "teratrib": "edad",
    "in": "ciudad",
    "indicador": " SELECT * FROM vw_ma_kpi_medio_ambiente_documentos WHERE (fecha_real_ini :: timestamp) :: date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (fecha_real_ini :: timestamp) :: date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD')",
    "datos": " SELECT * FROM vw_ma_kpi_medio_ambiente_documentos WHERE (fecha_real_ini :: timestamp) :: date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (fecha_real_ini :: timestamp) :: date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD')",
    "where": true
  }
  ,
  {
    "nombre": "/ma/kpi/evalDesemAm",
    "uri": "/ma/kpi/evalDesemAm",
    "comentario": "",
    "tipo": "indicador",
    "secatrib": "nombre",
    "teratrib": "edad",
    "in": "ciudad",
    "indicador": " SELECT avg(promedio) AS valor FROM vw_ma_kpi_eval_desem_ambiental WHERE (fecha_real_ini :: timestamp) :: date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (fecha_real_ini :: timestamp) :: date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD')",
    "datos": " SELECT id_survey, promedio AS valor, mx_impactos_ma valor1, mx_legal valor2, politica valor3, plan_riesgos valor4, gest_amb valor5, fecha_real_ini, fecha_plan_ini, nombre, codigo, ejecutor, id_doc, estado_srv FROM vw_ma_kpi_eval_desem_ambiental WHERE (fecha_real_ini :: timestamp) :: date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (fecha_real_ini :: timestamp) :: date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD')",
    "where": true
  }
  ,
  {
    "nombre": "/ma/kpi/evalDesemAmMxImpMA",
    "uri": "/ma/kpi/evalDesemAmMxImpMA",
    "comentario": "",
    "tipo": "indicador",
    "secatrib": "nombre",
    "teratrib": "edad",
    "in": "ciudad",
    "indicador": " SELECT avg(mx_impactos_ma) AS valor FROM vw_ma_kpi_eval_desem_ambiental WHERE (fecha_real_ini :: timestamp) :: date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (fecha_real_ini :: timestamp) :: date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD')",
    "datos": " SELECT id_survey, promedio AS valor, mx_impactos_ma valor1, mx_legal valor2, politica valor3, plan_riesgos valor4, gest_amb valor5, fecha_real_ini, fecha_plan_ini, nombre, codigo, ejecutor, id_doc, estado_srv FROM vw_ma_kpi_eval_desem_ambiental WHERE (fecha_real_ini :: timestamp) :: date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (fecha_real_ini :: timestamp) :: date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD')",
    "where": true
  }
  ,
  {
    "nombre": "/ma/kpi/evalDesemAmLegal",
    "uri": "/ma/kpi/evalDesemAmLegal",
    "comentario": "",
    "tipo": "indicador",
    "secatrib": "nombre",
    "teratrib": "edad",
    "in": "ciudad",
    "indicador": " SELECT avg(mx_legal) AS valor FROM vw_ma_kpi_eval_desem_ambiental WHERE (fecha_real_ini :: timestamp) :: date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (fecha_real_ini :: timestamp) :: date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD')",
    "datos": " SELECT id_survey, promedio AS valor, mx_impactos_ma valor1, mx_legal valor2, politica valor3, plan_riesgos valor4, gest_amb valor5, fecha_real_ini, fecha_plan_ini, nombre, codigo, ejecutor, id_doc, estado_srv FROM vw_ma_kpi_eval_desem_ambiental WHERE (fecha_real_ini :: timestamp) :: date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (fecha_real_ini :: timestamp) :: date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD')",
    "where": true
  }
  ,
  {
    "nombre": "/ma/kpi/evalDesemAmPolitica",
    "uri": "/ma/kpi/evalDesemAmPolitica",
    "comentario": "",
    "tipo": "indicador",
    "secatrib": "nombre",
    "teratrib": "edad",
    "in": "ciudad",
    "indicador": " SELECT avg(politica) valor FROM vw_ma_kpi_eval_desem_ambiental WHERE (fecha_real_ini :: timestamp) :: date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (fecha_real_ini :: timestamp) :: date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD')",
    "datos": " SELECT id_survey, politica valor, fecha_real_ini, fecha_plan_ini, nombre, codigo, ejecutor, id_doc, estado_srv FROM vw_ma_kpi_eval_desem_ambiental WHERE (fecha_real_ini :: timestamp) :: date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (fecha_real_ini :: timestamp) :: date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD')",
    "where": true
  }

  ,
  {
    "nombre": "/ma/kpi/evalDesemAmRiesgos",
    "uri": "/ma/kpi/evalDesemAmRiesgos",
    "comentario": "",
    "tipo": "indicador",
    "secatrib": "nombre",
    "teratrib": "edad",
    "in": "ciudad",
    "indicador": " SELECT avg(plan_riesgos) AS valor FROM vw_ma_kpi_eval_desem_ambiental WHERE (fecha_real_ini :: timestamp) :: date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (fecha_real_ini :: timestamp) :: date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD')",
    "datos": " SELECT id_survey, plan_riesgos valor, gest_amb valor5, fecha_real_ini, fecha_plan_ini, nombre, codigo, ejecutor, id_doc, estado_srv FROM vw_ma_kpi_eval_desem_ambiental WHERE (fecha_real_ini :: timestamp) :: date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (fecha_real_ini :: timestamp) :: date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD')",
    "where": true
  }
  ,
  {
    "nombre": "/ma/kpi/evalDesemAmGestion",
    "uri": "/ma/kpi/evalDesemAmGestion",
    "comentario": "",
    "tipo": "indicador",
    "secatrib": "nombre",
    "teratrib": "edad",
    "in": "ciudad",
    "indicador": " SELECT avg(gest_amb) valor FROM vw_ma_kpi_eval_desem_ambiental WHERE (fecha_real_ini :: timestamp) :: date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (fecha_real_ini :: timestamp) :: date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD')",
    "datos": " SELECT id_survey, gest_amb valor, fecha_real_ini, fecha_plan_ini, nombre, codigo, ejecutor, id_doc, estado_srv FROM vw_ma_kpi_eval_desem_ambiental WHERE (fecha_real_ini :: timestamp) :: date >= TO_DATE('$fecha_desde', 'YYYY-MM-DD') AND (fecha_real_ini :: timestamp) :: date <= TO_DATE('$fecha_hasta', 'YYYY-MM-DD')",
    "where": true
  }
  ,
  {
    "uri": "/leanglobal/obtenerNortificaciones",
    "tipo": "normal",
    "query": "select id_notification, id_user_target, json_data, channels from tntf_notfqueue where estado = 'PENDING'",
    "where": true
  }

  ,

  {
    "nombre": "/leanglobal/seguridad/obtenerPersonalizados",
    "uri": "/leanglobal/seguridad/obtenerPersonalizados",
    "comentario": "Consulta de Personalizados",
    "tipo": "indicador",
    "secatrib": "id_empresa",
    "teratrib": "id_proyecto",
    "indicador": "select 1 valor",
    "datos": "SELECT p.id_personalizado, p.id_empresa_cliente, cli.name_empresa AS nombre_cliente, p.id_proyecto, pr.nombre_proyecto, COALESCE(us.name_frst || ' ' || us.name_sec || ' ' || us.apellido_pat, 'SIN USUARIO') AS nombre_user, p.periodo, p.id_rol, r.name_rol, p.cantidad_usuarios, p.fecha_inicio_plan, p.fecha_fin_plan, p.fecha_inicio_real, p.fecha_fin_real, p.porcentaje_avance, p.cantidad_actividades, p.actividades_programadas, p.actividades_terminadas, p.actividades_atrasadas, p.actividades_verificacion FROM tsrv_personalizados p JOIN tpar_empresas cli ON p.id_empresa_cliente = cli.id_empresa JOIN tpry_proyecto pr ON p.id_proyecto = pr.id_proyecto JOIN tsec_roles r ON p.id_rol = r.id_rol LEFT JOIN tsec_users us ON p.id_user_creacion = us.id_user WHERE p.fecha_inicio_plan >= TO_DATE('$fecha_desde', 'yyyy-mm-dd') AND p.fecha_fin_plan <= TO_DATE('$fecha_hasta', 'yyyy-mm-dd') $secatrib $teratrib $in "
  }

  ,
  {
    "uri": "/leanglobal/obtenerPeriodos",
    "tipo": "normal",
    "query": "select periodo, fecha_ini, fecha_fin, estado, id_usuario_creador, fecha_creacion from tsrv_periodos",
    "where": true
  }
  ,

  {
    "uri": "/leanglobal/obtenerActividadesSurvey",
    "tipo": "normal",
    "query": "SELECT ts.id_personalizado, ts.id_survey, te.name_template_srv, te.codi_template_srv, ts.id_user, COALESCE( NULLIF(CONCAT_WS(' ', us.name_frst, us.name_sec, us.apellido_pat), ''), 'SIN USUARIO' ) AS nombre_user, TO_CHAR(ts.fecha_plan_ini, 'YYYY-MM-DD') AS fecha_plan_ini, TO_CHAR(ts.fecha_real_fin, 'YYYY-MM-DD HH24:MI') AS fecha_real_fin, TO_CHAR(ts.fecha_verif_fin, 'YYYY-MM-DD HH24:MI') AS fecha_verif_fin, ts.estado_srv, CASE WHEN ts.fecha_real_fin IS NULL THEN CASE WHEN ts.fecha_plan_fin < CURRENT_DATE THEN 'Rojo' WHEN ts.fecha_plan_fin BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '1 day' THEN 'Amarillo' WHEN ts.fecha_plan_fin > CURRENT_DATE + INTERVAL '1 day' THEN 'Azul' ELSE 'Desconocido' END ELSE 'Verde' END AS estado_color, fl.name_doc_interno AS id_doc FROM tsrv_survey ts JOIN tsrv_templates te ON ts.id_template = te.id_template JOIN tsec_users us ON ts.id_user = us.id_user LEFT JOIN vw_flow_last_doc d ON ts.id_flow = d.id_flow LEFT JOIN tfmg_file fl ON d.max_id_doc = fl.id_doc WHERE ts.id_personalizado IS NOT NULL",
    "where": true
  }

  ,

  {
    "uri": "/leanglobal/obtenerEquiposProyectos",
    "tipo": "normal",
    "query": "SELECT * from tpry_equipo_proyecto",
    "where": true
  }

  ,

  {
    uri: '/leanglobal/obtenerEquiposProyectosMiembros',
    tipo: 'normal',
    query: `
      SELECT
        e.id_proyecto,
        e.id_equipo_proyecto,
        e.nombre_equipo,
        e.descripcion_equipo,
        e.estado_equipo,
        e.id_usuario_lider,
        m.id_user,
        COALESCE(
          NULLIF(CONCAT_WS(' ', u.name_frst, u.name_sec, u.apellido_pat), ''),
          'SIN USUARIO'
        ) AS nombre_user,
        COALESCE(m.activo, false) AS activo
      FROM tpry_equipo_proyecto e
      LEFT JOIN tpry_equipo_miembro m
        ON e.id_equipo_proyecto = m.id_equipo_proyecto
      LEFT JOIN tsec_users u
        ON m.id_user = u.id_user
      ORDER BY e.id_equipo_proyecto DESC, nombre_user ASC
    `,
    where: false
  }

  ,

  {
    "uri": "/leanglobal/obtenerEquiposProyectosMiembrosFES",
    "tipo": "normal",
    "query": "SELECT e.id_proyecto, e.id_equipo_proyecto, fes.id_usuario, COALESCE( NULLIF(CONCAT_WS(' ', u.name_frst, u.name_sec, u.apellido_pat), ''), 'SIN USUARIO' ) nombre_user, fes.id_flow, fes.id_flow_step, fes.estado_fes, fes.fecha_fes from tpry_equipo_proyecto e, tflw_fes_colectiva fes, tsec_users u where e.id_equipo_proyecto = fes.id_equipo_proyecto and fes.id_usuario = u.id_user",
    "where": false
  }

  ,

  {
    "uri": "/leanglobal/obtenerGantts",
    "tipo": "normal",
    "query": "SELECT g.* from tpry_gantt g",
    "where": true
  }

  ,

  {
    "uri": "/leanglobal/obtenerGanttsTareas",
    "tipo": "normal",
    "query": "SELECT gt.* from tpry_gantt_tarea gt",
    "where": true
  }
  ,
  {
    "uri": "/leanglobal/obtenerGanttsTareasV2",
    "tipo": "normal",
    "query": "SELECT gt.* from tpry_gantt_tarea_V2 gt",
    "where": true
  },
  {
    "uri": "/leanglobal/obtenerGanttsTareasV3",
    "tipo": "normal",
    "query": "SELECT gt.* from tpry_gantt_tarea_V3 gt",
    "where": true
  },

  {
    "uri": "/leanglobal/obtenerTareasData",
    "tipo": "normal",
    "query": `
      SELECT
        t.id_tarea,
        t.id_tarea_padre,
        t.id_gantt,
        t.id_proyecto,
        t.nivel,
        t.nombre_tarea,
        t.unidad,
        elemento ->> 'fecha' AS fecha,
        elemento ->> 'value' AS value,
        elemento ->> 'real' AS real,
        t.json_data
      FROM tpry_gantt_tarea AS t
      LEFT JOIN LATERAL jsonb_array_elements(
        CASE
          WHEN jsonb_typeof(t.json_data::jsonb) = 'array' THEN t.json_data::jsonb
          ELSE '[]'::jsonb
        END
      ) AS elemento ON true
    `,
    "where": true
  },
  {
    "uri": "/leanglobal/obtenerTareasDataV2",
    "tipo": "normal",
    "query": `
      SELECT
        t.id_tarea,
        t.id_tarea_padre,
        t.id_gantt,
        t.id_proyecto,
        t.nivel,
        t.nombre_tarea,
        t.unidad,
        elemento ->> 'fecha' AS fecha,
        elemento ->> 'value' AS value,
        elemento ->> 'real' AS real,
        t.json_data
      FROM tpry_gantt_tarea_V2 AS t
      LEFT JOIN LATERAL jsonb_array_elements(
        CASE
          WHEN jsonb_typeof(t.json_data::jsonb) = 'array' THEN t.json_data::jsonb
          ELSE '[]'::jsonb
        END
      ) AS elemento ON true
    `,
    "where": true
  }

  ,

  {
    "uri": "/leanglobal/obtenerGanttPlanReal",
    "tipo": "normal",
    "query": "SELECT * from vw_gantt_avance_diario_v3",
    "where": true
  },
  // Seguridad
	{
		uri: '/seg/kpi/seguridad',
		tipo: 'indicador',
		filtro: 'ts.id_empresa_cliente',
		secatrib: 'ts.id_proyecto',

		indicador: `
			SELECT
        COUNT(*) AS cantidad
      FROM vw_procesossurvey ts
      WHERE ts.id_area = 2
        AND ts.name_tipo_srv = 'Seguridad'
        AND DATE(ts.fecha_plan_ini) >= DATE('$fecha_desde')
        AND DATE(ts.fecha_plan_fin) <= DATE('$fecha_hasta')
        $filtro
        $secatrib
		`,
		datos: `
			SELECT
				1
			FROM
				tpar_area a
		`,
		where: true
	},

	// Personalizado
	{
		uri: '/seg/kpi/personalizado',
		tipo: 'indicador',
		filtro: 'v.id_empresa_cliente',
		secatrib: 'v.id_proyecto',

		indicador: `
        SELECT
				COUNT(*) AS valor
        FROM vw_procesossurvey v
			  WHERE
                v.id_area = 2
                and v.id_personalizado is not null
                and date(v.fecha_plan_ini) >= DATE('$fecha_desde')
                and date(v.fecha_plan_fin) <= DATE('$fecha_hasta')
                $filtro
                $secatrib
		`,
		datos: `
			SELECT
				a.id_area,
				a.name_area,
				t.name_tipo_srv, -- Este dato SIEMPRE saldrá
				tm.name_template_srv,  -- Este dato saldrá NULL si no existe template
				t.flag_personalizado
			FROM
				tpar_area a
				LEFT JOIN tsrv_tipo_template t   ON a.id_area = t.id_area
				LEFT JOIN tsrv_templates tm ON t.id_tipo_srv = tm.id_tipo_srv
			WHERE a.id_area = 2
			ORDER BY a.id_area, t.name_tipo_srv, tm.name_template_srv
		`,
		where: true
	},

	// Accidentabilidad
	{
		uri: '/seg/kpi/accidentabilidad',
		tipo: 'indicador',
		filtro: 'ts.id_empresa_cliente',
		secatrib: 'ts.id_proyecto',

		indicador: `
			SELECT
        COUNT(*) AS cantidad
      FROM vw_procesossurvey ts
      WHERE ts.id_area = 2
        AND ts.name_tipo_srv = 'Accidentabilidad'
        AND DATE(ts.fecha_plan_ini) >= DATE('$fecha_desde')
        AND DATE(ts.fecha_plan_fin) <= DATE('$fecha_hasta')
        $filtro
        $secatrib
		`,
		datos: `
			SELECT
				1
			FROM
				tpar_area a
		`,
		where: true
	},

	// Minsal Protocolos MINSAL
	{
		uri: '/seg/kpi/minsal',
		tipo: 'indicador',
		filtro: 'ts.id_empresa_cliente',
		secatrib: 'ts.id_proyecto',

		indicador: `
			SELECT
        COUNT(*) AS cantidad
      FROM vw_procesossurvey ts
      WHERE ts.id_area = 2
        AND ts.name_tipo_srv = 'Protocolos MINSAL'
        AND DATE(ts.fecha_plan_ini) >= DATE('$fecha_desde')
        AND DATE(ts.fecha_plan_fin) <= DATE('$fecha_hasta')
        $filtro
        $secatrib
		`,
		datos: `
			SELECT
				1
			FROM
				tpar_area a
		`,
		where: true
	},

	// Capacitaciones
	{
		uri: '/seg/kpi/capacitaciones',
		tipo: 'indicador',
		filtro: 'ts.id_empresa_cliente',
		secatrib: 'ts.id_proyecto',

		indicador: `
			SELECT
        COUNT(*) AS cantidad
      FROM vw_procesossurvey ts
      WHERE ts.id_area = 2
        AND ts.name_tipo_srv = 'Capacitaciones'
        AND DATE(ts.fecha_plan_ini) >= DATE('$fecha_desde')
        AND DATE(ts.fecha_plan_fin) <= DATE('$fecha_hasta')
        $filtro
        $secatrib
		`,
		datos: `
			SELECT
				1
			FROM
				tpar_area a
		`,
		where: true
	},

	// Campañas
	{
		uri: '/seg/kpi/campanas',
		tipo: 'indicador',
		filtro: 'ts.id_empresa_cliente',
		secatrib: 'ts.id_proyecto',

		indicador: `
			SELECT
        COUNT(*) AS cantidad
      FROM vw_procesossurvey ts
      WHERE ts.id_area = 2
        AND ts.name_tipo_srv = 'Campañas'
        AND DATE(ts.fecha_plan_ini) >= DATE('$fecha_desde')
        AND DATE(ts.fecha_plan_fin) <= DATE('$fecha_hasta')
        $filtro
        $secatrib
		`,
		datos: `
			SELECT
				1
			FROM
				tpar_area a
		`,
		where: true
	},

	// Auditoría
	{
		uri: '/seg/kpi/auditoria',
		tipo: 'indicador',
		filtro: 'ts.id_empresa_cliente',
		secatrib: 'ts.id_proyecto',

		indicador: `
			SELECT
        COUNT(*) AS cantidad
      FROM vw_procesossurvey ts
      WHERE ts.id_area = 2
        AND ts.name_tipo_srv = 'Auditoría'
        AND DATE(ts.fecha_plan_ini) >= DATE('$fecha_desde')
        AND DATE(ts.fecha_plan_fin) <= DATE('$fecha_hasta')
        $filtro
        $secatrib
		`,
		datos: `
			SELECT
				1
			FROM
				tpar_area a
		`,
		where: true
	}

  ,
	// Personalizado Tabla % Cumplimiento x Persona
	{
		uri: '/seg/kpi/personalizadoPctCumplimPers',
		tipo: 'indicador',
		filtro: 'v.id_empresa_cliente',
		secatrib: 'v.id_proyecto',

		indicador: `
        SELECT
				1 AS valor
        FROM vw_procesossurvey v
			  WHERE
                1 = 1
		`,
		datos: `
        SELECT
            -- Agrupadores principales del plan de trabajo
            t.id_personalizado,
            t.periodo,
            t.id_rol,
            -- Agrupadores por ejecución (Usuario y Protocolo)
            v.nombre_user,
            v.id_user,
            -- 1. Inspecciones Planificadas (Total)
            COUNT(v.id_survey) AS cantidad_inspecciones_planificadas,
            -- 2. Inspecciones Terminadas (v.estado = 'APROBADO')
            COUNT(CASE WHEN v.estado_srv = 'APROBADO' THEN v.id_survey END) AS cantidad_inspecciones_terminadas,
            -- 3. Inspecciones Atrasadas (v.estado_color = 'Rojo')
            COUNT(CASE WHEN v.estado_color = 'Rojo' THEN v.id_survey END) AS cantidad_inspecciones_atrasadas,
            -- 4. Inspecciones Pendientes (v.estado != 'APROBADO' AND NO es Terminada/Aprobada)
            -- Asumo que cualquier estado que NO sea 'APROBADO' es considerado "Pendiente" o en proceso.
            COUNT(CASE WHEN v.estado_srv <> 'APROBADO' THEN v.id_survey END) AS cantidad_inspecciones_pendientes,
            -- 5. Porcentaje de Cumplimiento (Terminadas / Planificadas)
            CAST(
                (COUNT(CASE WHEN v.estado_srv = 'APROBADO' THEN v.id_survey END) * 100.0) /
                NULLIF(COUNT(v.id_survey), 0)
            AS DECIMAL(5, 2)) AS porcentaje_cumplimiento
        FROM
            tsrv_personalizados t
        JOIN
            vw_procesossurvey v ON t.id_personalizado = v.id_personalizado
            WHERE
            DATE(v.fecha_plan_ini) >= DATE('$fecha_desde')
            AND DATE(v.fecha_plan_fin) <= DATE('$fecha_hasta')
            $filtro
            $secatrib
        GROUP BY
            t.id_personalizado,
            t.periodo,
            t.id_rol,
            v.nombre_user,
            v.id_user
        ORDER BY
            t.id_personalizado,
            v.nombre_user;

		`,
		where: true
	}
  ,
	// Personalizado Tabla % Cumplimiento x Persona Apertura por Surv
	{
		uri: '/seg/kpi/personalizadoPctCumplimPersSurv',
		tipo: 'normal',
		query: `
      SELECT
          -- Agrupadores principales del plan de trabajo
          t.id_personalizado,
          t.periodo,
          t.id_rol,

          -- Agrupadores por ejecución (Usuario y Protocolo)
          v.nombre_user,
          v.id_user,
          v.name_template_srv,

          -- 1. Inspecciones Planificadas (Total)
          COUNT(v.id_survey) AS cantidad_inspecciones_planificadas,

          -- 2. Inspecciones Terminadas (v.estado = 'APROBADO')
          COUNT(CASE WHEN v.estado_srv = 'APROBADO' THEN v.id_survey END) AS cantidad_inspecciones_terminadas,

          -- 3. Inspecciones Atrasadas (v.estado_color = 'Rojo')
          COUNT(CASE WHEN v.estado_color = 'Rojo' THEN v.id_survey END) AS cantidad_inspecciones_atrasadas,

          -- 4. Inspecciones Pendientes (v.estado != 'APROBADO' AND NO es Terminada/Aprobada)
          -- Asumo que cualquier estado que NO sea 'APROBADO' es considerado "Pendiente" o en proceso.
          COUNT(CASE WHEN v.estado_srv <> 'APROBADO' THEN v.id_survey END) AS cantidad_inspecciones_pendientes,

          -- 5. Porcentaje de Cumplimiento (Terminadas / Planificadas)
          CAST(
              (COUNT(CASE WHEN v.estado_srv = 'APROBADO' THEN v.id_survey END) * 100.0) /
              NULLIF(COUNT(v.id_survey), 0)
          AS DECIMAL(5, 2)) AS porcentaje_cumplimiento
      FROM
          tsrv_personalizados t
      JOIN
          vw_procesossurvey v ON t.id_personalizado = v.id_personalizado
      -- Filtros Opcionales: Puedes añadir WHERE aquí para limitar por fechas o estados si lo necesitas.
      -- WHERE
          -- t.id_personalizado = 123
      GROUP BY
          t.id_personalizado,
          t.periodo,
          t.id_rol,
          v.nombre_user,
          v.id_user,
          v.name_template_srv
      ORDER BY
          t.id_personalizado,
          v.nombre_user,
          v.name_template_srv

		`,
		where: true
	},
  // Calidad
  {
		uri: '/general/dashboard/kpi/calidad',
		tipo: 'indicador',
		filtro: 'ts.id_empresa_cliente',
		secatrib: 'ts.id_proyecto',
		indicador: `
			SELECT
        COUNT(*) AS valor
      FROM vw_procesossurvey ts
      WHERE ts.id_area = 1
        AND DATE(ts.fecha_plan_ini) >= DATE('$fecha_desde')
        AND DATE(ts.fecha_plan_fin) <= DATE('$fecha_hasta')
        $filtro
        $secatrib
		`,
		datos: `
			SELECT
				1
			FROM
				tpar_area a
		`,
		where: true
	},
  //Avance
  {
		uri: '/general/dashboard/kpi/avance',
		tipo: 'indicador',
		filtro: 'ts.id_empresa_cliente',
		secatrib: 'ts.id_proyecto',

		indicador: `
			SELECT
        COUNT(*) AS valor
      FROM vw_procesossurvey ts
      WHERE ts.id_area = 4
        AND DATE(ts.fecha_plan_ini) >= DATE('$fecha_desde')
        AND DATE(ts.fecha_plan_fin) <= DATE('$fecha_hasta')
        $filtro
        $secatrib
		`,
		datos: `
			SELECT
				1
			FROM
				tpar_area a
		`,
		where: true
	},
  //Seguridad
  {
		uri: '/general/dashboard/kpi/seguridad',
		tipo: 'indicador',
		filtro: 'ts.id_empresa_cliente',
		secatrib: 'ts.id_proyecto',

		indicador: `
			SELECT
        COUNT(*) AS valor
      FROM vw_procesossurvey ts
      WHERE ts.id_area = 2
        AND DATE(ts.fecha_plan_ini) >= DATE('$fecha_desde')
        AND DATE(ts.fecha_plan_fin) <= DATE('$fecha_hasta')
        $filtro
        $secatrib
		`,
		datos: `
			SELECT
				1
			FROM
				tpar_area a
		`,
		where: true
	},
  // Medio Ambiente
  {
		uri: '/general/dashboard/kpi/medioAmbiente',
		tipo: 'indicador',
		filtro: 'ts.id_empresa_cliente',
		secatrib: 'ts.id_proyecto',

		indicador: `
			SELECT
        COUNT(*) AS valor
      FROM vw_procesossurvey ts
      WHERE ts.id_area = 3
        AND DATE(ts.fecha_plan_ini) >= DATE('$fecha_desde')
        AND DATE(ts.fecha_plan_fin) <= DATE('$fecha_hasta')
        $filtro
        $secatrib
		`,
		datos: `
			SELECT
				1
			FROM
				tpar_area a
		`,
		where: true
	},
  // Aprobados
  {
		uri: '/general/dashboard/gestion/aprobados',
		tipo: 'indicador',
		filtro: 'ts.id_empresa_cliente',
		secatrib: 'ts.id_proyecto',

		indicador: `
			SELECT
        COUNT(*) AS valor
      FROM vw_procesossurvey ts
      WHERE ts.estado_srv = 'APROBADO'
        and ts.id_area not in (5,6,7)
        AND DATE(ts.fecha_plan_ini) >= DATE('$fecha_desde')
        AND DATE(ts.fecha_plan_fin) <= DATE('$fecha_hasta')
        $filtro
        $secatrib
		`,
		datos: `
			SELECT
				1
			FROM
				tpar_area a
		`,
		where: true
	},
  // Rechazados
  {
		uri: '/general/dashboard/gestion/rechazados',
		tipo: 'indicador',
		filtro: 'ts.id_empresa_cliente',
		secatrib: 'ts.id_proyecto',

		indicador: `
			SELECT
        COUNT(*) AS valor
      FROM vw_procesossurvey ts
      WHERE ts.estado_srv = 'RECHAZADO'
        and ts.id_area not in (5,6,7)
        AND DATE(ts.fecha_plan_ini) >= DATE('$fecha_desde')
        AND DATE(ts.fecha_plan_fin) <= DATE('$fecha_hasta')
        $filtro
        $secatrib
		`,
		datos: `
			SELECT
				1
			FROM
				tpar_area a
		`,
		where: true
	},
  // Pendientes Aprobación
  {
		uri: '/general/dashboard/gestion/pendientesAprobacion',
		tipo: 'indicador',
		filtro: 'ts.id_empresa_cliente',
		secatrib: 'ts.id_proyecto',

		indicador: `
			SELECT
        COUNT(*) AS valor
      FROM vw_procesossurvey ts
      WHERE ts.estado_srv = 'VERIFICACION'
        and ts.id_area not in (5,6,7)
        AND DATE(ts.fecha_plan_ini) >= DATE('$fecha_desde')
        AND DATE(ts.fecha_plan_fin) <= DATE('$fecha_hasta')
        $filtro
        $secatrib
		`,
		datos: `
			SELECT
				1
			FROM
				tpar_area a
		`,
		where: true
	},
  // Pendientes Ejecución
  {
		uri: '/general/dashboard/gestion/pendientesEjecucion',
		tipo: 'indicador',
		filtro: 'ts.id_empresa_cliente',
		secatrib: 'ts.id_proyecto',

		indicador: `
			SELECT
        COUNT(*) AS valor
      FROM vw_procesossurvey ts
      WHERE ts.estado_srv in ('Ejecución', 'Creado', 'Pre Creado')
        and ts.id_area not in (5,6,7)
        AND DATE(ts.fecha_plan_ini) >= DATE('$fecha_desde')
        AND DATE(ts.fecha_plan_fin) <= DATE('$fecha_hasta')
        $filtro
        $secatrib
		`,
		datos: `
			SELECT
				1
			FROM
				tpar_area a
		`,
		where: true
	},
  {
		uri: '/seg/tabla/capacitaciones',
		tipo: 'normal',
		query: `
      SELECT
          *
      FROM
          tsrv_personalizados t
		`,
		where: true
	},
  // Puede ser uno solo, por ejemplo asi
  /*[
    { label: 'Accidentes',                 value: 0.0, series: [0,0,0,0,0,0,0], decimals: 1, suffix: '' },
    { label: 'Días Perdidos',              value: 0.0, series: [0,0,0,0,0,0,0], decimals: 1, suffix: '' },
    { label: 'Promedio Trabajadores',      value: 0.0, series: [0,0,0,0,0,0,0], decimals: 1, suffix: '' },
    { label: 'Índice de Accidentabilidad', value: 0.0, series: [0,0,0,0,0,0,0], decimals: 1, suffix: '' },
    { label: 'Índice de Frecuencia',       value: 0.0, series: [0,0,0,0,0,0,0], decimals: 1, suffix: '' },
    { label: 'Índice de Gravedad',         value: 0.0, series: [0,0,0,0,0,0,0], decimals: 1, suffix: '' },
  ]*/
  {
		uri: '/seg/informacion/estadistica',
		tipo: 'normal',
		query: `
      SELECT
          *
      FROM
          tsrv_personalizados t
		`,
		where: true
	}
  ,
  {
    "uri": "/leanglobal/obtenerTipoProyecto",
    "tipo": "normal",
    "query": "SELECT * FROM tpry_tipo where id_proyecto_tipo <> -1"
  }

  ,
  {
    "uri": "/leanglobal/obtenerEstadoProyecto",
    "tipo": "normal",
    "query": "SELECT * FROM tpry_estado"
  }

  ,
  {
    "uri": "/leanglobal/obtenerProyectoUser",
    "tipo": "normal",
    "query": `
        SELECT DISTINCT
        p.id_proyecto,
        p.nombre_proyecto,
        ep.id_equipo_proyecto,
        ep.nombre_equipo,
        em.id_equipo_miembro,
        em.id_user,
        ur.id_rol,
        ro.name_rol
      FROM
          tpry_proyecto p
          LEFT JOIN
              tpry_equipo_proyecto ep ON p.id_proyecto = ep.id_proyecto
          LEFT JOIN
              tpry_equipo_miembro em ON ep.id_equipo_proyecto = em.id_equipo_proyecto
          LEFT JOIN
              tsec_user_roles ur ON em.id_user = ur.id_user
          LEFT JOIN
              tsec_roles ro ON ur.id_rol = ro.id_rol
      WHERE
          (
              ro.name_rol LIKE '%_EJEC' OR
              ro.name_rol LIKE '%_VERIF' OR
              ro.name_rol LIKE '%_APRB'
          )
    `,
    "where": true
  },
  {
    uri: '/leanglobal/obtenerTFMGFile',
    tipo: 'normal',
    query: `SELECT * FROM tfmg_file`,
    where: true
  },
  {
    uri: '/leanglobal/obtenerCNXLoad',
    tipo: 'normal',
    query: `SELECT L.*, F.*  FROM tfmg_cnx_load L LEFT JOIN tfmg_file F ON L.id_doc = F.id_doc`,
    where: true
  }
  ,
  {
    uri: '/leanglobal/obtenerPersonalExterno',
    tipo: 'normal',
    query: `
      SELECT
          u.*,
          f.name_doc_interno as photo_filename,
          json_agg(ur.id_rol) as roles_ids
      FROM
          tsec_users u
          JOIN tpar_empresas e ON u.id_empresa = e.id_empresa
          LEFT JOIN tfmg_file f ON (u.json_data->>'id_doc_photo')::integer = f.id_doc
          LEFT JOIN tsec_user_roles ur ON u.id_user = ur.id_user
      WHERE
          e.flag_externo = true
      GROUP BY
          u.id_user, f.name_doc_interno
    `,
    where: true
  },
  {
    uri: '/leanglobal/obtenerEquiposMoviles',
    tipo: 'normal',
    query: `
      SELECT
          e.id_equipo,
          e.marca,
          e.modelo,
          e.numero_serie,
          e.tipo_equipo as elemento,
          e.json_data->>'patente' as patente,
          e.json_data->>'id_usuario_asignado' as id_usuario_asignado,
          CONCAT(u.name_frst, ' ', u.apellido_pat) as nombre,
          e.json_data,
          e.observaciones,
          e.estado
      FROM
          tequ_equipo e
          LEFT JOIN tsec_users u ON (e.json_data->>'id_usuario_asignado')::integer = u.id_user
      WHERE
          e.tipo_equipo = 'EQUIPO MOVIL'
    `,
    where: true
  },
  {
    uri: '/leanglobal/obtenerDocumentacionResumen',
    tipo: 'normal',
    query: `
      SELECT
          id_equipo,
          id_acreditacion,
          registro_acreditacion,
          fecha_prox_calibracion,
          json_data
      FROM tequ_documentacion_equipo
    `,
    where: true
  },
  {
    uri: '/leanglobal/obtenerHistoricoConexion',
    tipo: 'normal',
    query: `
      SELECT *
      FROM tcnx_historico
    `,
    where: true
  }

  ,
  {
    uri: '/conexion/documentos/total',
    tipo: 'indicador',
    filtro: '1=1',
    secatrib: '1=1',
    indicador: `
      SELECT COUNT(*) as valor
      FROM tequ_equipo
      WHERE tipo_equipo = 'EQUIPO MOVIL' AND estado = true
    `,
    datos: `
      SELECT 'Total' as serie, COUNT(*) as cantidad
      FROM tequ_equipo
      WHERE tipo_equipo = 'EQUIPO MOVIL' AND estado = true
      GROUP BY serie
    `,
    where: true
  },
  {
    uri: '/conexion/documentos/vigentes',
    tipo: 'indicador',
    filtro: '1=1',
    secatrib: '1=1',
    indicador: `
      SELECT COUNT(*) as valor
      FROM tequ_documentacion_equipo d
      JOIN tequ_equipo e ON d.id_equipo = e.id_equipo
      WHERE e.tipo_equipo = 'EQUIPO MOVIL'
        AND d.fecha_prox_calibracion > CURRENT_DATE + INTERVAL '30 days'
    `,
    datos: `
      SELECT
        (COALESCE(e.marca,'') || ' ' || COALESCE(e.modelo,'') || ' (' || COALESCE(e.json_data->>'patente','?') || ')') as serie,
        Extract(day from (d.fecha_prox_calibracion - CURRENT_DATE))::int as cantidad
      FROM tequ_documentacion_equipo d
      JOIN tequ_equipo e ON d.id_equipo = e.id_equipo
      WHERE e.tipo_equipo = 'EQUIPO MOVIL'
        AND d.fecha_prox_calibracion > CURRENT_DATE + INTERVAL '30 days'
      ORDER BY cantidad ASC LIMIT 20
    `,
    where: true
  },
  {
    uri: '/conexion/documentos/porvencer',
    tipo: 'indicador',
    filtro: '1=1',
    secatrib: '1=1',
    indicador: `
      SELECT COUNT(*) as valor
      FROM tequ_documentacion_equipo d
      JOIN tequ_equipo e ON d.id_equipo = e.id_equipo
      WHERE e.tipo_equipo = 'EQUIPO MOVIL'
        AND d.fecha_prox_calibracion BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
    `,
    datos: `
      SELECT
        (COALESCE(e.marca,'') || ' ' || COALESCE(e.modelo,'') || ' (' || COALESCE(e.json_data->>'patente','?') || ')') as serie,
        Extract(day from (d.fecha_prox_calibracion - CURRENT_DATE))::int as cantidad
      FROM tequ_documentacion_equipo d
      JOIN tequ_equipo e ON d.id_equipo = e.id_equipo
      WHERE e.tipo_equipo = 'EQUIPO MOVIL'
        AND d.fecha_prox_calibracion BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
      ORDER BY cantidad ASC LIMIT 20
    `,
    where: true
  },
  {
    uri: '/conexion/documentos/vencidos',
    tipo: 'indicador',
    filtro: '1=1',
    secatrib: '1=1',
    indicador: `
      SELECT COUNT(*) as valor
      FROM tequ_documentacion_equipo d
      JOIN tequ_equipo e ON d.id_equipo = e.id_equipo
      WHERE e.tipo_equipo = 'EQUIPO MOVIL'
        AND d.fecha_prox_calibracion < CURRENT_DATE
    `,
    datos: `
      SELECT
        (COALESCE(e.marca,'') || ' ' || COALESCE(e.modelo,'') || ' (' || COALESCE(e.json_data->>'patente','?') || ')') as serie,
        ABS(Extract(day from (d.fecha_prox_calibracion - CURRENT_DATE)))::int as cantidad
      FROM tequ_documentacion_equipo d
      JOIN tequ_equipo e ON d.id_equipo = e.id_equipo
      WHERE e.tipo_equipo = 'EQUIPO MOVIL'
        AND d.fecha_prox_calibracion < CURRENT_DATE
      ORDER BY cantidad DESC LIMIT 20
    `,
    where: true
  }
  ,
  {
    uri: '/conexion/planificacion/total',
    tipo: 'indicador',
    filtro: 'ts.id_empresa_cliente',
    secatrib: 'ts.id_proyecto',
    indicador: `
      SELECT COUNT(*) AS valor
      FROM vw_procesossurvey ts
      WHERE ts.id_area = 8
        AND COALESCE(ts.id_template, 0) <> 153
        AND DATE(ts.fecha_plan_ini) >= DATE('$fecha_desde')
        AND DATE(ts.fecha_plan_fin) <= DATE('$fecha_hasta')
        $filtro
        $secatrib
    `,
    datos: `
      SELECT 'Total Plan' AS serie, COUNT(*) AS cantidad
      FROM vw_procesossurvey ts
      WHERE ts.id_area = 8
        AND COALESCE(ts.id_template, 0) <> 153
        AND DATE(ts.fecha_plan_ini) >= DATE('$fecha_desde')
        AND DATE(ts.fecha_plan_fin) <= DATE('$fecha_hasta')
        $filtro
        $secatrib
      GROUP BY serie
    `,
    where: true
  },
  {
    uri: '/conexion/planificacion/ejecutado',
    tipo: 'indicador',
    filtro: 'ts.id_empresa_cliente',
    secatrib: 'ts.id_proyecto',
    indicador: `
      SELECT COUNT(*) AS valor
      FROM vw_procesossurvey ts
      WHERE ts.id_area = 8
        AND COALESCE(ts.id_template, 0) <> 153
        AND DATE(ts.fecha_plan_ini) >= DATE('$fecha_desde')
        AND DATE(ts.fecha_plan_fin) <= DATE('$fecha_hasta')
        AND ts.fecha_real_fin IS NOT NULL
        $filtro
        $secatrib
    `,
    datos: `
      SELECT 'Ejecutado' AS serie, COUNT(*) AS cantidad
      FROM vw_procesossurvey ts
      WHERE ts.id_area = 8
        AND COALESCE(ts.id_template, 0) <> 153
        AND DATE(ts.fecha_plan_ini) >= DATE('$fecha_desde')
        AND DATE(ts.fecha_plan_fin) <= DATE('$fecha_hasta')
        AND ts.fecha_real_fin IS NOT NULL
        $filtro
        $secatrib
      GROUP BY serie
    `,
    where: true
  },
  {
    uri: '/conexion/planificacion/pendiente',
    tipo: 'indicador',
    filtro: 'ts.id_empresa_cliente',
    secatrib: 'ts.id_proyecto',
    indicador: `
      SELECT COUNT(*) AS valor
      FROM vw_procesossurvey ts
      WHERE ts.id_area = 8
        AND COALESCE(ts.id_template, 0) <> 153
        AND DATE(ts.fecha_plan_ini) >= DATE('$fecha_desde')
        AND DATE(ts.fecha_plan_fin) <= DATE('$fecha_hasta')
        AND ts.fecha_real_fin IS NULL
        $filtro
        $secatrib
    `,
    datos: `
      SELECT 'Pendiente' AS serie, COUNT(*) AS cantidad
      FROM vw_procesossurvey ts
      WHERE ts.id_area = 8
        AND COALESCE(ts.id_template, 0) <> 153
        AND DATE(ts.fecha_plan_ini) >= DATE('$fecha_desde')
        AND DATE(ts.fecha_plan_fin) <= DATE('$fecha_hasta')
        AND ts.fecha_real_fin IS NULL
        $filtro
        $secatrib
      GROUP BY serie
    `,
    where: true
  },
  {
    uri: '/conexion/planificacion/avance',
    tipo: 'indicador',
    filtro: 'ts.id_empresa_cliente',
    secatrib: 'ts.id_proyecto',
    indicador: `
      SELECT
        ROUND(
          COALESCE(
            (
              SUM(CASE WHEN ts.fecha_real_fin IS NOT NULL THEN 1 ELSE 0 END) * 100.0
            ) / NULLIF(COUNT(*), 0),
            0
          ),
          2
        ) AS valor
      FROM vw_procesossurvey ts
      WHERE ts.id_area = 8
        AND COALESCE(ts.id_template, 0) <> 153
        AND DATE(ts.fecha_plan_ini) >= DATE('$fecha_desde')
        AND DATE(ts.fecha_plan_fin) <= DATE('$fecha_hasta')
        $filtro
        $secatrib
    `,
    datos: `
      SELECT 'Avance' AS serie,
             ROUND(
               COALESCE(
                 (
                   SUM(CASE WHEN ts.fecha_real_fin IS NOT NULL THEN 1 ELSE 0 END) * 100.0
                 ) / NULLIF(COUNT(*), 0),
                 0
               ),
               2
             ) AS cantidad
      FROM vw_procesossurvey ts
      WHERE ts.id_area = 8
        AND COALESCE(ts.id_template, 0) <> 153
        AND DATE(ts.fecha_plan_ini) >= DATE('$fecha_desde')
        AND DATE(ts.fecha_plan_fin) <= DATE('$fecha_hasta')
        $filtro
        $secatrib
      GROUP BY serie
    `,
    where: true
  }  ,
  {
    uri: '/conexion/personal/total',
    tipo: 'indicador',
    filtro: '1=1',
    secatrib: '1=1',
    indicador: `
      SELECT COUNT(*) AS valor
      FROM tsec_users u
      JOIN tpar_empresas e ON e.id_empresa = u.id_empresa
      WHERE e.flag_externo = true
    `,
    datos: `
      SELECT 'Total Personal' AS serie, COUNT(*) AS cantidad
      FROM tsec_users u
      JOIN tpar_empresas e ON e.id_empresa = u.id_empresa
      WHERE e.flag_externo = true
      GROUP BY serie
    `,
    where: true
  },
  {
    uri: '/conexion/personal/vigentes',
    tipo: 'indicador',
    filtro: '1=1',
    secatrib: '1=1',
    indicador: `
      SELECT COUNT(*) AS valor
      FROM tsec_users u
      JOIN tpar_empresas e ON e.id_empresa = u.id_empresa
      WHERE e.flag_externo = true
        AND UPPER(COALESCE(u.json_data->'examenAltura'->>'estado', 'NA')) NOT IN ('VENCIDO', 'POR VENCER')
        AND UPPER(COALESCE(u.json_data->'clase3'->>'estado', 'NA')) NOT IN ('VENCIDO', 'POR VENCER')
        AND UPPER(COALESCE(u.json_data->'soldadura'->>'estado', 'NA')) NOT IN ('VENCIDO', 'POR VENCER')
        AND UPPER(COALESCE(u.json_data->'licenciaConducir'->>'estado', 'NA')) NOT IN ('VENCIDO', 'POR VENCER')
        AND UPPER(COALESCE(u.json_data->'cedulaIdentidad'->>'estado', 'NA')) NOT IN ('VENCIDO', 'POR VENCER')
    `,
    datos: `
      SELECT 'Doc Vigentes' AS serie, COUNT(*) AS cantidad
      FROM tsec_users u
      JOIN tpar_empresas e ON e.id_empresa = u.id_empresa
      WHERE e.flag_externo = true
        AND UPPER(COALESCE(u.json_data->'examenAltura'->>'estado', 'NA')) NOT IN ('VENCIDO', 'POR VENCER')
        AND UPPER(COALESCE(u.json_data->'clase3'->>'estado', 'NA')) NOT IN ('VENCIDO', 'POR VENCER')
        AND UPPER(COALESCE(u.json_data->'soldadura'->>'estado', 'NA')) NOT IN ('VENCIDO', 'POR VENCER')
        AND UPPER(COALESCE(u.json_data->'licenciaConducir'->>'estado', 'NA')) NOT IN ('VENCIDO', 'POR VENCER')
        AND UPPER(COALESCE(u.json_data->'cedulaIdentidad'->>'estado', 'NA')) NOT IN ('VENCIDO', 'POR VENCER')
      GROUP BY serie
    `,
    where: true
  },
  {
    uri: '/conexion/personal/porvencer',
    tipo: 'indicador',
    filtro: '1=1',
    secatrib: '1=1',
    indicador: `
      SELECT COUNT(*) AS valor
      FROM tsec_users u
      JOIN tpar_empresas e ON e.id_empresa = u.id_empresa
      WHERE e.flag_externo = true
        AND (
          UPPER(COALESCE(u.json_data->'examenAltura'->>'estado', 'NA')) = 'POR VENCER'
          OR UPPER(COALESCE(u.json_data->'clase3'->>'estado', 'NA')) = 'POR VENCER'
          OR UPPER(COALESCE(u.json_data->'soldadura'->>'estado', 'NA')) = 'POR VENCER'
          OR UPPER(COALESCE(u.json_data->'licenciaConducir'->>'estado', 'NA')) = 'POR VENCER'
          OR UPPER(COALESCE(u.json_data->'cedulaIdentidad'->>'estado', 'NA')) = 'POR VENCER'
        )
    `,
    datos: `
      SELECT 'Por Vencer' AS serie, COUNT(*) AS cantidad
      FROM tsec_users u
      JOIN tpar_empresas e ON e.id_empresa = u.id_empresa
      WHERE e.flag_externo = true
        AND (
          UPPER(COALESCE(u.json_data->'examenAltura'->>'estado', 'NA')) = 'POR VENCER'
          OR UPPER(COALESCE(u.json_data->'clase3'->>'estado', 'NA')) = 'POR VENCER'
          OR UPPER(COALESCE(u.json_data->'soldadura'->>'estado', 'NA')) = 'POR VENCER'
          OR UPPER(COALESCE(u.json_data->'licenciaConducir'->>'estado', 'NA')) = 'POR VENCER'
          OR UPPER(COALESCE(u.json_data->'cedulaIdentidad'->>'estado', 'NA')) = 'POR VENCER'
        )
      GROUP BY serie
    `,
    where: true
  },
  {
    uri: '/conexion/personal/vencidos',
    tipo: 'indicador',
    filtro: '1=1',
    secatrib: '1=1',
    indicador: `
      SELECT COUNT(*) AS valor
      FROM tsec_users u
      JOIN tpar_empresas e ON e.id_empresa = u.id_empresa
      WHERE e.flag_externo = true
        AND (
          UPPER(COALESCE(u.json_data->'examenAltura'->>'estado', 'NA')) = 'VENCIDO'
          OR UPPER(COALESCE(u.json_data->'clase3'->>'estado', 'NA')) = 'VENCIDO'
          OR UPPER(COALESCE(u.json_data->'soldadura'->>'estado', 'NA')) = 'VENCIDO'
          OR UPPER(COALESCE(u.json_data->'licenciaConducir'->>'estado', 'NA')) = 'VENCIDO'
          OR UPPER(COALESCE(u.json_data->'cedulaIdentidad'->>'estado', 'NA')) = 'VENCIDO'
        )
    `,
    datos: `
      SELECT 'Vencidos' AS serie, COUNT(*) AS cantidad
      FROM tsec_users u
      JOIN tpar_empresas e ON e.id_empresa = u.id_empresa
      WHERE e.flag_externo = true
        AND (
          UPPER(COALESCE(u.json_data->'examenAltura'->>'estado', 'NA')) = 'VENCIDO'
          OR UPPER(COALESCE(u.json_data->'clase3'->>'estado', 'NA')) = 'VENCIDO'
          OR UPPER(COALESCE(u.json_data->'soldadura'->>'estado', 'NA')) = 'VENCIDO'
          OR UPPER(COALESCE(u.json_data->'licenciaConducir'->>'estado', 'NA')) = 'VENCIDO'
          OR UPPER(COALESCE(u.json_data->'cedulaIdentidad'->>'estado', 'NA')) = 'VENCIDO'
        )
      GROUP BY serie
    `,
    where: true
  },
  {
    uri: '/conexion/asistencia/total',
    tipo: 'indicador',
    filtro: '1=1',
    secatrib: '1=1',
    indicador: `
      SELECT COUNT(*) AS valor
      FROM tfmg_file f
      WHERE UPPER(COALESCE(f.tipo_documento, '')) = 'REGISTRO DE ASISTENCIA'
    `,
    datos: `
      SELECT 'Total Asistencia' AS serie, COUNT(*) AS cantidad
      FROM tfmg_file f
      WHERE UPPER(COALESCE(f.tipo_documento, '')) = 'REGISTRO DE ASISTENCIA'
      GROUP BY serie
    `,
    where: true
  },
  {
    uri: '/conexion/asistencia/vigentes',
    tipo: 'indicador',
    filtro: '1=1',
    secatrib: '1=1',
    indicador: `
      SELECT COUNT(*) AS valor
      FROM tfmg_file f
      WHERE UPPER(COALESCE(f.tipo_documento, '')) = 'REGISTRO DE ASISTENCIA'
        AND UPPER(COALESCE((f.json_data::jsonb->>'estado'), 'COMPLETADO')) IN ('COMPLETADO', 'APROBADO')
    `,
    datos: `
      SELECT 'Doc Vigentes' AS serie, COUNT(*) AS cantidad
      FROM tfmg_file f
      WHERE UPPER(COALESCE(f.tipo_documento, '')) = 'REGISTRO DE ASISTENCIA'
        AND UPPER(COALESCE((f.json_data::jsonb->>'estado'), 'COMPLETADO')) IN ('COMPLETADO', 'APROBADO')
      GROUP BY serie
    `,
    where: true
  },
  {
    uri: '/conexion/asistencia/porvencer',
    tipo: 'indicador',
    filtro: '1=1',
    secatrib: '1=1',
    indicador: `
      SELECT COUNT(*) AS valor
      FROM tfmg_file f
      WHERE UPPER(COALESCE(f.tipo_documento, '')) = 'REGISTRO DE ASISTENCIA'
        AND UPPER(COALESCE((f.json_data::jsonb->>'estado'), '')) = 'PENDIENTE'
    `,
    datos: `
      SELECT 'Por Vencer' AS serie, COUNT(*) AS cantidad
      FROM tfmg_file f
      WHERE UPPER(COALESCE(f.tipo_documento, '')) = 'REGISTRO DE ASISTENCIA'
        AND UPPER(COALESCE((f.json_data::jsonb->>'estado'), '')) = 'PENDIENTE'
      GROUP BY serie
    `,
    where: true
  },
  {
    uri: '/conexion/asistencia/vencidos',
    tipo: 'indicador',
    filtro: '1=1',
    secatrib: '1=1',
    indicador: `
      SELECT COUNT(*) AS valor
      FROM tfmg_file f
      WHERE UPPER(COALESCE(f.tipo_documento, '')) = 'REGISTRO DE ASISTENCIA'
        AND UPPER(COALESCE((f.json_data::jsonb->>'estado'), '')) = 'RECHAZADO'
    `,
    datos: `
      SELECT 'Vencidos' AS serie, COUNT(*) AS cantidad
      FROM tfmg_file f
      WHERE UPPER(COALESCE(f.tipo_documento, '')) = 'REGISTRO DE ASISTENCIA'
        AND UPPER(COALESCE((f.json_data::jsonb->>'estado'), '')) = 'RECHAZADO'
      GROUP BY serie
    `,
    where: true
  },
  {
    uri: '/conexion/equipamiento/total',
    tipo: 'indicador',
    filtro: '1=1',
    secatrib: '1=1',
    indicador: `
      SELECT COUNT(*) AS valor
      FROM tequ_equipo e
      WHERE UPPER(COALESCE(e.tipo_equipo, '')) <> 'EQUIPO MOVIL'
    `,
    datos: `
      SELECT 'Total Equipamiento' AS serie, COUNT(*) AS cantidad
      FROM tequ_equipo e
      WHERE UPPER(COALESCE(e.tipo_equipo, '')) <> 'EQUIPO MOVIL'
      GROUP BY serie
    `,
    where: true
  },
  {
    uri: '/conexion/equipamiento/vigentes',
    tipo: 'indicador',
    filtro: '1=1',
    secatrib: '1=1',
    indicador: `
      SELECT COUNT(*) AS valor
      FROM tequ_documentacion_equipo d
      JOIN tequ_equipo e ON d.id_equipo = e.id_equipo
      WHERE UPPER(COALESCE(e.tipo_equipo, '')) <> 'EQUIPO MOVIL'
        AND d.fecha_prox_calibracion > CURRENT_DATE + INTERVAL '30 days'
    `,
    datos: `
      SELECT 'Doc Vigentes' AS serie, COUNT(*) AS cantidad
      FROM tequ_documentacion_equipo d
      JOIN tequ_equipo e ON d.id_equipo = e.id_equipo
      WHERE UPPER(COALESCE(e.tipo_equipo, '')) <> 'EQUIPO MOVIL'
        AND d.fecha_prox_calibracion > CURRENT_DATE + INTERVAL '30 days'
      GROUP BY serie
    `,
    where: true
  },
  {
    uri: '/conexion/equipamiento/porvencer',
    tipo: 'indicador',
    filtro: '1=1',
    secatrib: '1=1',
    indicador: `
      SELECT COUNT(*) AS valor
      FROM tequ_documentacion_equipo d
      JOIN tequ_equipo e ON d.id_equipo = e.id_equipo
      WHERE UPPER(COALESCE(e.tipo_equipo, '')) <> 'EQUIPO MOVIL'
        AND d.fecha_prox_calibracion BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
    `,
    datos: `
      SELECT 'Por Vencer' AS serie, COUNT(*) AS cantidad
      FROM tequ_documentacion_equipo d
      JOIN tequ_equipo e ON d.id_equipo = e.id_equipo
      WHERE UPPER(COALESCE(e.tipo_equipo, '')) <> 'EQUIPO MOVIL'
        AND d.fecha_prox_calibracion BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
      GROUP BY serie
    `,
    where: true
  },
  {
    uri: '/conexion/equipamiento/vencidos',
    tipo: 'indicador',
    filtro: '1=1',
    secatrib: '1=1',
    indicador: `
      SELECT COUNT(*) AS valor
      FROM tequ_documentacion_equipo d
      JOIN tequ_equipo e ON d.id_equipo = e.id_equipo
      WHERE UPPER(COALESCE(e.tipo_equipo, '')) <> 'EQUIPO MOVIL'
        AND d.fecha_prox_calibracion < CURRENT_DATE
    `,
    datos: `
      SELECT 'Vencidos' AS serie, COUNT(*) AS cantidad
      FROM tequ_documentacion_equipo d
      JOIN tequ_equipo e ON d.id_equipo = e.id_equipo
      WHERE UPPER(COALESCE(e.tipo_equipo, '')) <> 'EQUIPO MOVIL'
        AND d.fecha_prox_calibracion < CURRENT_DATE
      GROUP BY serie
    `,
    where: true
  },
  {
    uri: '/conexion/reclamos/total',
    tipo: 'indicador',
    filtro: '1=1',
    secatrib: '1=1',
    indicador: `
      SELECT COUNT(*) AS valor
      FROM vw_procesossurvey ts
      WHERE COALESCE(ts.id_template, 0) = 153
    `,
    datos: `
      SELECT 'Total Reclamos' AS serie, COUNT(*) AS cantidad
      FROM vw_procesossurvey ts
      WHERE COALESCE(ts.id_template, 0) = 153
      GROUP BY serie
    `,
    where: true
  },
  {
    uri: '/conexion/reclamos/cerrados',
    tipo: 'indicador',
    filtro: '1=1',
    secatrib: '1=1',
    indicador: `
      SELECT COUNT(*) AS valor
      FROM vw_procesossurvey ts
      WHERE COALESCE(ts.id_template, 0) = 153
        AND UPPER(COALESCE(ts.estado_srv, '')) IN ('APROBADO', 'CERRADO', 'TERMINADO', 'COMPLETADO')
    `,
    datos: `
      SELECT 'Cerrados' AS serie, COUNT(*) AS cantidad
      FROM vw_procesossurvey ts
      WHERE COALESCE(ts.id_template, 0) = 153
        AND UPPER(COALESCE(ts.estado_srv, '')) IN ('APROBADO', 'CERRADO', 'TERMINADO', 'COMPLETADO')
      GROUP BY serie
    `,
    where: true
  },
  {
    uri: '/conexion/reclamos/proceso',
    tipo: 'indicador',
    filtro: '1=1',
    secatrib: '1=1',
    indicador: `
      SELECT COUNT(*) AS valor
      FROM vw_procesossurvey ts
      WHERE COALESCE(ts.id_template, 0) = 153
        AND UPPER(COALESCE(ts.estado_srv, '')) NOT IN ('APROBADO', 'CERRADO', 'TERMINADO', 'COMPLETADO')
        AND (ts.fecha_plan_fin IS NULL OR DATE(ts.fecha_plan_fin) >= CURRENT_DATE)
    `,
    datos: `
      SELECT 'En Proceso' AS serie, COUNT(*) AS cantidad
      FROM vw_procesossurvey ts
      WHERE COALESCE(ts.id_template, 0) = 153
        AND UPPER(COALESCE(ts.estado_srv, '')) NOT IN ('APROBADO', 'CERRADO', 'TERMINADO', 'COMPLETADO')
        AND (ts.fecha_plan_fin IS NULL OR DATE(ts.fecha_plan_fin) >= CURRENT_DATE)
      GROUP BY serie
    `,
    where: true
  },
  {
    uri: '/conexion/reclamos/vencidos',
    tipo: 'indicador',
    filtro: '1=1',
    secatrib: '1=1',
    indicador: `
      SELECT COUNT(*) AS valor
      FROM vw_procesossurvey ts
      WHERE COALESCE(ts.id_template, 0) = 153
        AND UPPER(COALESCE(ts.estado_srv, '')) NOT IN ('APROBADO', 'CERRADO', 'TERMINADO', 'COMPLETADO')
        AND ts.fecha_plan_fin IS NOT NULL
        AND DATE(ts.fecha_plan_fin) < CURRENT_DATE
    `,
    datos: `
      SELECT 'Vencidos' AS serie, COUNT(*) AS cantidad
      FROM vw_procesossurvey ts
      WHERE COALESCE(ts.id_template, 0) = 153
        AND UPPER(COALESCE(ts.estado_srv, '')) NOT IN ('APROBADO', 'CERRADO', 'TERMINADO', 'COMPLETADO')
        AND ts.fecha_plan_fin IS NOT NULL
        AND DATE(ts.fecha_plan_fin) < CURRENT_DATE
      GROUP BY serie
    `,
    where: true
  },
  {
    "uri": "/leanglobal/obtenerCargos",
    "tipo": "normal",
    "query": "select * from tsec_cargos",
    "where": true
  },
  {
    "uri": "/leanglobal/vistaIRL",
    "tipo": "normal",
    "query": "select * from vw_irl_docs",
    "where": true
  },
  {
    "uri": "/leanglobal/obtenerUsuariosPorProyecto",
    "tipo": "normal",
    "query": "SELECT p.id_proyecto, p.nombre_proyecto, COUNT(DISTINCT em.id_user) as total_usuarios FROM tpry_proyecto p LEFT JOIN tpry_equipo_proyecto ep ON p.id_proyecto = ep.id_proyecto LEFT JOIN tpry_equipo_miembro em ON ep.id_equipo_proyecto = em.id_equipo_proyecto AND em.activo = true GROUP BY p.id_proyecto, p.nombre_proyecto ORDER BY total_usuarios DESC",
    "where": false
  },
  {
    "uri": "/leanglobal/obtenerEquipoAcreditacion",
    "tipo": "normal",
    "query": `SELECT
                e.*,
                c_last.*
              FROM tequ_equipo e
              JOIN LATERAL (
                SELECT c.*
                FROM tequ_documentacion_equipo c
                WHERE c.id_equipo = e.id_equipo
                ORDER BY c.fecha_registro DESC, c.id_acreditacion DESC
                LIMIT 1
              ) c_last ON true;`,
    "where": false
  }
]