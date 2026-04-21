import { createContext, useContext, useState } from 'react';
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_PRICE_LISTS,
  INITIAL_BRANCHES,
  INITIAL_ORDERS,
  INITIAL_COMPANIES,
  INITIAL_ROUTES,
  INITIAL_PROMOTIONS,
} from '../data/mockData';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [priceLists, setPriceLists] = useState(INITIAL_PRICE_LISTS);
  const [promotions, setPromotions] = useState(INITIAL_PROMOTIONS);
  const [branches, setBranches] = useState(INITIAL_BRANCHES);
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [companies, setCompanies] = useState(INITIAL_COMPANIES);
  const [routes, setRoutes] = useState(INITIAL_ROUTES);
  const [cart, setCart] = useState([]);
  const [nextOrderId, setNextOrderId] = useState(10);

  function addToCart(product, quantity, unitPrice) {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i =>
          i.productId === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { productId: product.id, productName: product.name, quantity, unitPrice, unit: product.unit }];
    });
  }

  function updateCartItem(productId, quantity) {
    if (quantity <= 0) {
      setCart(prev => prev.filter(i => i.productId !== productId));
    } else {
      setCart(prev => prev.map(i => i.productId === productId ? { ...i, quantity } : i));
    }
  }

  function removeFromCart(productId) {
    setCart(prev => prev.filter(i => i.productId !== productId));
  }

  function clearCart() {
    setCart([]);
  }

  function loadCartFromItems(items = []) {
    setCart(items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      unit: item.unit,
    })));
  }

  function submitOrder(requestingUser, advisorId, notes) {
    const user = typeof requestingUser === 'object' ? requestingUser : { id: requestingUser };
    const company = companies.find(c => c.id === user.companyId);
    const sucursal = company?.sucursales?.find(s => s.id === user.sucursalId);
    const assignedAdvisorId = advisorId || sucursal?.advisorId || null;
    const id = `COT-00${nextOrderId}`;
    const total = cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const newOrder = {
      id,
      clientId: user.id,
      requestedById: user.id,
      requestedByName: user.name || '',
      companyId: user.companyId || null,
      sucursalId: user.sucursalId || null,
      sucursalName: sucursal?.name || '',
      advisorId: assignedAdvisorId,
      siigoUrl: '',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      carrier: null,
      items: [...cart],
      notes,
      total,
    };
    setOrders(prev => [newOrder, ...prev]);
    setNextOrderId(n => n + 1);
    clearCart();
    return id;
  }

  function updateOrder(orderId, updates) {
    setOrders(prev =>
      prev.map(o =>
        o.id === orderId
          ? { ...o, ...updates, updatedAt: new Date().toISOString().split('T')[0] }
          : o
      )
    );
  }

  const cartTotal = cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <AppContext.Provider value={{
      products, setProducts,
      categories, setCategories,
      priceLists, setPriceLists,
      promotions, setPromotions,
      branches, setBranches,
      orders, setOrders,
      companies, setCompanies,
      routes, setRoutes,
      cart, cartTotal, cartCount,
      addToCart, updateCartItem, removeFromCart, clearCart, loadCartFromItems, submitOrder,
      updateOrder,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
