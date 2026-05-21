'use client';

import { useState, useEffect } from 'react';

interface Props {
  targetDate: string;
  titulo: string;
  mostrarDias: string;
  mostrarHoras: string;
  mostrarMinutos: string;
  mostrarSegundos: string;
  labelDias: string;
  labelHoras: string;
  labelMinutos: string;
  labelSegundos: string;
  color: string;
  colorLabel: string;
  bgColor: string;
  paddingV: number;
  fontSize: number;
  tituloFontSize: number;
  tituloColor: string;
  fontFamily: string;
  alineacion: string;
}

interface TimeLeft { dias: number; horas: number; minutos: number; segundos: number; }

function calcTimeLeft(targetDate: string): TimeLeft {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return { dias: 0, horas: 0, minutos: 0, segundos: 0 };
  const s = Math.floor(diff / 1000);
  return {
    dias: Math.floor(s / 86400),
    horas: Math.floor((s % 86400) / 3600),
    minutos: Math.floor((s % 3600) / 60),
    segundos: s % 60,
  };
}

export default function CountdownDisplay(props: Props) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    if (!props.targetDate) return;
    setTimeLeft(calcTimeLeft(props.targetDate));
    const id = setInterval(() => setTimeLeft(calcTimeLeft(props.targetDate)), 1000);
    return () => clearInterval(id);
  }, [props.targetDate]);

  const pad = (n: number) => String(n).padStart(2, '0');
  const ff = props.fontFamily || undefined;
  const align = props.alineacion as React.CSSProperties['textAlign'];
  const justifyMap: Record<string, React.CSSProperties['justifyContent']> = {
    left: 'flex-start', center: 'center', right: 'flex-end',
  };

  const units = [
    { show: props.mostrarDias    === 'si', value: timeLeft?.dias    ?? 0, label: props.labelDias },
    { show: props.mostrarHoras   === 'si', value: timeLeft?.horas   ?? 0, label: props.labelHoras },
    { show: props.mostrarMinutos === 'si', value: timeLeft?.minutos ?? 0, label: props.labelMinutos },
    { show: props.mostrarSegundos === 'si', value: timeLeft?.segundos ?? 0, label: props.labelSegundos },
  ].filter(u => u.show);

  return (
    <div style={{ background: props.bgColor, padding: `${props.paddingV}px 2rem`, textAlign: align, fontFamily: ff }}>
      {props.titulo && (
        <p style={{ fontSize: props.tituloFontSize, fontWeight: 700, color: props.tituloColor, margin: '0 0 1rem', fontFamily: ff }}>
          {props.titulo}
        </p>
      )}
      {!timeLeft ? (
        <span style={{ color: props.colorLabel, opacity: 0.4, fontSize: 13 }}>Cargando...</span>
      ) : (
        <div style={{ display: 'inline-flex', gap: '1.5rem', alignItems: 'flex-end', justifyContent: justifyMap[props.alineacion] ?? 'center', flexWrap: 'wrap' }}>
          {units.map(({ value, label }, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 56 }}>
              <span style={{ fontSize: props.fontSize, fontWeight: 700, color: props.color, lineHeight: 1, fontFamily: ff }}>
                {pad(value)}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: props.colorLabel, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: ff }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
