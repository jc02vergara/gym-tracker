# Gym Tracker

Aplicación web (React + Vite) para registrar rutinas, series y progreso. Los datos se guardan en Supabase y la app se publica en GitHub Pages.

## Desarrollo

```bash
npm install
npm run dev
```

La app se sirve en `http://localhost:5173/gym-tracker/`.

## Despliegue (GitHub Pages)

Cada push a `main` ejecuta `.github/workflows/deploy.yml`, que compila y publica `dist/` en
`https://jc02vergara.github.io/gym-tracker/`.

Requisito único: en GitHub, **Settings → Pages → Source: GitHub Actions**.

Si el repositorio cambia de nombre, actualiza `base` en `vite.config.js`.

## Login (código OTP por correo)

El acceso es solo mediante un código enviado al correo de un usuario ya registrado (no hay registro público).

- La app llama a `signInWithOtp` con `shouldCreateUser: false` y luego a `verifyOtp`.
- El usuario de Supabase Auth se vincula con la fila de `public.users` por la columna `email`.

Configuración en Supabase:

1. **Authentication → Email Templates → Magic Link**: el cuerpo debe incluir `{{ .Token }}` para que el correo traiga el código en vez de un enlace.
2. **Authentication → Users → Add user**: crea el usuario con su correo (marcando *Auto Confirm User*) y pon ese mismo correo en `public.users.email`.

## Seguridad (RLS)

Todas las tablas tienen Row Level Security (`supabase_rls.sql`): cada sesión solo puede leer y modificar los datos del usuario de `public.users` cuyo `email` coincide con el correo verificado de la sesión. Sin sesión no se puede leer nada.
