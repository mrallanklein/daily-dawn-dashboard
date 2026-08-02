import type { CSSProperties } from "react";

/** Icônes Notion colorées fournies par Allan — utilisées partout dans l'app. */
export type NotionIconProps = {
  className?: string;
  size?: number;
  /** Ignoré (les icônes sont pleines), accepté pour rester compatible avec Lucide. */
  strokeWidth?: number;
  style?: CSSProperties | undefined;
};

function make(path: string, fill: string, title: string) {
  return function NotionIcon({ className, size, style }: NotionIconProps) {
    return (
      <svg
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={title}
        className={className}
        width={size}
        height={size}
        style={style}
      >
        <path fill={fill} d={path} />
      </svg>
    );
  };
}

export const ProjectsIcon = make(
  "m8,28h48v18c0,4.94-3.06,8-8,8H16c-4.94,0-8-3.06-8-8v-3h13.17l-5.17,5.17,2.83,2.83,10-10-10-10-2.83,2.83,5.17,5.17h-13.17v-11Zm27.24-12c-3.03,0-5.1-.85-7.24-3-2.15-2.15-4.21-3-7.24-3h-12.76v14h48v-8h-20.76Z",
  "#D9730D",
  "Projets",
);

export const TasksIcon = make(
  "m32,8c-13.25,0-24,10.75-24,24s10.75,24,24,24,24-10.75,24-24-10.75-24-24-24Zm-3,36.24l-11-11,4.24-4.24,6.76,6.76,13.76-13.76,4.24,4.24-18,18Z",
  "#448361",
  "Tâches",
);

export const CalendarIcon = make(
  "m48,12v-6h-6v6h-20v-6h-6v6h-8v40h48V12h-8Zm2,28h-14v-12h14v12Z",
  "#337EA9",
  "Calendrier",
);

export const MailIcon = make(
  "m32,42.47l24-12v25.53H8v-25.53l24,12Zm0-36.47l-24,12v8l10,5v-11h28v11l10-5v-8l-24-12Z",
  "#D44C47",
  "Boîte mail",
);

export const ContactIcon = make(
  "m12,20c0-4.94,3.06-8,8-8s8,3.06,8,8-3.06,8-8,8-8-3.06-8-8Zm32,8c4.94,0,8-3.06,8-8s-3.06-8-8-8-8,3.06-8,8,3.06,8,8,8Zm-24,4c-9.87,0-16,6.13-16,16h32c0-9.87-6.13-16-16-16Zm24,0c-3.43,0-6.4.76-8.82,2.14,3.08,3.44,4.82,8.17,4.82,13.86h20c0-9.87-6.13-16-16-16Z",
  "#9065B0",
  "Contacts",
);

export const BudgetIcon = make(
  "m6,14v36h52V14H6Zm46,22c-4.94,0-8,3.06-8,8h-24c0-4.94-3.06-8-8-8v-8c4.94,0,8-3.06,8-8h24c0,4.94,3.06,8,8,8v8Zm-13-4c0,4.94-2.68,8-7,8s-7-3.06-7-8,2.68-8,7-8,7,3.06,7,8Z",
  "#CB912F",
  "Budget",
);
