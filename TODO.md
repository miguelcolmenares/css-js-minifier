# TODO: Implementación de Estadísticas de Reducción de Tamaño

Este documento contiene la lista de tareas para implementar la funcionalidad de mostrar el porcentaje de reducción de tamaño después de la minificación.

## 📋 Resumen del Feature

**Objetivo**: Mostrar al usuario el porcentaje de reducción de tamaño después de minificar archivos CSS y JavaScript.

**Ejemplo de mensaje**: 
- Inglés: "style.css successfully minified! Size reduced by 45% (1.2 KB → 0.66 KB)"
- Español: "style.css minificado exitosamente! Tamaño reducido en 45% (1.2 KB → 0.66 KB)"

## 🎯 Tareas Principales

### 1. Análisis y Diseño
- [x] Revisar estructura del código existente
- [x] Identificar archivos a modificar:
  - `src/services/minificationService.ts` - Calcular estadísticas
  - `src/services/fileService.ts` - Mostrar mensajes con estadísticas
  - `src/commands/minifyCommand.ts` - Pasar datos de tamaño
  - `package.nls.json` - Mensajes en inglés
  - `package.nls.es.json` - Mensajes en español
- [x] Definir interfaz para estadísticas de minificación
- [ ] Crear diagrama de flujo de datos

### 2. Implementación del Core

#### 2.1 Crear interfaz para estadísticas
**Archivo**: `src/services/minificationService.ts`

```typescript
/**
 * Statistics about the minification process
 */
export interface MinificationStats {
  originalSize: number;      // Size in bytes
  minifiedSize: number;      // Size in bytes
  reductionPercent: number;  // Percentage (0-100)
  originalSizeKB: string;    // Formatted string (e.g., "1.2 KB")
  minifiedSizeKB: string;    // Formatted string (e.g., "0.66 KB")
}

/**
 * Result of minification with statistics
 */
export interface MinificationResult {
  minifiedText: string;
  stats: MinificationStats;
}
```

**Tareas**:
- [ ] Agregar interfaces `MinificationStats` y `MinificationResult`
- [ ] Crear función helper `calculateStats(originalText: string, minifiedText: string): MinificationStats`
- [ ] Crear función helper `formatBytes(bytes: number): string` para formatear tamaños
- [ ] Modificar `getMinifiedText()` para retornar `MinificationResult | null`
- [ ] Actualizar JSDoc de todas las funciones modificadas

#### 2.2 Actualizar comando de minificación
**Archivo**: `src/commands/minifyCommand.ts`

**Tareas**:
- [ ] Actualizar `processDocument()` para recibir `MinificationResult`
- [ ] Pasar estadísticas a `saveAsNewFile()` y `replaceDocumentContent()`
- [ ] Actualizar JSDoc con nuevos parámetros

#### 2.3 Actualizar servicios de archivo
**Archivo**: `src/services/fileService.ts`

**Tareas**:
- [ ] Modificar firma de `saveAsNewFile()` para recibir `stats: MinificationStats`
- [ ] Modificar firma de `replaceDocumentContent()` para recibir `stats: MinificationStats`
- [ ] Actualizar mensajes de éxito para incluir estadísticas
- [ ] Usar claves i18n para mensajes (no hardcodear texto)
- [ ] Actualizar JSDoc con nuevos parámetros

### 3. Internacionalización (i18n)

#### 3.1 Mensajes en Inglés
**Archivo**: `package.nls.json`

**Tareas**:
- [ ] Agregar clave `messages.minification.success.withStats` con formato:
  ```
  "{0} successfully minified! Size reduced by {1}% ({2} → {3})"
  ```
- [ ] Agregar clave `messages.minification.success.newFile.withStats` con formato:
  ```
  "File successfully minified and saved as: {0}! Size reduced by {1}% ({2} → {3})"
  ```
- [ ] Mantener claves existentes para compatibilidad

#### 3.2 Mensajes en Español
**Archivo**: `package.nls.es.json`

**Tareas**:
- [ ] Agregar clave `messages.minification.success.withStats` con formato:
  ```
  "¡{0} minificado exitosamente! Tamaño reducido en {1}% ({2} → {3})"
  ```
- [ ] Agregar clave `messages.minification.success.newFile.withStats` con formato:
  ```
  "¡Archivo minificado exitosamente y guardado como: {0}! Tamaño reducido en {1}% ({2} → {3})"
  ```
- [ ] Mantener claves existentes para compatibilidad

### 4. Testing

#### 4.1 Tests Unitarios para Estadísticas
**Archivo**: `src/test/extension.test.ts`

**Suite nueva**: "Size Reduction Statistics"

**Tareas**:
- [ ] Test: "should calculate correct size reduction percentage"
  - Verificar cálculo de porcentaje con diferentes tamaños
  - Casos: 50%, 25%, 75%, 90% de reducción
- [ ] Test: "should format bytes to KB correctly"
  - Verificar formateo de bytes a KB con decimales apropiados
  - Casos: 1024 bytes = 1 KB, 1536 bytes = 1.5 KB, 512 bytes = 0.5 KB
- [ ] Test: "should handle edge cases"
  - Archivo de tamaño 0
  - Minificación que no reduce (tamaño igual)
  - Minificación que incrementa tamaño (raro pero posible)
- [ ] Test: "should return MinificationResult with stats"
  - Verificar que `getMinifiedText()` retorna objeto con `minifiedText` y `stats`

#### 4.2 Tests de Integración
**Archivo**: `src/test/extension.test.ts`

**Tareas**:
- [ ] Modificar tests existentes para verificar mensajes con estadísticas
- [ ] Test: "should show statistics in success message (in-place minification)"
- [ ] Test: "should show statistics in success message (new file)"
- [ ] Test: "should display statistics in correct language"
  - Verificar inglés y español

#### 4.3 Consideraciones para Tests
- [ ] Mantener delays para respetar rate limit de Toptal API (30 req/min)
- [ ] Usar fixtures existentes para tests consistentes
- [ ] Mock de `vscode.window.showInformationMessage` para verificar mensajes
- [ ] Limpiar archivos generados después de cada test

### 5. Documentación

#### 5.1 Actualizar README
**Archivo**: `README.md`

**Tareas**:
- [ ] Agregar sección sobre estadísticas de reducción de tamaño
- [ ] Incluir screenshot del mensaje con estadísticas
- [ ] Actualizar lista de features
- [ ] Agregar ejemplos de uso

#### 5.2 Actualizar CHANGELOG
**Archivo**: `CHANGELOG.md`

**Tareas**:
- [ ] Crear entrada para nueva versión (1.1.0)
- [ ] Categoría "Added": Nueva funcionalidad de estadísticas
- [ ] Categoría "Changed": Mensajes de éxito mejorados
- [ ] Fecha de release

#### 5.3 Actualizar JSDoc
**Tareas**:
- [ ] Documentar todas las funciones nuevas
- [ ] Actualizar documentación de funciones modificadas
- [ ] Incluir ejemplos de uso en JSDoc
- [ ] Documentar interfaces nuevas

### 6. Validación y QA

#### 6.1 Testing Manual
**Tareas**:
- [ ] Probar minificación in-place con archivo CSS
- [ ] Probar minificación in-place con archivo JS
- [ ] Probar creación de nuevo archivo CSS
- [ ] Probar creación de nuevo archivo JS
- [ ] Verificar mensaje en inglés (cambiar idioma de VS Code)
- [ ] Verificar mensaje en español (cambiar idioma de VS Code)
- [ ] Probar con diferentes tamaños de archivo
- [ ] Probar con archivo muy pequeño (pocos bytes)

#### 6.2 Testing Automatizado
**Tareas**:
- [ ] Ejecutar `npm run lint` - debe pasar sin errores
- [ ] Ejecutar `npm run compile` - debe compilar correctamente
- [ ] Ejecutar `npm run compile-tests` - tests deben compilar
- [ ] Ejecutar `npm test` - todos los tests deben pasar
- [ ] Verificar cobertura de código si está configurado

#### 6.3 Code Review Checklist
- [ ] Código sigue convenciones del proyecto
- [ ] No hay código duplicado
- [ ] Manejo de errores apropiado
- [ ] Performance no se ve afectado negativamente
- [ ] Cambios son backward compatible
- [ ] No hay hardcoded strings (todo usa i18n)

### 7. Build y Release

#### 7.1 Preparación
**Tareas**:
- [ ] Actualizar versión en `package.json` a 1.1.0
- [ ] Ejecutar `npm run package` - build de producción
- [ ] Verificar que `dist/extension.js` se generó correctamente
- [ ] Test final con extensión empaquetada

#### 7.2 Git y Release
**Tareas**:
- [ ] Crear commit con cambios: `feat: add size reduction statistics display`
- [ ] Crear PR hacia master
- [ ] Esperar CI/CD checks
- [ ] Merge PR
- [ ] Crear tag: `git tag -a v1.1.0 -m "Release version 1.1.0"`
- [ ] Push tag: `git push origin v1.1.0`

#### 7.3 Publicación
**Tareas**:
- [ ] Ejecutar `vsce package` - crear .vsix
- [ ] Test instalación local: `code --install-extension css-js-minifier-1.1.0.vsix`
- [ ] Ejecutar `vsce publish` - publicar a marketplace
- [ ] Verificar en marketplace que apareció correctamente
- [ ] Actualizar GitHub Release con notas

## 📝 Notas Técnicas

### Cálculo de Porcentaje de Reducción
```typescript
const reductionPercent = ((originalSize - minifiedSize) / originalSize) * 100;
const rounded = Math.round(reductionPercent);
```

### Formato de Bytes a KB
```typescript
function formatBytes(bytes: number): string {
  const kb = bytes / 1024;
  return kb < 1 ? `${bytes} B` : `${kb.toFixed(2)} KB`;
}
```

### Uso de Claves i18n en Código
```typescript
// NO hacer esto:
vscode.window.showInformationMessage("File minified! Size reduced by 45%");

// SÍ hacer esto:
import * as vscode from 'vscode';
const message = vscode.l10n.t('messages.minification.success.withStats', 
  fileName, reductionPercent, originalSizeKB, minifiedSizeKB);
vscode.window.showInformationMessage(message);
```

### Estructura de MinificationResult
```typescript
const result: MinificationResult = {
  minifiedText: "body{margin:0}",
  stats: {
    originalSize: 1234,
    minifiedSize: 678,
    reductionPercent: 45,
    originalSizeKB: "1.21 KB",
    minifiedSizeKB: "0.66 KB"
  }
};
```

## 🔍 Referencias

- **Toptal API**: Límite de 30 requests/minuto
- **VS Code i18n**: [Documentación oficial](https://code.visualstudio.com/api/references/vscode-api#l10n)
- **Testing**: Mocha + Sinon para mocks
- **Semantic Versioning**: MINOR version bump (1.0.0 → 1.1.0)

## ⚠️ Consideraciones Importantes

1. **Compatibilidad**: Mantener mensajes antiguos sin estadísticas para no romper nada
2. **Performance**: Calcular tamaño es operación rápida (no afecta performance)
3. **API Limits**: Tests deben respetar rate limit de Toptal
4. **i18n**: Siempre agregar traducciones en ambos idiomas
5. **Tests**: Ejecutar suite completa antes de commit

## ✅ Criterios de Aceptación

- [ ] Usuario ve porcentaje de reducción después de minificar
- [ ] Mensaje muestra tamaño original y minificado en KB
- [ ] Funciona en minificación in-place
- [ ] Funciona en creación de nuevo archivo
- [ ] Mensajes en inglés y español correctos
- [ ] Todos los tests pasan (29 existentes + nuevos)
- [ ] Documentación actualizada
- [ ] Sin errores de linting
- [ ] Build de producción exitoso

---

**Fecha de Creación**: 2025-10-17  
**Versión Target**: 1.1.0  
**Estimación**: 8-12 horas de desarrollo  
**Prioridad**: Media  
**Asignado**: Miguel Colmenares
