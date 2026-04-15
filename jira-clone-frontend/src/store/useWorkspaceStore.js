import { create } from 'zustand';
import { api } from '../lib/axios';

export const useWorkspaceStore = create((set, get) => ({
  workspaces: [],
  activeWorkspace: null,
  projects: [],
  isLoading: false,

  // Fetch all workspaces the user belongs to
  fetchWorkspaces: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/workspaces');
      const workspaces = res.data.data;
      set({ workspaces, isLoading: false });
      
      // Auto-select the first workspace if none is active
      if (workspaces.length > 0 && !get().activeWorkspace) {
        get().setActiveWorkspace(workspaces[0]);
      }
    } catch (error) {
      console.error('Failed to fetch workspaces', error);
      set({ isLoading: false });
    }
  },

  // Set the active workspace and fetch its projects
  setActiveWorkspace: (workspace) => {
    set({ activeWorkspace: workspace });
    get().fetchProjects(workspace.id);
  },

  // Create a new workspace
  createWorkspace: async (name, description) => {
    try {
      const res = await api.post('/workspaces', { name, description });
      const newWorkspace = res.data.data;
      set((state) => ({
        workspaces: [...state.workspaces, newWorkspace],
      }));
      // Automatically switch to the newly created workspace
      get().setActiveWorkspace(newWorkspace);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  },

  // Fetch projects for the active workspace
  fetchProjects: async (workspaceId) => {
    try {
      const res = await api.get(`/projects/workspace/${workspaceId}`);
      set({ projects: res.data.data });
    } catch (error) {
      console.error('Failed to fetch projects', error);
    }
  },

  // Create a new project inside the active workspace
  createProject: async (name, key, description) => {
    try {
      const workspaceId = get().activeWorkspace?.id;
      if (!workspaceId) return false;
      
      const res = await api.post('/projects', { workspaceId, name, key, description });
      set((state) => ({ projects: [...state.projects, res.data.data] }));
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}));