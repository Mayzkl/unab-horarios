export type Day = "LU" | "MA" | "MI" | "JU" | "VI" | "SA";
export type BlockIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type Meeting = {
    day: Day;
    blocks: BlockIndex[];
    };

export type Course = {
    id: string;
    code: string;
    name: string;
    semester: string;
    linkedNrcs?: string[];
    };

export type Section = {
    id: string;
    nrc: string;
    courseId: string;
    sectionLabel: string;
    activityType: string; // Agregar la propiedad activityType
    professor?: string;
    modality: string;
    vacancies: number;
    meetings: { day: string; blocks: number[] }[];
    scheduleRaw?: string;
    linkedNrcRaw?: string; // Si es necesario
    linkedSections?: Section[]; // Relación entre secciones (TAL con TEO)
    semester: string;
};

