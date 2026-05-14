/**
 * Mapper bidireccional: SIIGO Customer ↔ companies (modelo local)
 *
 * SIIGO Customer schema (POST /v1/customers, GET /v1/customers):
 *   id, identification, name, commercial_name, active,
 *   person_type, id_type: { id, name },
 *   branch_office, check_digit,
 *   address: { address, city: { city_code, city_name, department_name } },
 *   phones: [{ indicative, number, extension }],
 *   contacts: [{ first_name, last_name, email, phone }]
 */

// ─── SIIGO → local ────────────────────────────────────────────────────────────

/**
 * Transforma un cliente de SIIGO al formato de la tabla companies.
 * Solo mapea campos comerciales: no toca advisor_id, route_id ni active local.
 */
export function mapSiigoCustomerToLocal(siigo) {
  const contact = Array.isArray(siigo.contacts) ? siigo.contacts[0] : null;
  const phone   = Array.isArray(siigo.phones)   ? siigo.phones[0]?.number ?? null : null;
  const email   = contact?.email ?? null;
  const addr    = siigo.address?.address ?? null;
  const city    = siigo.address?.city?.city_name ?? null;

  // SIIGO retorna name como array para personas naturales: ["NOMBRE", "APELLIDO"]
  const rawName = siigo.name ?? siigo.commercial_name;
  const name    = Array.isArray(rawName)
    ? rawName.filter(Boolean).join(' ')
    : (rawName ?? '(sin nombre)');

  return {
    siigo_customer_id:   String(siigo.id),
    name,
    nit:                 String(siigo.identification ?? ''),
    email,
    phone,
    address:             addr,
    city,                // va en company_branches.city al crear la sucursal principal
    active:              Boolean(siigo.active ?? true),
    siigo_origin:        'siigo',
    siigo_sync_status:   'synced',
  };
}

/**
 * Retorna los campos que se actualizan al hacer un RE-IMPORT de un company ya existente.
 * Regla de merge: actualizamos datos comerciales SIIGO, preservamos asignaciones locales.
 * Nunca se sobreescriben: advisor_id, route_id, price_list_id, user_id, active.
 */
export function mergeFields(siigo) {
  const mapped = mapSiigoCustomerToLocal(siigo);
  return {
    name:             mapped.name,
    email:            mapped.email,    // nullable — COALESCE en SQL si se quiere preservar
    phone:            mapped.phone,
    address:          mapped.address,
    siigo_customer_id: mapped.siigo_customer_id,
    siigo_sync_status: 'synced',
    siigo_origin:     'bidirectional', // ya existía local, ahora tiene fuente SIIGO también
  };
}

// ─── local → SIIGO ────────────────────────────────────────────────────────────

/**
 * Transforma una empresa local al payload de POST/PUT /v1/customers de SIIGO.
 * Requiere: nit, name. Opcionales: email, phone, address.
 */
export function mapLocalToSiigoCustomer(company) {
  const payload = {
    person_type: 'Company',
    id_type:     { id: 13 },   // 13 = NIT en SIIGO Colombia
    identification: String(company.nit),
    name:            company.name,
    commercial_name: company.name,
    active:          company.active ?? true,
  };

  if (company.phone) {
    payload.phones = [{ indicative: '57', number: String(company.phone), extension: '' }];
  }

  if (company.email) {
    payload.contacts = [{
      first_name: company.name,
      last_name:  '',
      email:      company.email,
    }];
  }

  if (company.address) {
    payload.address = { address: company.address };
  }

  return payload;
}
