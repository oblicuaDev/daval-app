import { query, getClient } from '../config/db.js';
import { siigoFetch } from '../lib/siigo/client.js';
import {
  mapSiigoCustomerToLocal,
  mergeFields,
  mapLocalToSiigoCustomer,
} from '../lib/siigo/customerMapper.js';
import { ApiError } from '../middleware/error.js';

// ─── Preview (lista desde SIIGO con estado local) ─────────────────────────────

/**
 * Consulta clientes en SIIGO con paginación y filtros opcionales.
 * Enriquece cada resultado con si ya existe localmente (por siigo_customer_id o NIT).
 */
export async function previewSiigoCustomers({
  page = 1,
  pageSize = 25,
  name,
  identification,
} = {}) {
  const qs = { page_size: Math.min(Number(pageSize), 100), page: Number(page) };
  if (name)           qs.name           = name;
  if (identification) qs.identification = identification;

  const data    = await siigoFetch('/v1/customers', { query: qs });
  const results = data?.results ?? [];
  const total   = data?.pagination?.total_results ?? 0;

  if (results.length === 0) {
    return { items: [], total, page, pageSize };
  }

  const siigoIds = results.map((c) => String(c.id));
  const nits     = [...new Set(results.map((c) => c.identification).filter(Boolean))];

  const [byIdRows, byNitRows] = await Promise.all([
    query(`SELECT siigo_customer_id, id, name FROM companies WHERE siigo_customer_id = ANY($1)`, [siigoIds]),
    nits.length
      ? query(`SELECT nit, id, name FROM companies WHERE nit = ANY($1)`, [nits])
      : { rows: [] },
  ]);

  const byIdMap  = new Map(byIdRows.rows.map((r) => [r.siigo_customer_id, r]));
  const byNitMap = new Map(byNitRows.rows.map((r) => [r.nit, r]));

  const items = results.map((siigo) => {
    const siigoId = String(siigo.id);
    const local   = byIdMap.get(siigoId) ?? byNitMap.get(siigo.identification) ?? null;
    return {
      siigoId,
      identification: siigo.identification,
      name:           siigo.name ?? siigo.commercial_name ?? '',
      email:          siigo.contacts?.[0]?.email ?? null,
      phone:          siigo.phones?.[0]?.number ?? null,
      city:           siigo.address?.city?.city_name ?? null,
      active:         siigo.active ?? true,
      alreadyImported:  !!local,
      localCompanyId:   local?.id ?? null,
      localCompanyName: local?.name ?? null,
    };
  });

  return { items, total, page: Number(page), pageSize: Number(pageSize) };
}

// ─── Importar un cliente individual desde SIIGO ───────────────────────────────

/**
 * Importa un cliente de SIIGO a companies.
 * Anti-duplicados: busca primero por siigo_customer_id, luego por NIT.
 * Merge strategy: actualiza campos comerciales, preserva advisor_id / route_id / active.
 */
export async function importSiigoCustomer(siigoCustomerId, triggeredBy) {
  const startedAt = Date.now();

  // 1. Obtener datos desde SIIGO
  let siigo;
  try {
    siigo = await siigoFetch(`/v1/customers/${siigoCustomerId}`);
  } catch (err) {
    // Algunos planes SIIGO no soportan GET by ID — fallback por identification param
    if (err?.code === 'SIIGO_HTTP_ERROR' && err?.details?.siigoStatus === 404) {
      throw new ApiError(404, 'SIIGO_CUSTOMER_NOT_FOUND',
        `Cliente ${siigoCustomerId} no encontrado en SIIGO.`);
    }
    throw err;
  }

  const mapped = mapSiigoCustomerToLocal(siigo);

  // 2. Buscar duplicado local (prioridad: siigo_customer_id > nit)
  let existingId = null;
  const r1 = await query(`SELECT id FROM companies WHERE siigo_customer_id = $1`, [mapped.siigo_customer_id]);
  if (r1.rows[0]) {
    existingId = r1.rows[0].id;
  } else if (mapped.nit) {
    const r2 = await query(`SELECT id FROM companies WHERE nit = $1`, [mapped.nit]);
    if (r2.rows[0]) existingId = r2.rows[0].id;
  }

  // 3. Registrar intento en auditoría
  const logRow = await query(
    `INSERT INTO siigo_customer_integrations
       (company_id, siigo_customer_id, operation, status, request_payload, triggered_by)
     VALUES ($1, $2, 'import', 'pending', $3, $4) RETURNING id`,
    [existingId, mapped.siigo_customer_id, JSON.stringify(siigo), triggeredBy ?? null]
  );
  const logId = logRow.rows[0].id;

  // 4. Upsert en companies (transacción atómica)
  const conn = await getClient();
  try {
    await conn.query('BEGIN');

    let companyId;
    let isNew;

    if (existingId) {
      // UPDATE: merge de campos comerciales, preserva asignaciones locales
      const merge = mergeFields(siigo);
      await conn.query(
        `UPDATE companies
            SET name              = $1,
                email             = COALESCE($2, email),
                phone             = COALESCE($3, phone),
                address           = COALESCE($4, address),
                siigo_customer_id = $5,
                siigo_sync_status = 'synced',
                siigo_last_import_at = NOW(),
                siigo_last_error  = NULL,
                siigo_origin      = CASE
                  WHEN siigo_origin = 'local' THEN 'bidirectional'
                  ELSE siigo_origin
                END,
                updated_at = NOW()
          WHERE id = $6`,
        [merge.name, merge.email, merge.phone, merge.address,
         merge.siigo_customer_id, existingId]
      );
      companyId = existingId;
      isNew = false;
    } else {
      // INSERT: nueva empresa desde SIIGO
      const ins = await conn.query(
        `INSERT INTO companies
           (name, nit, email, phone, address, active,
            siigo_customer_id, siigo_sync_status, siigo_last_import_at, siigo_origin)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'synced', NOW(), 'siigo')
         RETURNING id`,
        [mapped.name, mapped.nit, mapped.email, mapped.phone,
         mapped.address, mapped.active, mapped.siigo_customer_id]
      );
      companyId = ins.rows[0].id;
      isNew = true;

      // Crear sucursal principal si hay datos geográficos
      if (mapped.city || mapped.address) {
        await conn.query(
          `INSERT INTO company_branches (company_id, name, address, city, active)
           VALUES ($1, 'Principal', $2, $3, $4)`,
          [companyId, mapped.address, mapped.city, mapped.active]
        );
      }
    }

    // Actualizar log de auditoría
    const duration = Date.now() - startedAt;
    await conn.query(
      `UPDATE siigo_customer_integrations
          SET status           = 'success',
              company_id       = $1,
              response_payload = $2,
              duration_ms      = $3,
              updated_at       = NOW()
        WHERE id = $4`,
      [companyId, JSON.stringify(siigo), duration, logId]
    );

    await conn.query('COMMIT');
    console.log(`[siigoCustomer] ${isNew ? 'creada' : 'actualizada'}: ${mapped.name} (${mapped.nit})`);
    return {
      companyId,
      isNew,
      name:             mapped.name,
      nit:              mapped.nit,
      siigoCustomerId:  mapped.siigo_customer_id,
    };
  } catch (err) {
    await conn.query('ROLLBACK');
    const duration = Date.now() - startedAt;
    await query(
      `UPDATE siigo_customer_integrations
          SET status = 'error', error_message = $1, duration_ms = $2, updated_at = NOW()
        WHERE id = $3`,
      [err.message, duration, logId]
    ).catch(() => {});
    throw err;
  } finally {
    conn.release();
  }
}

// ─── Importación masiva ───────────────────────────────────────────────────────

/**
 * Importa un lote de clientes SIIGO. Procesa secuencialmente para no saturar la API.
 * Retorna resultados individuales: imported, updated, errors.
 */
export async function importBatch(siigoCustomerIds, triggeredBy) {
  const results = { imported: [], updated: [], errors: [] };

  for (const siigoId of siigoCustomerIds) {
    try {
      const r = await importSiigoCustomer(siigoId, triggeredBy);
      (r.isNew ? results.imported : results.updated).push({
        siigoId,
        companyId:       r.companyId,
        name:            r.name,
        nit:             r.nit,
      });
    } catch (err) {
      results.errors.push({ siigoId, error: err.message });
      console.error(`[siigoCustomer] error importando ${siigoId}:`, err.message);
    }
  }

  console.log(
    `[siigoCustomer] batch completado — importados=${results.imported.length}` +
    ` actualizados=${results.updated.length} errores=${results.errors.length}`
  );
  return results;
}

// ─── Exportar empresa local → SIIGO ──────────────────────────────────────────

/**
 * Envía una empresa local a SIIGO (crea o actualiza según si ya tiene siigo_customer_id).
 * No sobrescribe datos en SIIGO si la empresa ya existe: usa PUT.
 */
export async function exportCompanyToSiigo(companyId, triggeredBy) {
  const startedAt = Date.now();

  const r = await query(`SELECT * FROM companies WHERE id = $1`, [companyId]);
  const company = r.rows[0];
  if (!company) throw new ApiError(404, 'COMPANY_NOT_FOUND', `Empresa ${companyId} no encontrada.`);
  if (!company.nit) throw new ApiError(422, 'MISSING_NIT', 'La empresa no tiene NIT configurado.');

  const payload = mapLocalToSiigoCustomer(company);

  const logRow = await query(
    `INSERT INTO siigo_customer_integrations
       (company_id, siigo_customer_id, operation, status, request_payload, triggered_by)
     VALUES ($1, $2, 'export', 'pending', $3, $4) RETURNING id`,
    [companyId, company.siigo_customer_id ?? null, JSON.stringify(payload), triggeredBy ?? null]
  );
  const logId = logRow.rows[0].id;

  let siigoResponse;
  try {
    if (company.siigo_customer_id) {
      siigoResponse = await siigoFetch(`/v1/customers/${company.siigo_customer_id}`, {
        method: 'PUT',
        body: payload,
      });
    } else {
      siigoResponse = await siigoFetch('/v1/customers', {
        method: 'POST',
        body: payload,
      });
    }
  } catch (err) {
    const duration = Date.now() - startedAt;
    await Promise.all([
      query(
        `UPDATE siigo_customer_integrations
            SET status = 'error', error_message = $1, duration_ms = $2, updated_at = NOW()
          WHERE id = $3`,
        [err.message, duration, logId]
      ),
      query(
        `UPDATE companies
            SET siigo_sync_status = 'error', siigo_last_error = $1, updated_at = NOW()
          WHERE id = $2`,
        [err.message, companyId]
      ),
    ]);
    throw err;
  }

  const newSiigoId = String(siigoResponse?.id ?? company.siigo_customer_id ?? '');
  const duration   = Date.now() - startedAt;

  await Promise.all([
    query(
      `UPDATE siigo_customer_integrations
          SET status = 'success', siigo_customer_id = $1,
              response_payload = $2, duration_ms = $3, updated_at = NOW()
        WHERE id = $4`,
      [newSiigoId, JSON.stringify(siigoResponse), duration, logId]
    ),
    query(
      `UPDATE companies
          SET siigo_customer_id = $1,
              siigo_sync_status = 'synced',
              siigo_last_sync_at = NOW(),
              siigo_last_error = NULL,
              siigo_origin = CASE
                WHEN siigo_origin = 'local' THEN 'bidirectional'
                ELSE siigo_origin
              END,
              updated_at = NOW()
        WHERE id = $2`,
      [newSiigoId, companyId]
    ),
  ]);

  console.log(`[siigoCustomer] exportada: ${company.name} → SIIGO ID: ${newSiigoId}`);
  return { siigoCustomerId: newSiigoId, companyId, name: company.name };
}

// ─── Historial de integraciones ───────────────────────────────────────────────

export async function getCustomerIntegrationHistory(companyId) {
  const r = await query(
    `SELECT i.id, i.siigo_customer_id, i.operation, i.status,
            i.error_message, i.duration_ms, i.created_at, i.updated_at,
            u.name AS triggered_by_name
       FROM siigo_customer_integrations i
  LEFT JOIN users u ON u.id = i.triggered_by
      WHERE i.company_id = $1
      ORDER BY i.created_at DESC
      LIMIT 50`,
    [companyId]
  );
  return r.rows;
}

// ─── Lista local con estado de sincronización ─────────────────────────────────

export async function getLocalCompaniesSyncStatus({ syncStatus, limit = 100 } = {}) {
  const params = [];
  const where  = [];

  if (syncStatus) {
    params.push(syncStatus);
    where.push(`c.siigo_sync_status = $${params.length}`);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  params.push(Math.min(Number(limit), 500));

  const r = await query(
    `SELECT c.id, c.name, c.nit, c.email, c.phone, c.address, c.active,
            c.siigo_customer_id, c.siigo_sync_status, c.siigo_origin,
            c.siigo_last_sync_at, c.siigo_last_import_at, c.siigo_last_error,
            COALESCE(json_agg(json_build_object(
              'id', b.id, 'name', b.name, 'city', b.city
            )) FILTER (WHERE b.id IS NOT NULL), '[]') AS branches
       FROM companies c
  LEFT JOIN company_branches b ON b.company_id = c.id
      ${whereClause}
      GROUP BY c.id
      ORDER BY c.name
      LIMIT $${params.length}`,
    params
  );

  return r.rows.map((c) => ({
    id:               c.id,
    name:             c.name,
    nit:              c.nit,
    email:            c.email,
    phone:            c.phone,
    address:          c.address,
    active:           c.active,
    siigoCustomerId:  c.siigo_customer_id,
    siigoSyncStatus:  c.siigo_sync_status,
    siigoOrigin:      c.siigo_origin,
    siigoLastSyncAt:  c.siigo_last_sync_at,
    siigoLastImportAt: c.siigo_last_import_at,
    siigoLastError:   c.siigo_last_error,
    branches:         c.branches,
  }));
}
