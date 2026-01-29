import { create } from 'zustand';
import * as jobsApi from '../api/jobs';
import * as checklistRepo from '../db/repositories/checklist';
import * as syncQueue from '../db/repositories/syncQueue';
import { useJobsStore } from './jobsStore';
import type {
  ChecklistTemplate,
  ChecklistResponse,
  FieldType,
  FormState,
  ValidationResult,
} from '../types';
import { validateField, validateForm } from '../utils/validation';

interface ChecklistState {
  template: ChecklistTemplate | null;
  responses: Record<string, unknown>;
  formState: FormState;
  isDirty: boolean;
  isSubmitting: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions
  initializeChecklist: (
    template: ChecklistTemplate,
    existingResponses: ChecklistResponse[]
  ) => void;
  updateField: (fieldId: string, value: unknown) => void;
  saveDraft: (jobId: string) => Promise<void>;
  submitChecklist: (jobId: string, version: number) => Promise<void>;
  validateChecklist: () => ValidationResult;
  clearChecklist: () => void;
  clearError: () => void;
}

export const useChecklistStore = create<ChecklistState>((set, get) => ({
  template: null,
  responses: {},
  formState: {},
  isDirty: false,
  isSubmitting: false,
  isSaving: false,
  error: null,

  initializeChecklist: (
    template: ChecklistTemplate,
    existingResponses: ChecklistResponse[]
  ) => {
    const responses: Record<string, unknown> = {};
    const formState: FormState = {};

    // Initialize with existing responses or defaults
    for (const field of template.fields) {
      const existing = existingResponses.find((r) => r.fieldId === field.id);

      if (existing) {
        responses[field.id] = existing.value;
      } else if (field.defaultValue !== undefined) {
        responses[field.id] = field.defaultValue;
      } else {
        responses[field.id] = getDefaultValue(field.type);
      }

      formState[field.id] = {
        value: responses[field.id],
        error: null,
        touched: false,
        isDirty: false,
      };
    }

    set({
      template,
      responses,
      formState,
      isDirty: false,
      error: null,
    });
  },

  updateField: (fieldId: string, value: unknown) => {
    const { template, formState, responses } = get();

    if (!template) return;

    const field = template.fields.find((f) => f.id === fieldId);
    if (!field) return;

    // Validate the field
    const error = validateField(field, value);

    set({
      responses: { ...responses, [fieldId]: value },
      formState: {
        ...formState,
        [fieldId]: {
          value,
          error,
          touched: true,
          isDirty: true,
        },
      },
      isDirty: true,
    });
  },

  saveDraft: async (jobId: string) => {
    const { template, responses, isDirty } = get();

    if (!template || !isDirty) return;

    set({ isSaving: true, error: null });

    try {
      // Save locally first
      const responsesToSave = template.fields.map((field) => ({
        fieldId: field.id,
        fieldType: field.type,
        value: responses[field.id],
        isDraft: true,
      }));

      checklistRepo.saveResponses(jobId, responsesToSave, false);

      // Try to sync with server
      try {
        await jobsApi.saveChecklistResponses(
          jobId,
          responsesToSave.map((r) => ({
            fieldId: r.fieldId,
            value: r.value,
            isDraft: true,
          }))
        );

        checklistRepo.markResponsesSynced(jobId);
      } catch {
        // Queue for sync
        syncQueue.addToQueue(
          'checklist_response',
          jobId,
          'update',
          { responses: responsesToSave },
          undefined,
          5 // Higher priority for drafts
        );
      }

      set({ isSaving: false, isDirty: false });
    } catch  {
      set({
        isSaving: false,
        error: 'Failed to save draft',
      });
    }
  },

  submitChecklist: async (jobId: string, version: number) => {

    const { template, responses } = get();

    if (!template) {
      set({ error: 'No checklist template' });
      return;
    }

    // Validate all fields
    const validation = get().validateChecklist();
   console.log(validation,"VVVV")
    if (!validation.isValid) {
      // Update form state with errors
      const { formState } = get();
      const updatedFormState = { ...formState };

      for (const [fieldId, error] of Object.entries(validation.errors)) {
        if (updatedFormState[fieldId]) {
          updatedFormState[fieldId] = {
            ...updatedFormState[fieldId],
            error,
            touched: true,
          };
        }
      }

      set({ formState: updatedFormState, error: 'Please fix validation errors' });
      return;
    }

    set({ isSubmitting: true, error: null });

    try {
      const responsesToSubmit = template.fields.map((field) => ({
        fieldId: field.id,
        value: responses[field.id],
        isDraft: false,
      }));

      await jobsApi.completeJob(jobId, responsesToSubmit, version);

      // Update local storage
      const responsesForLocal = template.fields.map((field) => ({
        fieldId: field.id,
        fieldType: field.type,
        value: responses[field.id],
        isDraft: false,
      }));

      checklistRepo.saveResponses(jobId, responsesForLocal, true);
  console.log(responsesForLocal,"SDF")
      set({ isSubmitting: false, isDirty: false });

      // Refresh jobs list to reflect completed status
      useJobsStore.getState().fetchJobs();
    } catch  {

      // Save locally and queue for sync
      const responsesForLocal = template.fields.map((field) => ({
        fieldId: field.id,
        fieldType: field.type,
        value: responses[field.id],
        isDraft: false,
      }));

      checklistRepo.saveResponses(jobId, responsesForLocal, false);
      console.log('res',responsesForLocal)
      syncQueue.addToQueue(
        'checklist_response',
        jobId,
        'update',
        {
          responses: responsesForLocal.map((r) => ({
            fieldId: r.fieldId,
            value: r.value,
            isDraft: false,
          })),
          completeJob: true,
          version,
        },
        undefined,
        10 // Highest priority for submissions
      );

      set({
        isSubmitting: false,
        error: 'Submission queued for sync when online',
      });
    }
  },

  validateChecklist: () => {
    const { template, responses } = get();

    if (!template) {
      return { isValid: false, errors: {} };
    }

    return validateForm(template.fields, responses);
  },

  clearChecklist: () => {
    set({
      template: null,
      responses: {},
      formState: {},
      isDirty: false,
      error: null,
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));

function getDefaultValue(type: FieldType): unknown {
  switch (type) {
    case 'text':
    case 'textarea':
      return '';
    case 'number':
      return null;
    case 'select':
      return null;
    case 'multi-select':
      return [];
    case 'date':
    case 'time':
      return null;
    case 'checkbox':
      return false;
    case 'photo':
      return []; // Array of photos (up to 5)
    case 'signature':
      return null;
    default:
      return null;
  }
}
