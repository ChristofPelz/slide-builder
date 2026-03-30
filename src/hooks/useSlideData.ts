import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Presentation, Slide } from '../types/slide';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface UseSlideDataReturn {
  presentation: Presentation | null;
  currentSlide: Slide | null;
  currentSlideIndex: number;
  loading: boolean;
  error: string | null;
  setCurrentSlideIndex: (index: number) => void;
  savePresentation: (presentation: Presentation) => Promise<void>;
  loadPresentation: (id: string) => Promise<void>;
}

export function useSlideData(presentationId?: string): UseSlideDataReturn {
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPresentation = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: sbError } = await supabase
        .from('presentations')
        .select('*')
        .eq('id', id)
        .single();

      if (sbError) throw sbError;
      setPresentation(data as Presentation);
      setCurrentSlideIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load presentation');
    } finally {
      setLoading(false);
    }
  }, []);

  const savePresentation = useCallback(async (pres: Presentation) => {
    setLoading(true);
    setError(null);
    try {
      const { error: sbError } = await supabase
        .from('presentations')
        .upsert({ ...pres, updatedAt: new Date().toISOString() });

      if (sbError) throw sbError;
      setPresentation(pres);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save presentation');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (presentationId) {
      loadPresentation(presentationId);
    }
  }, [presentationId, loadPresentation]);

  const currentSlide = presentation?.slides[currentSlideIndex] ?? null;

  return {
    presentation,
    currentSlide,
    currentSlideIndex,
    loading,
    error,
    setCurrentSlideIndex,
    savePresentation,
    loadPresentation,
  };
}
