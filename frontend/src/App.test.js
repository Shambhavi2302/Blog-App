import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import App from './App';
import Home from './pages/Home';
import { AuthProvider } from './contexts/AuthContext';
import api from './services/api';
import store from './store/store';
import { plainTextToHtml, stripHtmlPreserveBreaks } from './pages/PostDetail';

jest.mock('./services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    getAccessToken: jest.fn(() => null),
    setAccessToken: jest.fn(),
    clearAccessToken: jest.fn(),
  },
}));

beforeAll(() => {
  window.matchMedia = window.matchMedia || function matchMedia() {
    return {
      matches: false,
      media: '',
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    };
  };
});

beforeEach(() => {
  localStorage.removeItem('theme');
  store.dispatch({ type: 'theme/set', payload: 'light' });
  window.confirm = jest.fn(() => true);
  api.get.mockReset();
  api.post.mockReset();
  api.delete.mockReset();
  api.patch.mockReset();

  api.get.mockImplementation((url) => {
    if (url === '/categories') {
      return Promise.resolve({
        data: {
          success: true,
          data: [
            { _id: 'c1', name: 'Tech' },
            { _id: 'c2', name: 'Travel' },
          ],
        },
      });
    }

    if (url === '/posts') {
      return Promise.resolve({
        data: {
          data: [
            { _id: 'p1', title: 'First post', content: 'Test content', category: { _id: 'c1', name: 'Tech' } },
          ],
          totalPages: 1,
        },
      });
    }

    return Promise.resolve({ data: {} });
  });
});

test('toggles the theme when the theme button is clicked', async () => {
  const user = userEvent.setup();

  render(
    <Provider store={store}>
      <AuthProvider>
        <MemoryRouter>
          <App />
        </MemoryRouter>
      </AuthProvider>
    </Provider>
  );

  const toggleButton = screen.getByRole('button', { name: /switch to dark mode/i });
  expect(document.documentElement.classList.contains('dark')).toBe(false);

  await user.click(toggleButton);

  expect(document.documentElement.classList.contains('dark')).toBe(true);
  expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument();
});

test('shows a category menu button on smaller screens and applies the selected category', async () => {
  const user = userEvent.setup();

  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );

  expect(await screen.findByRole('button', { name: /categories/i })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /categories/i }));

  const travelButtons = await screen.findAllByRole('button', { name: /travel/i });
  await user.click(travelButtons[0]);

  await waitFor(() => {
    expect(api.get).toHaveBeenCalledWith(
      '/posts',
      expect.objectContaining({
        params: expect.objectContaining({ category: 'c2' }),
      })
    );
  });
});

test('shows edit and delete actions only for the author of the post', async () => {
  const user = userEvent.setup();
  localStorage.setItem('user', JSON.stringify({ id: 'u1', name: 'Author User', role: 'Author' }));

  api.get.mockImplementation((url) => {
    if (url === '/posts/first-post') {
      return Promise.resolve({
        data: {
          data: {
            _id: 'p1',
            title: 'First post',
            content: '<p>Hello world</p>',
            slug: 'first-post',
            author: { _id: 'u1', name: 'Author User' },
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        },
      });
    }

    if (url === '/posts/p1/comments') {
      return Promise.resolve({ data: { data: [] } });
    }

    return Promise.resolve({ data: { data: [] } });
  });

  render(
    <Provider store={store}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/posts/first-post']}>
          <App />
        </MemoryRouter>
      </AuthProvider>
    </Provider>
  );

  expect(await screen.findByRole('button', { name: /edit post/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /delete/i }));

  expect(api.delete).toHaveBeenCalledWith('/posts/p1');
  localStorage.removeItem('user');
});

test('shows plain text instead of raw HTML in the post edit form', async () => {
  const user = userEvent.setup();
  localStorage.setItem('user', JSON.stringify({ id: 'u1', name: 'Author User', role: 'Author' }));

  api.get.mockImplementation((url) => {
    if (url === '/posts/first-post') {
      return Promise.resolve({
        data: {
          data: {
            _id: 'p1',
            title: 'First post',
            content: '<p>Types of tv:</p><p>- LCd</p><p>- LED</p><p>hello</p>',
            slug: 'first-post',
            author: { _id: 'u1', name: 'Author User' },
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        },
      });
    }

    if (url === '/posts/p1/comments') {
      return Promise.resolve({ data: { data: [] } });
    }

    return Promise.resolve({ data: { data: [] } });
  });

  render(
    <Provider store={store}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/posts/first-post']}>
          <App />
        </MemoryRouter>
      </AuthProvider>
    </Provider>
  );

  await user.click(await screen.findByRole('button', { name: /edit post/i }));

  const textarea = await screen.findByPlaceholderText(/write your post content/i);
  expect(textarea).toHaveValue('Types of tv:\n- LCd\n- LED\nhello');
  expect(textarea).not.toHaveValue(expect.stringContaining('<p>'));
  localStorage.removeItem('user');
});

test('allows an author to replace the cover image while editing a post', async () => {
  const user = userEvent.setup();
  localStorage.setItem('user', JSON.stringify({ id: 'u1', name: 'Author User', role: 'Author' }));

  api.get.mockImplementation((url) => {
    if (url === '/posts/first-post') {
      return Promise.resolve({
        data: {
          data: {
            _id: 'p1',
            title: 'First post',
            content: '<p>Hello world</p>',
            slug: 'first-post',
            coverImage: 'https://example.com/old-cover.jpg',
            author: { _id: 'u1', name: 'Author User' },
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        },
      });
    }

    if (url === '/posts/p1/comments') {
      return Promise.resolve({ data: { data: [] } });
    }

    return Promise.resolve({ data: { data: [] } });
  });

  api.patch.mockResolvedValue({ data: { success: true } });

  render(
    <Provider store={store}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/posts/first-post']}>
          <App />
        </MemoryRouter>
      </AuthProvider>
    </Provider>
  );

  await user.click(await screen.findByRole('button', { name: /edit post/i }));
  const imageInput = await screen.findByLabelText(/update cover image/i);
  const file = new File(['cover-image'], 'new-cover.jpg', { type: 'image/jpeg' });

  await user.upload(imageInput, file);
  await user.click(screen.getByRole('button', { name: /save changes/i }));

  await waitFor(() => {
    expect(api.patch).toHaveBeenCalledWith(
      '/posts/p1',
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
  });

  localStorage.removeItem('user');
});

test('loads author drafts using the stored user id when the session stores _id', async () => {
  const user = userEvent.setup();
  localStorage.setItem('user', JSON.stringify({ _id: 'u1', name: 'Author User', role: 'Author' }));

  api.get.mockImplementation((url) => {
    if (url === '/posts') {
      return Promise.resolve({
        data: {
          data: [
            { _id: 'p2', title: 'Draft Post', content: '<p>Draft</p>', status: 'Draft', author: { _id: 'u1' } },
            { _id: 'p3', title: 'Published Post', content: '<p>Live</p>', status: 'Published', author: { _id: 'u1' } },
          ],
          totalPages: 1,
        },
      });
    }

    return Promise.resolve({ data: {} });
  });

  render(
    <Provider store={store}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <App />
        </MemoryRouter>
      </AuthProvider>
    </Provider>
  );

  await waitFor(() => {
    expect(api.get).toHaveBeenCalledWith(
      '/posts',
      expect.objectContaining({
        params: expect.objectContaining({
          author: 'u1',
          status: 'All',
        }),
      })
    );
  });

  expect(await screen.findByText(/Drafts/i)).toBeInTheDocument();
  expect(await screen.findByText('Draft Post')).toBeInTheDocument();
  localStorage.removeItem('user');
});

test('allows an author to save a post as a draft', async () => {
  const user = userEvent.setup();
  localStorage.setItem('user', JSON.stringify({ id: 'u1', name: 'Author User', role: 'Author' }));
  api.post.mockResolvedValue({ data: { _id: 'p2', slug: 'draft-post', status: 'Draft' } });

  render(
    <Provider store={store}>
      <AuthProvider>
        <MemoryRouter>
          <App />
        </MemoryRouter>
      </AuthProvider>
    </Provider>
  );

  const route = '/create';
  window.history.pushState({}, '', route);

  render(
    <Provider store={store}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/create']}>
          <App />
        </MemoryRouter>
      </AuthProvider>
    </Provider>
  );

  await screen.findByText(/create post/i);
  await user.type(screen.getByPlaceholderText(/title/i), 'Draft Post');
  await user.selectOptions(screen.getByLabelText(/post status/i), 'Draft');
  await user.click(screen.getByRole('button', { name: /create/i }));

  await waitFor(() => {
    expect(api.post).toHaveBeenCalledWith(
      '/post',
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
  });

  const formData = api.post.mock.calls[0][1];
  expect(formData.get('status')).toBe('Draft');
  localStorage.removeItem('user');
});

test('redirects lowercase draft responses back to the author dashboard', async () => {
  const user = userEvent.setup();
  localStorage.setItem('user', JSON.stringify({ id: 'u1', name: 'Author User', role: 'Author' }));

  api.post.mockResolvedValue({ data: { _id: 'p2', slug: 'draft-post', status: 'draft' } });
  api.get.mockImplementation((url, config) => {
    if (url === '/posts' && config?.params?.status === 'All') {
      return Promise.resolve({
        data: {
          data: [
            { _id: 'p2', title: 'Draft Post', content: '<p>Draft</p>', status: 'draft', author: { _id: 'u1' } },
          ],
          totalPages: 1,
        },
      });
    }

    return Promise.resolve({ data: { data: [] } });
  });

  render(
    <Provider store={store}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/create']}>
          <App />
        </MemoryRouter>
      </AuthProvider>
    </Provider>
  );

  await screen.findByText(/create post/i);
  await user.type(screen.getByPlaceholderText(/title/i), 'Draft Post');
  await user.click(screen.getByRole('button', { name: /create/i }));

  expect(await screen.findByText(/welcome back, author user/i)).toBeInTheDocument();
  localStorage.removeItem('user');
});

test('preserves paragraph breaks when converting post content from plain text to HTML', () => {
  expect(plainTextToHtml('First line\nSecond line')).toContain('<br');
  expect(plainTextToHtml('First paragraph\n\nSecond paragraph')).toContain('<p>First paragraph</p><p>Second paragraph</p>');
  expect(stripHtmlPreserveBreaks('<p>First line<br/>Second line</p>')).toBe('First line\nSecond line');
});

test('shows all posts on demand and counts draft posts correctly', async () => {
  const user = userEvent.setup();
  localStorage.setItem('user', JSON.stringify({ id: 'u1', name: 'Author User', role: 'Author' }));

  const posts = Array.from({ length: 6 }, (_, index) => ({
    _id: `p${index + 1}`,
    title: `Post ${index + 1}`,
    content: '<p>Content</p>',
    status: index === 0 ? 'Draft' : 'Published',
    createdAt: new Date(2024, 0, index + 1).toISOString(),
    author: { _id: 'u1', name: 'Author User' },
  }));

  api.get.mockImplementation((url, config) => {
    if (url === '/posts' && config?.params?.status === 'All') {
      return Promise.resolve({ data: { data: posts, totalPages: 1 } });
    }

    return Promise.resolve({ data: { data: [] } });
  });

  render(
    <Provider store={store}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <App />
        </MemoryRouter>
      </AuthProvider>
    </Provider>
  );

  expect(await screen.findByText(/welcome back, author user/i)).toBeInTheDocument();
  expect(screen.getByText('1')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /show all posts/i }));
  expect(await screen.findByText(/post 6/i)).toBeInTheDocument();
  localStorage.removeItem('user');
});
