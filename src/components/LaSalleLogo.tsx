import React from 'react';

interface LaSalleLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  onClick?: () => void;
}

export const LaSalleLogo: React.FC<LaSalleLogoProps> = ({ 
  className = '', 
  size = 48,
  showText = true,
  onClick
}) => {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-3 ${onClick ? 'cursor-pointer select-none' : ''} ${className}`}
    >
      {/* Official Colegio La Salle de Tuxtla Circular Shield Logo Image */}
      <div className="relative shrink-0">
        <img 
          src="/LOGO.png" 
          alt="Colegio La Salle Tuxtla" 
          style={{ width: size, height: size }}
          className="relative rounded-full shadow-lg object-contain bg-white p-0.5 border-2 border-amber-400/90 hover:scale-105 transition-transform duration-200"
        />
      </div>

      {/* College Name Typography */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className="text-base font-black tracking-tight text-white lasalle-title-text flex items-center gap-1.5">
            <span>COLEGIO LA SALLE</span>
            <span className="text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-[#C8102E] border border-red-400/40 shadow-sm uppercase tracking-wider">
              DE TUXTLA
            </span>
          </span>
          <span className="text-[11px] font-extrabold text-amber-400 tracking-widest uppercase flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Olimpiadas Escolares
          </span>
        </div>
      )}
    </div>
  );
};
