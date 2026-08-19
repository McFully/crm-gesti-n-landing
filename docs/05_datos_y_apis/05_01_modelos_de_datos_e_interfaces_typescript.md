# MODELOS DE DATOS E INTERFACES TYPESCRIPT

## 1. CONTRATOS DE DATOS DEL DOMINIO
```typescript
export interface EntidadBase {
  id: string | number;
  creadoEn?: string | Date;
  actualizadoEn?: string | Date;
}

export interface ConfiguracionProyecto {
  nombre: string;
  version: string;
  activo: boolean;
}
```
