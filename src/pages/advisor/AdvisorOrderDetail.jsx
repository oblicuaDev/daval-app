import { useParams, useNavigate } from 'react-router-dom';
import { useQuotation } from '../../hooks/useQuotations.js';
import OrderDetailCRM from '../../components/OrderDetailCRM';

export default function AdvisorOrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { data: order, isLoading } = useQuotation(orderId);

  if (isLoading) {
    return <div className="py-20 text-center text-sm text-gray-500">Cargando cotización…</div>;
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Cotización no encontrada</p>
        <button
          onClick={() => navigate('/asesor')}
          className="mt-4 text-blue-400 text-sm font-medium hover:text-blue-300"
        >
          Volver a la lista
        </button>
      </div>
    );
  }

  return (
    <OrderDetailCRM
      order={order}
      onBack={() => navigate('/asesor')}
      editable={true}
      canAssign={false}
    />
  );
}
