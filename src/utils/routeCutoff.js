const WEEK_DAY_INDEX = {
  Domingo: 0,
  Lunes: 1,
  Martes: 2,
  Miércoles: 3,
  Miercoles: 3,
  Jueves: 4,
  Viernes: 5,
  Sábado: 6,
  Sabado: 6,
};

const WEEK_DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function getClientRoute(currentUser, companies, routes) {
  const company = companies.find(item => item.id === currentUser?.companyId);
  const sucursal = company?.sucursales?.find(item => item.id === currentUser?.sucursalId);
  const route = routes.find(item => item.id === sucursal?.routeId);
  return { company, sucursal, route };
}

export function getRouteCutoffStatus(route, now = new Date()) {
  if (!route?.day || !route?.cutoffTime) {
    return {
      isOpen: false,
      missingRoute: true,
      route,
      routeDate: null,
      deadline: null,
      nextOpenDate: null,
      message: 'Solicita a tu asesor de Distribuciones DAVAL que te asigne una ruta de pedidos para empezar a usar la plataforma.',
    };
  }

  const targetDay = WEEK_DAY_INDEX[route.day];
  if (targetDay === undefined) {
    return {
      isOpen: true,
      route,
      routeDate: null,
      deadline: null,
      nextOpenDate: null,
      message: 'El día de ruta no tiene un formato válido.',
    };
  }

  const routeDate = new Date(now);
  routeDate.setHours(0, 0, 0, 0);
  const diffDays = (targetDay - now.getDay() + 7) % 7;
  routeDate.setDate(routeDate.getDate() + diffDays);

  const [hours, minutes] = route.cutoffTime.split(':').map(Number);
  const deadline = new Date(routeDate);
  deadline.setDate(routeDate.getDate() - 1);
  deadline.setHours(hours || 0, minutes || 0, 0, 0);

  const nextOpenDate = new Date(routeDate);
  nextOpenDate.setDate(routeDate.getDate() + 1);
  nextOpenDate.setHours(0, 0, 0, 0);

  const isOpen = now <= deadline || now >= nextOpenDate;
  const previousDayName = WEEK_DAY_LABELS[deadline.getDay()];

  return {
    isOpen,
    route,
    routeDate,
    deadline,
    nextOpenDate,
    previousDayName,
    message: isOpen
      ? `Puedes solicitar cotizaciones hasta el ${previousDayName} a las ${route.cutoffTime}.`
      : `La recepción para la ruta de ${route.day} ya cerró. Podrás crear nuevas cotizaciones desde el día siguiente a la ruta.`,
  };
}

export function formatRouteDate(date) {
  if (!date) return '';
  return date.toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'short' });
}

export function formatRouteDateTime(date) {
  if (!date) return '';
  return date.toLocaleString('es-CO', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTimeRemaining(targetDate, now = new Date()) {
  if (!targetDate) return 'sin ruta programada';
  const diffMs = targetDate.getTime() - now.getTime();
  if (diffMs <= 0) return '0 min';

  const totalMinutes = Math.ceil(diffMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days} día${days === 1 ? '' : 's'} ${hours} h`;
  if (hours > 0) return `${hours} h ${minutes} min`;
  return `${minutes} min`;
}
