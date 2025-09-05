import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (user && token) {
      setLoading(true);
      axios
        .get('http://localhost:5000/api/orders/my-orders', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => setOrders(res.data))
        .catch((err) => console.error('Erreur chargement commandes :', err))
        .finally(() => setLoading(false));
    }
  },  [user]);

  return (
    <div>
      <h1 className="text-2xl mb-4">Mes commandes</h1>
      {orders.length === 0 ? (
        <p>Aucune commande.</p>
      ) : (
        <ul className="space-y-4">
          {orders.map(order => (
            <li key={order._id} className="border p-4">
              <p>Total : {order.total} CFA</p>
              <p>Status : {order.status}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
