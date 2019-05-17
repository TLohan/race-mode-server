import { Question } from "./question";

export class Board {
    id: number;
    numRows: number;
    numCols: number;
    questions: Question[] = [];
    boardMap: number[][] = [];
}