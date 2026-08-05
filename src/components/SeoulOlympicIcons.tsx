import React from 'react';
import type { OlympicEventId } from '../types/olympics';

interface SeoulOlympicIconProps {
  eventId: OlympicEventId | string;
  className?: string;
  size?: number;
}

/**
 * High-precision SVG pictograms inspired by the classic Seoul 1988 Summer Olympic Games
 * Athletics pictograms:
 * - Velocidad: 100m Sprint Runner in full stride
 * - Vallas: Hurdle Runner jumping obstacle
 * - Relevos: 4x100 Relay runners passing baton
 * - Bala: Shot Put athlete in throwing posture
 */
export const SeoulOlympicIcon: React.FC<SeoulOlympicIconProps> = ({ 
  eventId, 
  className = "w-5 h-5",
  size
}) => {
  const style = size ? { width: size, height: size } : undefined;

  switch (eventId) {
    case 'velocidad':
      return (
        <svg 
          viewBox="0 0 64 64" 
          fill="currentColor" 
          className={className} 
          style={style} 
          aria-label="Icono Olimpiadas Seúl 1988 - Carrera de Velocidad"
        >
          {/* Head */}
          <circle cx="44" cy="14" r="5" />
          {/* Torso in forward dash angle */}
          <path d="M 38,20 L 26,30 L 16,34 L 18,37 L 28,33 L 34,42 L 20,54 L 24,56 L 38,42 L 44,30 Z" />
          {/* Trailing Back Leg */}
          <path d="M 26,30 L 14,24 L 10,27 L 12,30 L 22,34 Z" />
          {/* Forward Front Leg */}
          <path d="M 38,20 L 48,22 L 54,16 L 51,13 L 46,18 L 38,18 Z" />
          {/* Track line accents */}
          <line x1="8" y1="58" x2="56" y2="58" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
        </svg>
      );

    case 'vallas':
      return (
        <svg 
          viewBox="0 0 64 64" 
          fill="currentColor" 
          className={className} 
          style={style} 
          aria-label="Icono Olimpiadas Seúl 1988 - Salto de Vallas"
        >
          {/* Head */}
          <circle cx="38" cy="12" r="5" />
          {/* Torso & Extended Legs leaping over hurdle */}
          <path d="M 33,18 L 24,28 L 12,30 L 13,34 L 27,31 L 34,22 Z" />
          {/* Front Leg over hurdle */}
          <path d="M 34,22 L 48,20 L 58,26 L 56,30 L 46,24 L 33,26 Z" />
          {/* Arms for balance */}
          <path d="M 33,18 L 44,14 L 50,18 L 47,21 L 42,18 Z" />
          <path d="M 33,18 L 22,14 L 16,18 L 18,21 L 24,18 Z" />
          {/* Hurdle Obstacle (Seoul style geometric hurdle) */}
          <path d="M 34,40 L 34,56 M 34,40 L 44,40 M 44,40 L 44,56" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <line x1="30" y1="44" x2="48" y2="44" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <line x1="8" y1="58" x2="56" y2="58" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
        </svg>
      );

    case 'relevos':
      return (
        <svg 
          viewBox="0 0 64 64" 
          fill="currentColor" 
          className={className} 
          style={style} 
          aria-label="Icono Olimpiadas Seúl 1988 - Carrera de Relevos"
        >
          {/* Runner 1 (Passer) Head & Body */}
          <circle cx="20" cy="16" r="4" />
          <path d="M 18,22 L 12,30 L 6,34 L 8,37 L 14,33 L 18,44 L 12,54 L 15,56 L 22,44 L 24,30 Z" />
          {/* Runner 1 Arm holding Baton forward */}
          <path d="M 18,22 L 28,24 L 32,24 L 32,21 L 28,21 Z" />
          {/* Olympic Baton */}
          <rect x="30" y="16" width="10" height="3" rx="1.5" transform="rotate(-20 35 17.5)" fill="currentColor" />

          {/* Runner 2 (Receiver) Head & Body */}
          <circle cx="48" cy="14" r="4" />
          <path d="M 44,20 L 36,28 L 32,26 L 30,29 L 36,32 L 42,42 L 36,54 L 39,56 L 46,42 L 50,28 Z" />
          {/* Runner 2 Arm extended backward to grab baton */}
          <path d="M 44,20 L 36,20 L 34,23 L 38,23 Z" />

          {/* Ground track */}
          <line x1="4" y1="58" x2="60" y2="58" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
        </svg>
      );

    case 'bala':
      return (
        <svg 
          viewBox="0 0 64 64" 
          fill="currentColor" 
          className={className} 
          style={style} 
          aria-label="Icono Olimpiadas Seúl 1988 - Lanzamiento de Bala"
        >
          {/* Head */}
          <circle cx="22" cy="18" r="5" />
          {/* Shot Put Ball on neck/shoulder */}
          <circle cx="30" cy="16" r="4.5" className="fill-amber-400 stroke-amber-500" strokeWidth="1" />
          {/* Powerful Torso twisted back */}
          <path d="M 22,24 L 16,34 L 10,48 L 14,50 L 20,38 L 26,46 L 24,56 L 28,56 L 32,44 L 30,32 Z" />
          {/* Back arm for balance */}
          <path d="M 22,24 L 10,22 L 6,26 L 8,29 L 12,26 Z" />
          {/* Front pushing arm */}
          <path d="M 22,24 L 32,20 L 34,24 L 26,27 Z" />
          {/* Throwing Arc Trajectory Line */}
          <path d="M 34,16 Q 46,6 58,18" stroke="currentColor" strokeWidth="2.5" strokeDasharray="3 3" fill="none" opacity="0.75" />
          {/* Flying Shot Ball in air */}
          <circle cx="56" cy="18" r="3.5" />
          {/* Circle ring stopboard */}
          <path d="M 8,56 A 24 8 0 0 0 54,56" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.5" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} style={style}>
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
};
