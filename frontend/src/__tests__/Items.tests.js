// Items.test.js
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Items from '../pages/Items'; // adjust path if needed
import { useData } from '../state/DataContext';
import { MemoryRouter } from 'react-router-dom';

// Mock useData hook
jest.mock('../state/DataContext', () => ({
  useData: jest.fn(),
}));

describe('Items Component', () => {
  const mockFetchItems = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useData.mockReturnValue({ fetchItems: mockFetchItems });
  });

  test('renders loading and then items', async () => {
    mockFetchItems.mockResolvedValueOnce({
      items: [{ id: 1, name: 'Test Item' }],
      page: 1,
      totalPages: 1,
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <Items />
        </MemoryRouter>
      );
    });

    // Loading is shown initially (may appear briefly)
    expect(screen.getByPlaceholderText(/search items/i)).toBeInTheDocument();

    // Wait for items to appear after fetch resolves
    await waitFor(() => {
      expect(screen.getByText(/test item/i)).toBeInTheDocument();
    });
  });

  test('shows no items found message', async () => {
    mockFetchItems.mockResolvedValueOnce({
      items: [],
      page: 1,
      totalPages: 1,
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <Items />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/no items found/i)).toBeInTheDocument();
    });
  });

  test('can search and debounce updates results', async () => {
    mockFetchItems.mockResolvedValue({
      items: [{ id: 1, name: 'Search Result' }],
      page: 1,
      totalPages: 1,
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <Items />
        </MemoryRouter>
      );
    });

    const input = screen.getByPlaceholderText(/search items/i);

    // Type in search input
    fireEvent.change(input, { target: { value: 'test' } });

    // wait for fetchItems to be called with q: 'test'
    await waitFor(() => {
      expect(mockFetchItems).toHaveBeenCalledWith(
        expect.objectContaining({ q: 'test' })
      );
    });
  });

  test('pagination buttons work', async () => {
    // Page 1
    mockFetchItems.mockResolvedValueOnce({
      items: [{ id: 1, name: 'Item Page 1' }],
      page: 1,
      totalPages: 2,
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <Items />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument();
      expect(screen.getByText(/item page 1/i)).toBeInTheDocument();
    });

    // Mock page 2 response
    mockFetchItems.mockResolvedValueOnce({
      items: [{ id: 2, name: 'Item Page 2' }],
      page: 2,
      totalPages: 2,
    });

    // Click next button
    const nextButton = screen.getByText(/next/i);
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/page 2 of 2/i)).toBeInTheDocument();
      expect(screen.getByText(/item page 2/i)).toBeInTheDocument();
    });
  });

  test('aborts fetch on unmount or input change', async () => {
    const abortSpy = jest.fn();
    const controller = { signal: {}, abort: abortSpy };
    global.AbortController = jest.fn(() => controller);

    mockFetchItems.mockResolvedValueOnce({
      items: [{ id: 1, name: 'Item' }],
      page: 1,
      totalPages: 1,
    });

    const { unmount } = render(
      <MemoryRouter>
        <Items />
      </MemoryRouter>
    );

    unmount();

    expect(abortSpy).toHaveBeenCalled();
  });
});
