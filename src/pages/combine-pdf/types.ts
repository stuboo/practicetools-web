export type PDF = {
    title: string,
    filename: string,
    language: string,
    category: string[],
    description: string,
    author: string,
    thumbnail: string,
    updated: string,
    source: string,
    selected?: boolean
};

export interface CombinePDFState {
    pdfs: PDF[];
    selectedPdfs: PDF[];
    languages: string[];
    filter: string;
    searchterm: string;
    error: string | null;
    status: "idle" | "loading" | "failed" | "succeeded";
    combinePDFStatus: "idle" | "loading" | "failed" | "succeeded";
    combinedPDF: Uint8Array | null;
}