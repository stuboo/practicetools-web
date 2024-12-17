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
    selected?: boolean,
    short_url: string,
    short_url_qr: string,
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