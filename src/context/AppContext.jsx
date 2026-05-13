import { createContext, useContext, useState, useEffect } from 'react';

const CART_KEY = 'daval_cart';
const AppContext = createContext(null);

function loadFromStorage() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) ?? '[]'); } catch { return []; }
}

// Cart-only context — todos los demás datos vienen de hooks React Query.
export function AppProvider({ children }) {
  const [cart, setCart] = useState(loadFromStorage);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  function addToCart(product, quantity, unitPrice) {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i =>
          i.productId === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice,
        unit: product.unit,
      }];
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
      unitPrice: item.unitPrice ?? item.unit_price,
      unit: item.unit,
    })));
  }

  const cartTotal = cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <AppContext.Provider value={{
      cart, cartTotal, cartCount,
      addToCart, updateCartItem, removeFromCart, clearCart, loadCartFromItems,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
