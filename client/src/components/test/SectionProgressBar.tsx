import { Check } from "lucide-react";

interface SectionProgressBarProps {
  currentSection: number;
  totalSections: number;
}

export function SectionProgressBar({ currentSection, totalSections }: SectionProgressBarProps) {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between gap-2">
        {Array.from({ length: totalSections }, (_, index) => {
          const sectionNumber = index + 1;
          const isCompleted = index < currentSection;
          const isCurrent = index === currentSection;
          const isPending = index > currentSection;

          return (
            <div key={index} className="flex items-center flex-1">
              {/* Círculo da seção */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                    transition-all duration-300 ease-in-out
                    ${isCompleted ? "bg-green-500 text-white scale-100" : ""}
                    ${isCurrent ? "bg-blue-600 text-white scale-110 ring-4 ring-blue-200" : ""}
                    ${isPending ? "bg-gray-200 text-gray-500 scale-90" : ""}
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{sectionNumber}</span>
                  )}
                </div>
                
                {/* Label da seção */}
                <span
                  className={`
                    mt-2 text-xs font-medium transition-all duration-300
                    ${isCompleted ? "text-green-600" : ""}
                    ${isCurrent ? "text-blue-600 font-bold" : ""}
                    ${isPending ? "text-gray-400" : ""}
                  `}
                >
                  Seção {sectionNumber}
                </span>
              </div>

              {/* Linha conectora (não mostrar após a última seção) */}
              {index < totalSections - 1 && (
                <div
                  className={`
                    h-1 flex-1 mx-1 transition-all duration-500 ease-in-out
                    ${isCompleted ? "bg-green-500" : "bg-gray-200"}
                  `}
                  style={{
                    transform: isCompleted ? "scaleX(1)" : "scaleX(0.8)",
                    transformOrigin: "left",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
