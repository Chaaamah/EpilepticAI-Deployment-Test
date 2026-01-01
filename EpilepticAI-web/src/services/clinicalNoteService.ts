import api from '@/lib/api';
import {
  ClinicalNote,
  ClinicalNoteCreateRequest,
  ClinicalNoteUpdateRequest,
} from '@/types/api';

export const clinicalNoteService = {
  // Get clinical notes for a patient
  getPatientNotes: async (patientId: number): Promise<ClinicalNote[]> => {
    const response = await api.get(`/clinical-notes/patient/${patientId}`);
    return response.data;
  },

  // Get specific note
  getNoteById: async (id: number): Promise<ClinicalNote> => {
    const response = await api.get(`/clinical-notes/${id}`);
    return response.data;
  },

  // Create clinical note
  createNote: async (data: ClinicalNoteCreateRequest): Promise<ClinicalNote> => {
    const response = await api.post('/clinical-notes', data);
    return response.data;
  },

  // Update clinical note
  updateNote: async (id: number, data: ClinicalNoteUpdateRequest): Promise<ClinicalNote> => {
    const response = await api.put(`/clinical-notes/${id}`, data);
    return response.data;
  },

  // Delete clinical note
  deleteNote: async (id: number): Promise<void> => {
    await api.delete(`/clinical-notes/${id}`);
  },
};
