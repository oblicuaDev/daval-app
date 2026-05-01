import { DateTime } from 'luxon';

const TZ = 'America/Bogota';
const DAY_INDEX = {
  Domingo: 7, Lunes: 1, Martes: 2, 'Miércoles': 3, Miercoles: 3,
  Jueves: 4, Viernes: 5, 'Sábado': 6, Sabado: 6,
};
const DAY_LABEL = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

/**
 * Compute the cutoff status for a route in America/Bogota.
 * Server is the only authority — frontend may format but never decide.
 *
 * Returns { isOpen, deadline, routeDate, nextOpenDate, message } in ISO strings.
 */
export function computeRouteCutoff(route, now = DateTime.now().setZone(TZ)) {
  if (!route?.day || !route?.cutoff_time) {
    return {
      isOpen: false,
      missingRoute: true,
      deadline: null,
      routeDate: null,
      nextOpenDate: null,
      message: 'No tienes una ruta asignada. Contacta a tu asesor.',
    };
  }

  const target = DAY_INDEX[route.day];
  if (!target) {
    return { isOpen: false, deadline: null, routeDate: null, nextOpenDate: null,
      message: 'Día de ruta inválido.' };
  }

  const [h, m] = String(route.cutoff_time).split(':').map(Number);
  const today = now.weekday; // 1..7 (Mon..Sun)
  const diff = (target - today + 7) % 7;

  const routeDate = now.startOf('day').plus({ days: diff });
  const deadline = routeDate.minus({ days: 1 }).set({ hour: h || 0, minute: m || 0, second: 0, millisecond: 0 });
  const nextOpenDate = routeDate.plus({ days: 1 }).startOf('day');

  const isOpen = now <= deadline || now >= nextOpenDate;
  const previousDayName = DAY_LABEL[deadline.weekday];

  return {
    isOpen,
    deadline: deadline.toISO(),
    routeDate: routeDate.toISO(),
    nextOpenDate: nextOpenDate.toISO(),
    previousDayName,
    message: isOpen
      ? `Puedes solicitar cotizaciones hasta el ${previousDayName} a las ${route.cutoff_time}.`
      : `La recepción para la ruta de ${route.day} ya cerró. Vuelve a abrir el día siguiente a la ruta.`,
  };
}

export const TIMEZONE = TZ;
