import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const EventsContext = createContext();

export function useEvents() {
  return useContext(EventsContext);
}

export function EventsProvider({ children }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await axios.get('http://localhost:8080/api/events');
        setEvents(Array.isArray(res.data.content) ? res.data.content : []);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  function decrementStock(cartItems) {
    const OFFER_PLACES = {1:1, 2:2, 3:4};
    setEvents(prevEvents =>
      prevEvents.map(event => {
        const item = cartItems.find(ci => ci.eventId === event.id);
        if (!item) return event;
        const placesToRemove = OFFER_PLACES[item.offerTypeId] * item.quantity;
        return {...event, remainingTickets: event.remainingTickets - placesToRemove};
      })
    );
  }

  return (
    <EventsContext.Provider value={{ events, loading, decrementStock }}>
      {children}
    </EventsContext.Provider>
  );
}
