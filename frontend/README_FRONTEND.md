Frontend setup (Tailwind, React) for the CMS App

From the `frontend` folder run:

```bash
# install dependencies
npm install

# then add these packages
npm install axios react-router-dom react-quill
npm install -D tailwindcss postcss autoprefixer @tailwindcss/typography

# initialize tailwind (if needed)
npx tailwindcss init -p

# start dev server
npm start
```

Notes:
- The API base URL is `http://localhost:4000/api` configured in `src/services/api.js`.
- Login stores the token in `localStorage` and `AuthContext` sets the Authorization header.
- CreatePost uses `react-quill` for rich text editing and uploads images via the backend `POST /api/post` endpoint.
- Ensure the backend server is running and environment variables for Cloudinary are configured.
