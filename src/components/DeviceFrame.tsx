import React from "react";
import { Smartphone, Monitor } from "lucide-react";

interface DeviceFrameProps {
  device: "desktop" | "mobile";
  onChangeDevice: (dev: "desktop" | "mobile") => void;
  children: React.ReactNode;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({
  device,
  onChangeDevice,
  children,
}) => {
  return (
    <div className="flex flex-col h-full space-y-2">
      {/* Device View Bar */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] theme-text-muted font-medium flex items-center gap-1">
          <span>Feed Simulator:</span>
        </span>

        <div className="flex items-center bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg p-0.5 text-[11px] font-medium">
          <button
            type="button"
            onClick={() => onChangeDevice("desktop")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              device === "desktop"
                ? "bg-white dark:bg-neutral-800 theme-text-main shadow-xs font-semibold"
                : "theme-text-muted hover:opacity-80"
            }`}
            title="Desktop Feed View"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeDevice("mobile")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              device === "mobile"
                ? "bg-white dark:bg-neutral-800 theme-text-main shadow-xs font-semibold"
                : "theme-text-muted hover:opacity-80"
            }`}
            title="Mobile Smartphone Screen View"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 flex justify-center items-start w-full overflow-hidden">
        {device === "mobile" ? (
          <div className="w-full max-w-[335px] sm:max-w-[390px] mx-auto rounded-2xl sm:rounded-[36px] p-1.5 sm:p-2.5 bg-slate-900 dark:bg-black border-[3px] sm:border-[5px] border-slate-700 dark:border-neutral-800 shadow-xl transition-all">
            {/* Phone Screen Bezel & Dynamic Island / Status Bar */}
            <div className="pt-1 pb-1.5 px-2.5 sm:px-4 flex items-center justify-between text-[10px] text-white font-mono select-none">
              <span>9:41</span>
              <div className="w-12 sm:w-16 h-3 sm:h-4 bg-slate-800 dark:bg-neutral-900 rounded-full" />
              <div className="flex items-center gap-1 text-[9px] sm:text-[10px]">
                <span>5G</span>
                <span>100%</span>
              </div>
            </div>

            {/* Inner Content */}
            <div className="overflow-hidden rounded-xl sm:rounded-[26px]">
              {children}
            </div>

            {/* Home indicator bar */}
            <div className="py-1.5 sm:py-2 flex justify-center">
              <div className="w-20 sm:w-28 h-1 bg-white/30 rounded-full" />
            </div>
          </div>
        ) : (
          <div className="w-full h-full">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};
