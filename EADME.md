# 🌿 EcoTrack AI — Documento de Bitácora y Guía de Proyecto

**Proyecto:** EcoTrack AI — Calculadora Conversacional de Huella de Carbono para Pymes  
**Autor:** Estudiante de Ingeniería de Sistemas  
**Institución:** Escuela Colombiana de Ingeniería Julio Garavito  
**Fecha:** Septiembre 2026  

---

## 🚀 Descripción General

EcoTrack AI es un MVP en **React** y **Tailwind CSS** diseñado para pequeñas y medianas empresas (Pymes). Permite calcular y monitorear la huella de carbono diaria de manera conversacional en español utilizando procesamiento de lenguaje natural (NLP simulado).

---

## 📝 1. Prompts Principales Utilizados

El desarrollo iterativo de **EcoTrack AI** se basó en una estrategia de *Prompt Engineering* estructurada por capas funcional y de diseño, permitiendo pasar de una especificación conceptual a un software interactivo de nivel producción.

### 1.1 Master Prompt Inicial (Definición del MVP)
> *"Crea un MVP web moderno e interactivo para la startup 'EcoTrack AI' enfocado en calcular la huella de carbono de pequeños negocios de forma conversacional y simplificada.*  
> *Diseño y Estética: Interfaz limpia, profesional y minimalista utilizando una paleta de colores ecológica (tonos verde muesli, esmeralda y acentos oscuros). Layout responsive centrado en un área principal de entrada de texto/chat.*  
> *Funcionalidades Clave: Entrada de lenguaje natural, Procesamiento e Interpretación (Mock API de IA), Dashboard de Resumen con tarjetas dinámicas, Historial de Registros.*  
> *Desarrolla el frontend completo con React, Tailwind CSS y Lucide Icons, asegurando que sea totalmente funcional e interactivo."*

### 1.2 Prompt de Rediseño de Interfaz y UX Avanzada
> *"Añade un selector interactivo con 3 ejemplos predeterminados para que el usuario pueda probar el sistema con un solo clic. Mejora los gráficos o barras de progreso para mostrar visualmente el impacto ambiental por categoría (Transporte vs Energía) y haz que el botón de envío tenga una animación sutil de carga al simular la extracción de datos con IA."*

### 1.3 Prompt de Lógica de Procesamiento NLP y Validación
> *"Implementa un parser simulado en JS/TS que tome cualquier texto descriptivo en español e identifique palabras clave relacionadas con unidades (kWh, km, litros, camionetas). Si el texto no menciona datos cuantitativos claros, muestra un mensaje amigable indicando que se requiere más detalle para calcular la huella exacta."*

---

## 🐞 2. Proceso de Iteración y Debugging

Durante el ciclo de desarrollo se presentaron varios desafíos de reactividad de estado y experiencia de usuario en React. A continuación se detallan la causa raíz de los 4 errores principales y cómo fueron solventados.

### Bug 1: Cierre Desactualizado (*Stale Closure*) al Actualizar el Historial
* **Problema:** Al procesar un nuevo registro desde el panel de chat, los valores del total acumulado y los gráficos de desglose no reflejaban los datos de forma inmediata, requiriendo recargar el navegador o enviar un segundo mensaje.
* **Causa Raíz:** El manejo del estado `logs` dentro de funciones memoizadas (`useCallback`) leía una referencia antigua (*stale closure*) del array sin incluir las últimas actualizaciones.
* **Solución:** Se reestructuró la mutación del estado utilizando la forma funcional de actualización `setLogs(prevLogs => [newLog, ...prevLogs])` y se recalculó la métrica global directamente sobre el estado reactivo mediante `useMemo`.

---

### Bug 2: Renderizado Ineficiente por Claves Basadas en Índices (*Index Keys*)
* **Problema:** Al eliminar registros o insertar un nuevo elemento al inicio de la lista, React renderizaba incorrectamente las insignias de intensidad (*Low/Moderate/High*) y mezclaba las propiedades de animaciones.
* **Causa Raíz:** El mapeo de la tabla de historial utilizaba `index` como propiedad `key` (`key={index}`). Al usar `unshift` o prepend en arrays, los índices cambian de posición, confundiendo el algoritmo de reconciliación del DOM Virtual de React.
* **Solución:** Se sustituyó la clave por un identificador único global generado dinámicamente (`id: Date.now().toString()`).

---

### Bug 3: Pérdida de Enfoque y Autodespliegue del Panel de Historial
* **Problema:** Al enviar una entrada desde el área de texto, la pantalla mantenía el foco en la parte inferior del chat sin desplazar la atención del usuario hacia las tarjetas de métricas o el historial recién actualizado en pantallas móviles/tablets.
* **Causa Raíz:** Ausencia de gestión de scroll y de referencias DOM tras la inyección asíncrona simulada de datos (`setTimeout`).
* **Solución:** Se implementó una referencia `useRef` para canalizar el scroll suave de la interfaz y notificar visualmente al usuario con animaciones CSS (`animate-fadeIn` / `transition-all`) sobre la actualización del historial.


---

### Bug 4: Desfasamiento en la Barra Acumulativa por Categorías
* **Problema:** Al calcular proporciones por categoría (Transporte vs. Energía vs. Residuos), el porcentaje acumulado superaba el 100% o producía errores `NaN%` cuando la huella total era `0`.
* **Causa Raíz:** División por cero en el cálculo proporcional cuando la lista de logs estaba vacía, sumado a imprecisiones de coma flotante en JavaScript.
* **Solución:** Se implementó una guardia lógica en el renderizado de porcentajes `((categoryTotals.transport / totalCO2Accumulated) * 100 || 0).toFixed(1)` junto con saneamiento previo de valores usando `parseFloat(val.toFixed(2))`.


---

## 🧠 3. Explicación de la Funcionalidad de IA (Mock Engine & NLP)

La solución simula un motor de Inteligencia Artificial que analiza lenguaje natural en español sin depender de llamadas de API externas costosas o lentas.

```text
                               ┌────────────────────────────────┐
                               │  Entrada de Texto en Español   │
                               └───────────────┬────────────────┘
                                               │
                                               ▼
                               ┌────────────────────────────────┐
                               │  Normalización de Texto & NLP  │
                               │   (Mapeo de palabras numéricas)│
                               └───────────────┬────────────────┘
                                               │
                                               ▼
                               ┌────────────────────────────────┐
                               │ Extracción de Entidades/Métricas│
                               │ (kWh, km, litros, camionetas)  │
                               └───────────────┬────────────────┘
                                               │
                                 ┌─────────────┴─────────────┐
                                 │                           │
                        [¿Métricas > 0?]             [Sin Métricas]
                                 │                           │
                                 ▼                           ▼
                   ┌───────────────────────────┐ ┌───────────────────────┐
                   │ Aplicar Factores CO2e     │ │ Notificación Friendly │
                   │   • Transport: 0.21 kg/km │ │ "Se requieren datos   │
                   │   • Energy: 0.233 kg/kWh  │ │  cuantitativos"       │
                   │   • Gas: 2.0 kg/m3        │ └───────────────────────┘
                   └─────────────┬─────────────┘
                                 │
                                 ▼
                   ┌───────────────────────────┐
                   │ Retorno de Resultados     │
                   │   Total CO2 + Breakdown   │
                   └───────────────────────────┘