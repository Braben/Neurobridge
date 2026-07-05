import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { childrenApi, Child, ChildDetail, CreateChildData, UpdateChildData } from "../../services/children";

interface ChildState {
  children: Child[];
  currentChild: ChildDetail | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ChildState = {
  children: [],
  currentChild: null,
  isLoading: false,
  error: null,
};

export const fetchChildren = createAsyncThunk("child/fetchChildren", async () => {
  const data = await childrenApi.list();
  return data.children;
});

export const fetchChild = createAsyncThunk("child/fetchChild", async (id: string) => {
  const data = await childrenApi.get(id);
  return data.child;
});

export const createChild = createAsyncThunk("child/createChild", async (childData: CreateChildData) => {
  const data = await childrenApi.create(childData);
  return data.child;
});

export const updateChild = createAsyncThunk(
  "child/updateChild",
  async ({ id, data }: { id: string; data: UpdateChildData }) => {
    const result = await childrenApi.update(id, data);
    return result.child;
  },
);

export const deleteChild = createAsyncThunk("child/deleteChild", async (id: string) => {
  await childrenApi.delete(id);
  return id;
});

const childSlice = createSlice({
  name: "child",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentChild: (state) => {
      state.currentChild = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChildren.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchChildren.fulfilled, (state, action) => {
        state.isLoading = false;
        state.children = action.payload;
      })
      .addCase(fetchChildren.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch children";
      })

      .addCase(fetchChild.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchChild.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentChild = action.payload;
      })
      .addCase(fetchChild.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch child";
      })

      .addCase(createChild.fulfilled, (state, action) => {
        state.children.unshift(action.payload);
      })

      .addCase(updateChild.fulfilled, (state, action) => {
        const idx = state.children.findIndex((c) => c.id === action.payload.id);
        if (idx !== -1) state.children[idx] = action.payload;
        if (state.currentChild?.id === action.payload.id) {
          state.currentChild = { ...state.currentChild, ...action.payload };
        }
      })

      .addCase(deleteChild.fulfilled, (state, action) => {
        state.children = state.children.filter((c) => c.id !== action.payload);
        if (state.currentChild?.id === action.payload) {
          state.currentChild = null;
        }
      });
  },
});

export const { clearError, clearCurrentChild } = childSlice.actions;
export default childSlice.reducer;
