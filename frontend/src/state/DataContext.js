import React, { createContext, useCallback, useContext, useState } from 'react';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [items, setItems] = useState([]);

  /**
   * Fetch items from the API.
   * Supports:
   *  signal: AbortController signal (to cancel fetch if component unmounts),
   *  q: search query,
   *  page: pagination page number,
   *  limit: pagination limit
   * 
   * Returns { items, page, totalPages }
   */
  const fetchItems = useCallback(
    async ({ signal, q = '', page = 1, limit = 10 } = {}) => {
      const params = new URLSearchParams();
      if (q) params.append('q', q);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const res = await fetch(`http://localhost:3008/api/items?${params.toString()}`, { signal });

      if (!res.ok) {
        throw new Error('Failed to fetch items');
      }

      const json = await res.json();

      if (Array.isArray(json)) {
        setItems(json);
        return { items: json, page: 1, totalPages: 1 };
      } else if (json.items) {
        setItems(json.items);
        return { items: json.items, page: json.page, totalPages: json.totalPages };
      } else {
        setItems([]);
        return { items: [], page: 1, totalPages: 1 };
      }
    },
    []
  );

  return <DataContext.Provider value={{ items, fetchItems }}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);
