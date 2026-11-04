import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PostDetail from './PostDetail';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';

jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('react-toastify', () => ({
  toast: {
    info: jest.fn(),
  },
}));

describe('PostDetail follow menu', () => {
  beforeEach(() => {
    api.get.mockImplementation((url) => {
      if (url === '/posts/test-slug') {
        return Promise.resolve({
          data: {
            data: {
              _id: 'post-1',
              title: 'Hello world',
              content: '<p>Hello world</p>',
              author: { _id: 'auth-1', name: 'Jane Doe' },
              category: { name: 'Tech' },
              likes: 0,
              likedBy: [],
            },
          },
        });
      }

      if (url === '/posts/post-1/comments') {
        return Promise.resolve({ data: { data: [] } });
      }

      return Promise.resolve({ data: { data: [] } });
    });

    api.post.mockReset();
  });

  it('shows the follow menu when the author is followed', async () => {
    api.post.mockResolvedValue({
      data: {
        success: true,
        following: true,
      },
    });

    render(
      <AuthContext.Provider value={{ user: { userId: 'user-1', name: 'Tester' } }}>
        <MemoryRouter initialEntries={['/posts/test-slug']}>
          <Routes>
            <Route path="/posts/:slug" element={<PostDetail />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    const followButton = await screen.findByRole('button', { name: /follow writer/i });
    fireEvent.click(followButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/follow/auth-1', { followerId: 'user-1' });
    });

    await screen.findByRole('button', { name: /following/i });

    expect(await screen.findByText(/Email notifications on/i)).toBeInTheDocument();
    expect(screen.getByText(/Unfollow/i)).toBeInTheDocument();
  });

  it('loads the follow state from the backend on refresh', async () => {
    api.get.mockImplementation((url, config) => {
      if (url === '/posts/test-slug') {
        return Promise.resolve({
          data: {
            data: {
              _id: 'post-1',
              title: 'Hello world',
              content: '<p>Hello world</p>',
              author: { _id: 'auth-1', name: 'Jane Doe' },
              category: { name: 'Tech' },
              likes: 0,
              likedBy: [],
            },
          },
        });
      }

      if (url === '/posts/post-1/comments') {
        return Promise.resolve({ data: { data: [] } });
      }

      if (url === '/follow/auth-1/status') {
        return Promise.resolve({
          data: {
            success: true,
            following: true,
          },
        });
      }

      return Promise.resolve({ data: { data: [] } });
    });

    render(
      <AuthContext.Provider value={{ user: { userId: 'user-1', name: 'Tester' } }}>
        <MemoryRouter initialEntries={['/posts/test-slug']}>
          <Routes>
            <Route path="/posts/:slug" element={<PostDetail />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(await screen.findByRole('button', { name: /following/i })).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/follow/auth-1/status', { params: { followerId: 'user-1' } });
  });
});
