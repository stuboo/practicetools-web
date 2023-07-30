export type SelectedProcedureType = {
    [key: string]: { status: ProcedureStatus, id: number };
}

export type ProcedureStatus = 'planned' | 'possible'

export type SourceType = 'IU Health';

// export interface CreateProcedureAlias {
//     id: number
//     alias: string
//     abbreviation: string
//     description: string
//     glossary_definition: string
// }