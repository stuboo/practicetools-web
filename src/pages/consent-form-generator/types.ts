export type SelectedProcedureType = {
    [key: string]: { status: ProcedureStatus, id: number };
}

export type ProcedureStatus = 'planned' | 'possible'

export type SourceType = 'IU Health';