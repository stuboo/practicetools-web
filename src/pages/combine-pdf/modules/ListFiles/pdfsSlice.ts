import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import mergePDF from "../../../../libs/pdf-libs";
import books from '../../../../libs/books.json';
import { PDF } from "../../types";

interface PDFState {
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

const initialState: PDFState = {
  pdfs: [],
  selectedPdfs: [],
  languages: [],
  filter: "English",
  searchterm: "",
  status: "idle",
  error: null,
  combinePDFStatus: "idle",
  combinedPDF: null,
};

export const fetchPDFs = createAsyncThunk("pdfs/fetchPDFs", async () => {
  // const response = await client.get("stuboo/tools/main/urogyn_pdfs.json");

  // return response.data as PDF[];
  const pdfs = books;
  return pdfs as PDF[];
});

export const combinePDFs = createAsyncThunk(
  "pdfs/combinePDFs",
  async (toBeCombinedPDFs: PDF[]) => {
    const pdfBytes = await mergePDF(toBeCombinedPDFs);
    return pdfBytes;
  }
);

export const pdfsSlice = createSlice({
  name: "pdfs",
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    selectPDF: (state, { payload: selectedPDF }: PayloadAction<PDF>) => {
      state.selectedPdfs.push(selectedPDF);
      state.pdfs.map((pdf) => {
        if (pdf.filename === selectedPDF.filename) {
          const newPDF = pdf;
          newPDF.selected = true;
          return newPDF;
        }
        return pdf;
      });
    },

    unSelectPDF: (state, { payload: unSelectedPDF }: PayloadAction<PDF>) => {
      state.selectedPdfs = state.selectedPdfs.filter(
        (pdf) => pdf.filename !== unSelectedPDF.filename
      );
      state.pdfs.map((pdf) => {
        if (pdf.filename === unSelectedPDF.filename) {
          const newPDF = pdf;
          newPDF.selected = false;
          return newPDF;
        }
        return pdf;
      });
    },

    clearSelection: (state) => {
      state.selectedPdfs = [];

      state.pdfs.map((pdf) => {
        if (pdf.selected) {
          const newPDF = pdf;
          newPDF.selected = false;
          return newPDF;
        }
        return pdf;
      });
    },

    reorderSelection: (state, { payload }: PayloadAction<{ sourcePDF: PDF, targetPDF: PDF }>) => {
      const { sourcePDF, targetPDF } = payload

      // Find indexes
      const targetIndex = state.selectedPdfs.findIndex(_pdf => _pdf.filename == targetPDF.filename);
      const sourceIndex = state.selectedPdfs.findIndex(_pdf => _pdf.filename == sourcePDF.filename);

      const _selectedPdfs = state.selectedPdfs;
      _selectedPdfs.splice(sourceIndex, 1);
      _selectedPdfs.splice(targetIndex, 0, sourcePDF);

      state.selectedPdfs = _selectedPdfs;
    },

    extractLanguages: (state) => {
      const languages: string[] = [];

      state.pdfs.forEach((pdf) => {
        if (!languages.includes(pdf.language)) languages.push(pdf.language);
      });

      state.languages = languages;
    },

    setFilter: (state, { payload }: PayloadAction<string>) => {
      state.filter = payload;
    },

    setSearchTerm: (state, { payload }: PayloadAction<string>) => {
      state.searchterm = payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPDFs.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchPDFs.rejected, (state) => {
        state.status = "failed";
        state.error = "An error occured!";
      })
      .addCase(fetchPDFs.fulfilled, (state, { payload }) => {
        state.status = "succeeded";
        state.pdfs = payload;

        const languages: string[] = [];

        payload.forEach((pdf) => {
          if (!languages.includes(pdf.language)) languages.push(pdf.language);
        });

        state.languages = languages;
      })
      .addCase(combinePDFs.pending, (state) => {
        state.combinePDFStatus = "loading";
      })
      .addCase(combinePDFs.rejected, (state) => {
        state.combinePDFStatus = "failed";
      })
      .addCase(combinePDFs.fulfilled, (state) => {
        state.combinePDFStatus = "succeeded";
      });
  },
});

export const { selectPDF, unSelectPDF, extractLanguages, setFilter, setSearchTerm, clearSelection, reorderSelection } = pdfsSlice.actions;

export default pdfsSlice.reducer;
