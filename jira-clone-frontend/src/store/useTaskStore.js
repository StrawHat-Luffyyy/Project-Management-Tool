import { create } from "zustand";
import { api } from "../lib/axios";

export const useTaskStore = create((set) => ({
  tasks: [],
  isLoading: false,

  
  fetchTasks: async (projectId) => {
    set({ isLoading: true });
    try {
      const res = await api.get(`/tasks?projectId=${projectId}`);
      set({ tasks: res.data.data, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch tasks", error);
      set({ isLoading: false });
    }
  },
  createTask: async (taskData) => {
    try {
      const res = await api.post("/tasks", taskData);
      set((state) => ({ tasks: [...state.tasks, res.data.data] }));
      return true;
    } catch (error) {
      console.error("Failed to create task", error);
      return false;
    }
  },
  reorderTask: async (
    taskId,
    newStatus,
    prevTaskId,
    nextTaskId,
    originalTasks,
  ) => {
    try {
      await api.patch(`/tasks/${taskId}/reorder`, {
        status: newStatus,
        prevTaskId: prevTaskId || null,
        nextTaskId: nextTaskId || null,
      });
    } catch (error) {
      console.error("Failed to reorder task", error);
      set({ tasks: originalTasks });
    }
  },
  setLocalTasks: (newTasks) => set({ tasks: newTasks }),
}));
