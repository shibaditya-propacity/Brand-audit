import { create } from 'zustand';
import type { DeveloperInput, AuditWithRelations, ProgressEvent } from '@/types/audit';

interface WizardState {
  currentStep: number;
  formData: Partial<DeveloperInput>;
  auditMeta: {
    auditorName?: string;
    objective?: string;
    knownRedFlags?: string;
  };
}

interface AuditState {
  wizard: WizardState;
  currentAudit: AuditWithRelations | null;
  progressEvents: ProgressEvent[];
  isRunning: boolean;

  setWizardStep: (step: number) => void;
  updateFormData: (data: Partial<DeveloperInput>) => void;
  updateAuditMeta: (meta: Partial<WizardState['auditMeta']>) => void;
  resetWizard: () => void;

  setCurrentAudit: (audit: AuditWithRelations | null) => void;
  addProgressEvent: (event: ProgressEvent) => void;
  clearProgressEvents: () => void;
  setIsRunning: (running: boolean) => void;
}

const initialWizardState: WizardState = {
  currentStep: 1,
  formData: {
    microMarkets: [],
    targetSegments: [],
    reraNumbers: [],
    adPlatforms: [],
    competitors: [],
  },
  auditMeta: {},
};

export const useAuditStore = create<AuditState>((set) => ({
  wizard: initialWizardState,
  currentAudit: null,
  progressEvents: [],
  isRunning: false,

  setWizardStep: (step) => set(state => ({ wizard: { ...state.wizard, currentStep: step } })),
  updateFormData: (data) => set(state => ({ wizard: { ...state.wizard, formData: { ...state.wizard.formData, ...data } } })),
  updateAuditMeta: (meta) => set(state => ({ wizard: { ...state.wizard, auditMeta: { ...state.wizard.auditMeta, ...meta } } })),
  resetWizard: () => set({ wizard: initialWizardState }),

  setCurrentAudit: (audit) => set({ currentAudit: audit }),
  addProgressEvent: (event) => set(state => ({ progressEvents: [...state.progressEvents, event] })),
  clearProgressEvents: () => set({ progressEvents: [] }),
  setIsRunning: (running) => set({ isRunning: running }),
}));
