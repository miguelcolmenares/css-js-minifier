# 🔄 Flujo de Implementación: Estadísticas de Reducción de Tamaño

## 📊 Arquitectura del Feature

```
┌─────────────────────────────────────────────────────────────────┐
│                    USUARIO EJECUTA COMANDO                      │
│              (Minify / Minify in New File)                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│           src/commands/minifyCommand.ts                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  processDocument(document, options)                      │  │
│  │  - Lee contenido del documento (originalText)            │  │
│  │  - Valida tipo de archivo y contenido                    │  │
│  └────────────────────┬─────────────────────────────────────┘  │
└────────────────────────┼────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│        src/services/minificationService.ts                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  getMinifiedText(text, fileType)                         │  │
│  │  1. Calcula originalSize = originalText.length           │  │
│  │  2. Llama API de Toptal                                  │  │
│  │  3. Calcula minifiedSize = minifiedText.length           │  │
│  │  4. Calcula estadísticas con calculateStats()            │  │
│  │  5. Retorna MinificationResult:                          │  │
│  │     {                                                     │  │
│  │       minifiedText: string,                              │  │
│  │       stats: {                                            │  │
│  │         originalSize: number,                            │  │
│  │         minifiedSize: number,                            │  │
│  │         reductionPercent: number,                        │  │
│  │         originalSizeKB: string,                          │  │
│  │         minifiedSizeKB: string                           │  │
│  │       }                                                   │  │
│  │     }                                                     │  │
│  └────────────────────┬─────────────────────────────────────┘  │
└────────────────────────┼────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│           src/commands/minifyCommand.ts                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  processDocument() continúa...                           │  │
│  │  - Recibe MinificationResult                             │  │
│  │  - Decide según options.saveAsNewFile                    │  │
│  └────────────────────┬─────────────────────────────────────┘  │
└────────────────────────┼────────────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
          ▼                             ▼
┌─────────────────────┐       ┌─────────────────────┐
│   Nueva Archivo     │       │    In-Place         │
└─────────────────────┘       └─────────────────────┘
          │                             │
          ▼                             ▼
┌─────────────────────────────────────────────────────────────────┐
│            src/services/fileService.ts                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  saveAsNewFile(minifiedText, fileName, stats)            │  │
│  │  - Crea nuevo archivo                                    │  │
│  │  - Carga mensaje i18n con estadísticas                   │  │
│  │  - Muestra: "File saved as X! Size reduced by Y%"       │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  replaceDocumentContent(document, minifiedText, stats)   │  │
│  │  - Reemplaza contenido del documento                     │  │
│  │  - Carga mensaje i18n con estadísticas                   │  │
│  │  - Muestra: "X minified! Size reduced by Y%"            │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Mensaje al Usuario                             │
│  "style.css successfully minified!                              │
│   Size reduced by 45% (1.21 KB → 0.66 KB)"                     │
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 Funciones Helper

```
┌─────────────────────────────────────────────────────────────────┐
│        Helper Functions (minificationService.ts)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  calculateStats(originalText, minifiedText)                    │
│  ┌───────────────────────────────────────────────────────┐    │
│  │ 1. originalSize = new TextEncoder().encode(original)  │    │
│  │ 2. minifiedSize = new TextEncoder().encode(minified)  │    │
│  │ 3. reductionPercent = ((orig - min) / orig) * 100     │    │
│  │ 4. originalSizeKB = formatBytes(originalSize)         │    │
│  │ 5. minifiedSizeKB = formatBytes(minifiedSize)         │    │
│  │ 6. return MinificationStats                           │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                                 │
│  formatBytes(bytes)                                            │
│  ┌───────────────────────────────────────────────────────┐    │
│  │ if bytes < 1024:                                      │    │
│  │   return "X B"                                        │    │
│  │ else:                                                 │    │
│  │   kb = bytes / 1024                                   │    │
│  │   return "X.XX KB"                                    │    │
│  └───────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## 🌐 Sistema de Internacionalización

```
┌─────────────────────────────────────────────────────────────────┐
│                     i18n Message Flow                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  VS Code detecta idioma del usuario                            │
│         │                                                       │
│         ▼                                                       │
│  ┌────────────────┐              ┌────────────────┐           │
│  │ package.nls    │              │ package.nls    │           │
│  │     .json      │              │   .es.json     │           │
│  │   (English)    │              │   (Español)    │           │
│  └────────────────┘              └────────────────┘           │
│         │                                │                     │
│         ▼                                ▼                     │
│  Carga automática según idioma de VS Code                     │
│         │                                                       │
│         ▼                                                       │
│  En código TypeScript:                                         │
│  ┌───────────────────────────────────────────────────────┐    │
│  │ const message = vscode.l10n.t(                        │    │
│  │   'messages.minification.success.withStats',          │    │
│  │   fileName,                    // {0}                 │    │
│  │   stats.reductionPercent,      // {1}                 │    │
│  │   stats.originalSizeKB,        // {2}                 │    │
│  │   stats.minifiedSizeKB         // {3}                 │    │
│  │ );                                                    │    │
│  └───────────────────────────────────────────────────────┘    │
│         │                                                       │
│         ▼                                                       │
│  VS Code reemplaza placeholders con valores                   │
│         │                                                       │
│         ▼                                                       │
│  Mensaje final mostrado al usuario                            │
└─────────────────────────────────────────────────────────────────┘
```

## 📝 Estructura de Datos

```typescript
// Interfaces principales

interface MinificationStats {
  originalSize: number;      // bytes: 1234
  minifiedSize: number;      // bytes: 678
  reductionPercent: number;  // percent: 45
  originalSizeKB: string;    // formatted: "1.21 KB"
  minifiedSizeKB: string;    // formatted: "0.66 KB"
}

interface MinificationResult {
  minifiedText: string;      // código minificado
  stats: MinificationStats;  // estadísticas
}
```

## 🧪 Flujo de Testing

```
┌─────────────────────────────────────────────────────────────────┐
│                    Test Suites Structure                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Suite: "Size Reduction Statistics"                            │
│  ├─ Test: "calculate correct percentage"                       │
│  │  └─ Input: 1000 bytes → 500 bytes                          │
│  │  └─ Expected: 50%                                           │
│  │                                                              │
│  ├─ Test: "format bytes to KB"                                 │
│  │  └─ Input: 1024 bytes                                       │
│  │  └─ Expected: "1.00 KB"                                     │
│  │                                                              │
│  ├─ Test: "handle edge cases"                                  │
│  │  ├─ Zero size file                                          │
│  │  ├─ No reduction (same size)                                │
│  │  └─ Size increase (rare)                                    │
│  │                                                              │
│  └─ Test: "return MinificationResult"                          │
│     └─ Verify structure has minifiedText and stats             │
│                                                                 │
│  Suite: "Integration Tests with Stats"                         │
│  ├─ Test: "show stats in-place minification"                   │
│  │  └─ Mock showInformationMessage                            │
│  │  └─ Verify message contains percentage                     │
│  │                                                              │
│  ├─ Test: "show stats new file"                                │
│  │  └─ Mock showInformationMessage                            │
│  │  └─ Verify message contains sizes                          │
│  │                                                              │
│  └─ Test: "display in correct language"                        │
│     ├─ Set VS Code locale to 'en'                             │
│     ├─ Verify English message                                 │
│     ├─ Set VS Code locale to 'es'                             │
│     └─ Verify Spanish message                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 Orden de Implementación Recomendado

```
1. ┌─────────────────────────────────────┐
   │ Crear Interfaces y Tipos            │ ⏱️ 30 min
   │ - MinificationStats                 │
   │ - MinificationResult                │
   └─────────────────────────────────────┘

2. ┌─────────────────────────────────────┐
   │ Implementar Helper Functions        │ ⏱️ 1 hora
   │ - calculateStats()                  │
   │ - formatBytes()                     │
   └─────────────────────────────────────┘

3. ┌─────────────────────────────────────┐
   │ Tests para Helpers                  │ ⏱️ 1 hora
   │ - Test calculateStats()             │
   │ - Test formatBytes()                │
   │ - Test edge cases                   │
   └─────────────────────────────────────┘

4. ┌─────────────────────────────────────┐
   │ Modificar getMinifiedText()         │ ⏱️ 1 hora
   │ - Calcular tamaños                  │
   │ - Retornar MinificationResult       │
   └─────────────────────────────────────┘

5. ┌─────────────────────────────────────┐
   │ Agregar Mensajes i18n               │ ⏱️ 30 min
   │ - package.nls.json (inglés)         │
   │ - package.nls.es.json (español)     │
   └─────────────────────────────────────┘

6. ┌─────────────────────────────────────┐
   │ Actualizar File Services            │ ⏱️ 1.5 horas
   │ - saveAsNewFile() con stats         │
   │ - replaceDocumentContent() con stats│
   │ - Usar vscode.l10n.t()              │
   └─────────────────────────────────────┘

7. ┌─────────────────────────────────────┐
   │ Actualizar Command Handler          │ ⏱️ 30 min
   │ - processDocument() pasar stats     │
   └─────────────────────────────────────┘

8. ┌─────────────────────────────────────┐
   │ Tests de Integración                │ ⏱️ 2 horas
   │ - In-place con stats                │
   │ - New file con stats                │
   │ - Ambos idiomas                     │
   └─────────────────────────────────────┘

9. ┌─────────────────────────────────────┐
   │ Documentación                       │ ⏱️ 1 hora
   │ - README.md                         │
   │ - CHANGELOG.md                      │
   │ - JSDoc updates                     │
   └─────────────────────────────────────┘

10.┌─────────────────────────────────────┐
   │ Validación y Release                │ ⏱️ 1 hora
   │ - Lint, Build, Test                 │
   │ - Manual testing                    │
   │ - Version bump                      │
   │ - Publish                           │
   └─────────────────────────────────────┘

   Total Estimado: 10.5 horas
```

## 🎯 Puntos Críticos de Validación

```
┌─────────────────────────────────────────────────────────────────┐
│                  Validation Checkpoints                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✓ Checkpoint 1: Después de crear helpers                      │
│    - Ejecutar tests unitarios de helpers                       │
│    - Verificar cálculos correctos                              │
│                                                                 │
│  ✓ Checkpoint 2: Después de modificar getMinifiedText()        │
│    - Verificar que retorna MinificationResult                  │
│    - Comprobar que stats tiene todos los campos                │
│                                                                 │
│  ✓ Checkpoint 3: Después de agregar i18n                       │
│    - Verificar sintaxis JSON                                   │
│    - Comprobar que ambos archivos tienen las mismas claves    │
│                                                                 │
│  ✓ Checkpoint 4: Después de actualizar file services           │
│    - Ejecutar npm run lint                                     │
│    - Compilar código sin errores                               │
│                                                                 │
│  ✓ Checkpoint 5: Antes de commit                               │
│    - Ejecutar suite completa de tests                          │
│    - Testing manual en ambos idiomas                           │
│    - Verificar mensajes en UI                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

**Diagrama Creado**: 2025-10-17  
**Versión**: 1.0  
**Uso**: Referencia visual para implementación del feature
