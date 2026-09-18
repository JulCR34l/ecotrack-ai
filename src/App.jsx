import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Leaf, 
  Send, 
  Zap, 
  Truck, 
  Trash2, 
  Droplet, 
  Flame, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Download, 
  HelpCircle, 
  Sparkles,
  Info,
  Building2,
  Calendar,
  BarChart3,
  Award,
  ArrowRight
} from 'lucide-react';

// Factor de emisión base y multiplicadores
const EMISSION_FACTORS = {
  kwh: 0.233, // kg CO2 por kWh
  km: 0.21,   // kg CO2 por km recorrido en vehículo estándar
  litros: 2.68, // kg CO2 por litro de combustible
  camionetas: 18.5, // estimativo diario por camioneta en ruta
  gas: 2.0,    // m3 o kg de gas
  residuos: 1.5, // kg de residuos no reciclados
  agua: 0.3    // m3 de agua consumida
};

// Conversor de palabras numéricas en español a números enteros
const SPANISH_NUMBERS = {
  'un': 1, 'uno': 1, 'una': 1,
  'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5,
  'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10,
  'ciento': 100, 'cien': 100, 'doscientos': 200, 'quinientos': 500
};

// Parser en Lenguaje Natural
const parseSpanishText = (text) => {
  const normalized = text.toLowerCase();
  
  // Extraer números escritos en dígitos o en palabras
  const getQuantity = (keywords) => {
    for (const kw of keywords) {
      // Coincidencia con números digitales (ej. 200 kWh)
      const digitRegex = new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*(?:${kw})`, 'i');
      const digitMatch = normalized.match(digitRegex);
      if (digitMatch) return parseFloat(digitMatch[1].replace(',', '.'));

      // Coincidencia con números escritos en letras (ej. cinco camionetas)
      const wordRegex = new RegExp(`(${Object.keys(SPANISH_NUMBERS).join('|')})\\s*(?:${kw})`, 'i');
      const wordMatch = normalized.match(wordRegex);
      if (wordMatch && SPANISH_NUMBERS[wordMatch[1]]) {
        return SPANISH_NUMBERS[wordMatch[1]];
      }
    }
    return 0;
  };

  const kwh = getQuantity(['kwh', 'kilovatios', 'luz', 'electricidad', 'energia']);
  const km = getQuantity(['km', 'kilometros', 'distancia', 'recorrido']);
  const camionetas = getQuantity(['camioneta', 'camionetas', 'furgon', 'furgones', 'vehiculo', 'vehiculos']);
  const litros = getQuantity(['litro', 'litros', 'gasolina', 'diesel', 'combustible']);
  const gas = getQuantity(['gas', 'm3 de gas', 'pipeta']);
  const residuos = getQuantity(['kg de basura', 'residuos', 'basura', 'desechos']);
  const agua = getQuantity(['m3 de agua', 'agua', 'litros de agua']);

  const transportCO2 = (km * EMISSION_FACTORS.km) + (camionetas * EMISSION_FACTORS.camionetas) + (litros * EMISSION_FACTORS.litros);
  const energyCO2 = (kwh * EMISSION_FACTORS.kwh) + (gas * EMISSION_FACTORS.gas);
  const wasteCO2 = (residuos * EMISSION_FACTORS.residuos) + (agua * EMISSION_FACTORS.agua);
  
  const totalCO2 = transportCO2 + energyCO2 + wasteCO2;

  const hasData = totalCO2 > 0;

  return {
    hasData,
    totalCO2: parseFloat(totalCO2.toFixed(2)),
    breakdown: {
      transport: parseFloat(transportCO2.toFixed(2)),
      energy: parseFloat(energyCO2.toFixed(2)),
      waste: parseFloat(wasteCO2.toFixed(2))
    },
    extractedMetrics: { kwh, km, camionetas, litros, gas, residuos, agua }
  };
};

const PRESETS = [
  {
    title: "🚚 Reparto Urbano",
    category: "Logística",
    text: "Hoy usamos 3 camionetas de reparto recorriendo 150 km y gastamos 45 kWh en bodega."
  },
  {
    title: "🍝 Restaurante Central",
    category: "Gastronomía",
    text: "Consumimos 120 kWh de luz, 15 kg de gas natural y generamos 25 kg de residuos."
  },
  {
    title: "💻 Oficina Tecnológica",
    category: "Servicios",
    text: "Operamos con 85 kWh de energía para los servidores y 12 m3 de agua durante la jornada."
  }
];

export default function App() {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem('ecotrack_logs');
    return saved ? JSON.parse(saved) : [
      {
        id: '1',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString('es-ES'),
        rawText: "Hoy operamos con 2 camionetas y gastamos 110 kWh de energía.",
        totalCO2: 62.63,
        breakdown: { transport: 37.0, energy: 25.63, waste: 0 },
        intensity: "Moderada"
      }
    ];
  });

  const chatEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('ecotrack_logs', JSON.stringify(logs));
  }, [logs]);

  // Cálculos reaccionando dinámicamente al estado de logs
  const { totalCO2Accumulated, todayCO2, categoryTotals } = useMemo(() => {
    let accTotal = 0;
    let todayTotal = 0;
    const catTotals = { transport: 0, energy: 0, waste: 0 };

    const todayStr = new Date().toLocaleDateString('es-ES');

    logs.forEach(log => {
      accTotal += log.totalCO2;
      if (log.date === todayStr) {
        todayTotal += log.totalCO2;
      }
      catTotals.transport += log.breakdown.transport;
      catTotals.energy += log.breakdown.energy;
      catTotals.waste += log.breakdown.waste;
    });

    return {
      totalCO2Accumulated: parseFloat(accTotal.toFixed(2)),
      todayCO2: parseFloat(todayTotal.toFixed(2)),
      categoryTotals: {
        transport: parseFloat(catTotals.transport.toFixed(2)),
        energy: parseFloat(catTotals.energy.toFixed(2)),
        waste: parseFloat(catTotals.waste.toFixed(2))
      }
    };
  }, [logs]);

  const calculateIntensity = (val) => {
    if (val < 20) return { label: "Baja", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };
    if (val < 70) return { label: "Moderada", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" };
    return { label: "Alta", color: "text-rose-400 bg-rose-500/10 border-rose-500/30" };
  };

  const handleProcessEntry = (textToSend = inputText) => {
    if (!textToSend.trim()) return;

    setValidationError(null);
    setIsProcessing(true);

    setTimeout(() => {
      const parsed = parseSpanishText(textToSend);

      if (!parsed.hasData) {
        setValidationError(
          "No pudimos detectar métricas cuantitativas claras (kWh, km, litros, camionetas, gas). Intenta incluir cantidades y unidades en tu descripción."
        );
        setIsProcessing(false);
        return;
      }

      const intensityObj = calculateIntensity(parsed.totalCO2);

      const newLog = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString('es-ES'),
        rawText: textToSend,
        totalCO2: parsed.totalCO2,
        breakdown: parsed.breakdown,
        extractedMetrics: parsed.extractedMetrics,
        intensity: intensityObj.label
      };

      // Actualización reactiva inmediata
      setLogs(prevLogs => [newLog, ...prevLogs]);
      setInputText('');
      setIsProcessing(false);
    }, 800);
  };

  const exportCSV = () => {
    const headers = "ID,Fecha,Hora,Texto,Total_CO2_kg,Transporte_kg,Energia_kg,Residuos_kg,Intensidad\n";
    const rows = logs.map(l => 
      `"${l.id}","${l.date}","${l.timestamp}","${l.rawText.replace(/"/g, '""')}",${l.totalCO2},${l.breakdown.transport},${l.breakdown.energy},${l.breakdown.waste},"${l.intensity}"`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ecotrack_reporte_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearHistory = () => {
    if (window.confirm("¿Deseas reiniciar el historial de registros?")) {
      setLogs([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header Superior */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Leaf className="h-6 w-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-200 to-white">
                  EcoTrack AI
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  MVP Pymes
                </span>
              </div>
              <p className="text-xs text-slate-400">Calculadora conversacional de huella de carbono</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button 
              onClick={exportCSV}
              disabled={logs.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar CSV
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Columna Izquierda: Asistente Conversacional (5 cols) */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          
          {/* Tarjeta de Entrada */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Asistente de Registro IA</span>
              </div>
              <span className="text-xs text-slate-400">Español Natural</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Describe tus operaciones operativas del día. Nuestra IA identificará los consumos energéticos, logísticos y residuos para calcular tus kg de CO₂e.
            </p>

            {/* Presets Rápidos */}
            <div className="space-y-2">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                Prueba un ejemplo rápido:
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputText(p.text);
                      handleProcessEntry(p.text);
                    }}
                    className="text-left px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-emerald-500/40 transition group"
                  >
                    <div className="flex items-center justify-between text-xs font-medium text-slate-200">
                      <span>{p.title}</span>
                      <span className="text-[10px] text-emerald-400 opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5">
                        Procesar <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{p.text}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea y Botón */}
            <div className="relative mt-2">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ejemplo: Hoy usaremos 2 camionetas recorriendo 80 km y gastamos 150 kWh de luz..."
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/60 transition resize-none"
              />

              {validationError && (
                <div className="mt-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-rose-300 text-xs animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <p>{validationError}</p>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Info className="w-3 h-3" /> Soporta kWh, km, litros, gas, camionetas
                </span>
                <button
                  onClick={() => handleProcessEntry()}
                  disabled={isProcessing || !inputText.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Extrayendo...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Calcular Huella
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Guía Rápida */}
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400">
            <h4 className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-emerald-400" /> Factores de Emisión Utilizados
            </h4>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-[11px]">
              <li>• Electricity: 0.233 kg/kWh</li>
              <li>• Gasolina/Diesel: 2.68 kg/L</li>
              <li>• Furgón/Camioneta: 18.5 kg/día</li>
              <li>• Transporte general: 0.21 kg/km</li>
            </ul>
          </div>
        </section>

        {/* Columna Derecha: Dashboard & Gráficos (7 cols) */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Tarjetas Superiores de Métricas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Total Acumulado */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
              <p className="text-xs font-medium text-slate-400">Huella Total Acumulada</p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-white tracking-tight">
                  {totalCO2Accumulated}
                </span>
                <span className="text-xs font-semibold text-emerald-400">kg CO₂e</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Registros de la sesión</p>
            </div>

            {/* Emitido Hoy */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
              <p className="text-xs font-medium text-slate-400">Emitido Hoy</p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-teal-300 tracking-tight">
                  {todayCO2}
                </span>
                <span className="text-xs font-semibold text-teal-400">kg CO₂e</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">{logs.length} entradas procesadas</p>
            </div>

            {/* Intensidad Promedio */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
              <p className="text-xs font-medium text-slate-400">Nivel de Impacto</p>
              <div className="mt-2">
                {logs.length > 0 ? (
                  <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full border ${calculateIntensity(logs[0]?.totalCO2 || 0).color}`}>
                    {calculateIntensity(logs[0]?.totalCO2 || 0).label}
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">Sin datos</span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Basado en el último cálculo</p>
            </div>
          </div>

          {/* Desglose Ambiental por Categoría */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Desglose de Emisiones por Categoría
            </h3>

            {totalCO2Accumulated === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                Ingresa una actividad en el chat para visualizar el desglose ambiental.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Bar Transporte */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                      <Truck className="w-3.5 h-3.5 text-amber-400" /> Transporte y Logística
                    </span>
                    <span className="font-semibold text-slate-200">
                      {categoryTotals.transport} kg ({((categoryTotals.transport / totalCO2Accumulated) * 100 || 0).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(categoryTotals.transport / totalCO2Accumulated) * 100 || 0}%` }}
                    />
                  </div>
                </div>

                {/* Bar Energía */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                      <Zap className="w-3.5 h-3.5 text-emerald-400" /> Energía y Electricidad
                    </span>
                    <span className="font-semibold text-slate-200">
                      {categoryTotals.energy} kg ({((categoryTotals.energy / totalCO2Accumulated) * 100 || 0).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(categoryTotals.energy / totalCO2Accumulated) * 100 || 0}%` }}
                    />
                  </div>
                </div>

                {/* Bar Residuos */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                      <Trash2 className="w-3.5 h-3.5 text-teal-400" /> Residuos y Agua
                    </span>
                    <span className="font-semibold text-slate-200">
                      {categoryTotals.waste} kg ({((categoryTotals.waste / totalCO2Accumulated) * 100 || 0).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div 
                      className="bg-teal-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(categoryTotals.waste / totalCO2Accumulated) * 100 || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Historial de Registros */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Historial de Actividades Procesadas
              </h3>
              {logs.length > 0 && (
                <button 
                  onClick={clearHistory}
                  className="text-xs text-rose-400 hover:text-rose-300 transition"
                >
                  Limpiar historial
                </button>
              )}
            </div>

            <div className="overflow-x-auto flex-1">
              {logs.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  No hay registros aún en esta sesión.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 px-2">Hora</th>
                      <th className="pb-3 px-2">Descripción</th>
                      <th className="pb-3 px-2 text-right">CO₂ (kg)</th>
                      <th className="pb-3 px-2 text-center">Impacto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {logs.map((log) => {
                      const badge = calculateIntensity(log.totalCO2);
                      return (
                        <tr key={log.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-2 text-slate-400 font-mono whitespace-nowrap text-[11px]">
                            {log.timestamp}
                          </td>
                          <td className="py-3 px-2 text-slate-200 max-w-xs truncate">
                            {log.rawText}
                          </td>
                          <td className="py-3 px-2 text-right font-bold text-emerald-400">
                            {log.totalCO2}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium border ${badge.color}`}>
                              {badge.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/50 py-4 mt-auto text-center text-xs text-slate-500">
        EcoTrack AI © {new Date().getFullYear()} — Plataforma de Estimación de Huella Ecológica para Pymes.
      </footer>
    </div>
  );
}