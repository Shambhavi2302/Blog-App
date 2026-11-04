import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PostCard from './PostCard';
import api from '../services/api';

jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('PostCard content preview', () => {
  beforeEach(() => {
    localStorage.clear();
    api.get.mockResolvedValue({ data: { count: 3 } });
  });

  it('shows the full preview text instead of cutting it mid-sentence', async () => {
    render(
      <MemoryRouter>
        <PostCard
          post={{
            _id: '1',
            slug: 'benefits-of-eating-fruits',
            title: 'Benefits of Eating Fruits for Good Health',
            content:
              '<p>Fruits are an essential part of a healthy and balanced diet. They are packed with vitamins, minerals, and fiber.</p>',
            createdAt: '2026-10-15T00:00:00.000Z',
            author: { name: 'Aarav Nair' },
            coverImage: 'https://example.com/test.jpg',
            isSaved: false,
          }}
        />
      </MemoryRouter>
    );

    expect(
      await screen.findByText(
        /Fruits are an essential part of a healthy and balanced diet\. They are packed with vitamins, minerals, and fiber\./i
      )
    ).toBeInTheDocument();
  });

  it('increments and persists the clap count in localStorage without hitting the backend', async () => {
    const post = {
      _id: '1',
      slug: 'benefits-of-eating-fruits',
      title: 'Benefits of Eating Fruits for Good Health',
      content: '<p>Fruits are essential.</p>',
      createdAt: '2026-10-15T00:00:00.000Z',
      author: { name: 'Aarav Nair' },
      coverImage: 'https://example.com/test.jpg',
      isSaved: false,
    };

    const { rerender } = render(
      <MemoryRouter>
        <PostCard post={post} />
      </MemoryRouter>
    );

    const clapButton = screen.getByRole('button', { name: /claps/i });
    expect(clapButton).toHaveTextContent('0');

    fireEvent.click(clapButton);
    expect(clapButton).toHaveTextContent('1');
    expect(localStorage.getItem('claps-1')).toBe('1');

    rerender(
      <MemoryRouter>
        <PostCard post={post} />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /claps/i })).toHaveTextContent('1');
  });
});
