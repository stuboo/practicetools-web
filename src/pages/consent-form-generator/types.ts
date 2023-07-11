export type SelectedProcedureType = {
    [key: string]: ProcedureStatus;
}

export type ProcedureStatus = 'planned' | 'possible'

export type SourceType = 'oauthc' | 'uch' | 'iu health'