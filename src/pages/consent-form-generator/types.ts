export type SelectedProcedureType = {
    [key: string]: ProcedureStatus;
}

export type ProcedureStatus = 'planned' | 'possible'