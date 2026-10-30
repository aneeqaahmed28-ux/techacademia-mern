# TechAcademia client

React and Vite frontend for TechAcademia. Setup, environment variables, and the security notes are in the [repository README](../README.md).

```bash
npm install
npm run dev
```

The dev server proxies `/api` to `http://localhost:5000`. Leave `VITE_API_URL` empty unless the browser should call another API origin. See `.env.example`.
