# PATRONES DE DISEÑO Y CONVENCIONES

## 1. PRINCIPIOS DE ARQUITECTURA
- **Modularidad Atómica:** Separación estricta entre presentación, lógica de dominio y capa de acceso a datos.
- **SOLID & Clean Architecture:** Componentes puros desacoplados de efectos secundarios globales.
- **Inmutabilidad del Estado:** Mutaciones predecibles a través de despachos o setters definidos.

## 2. CONVENCIONES DE CÓDIGO
- **Nombres de Componentes:** PascalCase (`MiComponente.tsx` o `MiComponente.js`).
- **Nombres de Utilidades y Hooks:** camelCase (`useMiHook.ts`, `calcularTotales.js`).
- **Tipado Estricto:** Prohibición expresa de tipos laxos (`any`), garantizando cobertura de contratos.
