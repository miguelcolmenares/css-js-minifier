# 🚀 Quick Start Guide: Size Reduction Statistics Implementation

## 📖 Introducción

Esta guía te ayudará a empezar rápidamente con la implementación del feature de estadísticas de reducción de tamaño.

## 📚 Documentos Disponibles

| Documento | Propósito | Cuándo Usarlo |
|-----------|-----------|---------------|
| **[TODO.md](./TODO.md)** | Lista completa de tareas (10KB) | Referencia detallada, planning |
| **[TODO-SUMMARY.md](./TODO-SUMMARY.md)** | Resumen ejecutivo (4KB) | Vista rápida del progreso |
| **[IMPLEMENTATION-FLOW.md](./IMPLEMENTATION-FLOW.md)** | Diagramas visuales (16KB) | Entender arquitectura y flujo |
| **QUICK-START.md** (este archivo) | Guía de inicio rápido | Empezar a codear ahora |

## ⚡ Comenzar en 5 Minutos

### 1. Entender el Objetivo
Mostrar al usuario:
```
style.css successfully minified! Size reduced by 45% (1.21 KB → 0.66 KB)
```

### 2. Archivos Principales a Modificar
```bash
src/services/minificationService.ts  # Core: calcular stats
src/services/fileService.ts          # UI: mostrar mensajes
src/commands/minifyCommand.ts        # Glue: conectar todo
package.nls.json                      # i18n: mensajes inglés
package.nls.es.json                   # i18n: mensajes español
src/test/extension.test.ts           # Tests
```

### 3. Primer Paso: Crear Interfaces
**Archivo**: `src/services/minificationService.ts`

Agregar al inicio del archivo (después de imports):

```typescript
/**
 * Statistics about the minification process
 */
export interface MinificationStats {
  originalSize: number;      // Size in bytes
  minifiedSize: number;      // Size in bytes
  reductionPercent: number;  // Percentage (0-100)
  originalSizeKB: string;    // Formatted string (e.g., "1.21 KB")
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

### 4. Segundo Paso: Implementar Helpers
**Archivo**: `src/services/minificationService.ts`

Agregar estas funciones antes de `getMinifiedText()`:

```typescript
/**
 * Formats bytes to human-readable string with KB units
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kb = bytes / 1024;
  return `${kb.toFixed(2)} KB`;
}

/**
 * Calculates minification statistics
 */
function calculateStats(originalText: string, minifiedText: string): MinificationStats {
  const textEncoder = new TextEncoder();
  const originalSize = textEncoder.encode(originalText).length;
  const minifiedSize = textEncoder.encode(minifiedText).length;
  
  const reductionPercent = Math.round(
    ((originalSize - minifiedSize) / originalSize) * 100
  );
  
  return {
    originalSize,
    minifiedSize,
    reductionPercent,
    originalSizeKB: formatBytes(originalSize),
    minifiedSizeKB: formatBytes(minifiedSize)
  };
}
```

### 5. Tercer Paso: Modificar getMinifiedText()
**Archivo**: `src/services/minificationService.ts`

Cambiar la firma de la función:
```typescript
// ANTES:
export async function getMinifiedText(text: string, fileType: string): Promise<string | null>

// DESPUÉS:
export async function getMinifiedText(text: string, fileType: string): Promise<MinificationResult | null>
```

Y al final de la función, antes del último return:
```typescript
// ANTES:
return minifiedText;

// DESPUÉS:
const stats = calculateStats(text, minifiedText);
return {
  minifiedText,
  stats
};
```

En los casos de error, cambiar:
```typescript
// ANTES:
return null;

// DESPUÉS (se mantiene igual):
return null;
```

## 🧪 Testing Rápido

### Test Básico para Helpers
**Archivo**: `src/test/extension.test.ts`

Agregar esta suite antes de la última línea:

```typescript
suite("Size Reduction Statistics", function () {
  this.timeout(RATE_LIMIT_CONFIG.TEST_TIMEOUT_MS);

  test("should format bytes correctly", () => {
    // Este es un test de ejemplo - necesitas importar la función
    // o hacer el test de integración completo
    const bytes1 = 1024;
    const expected1 = "1.00 KB";
    
    const bytes2 = 512;
    const expected2 = "512 B";
    
    // Aquí irían los asserts cuando tengas acceso a formatBytes()
  });
});
```

## 📋 Checklist de Implementación Rápida

### Sprint 1: Core (2-3 horas)
- [ ] Crear interfaces `MinificationStats` y `MinificationResult`
- [ ] Implementar `formatBytes()`
- [ ] Implementar `calculateStats()`
- [ ] Modificar `getMinifiedText()` para retornar `MinificationResult`
- [ ] Actualizar todos los lugares que llaman `getMinifiedText()`

### Sprint 2: UI Messages (1-2 horas)
- [ ] Agregar claves i18n en `package.nls.json`
- [ ] Agregar claves i18n en `package.nls.es.json`
- [ ] Modificar `saveAsNewFile()` para usar stats
- [ ] Modificar `replaceDocumentContent()` para usar stats
- [ ] Usar `vscode.l10n.t()` para cargar mensajes

### Sprint 3: Testing (2-3 horas)
- [ ] Tests unitarios para `formatBytes()`
- [ ] Tests unitarios para `calculateStats()`
- [ ] Tests de integración para mensajes
- [ ] Validar en ambos idiomas
- [ ] Ejecutar suite completa

### Sprint 4: Polish (1 hora)
- [ ] Actualizar JSDoc
- [ ] Actualizar README.md
- [ ] Actualizar CHANGELOG.md
- [ ] Lint + Build + Test final

## 🎯 Ejemplos de Código Completos

### Ejemplo: Actualizar processDocument()
**Archivo**: `src/commands/minifyCommand.ts`

```typescript
async function processDocument(document: vscode.TextDocument, options: MinifyOptions = {}): Promise<void> {
  const fileType = document.languageId;
  const text = document.getText();

  if (!validateFileType(fileType) || !validateContentLength(text, fileType)) {
    return;
  }

  // CAMBIO AQUÍ: ahora recibe MinificationResult
  const result = await getMinifiedText(text, fileType);
  if (!result) {
    return;
  }

  // CAMBIO AQUÍ: extraer minifiedText y stats
  const { minifiedText, stats } = result;

  if (options.saveAsNewFile && options.filePrefix) {
    const newFileName = createMinifiedFileName(document.fileName, options.filePrefix);
    // CAMBIO AQUÍ: pasar stats
    await saveAsNewFile(minifiedText, newFileName, stats);
  } else {
    // CAMBIO AQUÍ: pasar stats
    await replaceDocumentContent(document, minifiedText, stats);
  }
}
```

### Ejemplo: Actualizar saveAsNewFile()
**Archivo**: `src/services/fileService.ts`

```typescript
// ANTES:
export async function saveAsNewFile(minifiedText: string, newFileName: string): Promise<void>

// DESPUÉS:
export async function saveAsNewFile(
  minifiedText: string, 
  newFileName: string, 
  stats: MinificationStats
): Promise<void> {
  const uri = vscode.Uri.file(newFileName);
  const textEncoder = new TextEncoder();
  const encodedContent = textEncoder.encode(minifiedText);
  
  await vscode.workspace.fs.writeFile(uri, encodedContent);
  
  const settings = vscode.workspace.getConfiguration("css-js-minifier");
  const autoOpenNewFile = settings.get("autoOpenNewFile") as boolean;
  
  if (autoOpenNewFile) {
    await vscode.window.showTextDocument(uri);
  }
  
  // CAMBIO AQUÍ: mensaje con estadísticas
  const fileName = newFileName.split('/').pop();
  const message = vscode.l10n.t(
    'messages.minification.success.newFile.withStats',
    fileName,
    stats.reductionPercent.toString(),
    stats.originalSizeKB,
    stats.minifiedSizeKB
  );
  vscode.window.showInformationMessage(message);
}
```

### Ejemplo: Mensajes i18n
**Archivo**: `package.nls.json`

Agregar estas líneas:
```json
{
  "commands.extension.minify.title": "Minify this File",
  "commands.extension.minifyInNewFile.title": "Minify and Save as New File",
  "configuration.title": "JS & CSS Minifier Tool Configuration",
  "...": "... (claves existentes) ...",
  
  "messages.minification.success.withStats": "{0} successfully minified! Size reduced by {1}% ({2} → {3})",
  "messages.minification.success.newFile.withStats": "File successfully minified and saved as: {0}! Size reduced by {1}% ({2} → {3})"
}
```

**Archivo**: `package.nls.es.json`

```json
{
  "commands.extension.minify.title": "Minificar este archivo",
  "...": "... (claves existentes) ...",
  
  "messages.minification.success.withStats": "¡{0} minificado exitosamente! Tamaño reducido en {1}% ({2} → {3})",
  "messages.minification.success.newFile.withStats": "¡Archivo minificado exitosamente y guardado como: {0}! Tamaño reducido en {1}% ({2} → {3})"
}
```

## 🐛 Troubleshooting Común

### Error: "Cannot find name 'MinificationResult'"
**Solución**: Asegúrate de exportar las interfaces:
```typescript
export interface MinificationStats { ... }
export interface MinificationResult { ... }
```

### Error: Type mismatch en processDocument()
**Solución**: Actualizar la destructuración:
```typescript
// Viejo:
const minifiedText = await getMinifiedText(text, fileType);

// Nuevo:
const result = await getMinifiedText(text, fileType);
if (!result) return;
const { minifiedText, stats } = result;
```

### Error: "Property 'stats' does not exist"
**Solución**: Agregar el parámetro stats a las firmas de función:
```typescript
saveAsNewFile(text: string, fileName: string, stats: MinificationStats)
replaceDocumentContent(doc: TextDocument, text: string, stats: MinificationStats)
```

### Tests fallan por timeout
**Solución**: Respetar delays entre tests:
```typescript
await delayBetweenTests(RATE_LIMIT_CONFIG.TEST_DELAY_MS);
```

## 🔗 Comandos Útiles

```bash
# Compilar código
npm run compile

# Compilar tests
npm run compile-tests

# Ejecutar linting
npm run lint

# Ejecutar tests (requiere VS Code environment)
npm test

# Build de producción
npm run package

# Watch mode (desarrollo)
npm run watch
```

## 📞 ¿Necesitas Ayuda?

1. **Consulta detalles**: Ver [TODO.md](./TODO.md) para lista completa de tareas
2. **Entiende el flujo**: Ver [IMPLEMENTATION-FLOW.md](./IMPLEMENTATION-FLOW.md) para diagramas
3. **Check progreso**: Ver [TODO-SUMMARY.md](./TODO-SUMMARY.md) para vista general

## ✅ Criterio de Éxito

Tu implementación está lista cuando:
- [ ] Usuario ve porcentaje de reducción en mensajes
- [ ] Funciona en minificación in-place
- [ ] Funciona en creación de nuevo archivo
- [ ] Mensajes en inglés y español correctos
- [ ] Todos los tests pasan (29 existentes + nuevos)
- [ ] No hay errores de linting
- [ ] Build de producción exitoso

---

**¡Buen Coding!** 🎉

Si sigues esta guía paso a paso, tendrás el feature implementado en ~8 horas.
