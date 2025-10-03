import { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  const addItem = (newItem) => {
    setItems(prevItems => {
      const existing = prevItems.find(i => i.eventId === newItem.eventId && i.offerTypeId === newItem.offerTypeId);
      if (existing) {
        return prevItems.map(i => 
          i.eventId === newItem.eventId && i.offerTypeId === newItem.offerTypeId
          ? { ...i, quantity: i.quantity + newItem.quantity }
          : i
        );
      }
      return [...prevItems, newItem];
    });
  };

  // Fonction pour retirer un item du panier par eventId + offerTypeId
  const removeItem = (eventId, offerTypeId) => {
    setItems(prevItems => prevItems.filter(i => !(i.eventId === eventId && i.offerTypeId === offerTypeId)));
  };

  const clearCart = () => setItems([]);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
