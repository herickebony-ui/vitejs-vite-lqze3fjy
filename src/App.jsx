import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Trash2, 
  Plus, 
  Copy, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle,
  Dumbbell,
  RefreshCw,
  Clock, // Ícone para vigência
  ArrowRight,
  UserPlus // Ícone para Novo Aluno
} from 'lucide-react';

// --- Utilitários de Data ---

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

// Feriados Fixos com NOMES (Incluindo Itabuna e Bahia)
const HOLIDAYS_FIXED = {
  '01-01': 'Confraternização Universal',
  '19-03': 'Dia de São José (Itabuna)',
  '21-04': 'Tiradentes',
  '01-05': 'Dia do Trabalho',
  '24-06': 'São João (Festa Junina)',
  '02-07': 'Independência da Bahia',
  '28-07': 'Aniversário de Itabuna',
  '07-09': 'Independência do Brasil',
  '12-10': 'Nossa Sra. Aparecida',
  '02-11': 'Finados',
  '15-11': 'Proclamação da República',
  '25-12': 'Natal'
};

const getHolidayName = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const key = `${day}-${month}`;
  return HOLIDAYS_FIXED[key] || null;
};

const formatDateBR = (date) => {
  return new Intl.DateTimeFormat('pt-BR').format(date);
};

// --- Componentes ---

export default function EbonyFeedbackSystem() {
  const [year, setYear] = useState(new Date().getFullYear());
  
  // Lista de datas selecionadas
  const [selectedDates, setSelectedDates] = useState(() => {
    const saved = localStorage.getItem('ebony_selectedDates');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Lista de Troca de Treino
  const [trainingDates, setTrainingDates] = useState(() => {
    const saved = localStorage.getItem('ebony_trainingDates');
    return saved ? JSON.parse(saved) : [];
  });

  // Férias (Persistente)
  const [vacationRanges, setVacationRanges] = useState(() => {
    const saved = localStorage.getItem('ebony_vacationRanges');
    return saved ? JSON.parse(saved) : [];
  });

  // Vigência do Plano
  const [planStart, setPlanStart] = useState(() => localStorage.getItem('ebony_planStart') || '');
  const [planEnd, setPlanEnd] = useState(() => localStorage.getItem('ebony_planEnd') || '');
  const [planDuration, setPlanDuration] = useState(() => localStorage.getItem('ebony_planDuration') || ''); 
  
  // SALVAR AUTOMATICAMENTE
  useEffect(() => { localStorage.setItem('ebony_selectedDates', JSON.stringify(selectedDates)); }, [selectedDates]);
  useEffect(() => { localStorage.setItem('ebony_vacationRanges', JSON.stringify(vacationRanges)); }, [vacationRanges]);
  useEffect(() => { localStorage.setItem('ebony_trainingDates', JSON.stringify(trainingDates)); }, [trainingDates]);
  
  // Salvar Vigência
  useEffect(() => { localStorage.setItem('ebony_planStart', planStart); }, [planStart]);
  useEffect(() => { localStorage.setItem('ebony_planEnd', planEnd); }, [planEnd]);
  useEffect(() => { localStorage.setItem('ebony_planDuration', planDuration); }, [planDuration]);
  
  // Estados temporários
  const [vacationStart, setVacationStart] = useState('');
  const [vacationEnd, setVacationEnd] = useState('');

  // Lógica de Cálculo Automático de Data Final
  const calculatePlanEnd = (start, months) => {
    if (!start || !months) return;
    
    const date = new Date(start + 'T12:00:00'); 
    const monthsToAdd = parseInt(months);
    
    if (!isNaN(monthsToAdd)) {
      date.setMonth(date.getMonth() + monthsToAdd);
      
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      
      setPlanEnd(`${y}-${m}-${d}`);
    }
  };

  const handleDurationChange = (e) => {
    const val = e.target.value;
    setPlanDuration(val);
    calculatePlanEnd(planStart, val);
  };

  const handleStartDateChange = (e) => {
    const val = e.target.value;
    setPlanStart(val);
    if (planDuration) {
      calculatePlanEnd(val, planDuration);
    }
  };

  const toggleDate = (dateStr) => {
    setSelectedDates(prev => {
      if (prev.includes(dateStr)) {
        setTrainingDates(tPrev => tPrev.filter(d => d !== dateStr));
        return prev.filter(d => d !== dateStr);
      } else {
        return [...prev, dateStr].sort();
      }
    });
  };

  const toggleTrainingType = (dateStr) => {
    setTrainingDates(prev => {
      if (prev.includes(dateStr)) return prev.filter(d => d !== dateStr);
      else return [...prev, dateStr];
    });
  };

  const addVacation = () => {
    if (vacationStart && vacationEnd) {
      if (new Date(vacationStart) > new Date(vacationEnd)) {
        alert("Data fim deve ser depois do início.");
        return;
      }
      setVacationRanges([...vacationRanges, { start: vacationStart, end: vacationEnd, id: Date.now() }]);
      setVacationStart('');
      setVacationEnd('');
    }
  };

  const removeVacation = (id) => {
    setVacationRanges(prev => prev.filter(v => v.id !== id));
  };

  const isVacation = (dateStr) => {
    const target = new Date(dateStr);
    return vacationRanges.some(range => {
      const start = new Date(range.start + 'T00:00:00');
      const end = new Date(range.end + 'T23:59:59'); 
      const check = new Date(dateStr + 'T12:00:00');
      return check >= start && check <= end;
    });
  };

  const processedList = useMemo(() => {
    let lastTrainingAnchor = selectedDates[0]; 

    return selectedDates.map((dateStr, index) => {
      let diffWeeks = '-'; 
      let trainingBlockDuration = '-'; 
      let status = 'Normal';
      let type = trainingDates.includes(dateStr) ? 'Troca de Treino' : 'Feedback';

      const current = new Date(dateStr);

      if (index > 0) {
        const prev = new Date(selectedDates[index - 1]);
        const diffTime = Math.abs(current - prev);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        diffWeeks = Math.floor(diffDays / 7);
      }

      if (type === 'Troca de Treino' && dateStr !== selectedDates[0]) {
         const anchor = new Date(lastTrainingAnchor);
         const blockDiffTime = Math.abs(current - anchor);
         const blockDiffDays = Math.ceil(blockDiffTime / (1000 * 60 * 60 * 24));
         trainingBlockDuration = Math.floor(blockDiffDays / 7);
         lastTrainingAnchor = dateStr;
      }

      if (isVacation(dateStr)) {
        status = 'Atenção: Durante Férias';
      }

      return {
        id: dateStr,
        dateFormatted: formatDateBR(new Date(dateStr + 'T12:00:00')),
        rawDate: dateStr,
        diffWeeks,
        trainingBlockDuration,
        status,
        type
      };
    });
  }, [selectedDates, vacationRanges, trainingDates]);

  const stats = useMemo(() => {
    const total = processedList.length;
    const training = processedList.filter(i => i.type === 'Troca de Treino').length;
    const totalWeeks = processedList.reduce((acc, curr) => typeof curr.diffWeeks === 'number' ? acc + curr.diffWeeks : acc, 0);
    return { total, training, totalWeeks };
  }, [processedList]);

  const copyToClipboard = () => {
    const header = "Ordem\tData\tIntervalo (Sem.)\tCiclo (Duração Ficha)\tTipo\tAlertas\n";
    const body = processedList.map((item, idx) => 
      `${idx + 1}\t${item.dateFormatted}\t${item.diffWeeks}\t${item.trainingBlockDuration}\t${item.type}\t${item.status === 'Normal' ? '' : item.status}`
    ).join('\n');
    
    const textToCopy = header + body;
    const textArea = document.createElement("textarea");
    textArea.value = textToCopy;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy') ? alert("Copiado com sucesso!") : alert("Erro ao copiar.");
    } catch (err) { alert("Erro ao copiar."); }
    document.body.removeChild(textArea);
  };

  // --- FUNÇÕES DE LIMPEZA ---

  // Limpar Apenas Cronograma (Novo Aluno)
  const clearSchedule = () => {
    if(confirm("Iniciar planejamento de NOVO ALUNO?\n\nIsso apagará:\n- Datas selecionadas\n- Vigência do plano\n\nMas MANTERÁ suas férias salvas.")) {
      setSelectedDates([]);
      setTrainingDates([]);
      setPlanStart('');
      setPlanEnd('');
      setPlanDuration('');
      
      localStorage.removeItem('ebony_selectedDates');
      localStorage.removeItem('ebony_trainingDates');
      localStorage.removeItem('ebony_planStart');
      localStorage.removeItem('ebony_planEnd');
      localStorage.removeItem('ebony_planDuration');
      // Não remove vacatonRanges
    }
  };

  // Limpar TUDO (Reset de Fábrica)
  const resetAll = () => {
    if(confirm("ATENÇÃO: Isso apagará TUDO, inclusive seus períodos de Férias salvos.\n\nDeseja continuar?")) {
       setSelectedDates([]);
       setTrainingDates([]);
       setVacationRanges([]);
       setPlanStart('');
       setPlanEnd('');
       setPlanDuration('');
       localStorage.clear(); // Limpa tudo do domínio
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-emerald-400" />
              Gestão de Ciclos de Treino
            </h1>
            <p className="text-slate-400 text-sm">Ebony Team - Planejador de Periodização</p>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-800 p-2 rounded-lg">
            <button onClick={() => setYear(year - 1)} className="p-1 hover:bg-slate-700 rounded"><ChevronLeft size={20}/></button>
            <span className="text-xl font-mono font-bold w-20 text-center">{year}</span>
            <button onClick={() => setYear(year + 1)} className="p-1 hover:bg-slate-700 rounded"><ChevronRight size={20}/></button>
          </div>
          
           {/* Botão de Reset Total (Discreto) */}
           <button onClick={resetAll} className="text-[10px] text-slate-500 hover:text-red-400 absolute top-2 right-2 md:static md:ml-4">
             Reset Total
           </button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        
        {/* Painel Esquerdo */}
        <div className="lg:col-span-4 space-y-6"> 
          
          {/* Estatísticas Rápidas */}
          <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-50 p-2 rounded border border-slate-100">
              <span className="block text-xl font-bold text-slate-700">{stats.total}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wide">Encontros</span>
            </div>
            <div className="bg-violet-50 p-2 rounded border border-violet-100">
              <span className="block text-xl font-bold text-violet-600">{stats.training}</span>
              <span className="text-[10px] text-violet-400 uppercase tracking-wide">Trocas de Ficha</span>
            </div>
            <div className="bg-emerald-50 p-2 rounded border border-emerald-100">
              <span className="block text-xl font-bold text-emerald-600">{stats.totalWeeks}</span>
              <span className="text-[10px] text-emerald-500 uppercase tracking-wide">Semanas Totais</span>
            </div>
          </section>

          {/* Férias */}
          <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <h2 className="font-semibold text-lg mb-3 flex items-center gap-2 text-slate-700">
              <span className="w-2 h-8 bg-red-400 rounded-full"></span>
              Férias / Ausências (Salvas)
            </h2>
            <div className="flex gap-2 mb-2">
              <input type="date" className="w-full p-2 border rounded text-sm" value={vacationStart} onChange={(e) => setVacationStart(e.target.value)} />
              <input type="date" className="w-full p-2 border rounded text-sm" value={vacationEnd} onChange={(e) => setVacationEnd(e.target.value)} />
            </div>
            <button onClick={addVacation} disabled={!vacationStart || !vacationEnd} className="w-full bg-red-50 text-red-600 hover:bg-red-100 p-2 rounded text-sm font-medium">
              <Plus size={16} className="inline mr-1"/> Adicionar Ausência
            </button>
            
            {vacationRanges.length > 0 && (
              <ul className="mt-3 space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                {vacationRanges.map(range => (
                  <li key={range.id} className="flex justify-between items-center text-xs bg-red-50 p-2 rounded border-l-2 border-red-400 mb-1">
                    <span className="pl-1 font-medium text-slate-600">
                      {formatDateBR(new Date(range.start + 'T12:00:00'))} - {formatDateBR(new Date(range.end + 'T12:00:00'))}
                    </span>
                    <button onClick={() => removeVacation(range.id)} title="Remover este período"><Trash2 size={12} className="text-red-400 hover:text-red-600"/></button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Vigência do Plano */}
          <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <h2 className="font-semibold text-lg mb-3 flex items-center gap-2 text-slate-700">
              <span className="w-2 h-8 bg-slate-400 rounded-full"></span>
              Vigência do Plano
            </h2>
            <div className="grid grid-cols-12 gap-2 items-end mb-2">
              <div className="col-span-5">
                <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Início</label>
                <input 
                  type="date" 
                  className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-slate-200 outline-none" 
                  value={planStart} 
                  onChange={handleStartDateChange} 
                />
              </div>

              <div className="col-span-2">
                 <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block text-center">Meses</label>
                 <input 
                  type="number" 
                  min="1"
                  placeholder="#"
                  className="w-full p-2 border border-slate-300 rounded text-sm text-center font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-200 outline-none" 
                  value={planDuration} 
                  onChange={handleDurationChange} 
                />
              </div>

              <div className="col-span-1 flex justify-center pb-3 text-slate-300">
                <ArrowRight size={16} />
              </div>

              <div className="col-span-4">
                <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Fim (Previsto)</label>
                <input 
                  type="date" 
                  className="w-full p-2 border border-slate-300 rounded text-sm bg-slate-50 focus:ring-2 focus:ring-slate-200 outline-none" 
                  value={planEnd} 
                  onChange={(e) => setPlanEnd(e.target.value)} 
                />
              </div>
            </div>

            {planStart && planEnd && (
              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-2">
                <Clock size={12} /> O período ativo está destacado em cinza no calendário.
              </p>
            )}
          </section>

          {/* Cronograma (Tabela) */}
          <section className="bg-white p-4 rounded-xl shadow-lg border border-slate-200 flex flex-col h-[600px]">
            <div className="flex justify-between items-end mb-4 border-b border-slate-100 pb-2">
              <div>
                <h2 className="font-semibold text-lg text-slate-700">Cronograma</h2>
                <p className="text-xs text-slate-400">Planejamento do aluno atual</p>
              </div>
              <div className="flex gap-2">
                 <button 
                  onClick={clearSchedule} 
                  className="flex items-center gap-1 px-3 py-2 text-slate-600 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded transition-colors text-xs font-bold" 
                  title="Limpar apenas datas e plano (Mantém Férias)"
                >
                  <UserPlus size={16} /> Novo Aluno
                </button>
                <button 
                  onClick={copyToClipboard} 
                  className="p-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 shadow-sm transition-colors" 
                  title="Copiar Tabela"
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {processedList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-4">
                  <CalendarIcon size={32} className="mb-2 opacity-50" />
                  <p className="text-sm">Selecione datas no calendário.</p>
                </div>
              ) : (
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="text-slate-500 bg-slate-50 sticky top-0 uppercase font-semibold z-10">
                    <tr>
                      <th className="p-2">Data</th>
                      <th className="p-2 text-center w-8">Tipo</th>
                      <th className="p-2 text-center" title="Distância do encontro anterior">Interv.</th>
                      <th className="p-2 text-center bg-violet-50 text-violet-700" title="Duração total deste bloco de treino">Ciclo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {processedList.map((item, idx) => (
                      <tr key={item.id} className={`group transition-colors ${item.type === 'Troca de Treino' ? 'bg-violet-50' : 'hover:bg-slate-50'}`}>
                        <td className="p-2 font-medium text-slate-700 align-top">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm">{item.dateFormatted}</span>
                            {item.status !== 'Normal' && <span className="text-[10px] text-orange-600 flex items-center gap-1"><AlertCircle size={8} /> Férias</span>}
                          </div>
                        </td>
                        <td className="p-2 text-center align-top">
                          <button 
                            onClick={() => toggleTrainingType(item.rawDate)}
                            title={item.type === 'Troca de Treino' ? "É Troca de Treino" : "É Apenas Feedback"}
                            className={`p-1.5 rounded-full transition-all ${
                              item.type === 'Troca de Treino' 
                                ? 'bg-violet-500 text-white shadow-sm hover:bg-violet-600' 
                                : 'bg-slate-100 text-slate-400 hover:bg-emerald-100 hover:text-emerald-600'
                            }`}
                          >
                            <Dumbbell size={14} />
                          </button>
                        </td>
                         <td className="p-2 text-center align-top">
                           {item.diffWeeks !== '-' && (
                             <span className="text-slate-400">
                               {item.diffWeeks}s
                             </span>
                           )}
                        </td>
                        <td className="p-2 text-center align-top bg-violet-50/50">
                           {item.trainingBlockDuration !== '-' && (
                             <div className="flex flex-col items-center">
                               <span className="font-bold px-2 py-0.5 rounded text-xs bg-violet-200 text-violet-800 border border-violet-300">
                                 {item.trainingBlockDuration} sem
                               </span>
                               <span className="text-[9px] text-violet-400 mt-0.5 flex items-center gap-0.5">
                                 <RefreshCw size={8} /> ciclo
                               </span>
                             </div>
                           )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-sm text-slate-600 bg-slate-50 p-2 rounded">
               <span className="font-semibold">Total do Plano:</span>
               <span className="font-bold text-lg text-emerald-600">
                 {processedList.length > 1 
                   ? processedList.reduce((acc, curr) => typeof curr.diffWeeks === 'number' ? acc + curr.diffWeeks : acc, 0)
                   : 0} semanas
               </span>
            </div>
          </section>
        </div>

        {/* Calendário */}
        <div className="lg:col-span-8 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MONTHS.map((monthName, monthIndex) => (
              <MonthCalendar 
                key={monthName}
                monthIndex={monthIndex}
                year={year}
                selectedDates={selectedDates}
                trainingDates={trainingDates}
                toggleDate={toggleDate}
                isVacation={isVacation}
                planStart={planStart}
                planEnd={planEnd}
              />
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}

function MonthCalendar({ monthIndex, year, selectedDates, trainingDates, toggleDate, isVacation, planStart, planEnd }) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, monthIndex, 1).getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  const holidaysInMonth = days.reduce((acc, day) => {
    const dateObj = new Date(year, monthIndex, day);
    const name = getHolidayName(dateObj);
    if (name) {
      acc.push({ day, name });
    }
    return acc;
  }, []);

  return (
    <div className="select-none flex flex-col h-full border border-slate-100 rounded-lg p-2 hover:border-slate-200 transition-colors">
      <h3 className="text-center font-bold text-slate-700 mb-2 border-b border-slate-100 pb-1">{MONTHS[monthIndex]}</h3>
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className={`text-[10px] font-bold ${i === 0 || i === 6 ? 'text-slate-300' : 'text-slate-500'}`}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-sm flex-1 content-start">
        {blanks.map(b => <div key={`blank-${b}`} />)}
        
        {days.map(day => {
          const dateObj = new Date(year, monthIndex, day);
          const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          
          const isSelected = selectedDates.includes(dateStr);
          const isTraining = trainingDates.includes(dateStr); 
          const isVacationDay = isVacation(dateStr);
          const holidayName = getHolidayName(dateObj);
          const isMonday = dateObj.getDay() === 1;

          // Verifica se está dentro do plano
          const isInPlan = planStart && planEnd && dateStr >= planStart && dateStr <= planEnd;

          let bgClass = "bg-white hover:bg-slate-50";
          let textClass = "text-slate-700";
          let borderClass = "border border-transparent";

          // HIERARQUIA DE CORES
          if (isSelected) {
            textClass = "text-white font-bold";
            if (isTraining) {
                bgClass = "bg-violet-500 hover:bg-violet-600 shadow-sm";
            } else {
                bgClass = "bg-emerald-500 hover:bg-emerald-600 shadow-sm";
            }
            if (isVacationDay) borderClass = "border-2 border-red-300";
          } else if (isVacationDay) {
            bgClass = "bg-red-100 hover:bg-red-200";
            textClass = "text-red-700 font-medium";
          } else if (isMonday) {
             // Segunda-feira normal
             bgClass = isInPlan ? "bg-indigo-100/50 hover:bg-indigo-100" : "bg-indigo-50 hover:bg-indigo-100";
             textClass = "text-indigo-700 font-medium";
          } else if (isInPlan) {
            // Apenas vigência do plano (cinza claro)
            bgClass = "bg-slate-100 hover:bg-slate-200";
          }

          if (holidayName && !isSelected) {
             borderClass = "border border-orange-300";
             textClass = `${textClass} italic`;
          }

          return (
            <div 
              key={day}
              onClick={() => toggleDate(dateStr)}
              title={holidayName ? `Feriado: ${holidayName}` : ''}
              className={`
                aspect-square flex items-center justify-center rounded-md cursor-pointer transition-all duration-200 relative
                ${bgClass} ${textClass} ${borderClass} text-xs
              `}
            >
              {day}
              {holidayName && !isSelected && <span className="absolute top-0 right-0.5 text-[6px] text-orange-400 font-bold">•</span>}
            </div>
          );
        })}
      </div>

      {holidaysInMonth.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-100 text-[9px] text-slate-500">
          {holidaysInMonth.map(h => (
            <div key={h.day} className="flex gap-1 items-center truncate">
               <span className="w-1 h-1 bg-orange-400 rounded-full inline-block flex-shrink-0"></span>
               <span className="font-bold text-slate-600">{h.day}:</span>
               <span className="truncate" title={h.name}>{h.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}