import React, { useEffect, useState, useRef } from 'react';
import { useData } from '../state/DataContext';
import { Link } from 'react-router-dom';
import { FixedSizeList as List } from 'react-window';
import './items.css'; // Make sure to create this CSS file

function Items() {
  const { fetchItems } = useData();

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  const abortControllerRef = useRef(null);
  const debounceTimeoutRef = useRef(null);
  const [debouncedQ, setDebouncedQ] = useState(q);

  useEffect(() => {
    clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedQ(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(debounceTimeoutRef.current);
  }, [q]);

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    fetchItems({ page, limit: 10, q: debouncedQ, signal: controller.signal })
      .then(({ items, page: currentPage, totalPages }) => {
        setItems(items);
        setPage(currentPage);
        setTotalPages(totalPages);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error(err);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [fetchItems, page, debouncedQ]);

  const Row = ({ index, style }) => {
    const item = items[index];
    return (
      <div className="item-row" style={style} key={item.id}>
        <Link to={`/items/${item.id}`} className="item-link">
          {item.name}
        </Link>
      </div>
    );
  };

  return (
    <div className="items-container">
      <input
        type="search"
        placeholder="Search items"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search items"
        className="search-input"
      />

      {loading && <p>Loading...</p>}
      {!loading && items.length === 0 && <p>No items found.</p>}

      {!loading && items.length > 0 && (
        <div className="list-wrapper">
          <div className="scroll-instruction">Scroll to see more</div>
          <List
            height={400}
            itemCount={items.length}
            itemSize={50}
            width="100%"
          >
            {Row}
          </List>
          <div className="scroll-fade" />
        </div>
      )}

      <div className="pagination">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1 || loading}
        >
          Prev
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages || loading}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Items;
