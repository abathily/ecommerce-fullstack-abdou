const orders = {};

function getOrder(id) {
  if (!orders[id]) {
    orders[id] = {
      orderId: id,
      name: "Kov Lou",
      date: new Date().toLocaleDateString(),
      address: "Dakar, Sénégal",
      status: "preparation",
      products: [
        { name: "Galaxy A14", quantity: 1, price: 199 },
        { name: "Shampoing Kerastase", quantity: 2, price: 25 },
      ],
      total: 199 + 2 * 25,
    };
  }
  return orders[id];
}

// Simulation du statut qui évolue
function updateStatus(id) {
  const sequence = ["preparation", "expediee", "livree"];
  const order = getOrder(id);
  const currentIndex = sequence.indexOf(order.status);
  if (currentIndex < sequence.length - 1) {
    order.status = sequence[currentIndex + 1];
  }
}

module.exports = { getOrder, updateStatus };
