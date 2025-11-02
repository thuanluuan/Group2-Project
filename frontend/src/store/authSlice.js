import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../lib/api';

// Helpers to persist auth
function saveAuth({ token, user }) {
  try {
    if (token) localStorage.setItem('auth_token', token);
    if (user) localStorage.setItem('auth_user', JSON.stringify(user));
  } catch {}
}

function clearAuth() {
  try {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  } catch {}
}

export const loginThunk = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const token = res?.data?.accessToken || res?.data?.token;
      const user = res?.data?.user;
      if (!token || !user) throw new Error('Invalid login response');
      saveAuth({ token, user });
      return { token, user };
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      return rejectWithValue({ status, data, message: data?.message || err?.message || 'Login failed' });
    }
  }
);

export const fetchMeThunk = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/auth/me');
      const user = res?.data;
      if (!user?._id) throw new Error('Invalid profile response');
      // keep token from storage
      const token = localStorage.getItem('auth_token');
      if (token) saveAuth({ token, user });
      return { user };
    } catch (err) {
      return rejectWithValue({ message: err?.response?.data?.message || 'Failed to load profile' });
    }
  }
);

const initialState = {
  user: null,
  token: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    hydrateFromStorage(state) {
      try {
        const token = localStorage.getItem('auth_token');
        const userStr = localStorage.getItem('auth_user');
        const user = userStr ? JSON.parse(userStr) : null;
        state.token = token || null;
        state.user = user || null;
        state.error = null;
      } catch {}
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.status = 'idle';
      state.error = null;
      clearAuth();
    },
    setAuth(state, action) {
      const { token, user } = action.payload || {};
      state.token = token || null;
      state.user = user || null;
      saveAuth({ token, user });
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Login failed' };
      })
      .addCase(fetchMeThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchMeThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
      })
      .addCase(fetchMeThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to load profile' };
      });
  }
});

export const { hydrateFromStorage, logout, setAuth } = authSlice.actions;

// Selectors
export const selectAuth = (state) => state.auth;
export const selectIsAuthenticated = (state) => !!state.auth.token;
export const selectUser = (state) => state.auth.user;
export const selectIsAdmin = (state) => state.auth.user?.role === 'admin';

export default authSlice.reducer;
