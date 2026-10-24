# AlertaFuego

## TODO

### Pendiente

- [ ] Cambiar el nombre de la app de Supabase de "https://viduxyduxzcujpbbfsmw.supabase.co" a AlertaFuego

### Terminado

- [x] Landing page
- [x] Conectar con el backend
- [x] Implementar user logout
- [x] Editar Leaflet LPopup para contener los reportes de los usuarios y permitir que se pueda generar un nuevo reporte
- [x] Agregar secrets en Vercel
- [x] Agregar filtros al mapa

## Tests

```
npm run test           # Vitest: utils, store, composables y componentes
npm run test:coverage  # lo mismo, con cobertura
npm run test:e2e       # Playwright: navegación, mapa, accesibilidad (axe) y mobile
```

Los E2E generan el sitio (`nuxt generate`) y lo sirven como CloudFront
(`test/e2e/static-server.mjs`, puerto 3100). El backend y Supabase no se usan:
`test/e2e/fixtures.ts` responde cada request con las formas del contrato OpenAPI.
La primera vez: `npx playwright install chromium`. Corren en CI en cada PR
(`.github/workflows/ci.yml`). Resultados y decisiones: `docs/PRUEBAS.md` en la
raíz del workspace `tesis/`.
