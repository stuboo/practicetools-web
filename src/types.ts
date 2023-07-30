export interface CreateProcedureAliasType {
    alias: string
    abbreviation?: string
    simple_description?: string
    glossary_definition?: string
    alternatives?: Alternative[]
    risks?: Risk[]
}

export interface ProcedureAlias extends CreateProcedureAliasType {
    id: number
}



export interface Alternative {
    id: number
    alternative: string
    notes?: string
}

export interface Risk {
    id: number
    risk: string
    notes?: string
}
