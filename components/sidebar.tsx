"use client";

import { useState } from "react";
import {
  Eye,
  Gauge,
  Layers,
  Activity,
  Stethoscope,
  Pill,
  Microscope,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface SidebarProps {
  toggles: {
    showVA: boolean;
    showIOP: boolean;
    showCMT: boolean;
    showProcedures: boolean;
    showDiagnosis: boolean;
    showMedication: boolean;
    showLens: boolean;
    showBackgroundRetina: boolean;
    showMaculaFovealReflex: boolean;
    showConjunctiva: boolean;
    showMedia: boolean;
    showAnteriorChamber: boolean;
    showIris: boolean;
    showDisc: boolean;
    showPupil: boolean;
    showVessels: boolean;
    showUndilatedFundus: boolean;
  };
  onToggleChange: (key: string, value: boolean) => void;
}

export function Sidebar({ toggles, onToggleChange }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const mainToggles = [
    { key: "showVA", label: "Show VA", icon: Eye },
    { key: "showIOP", label: "Show IOP", icon: Gauge },
    { key: "showCMT", label: "Show CMT", icon: Layers },
    { key: "showProcedures", label: "Show Procedure", icon: Activity },
    { key: "showDiagnosis", label: "Show Diagnosis", icon: Stethoscope },
    { key: "showMedication", label: "Show Medication", icon: Pill },
  ];

  const observationToggles = [
    { key: "showLens", label: "Lens" },
    { key: "showBackgroundRetina", label: "Background Retina" },
    { key: "showMaculaFovealReflex", label: "Macula Foveal Reflex" },
    { key: "showConjunctiva", label: "Conjunctiva" },
    { key: "showMedia", label: "Media" },
    { key: "showAnteriorChamber", label: "Anterior Chamber" },
    { key: "showIris", label: "Iris" },
    { key: "showDisc", label: "Disc" },
    { key: "showPupil", label: "Pupil" },
    { key: "showVessels", label: "Vessels" },
    { key: "showUndilatedFundus", label: "Undilated Fundus" },
  ];

  const showObservations = observationToggles.some(
    ({ key }) => toggles[key as keyof typeof toggles]
  );

  const handleObservationsToggle = (checked: boolean) => {
    observationToggles.forEach(({ key }) => {
      onToggleChange(key, checked);
    });
  };

  return (
    <div
      className={`fixed bottom-5 right-5 bg-card rounded-lg shadow-lg z-50 border transition-all duration-300 ease-in-out overflow-hidden ${
        isExpanded ? "w-[220px]" : "w-[50px]"
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="py-2.5">
        {mainToggles.map(({ key, label, icon: Icon }) => (
          <div
            key={key}
            className="flex items-center justify-between px-2.5 py-2 hover:bg-muted/50 cursor-pointer"
          >
            <label className="flex items-center gap-2 cursor-pointer text-sm whitespace-nowrap">
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span
                className={`transition-opacity duration-300 ${
                  isExpanded ? "opacity-100" : "opacity-0"
                }`}
              >
                {label}
              </span>
            </label>
            <Switch
              checked={toggles[key as keyof typeof toggles]}
              onCheckedChange={(checked) => onToggleChange(key, checked)}
              className={`transition-opacity duration-300 flex-shrink-0 ${
                isExpanded ? "opacity-100" : "opacity-0"
              }`}
            />
          </div>
        ))}

        <div className="flex items-center justify-between px-2.5 py-2 hover:bg-muted/50 cursor-pointer">
          <label className="flex items-center gap-2 cursor-pointer text-sm whitespace-nowrap">
            <Microscope className="h-4 w-4 flex-shrink-0" />
            <span
              className={`transition-opacity duration-300 ${
                isExpanded ? "opacity-100" : "opacity-0"
              }`}
            >
              Show Observation
            </span>
          </label>
          <Switch
            checked={showObservations}
            onCheckedChange={handleObservationsToggle}
            className={`transition-opacity duration-300 flex-shrink-0 ${
              isExpanded ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>

        {isExpanded && (
          <div className="pl-6 space-y-0">
            {observationToggles.map(({ key, label }) => (
              <div
                key={key}
                className="flex items-center justify-between px-2.5 py-1.5 hover:bg-muted/50 cursor-pointer"
              >
                <label className="cursor-pointer text-xs whitespace-nowrap">
                  {label}
                </label>
                <Switch
                  checked={toggles[key as keyof typeof toggles]}
                  onCheckedChange={(checked) => onToggleChange(key, checked)}
                  className="scale-75 flex-shrink-0"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
