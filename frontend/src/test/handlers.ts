import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export const mockUser = { id: 'user-1', username: 'testuser' };

export const defaultHandlers = [
  http.get('/api/auth/me', () => HttpResponse.json(mockUser)),

  http.post('/api/auth/login', () =>
    HttpResponse.json({ id: 'user-1', username: 'testuser' }),
  ),

  http.post('/api/auth/logout', () =>
    HttpResponse.json({ message: 'Logged out' }),
  ),

  http.post('/api/auth/register', () =>
    HttpResponse.json({ message: 'Registration successful' }, { status: 201 }),
  ),

  http.get('/api/listings/filtered', () =>
    HttpResponse.json({ listings: [], currentPage: 0, totalItems: 0, totalPages: 0 }),
  ),

  http.get('/api/listings/all', () => HttpResponse.json([])),

  http.post('/api/listings', () =>
    HttpResponse.json({ id: 'listing-1', title: 'Test KB', condition: 'new' }, { status: 201 }),
  ),

  http.get('/api/groupbuys', () => HttpResponse.json([])),
  http.get('/api/groupbuys/counts', () =>
    HttpResponse.json({ IC: 0, GB: 0, closed: 0, total: 0, closingSoon: 0 }),
  ),
];

export const server = setupServer(...defaultHandlers);
