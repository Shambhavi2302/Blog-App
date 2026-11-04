import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Profile from './Profile';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';

jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    patch: jest.fn(),
  },
}));

describe('Profile page', () => {
  beforeEach(() => {
    api.get.mockResolvedValue({ data: { data: [] } });
    api.patch.mockResolvedValue({ data: { success: true } });
  });

  it('shows the saved email and hides pronouns and bio fields', async () => {
    render(
      <AuthContext.Provider value={{ user: { name: 'Jane Doe', email: 'jane@example.com' } }}>
        <Profile />
      </AuthContext.Provider>
    );

    expect((await screen.findAllByText('Jane Doe')).length).toBeGreaterThan(0);
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.queryByText(/Pronouns/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Short bio/i)).not.toBeInTheDocument();
  });

  it('saves the updated profile and persists it in the auth state', async () => {
    const updateUser = jest.fn();

    render(
      <AuthContext.Provider value={{ user: { name: 'Jane Doe', email: 'jane@example.com' }, updateUser }}>
        <Profile />
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));
    fireEvent.change(screen.getByPlaceholderText('Your name'), { target: { value: 'Jane Updated' } });
    fireEvent.click(screen.getAllByRole('button', { name: /save/i })[1]);

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/updateUser', {
        name: 'Jane Updated',
        email: 'jane@example.com',
      });
    });

    expect(updateUser).toHaveBeenCalledWith({
      name: 'Jane Updated',
      email: 'jane@example.com',
    });
  });
});
