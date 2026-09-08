# RAG Frontend

React + Vite frontend for the RAG application.

After cloning the repository:

## API configuration

The API URLs are configured in `src/api.js`:

```js
const API_BASE = 'https://example.com/api'; // Production
const API_BASE_DEV = 'http://localhost:4040/api'; // Development
```

The current application uses `API_BASE` in `apiFetch`, so local development requests go to `http://localhost:4040/api`.

When switching environments, update the URL used in `apiFetch` in `src/api.js`:

- **Development:** use `${API_BASE_DEV}${endpoint}`
- **Production:** use `${API_BASE}${endpoint}`

After changing the API URL, start the Vite server. Do not change the endpoint paths in individual components.

```bash
npm install
npm run dev
```

Open the local URL shown by Vite, usually `http://localhost:5173`.


Optional checks:

```bash
npm run lint
```
