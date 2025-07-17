# test7

# SOLUTION.md

## Overview

This project involved improving an existing Node.js + React app with a backend API for managing items and a frontend to display and search them. The primary goals were:

- Refactor blocking synchronous file I/O to non-blocking async operations for better scalability and performance.
- Add pagination and search filtering with debouncing on the frontend.
- Improve the React components to handle loading states and cleanup correctly.
- Add robust validation on POST requests.
- Introduce caching and optimized recalculation of statistics.
- Implement comprehensive frontend and backend tests.
- Fix existing bugs related to stale state updates and incomplete fetch handling.

---

## Backend Changes

### 1. **Async File I/O**

- Replaced `fs.readFileSync` and `fs.writeFileSync` with async `fs.promises.readFile` and `fs.promises.writeFile` for non-blocking operations.
- This prevents the event loop from blocking on file reads/writes, allowing better concurrency and performance under load.

### 2. **Improved Pagination and Search**

- Added query parameters `limit`, `page`, and `q` (search query) for `/api/items` GET.
- Pagination is implemented by slicing the filtered dataset after applying the search filter.
- The `limit` param is sanitized to ensure a max of 100 and a minimum of 1.
- Response includes `items`, current `page`, and `totalPages` for frontend consumption.

### 3. **Validation on POST**

- Added validation for `name` (required string), `price` (non-negative number), and `category` (required string).
- Returns `400 Bad Request` with clear error messages on invalid inputs.
- This prevents invalid data corruption in the dataset.

### 4. **Stats Endpoint Caching**

- Introduced in-memory caching for stats with tracking of file modification time.
- Only recalculates stats if data file modification time changes.
- Uses a `mean` utility function to calculate average price cleanly.
- Improves performance by avoiding redundant expensive calculations on each request.

---

## Frontend Changes

### 1. **DataContext and Fetching**

- `fetchItems` supports pagination, search query, and abort signals.
- Fetch URL is dynamically built based on these parameters.
- Updates internal items state based on the API response shape.
- Handles errors and throws if fetch fails.

### 2. **Items Component**

- Implements search input with debounce (300ms) before triggering fetch.
- Manages loading state to display "Loading..." text.
- Shows "No items found." message if results are empty.
- Uses `react-window` for efficient rendering of large lists.
- Pagination buttons "Prev" and "Next" adjust the page and are disabled appropriately.
- Uses `AbortController` to cancel ongoing fetch requests on unmount or new fetches to prevent race conditions or memory leaks.
- Fixes previous bug where state updates occurred after unmount without cleanup.

### 3. **Styling**

- Added CSS styles (assumed in `items.css`) for layout and user experience improvements.

---

## Testing

### 1. **Frontend Tests (Items.tests.js)**

- Mocked `useData` hook to isolate component behavior.
- Tests include:
  - Rendering loading and items after fetch resolves.
  - Displaying no items found message.
  - Debounced search updates.
  - Pagination button functionality.
  - Proper abort of fetch on unmount.
- Uses `@testing-library/react` utilities and `jest` mocks for asynchronous and event-driven interactions.
- Wrapped state updates with `act` to fix warnings.

### 2. **Backend Tests (items.tests.js)**

- Used `supertest` with an Express app instance for integration testing.
- Tests:
  - GET all items.
  - GET with search query filtering.
  - GET with pagination.
  - GET by ID success and 404 not found.
  - POST with valid and invalid payload validation.
- Data file mocked for test isolation and repeatability.
- Ensures backend validation and pagination work correctly.

---

## Trade-Offs & Considerations

- **In-memory caching for stats:** This improves performance but is reset on server restart and doesn’t handle concurrent updates. Suitable for low-to-medium traffic apps but might require a more robust caching or DB solution for production.
- **File-based data storage:** Using JSON files is simple but not scalable for large data or concurrent writes. Migrating to a database would be a natural next step.
- **Debounce delay:** Fixed 300ms delay balances responsiveness and reducing redundant fetch calls. This could be made configurable.
- **Error handling:** Currently logs errors to console and shows minimal UI feedback; can be enhanced for better user experience.
- **Pagination limits:** Max limit of 100 is arbitrary; adjust based on typical usage and backend capacity.
- **Test coverage:** Covers most critical flows but could add more edge cases (e.g., empty queries, network errors, etc.).

---

## Summary

The refactor improves backend performance and scalability by moving to async file I/O, adds robust pagination and search, enhances frontend UX with debounced search, loading states, and abort handling, and strengthens test coverage on both ends. The approach balances simplicity and effectiveness, preparing the app for smoother real-world usage.

---
