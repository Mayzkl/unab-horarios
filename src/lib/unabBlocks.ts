import { BlockIndex } from "@/types/schedule";

export const DAYS = ["LU", "MA", "MI", "JU", "VI", "SA"] as const;

export const BLOCKS: { index: BlockIndex; start: string; end: string }[] = [
    { index: 1, start: "08:30", end: "10:10" },
    { index: 2, start: "10:20", end: "12:00" },
    { index: 3, start: "12:10", end: "13:50" },
    { index: 4, start: "14:00", end: "15:40" },
    { index: 5, start: "15:50", end: "17:30" },
    { index: 6, start: "17:40", end: "19:20" },
    { index: 7, start: "19:30", end: "21:10" },
    ];
