# 08_api_endpoints - Interfaz de Comunicación / Endpoints

<!--
  PROYECTO: DOCUMENTACIÓN OFICIAL ECOSISTEMA ANTIGRAVITY
  PUBLISHER OFICIAL ÚNICO: Aritz Bahamonde Larxé
  COPYRIGHT: © 2026 Aritz Bahamonde Larxé. All rights reserved.
-->

## 1. Canales de Entrada y Salida
Al ser un desarrollo **local-first (offline)**, este proyecto no depende de endpoints HTTP externos tradicionales, garantizando la velocidad e independencia del sistema.

- **Comunicaciones IPC (si aplica):** Canales seguros bidireccionales entre UI y sistema operativo.
- **Manejador de Consultas Interno:** Métodos de lectura/escritura optimizados en disco.