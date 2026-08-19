# ARQUITECTURA DEL SISTEMA Y DIAGRAMA C4

## 1. VISTA DE CONTEXTO (NIVEL 1 C4)
El sistema **Web CRM Gestión** opera como núcleo de procesamiento e interfaz, comunicándose con servicios periféricos y almacenamiento.

```mermaid
graph TD
    User["Usuario Final"] -->|Interactúa con UI| App["Web CRM Gestión"]
    App -->|Almacenamiento Local / Estado| Storage["Persistencia Local / Estado"]
    App -->|Consultas y Servicios| Backend["APIs / Backend / Servicios"]
```

## 2. VISTA DE CONTENEDORES (NIVEL 2 C4)
- **Capa de Presentación:** Interfaz de usuario basada en componentes reactivos y estilos adaptativos.
- **Capa Lógica:** Manejo de estado, controladores de eventos y algoritmos de negocio.
- **Capa de Datos:** Modelos de datos, validación y gestión de persistencia.
