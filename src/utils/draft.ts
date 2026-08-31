import { BookingDraft } from '../types';

const DRAFT_KEY = 'movietix.draft';

export const saveDraft = (draft: BookingDraft) => {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
};

export const loadDraft = (): BookingDraft | null => {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as BookingDraft) : null;
  } catch {
    return null;
  }
};

export const clearDraft = () => sessionStorage.removeItem(DRAFT_KEY);
