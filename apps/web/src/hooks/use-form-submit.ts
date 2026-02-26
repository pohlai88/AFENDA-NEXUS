'use client';

import { useState, useCallback, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { generateIdempotencyKey } from '@/lib/idempotency';

// ─── Types ───────────────────────────────────────────────────────────────────

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

interface UseFormSubmitOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  successMessage?: string;
  errorMessage?: string;
  redirectTo?: string;
  resetOnSuccess?: boolean;
  useIdempotencyKey?: boolean;
}

interface FormSubmitState {
  isSubmitting: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: string | null;
}

// ─── useFormSubmit Hook ──────────────────────────────────────────────────────

export function useFormSubmit<TInput, TResult>(
  action: (input: TInput) => Promise<ActionResult<TResult>>,
  options: UseFormSubmitOptions<TResult> = {}
) {
  const {
    onSuccess,
    onError,
    successMessage,
    errorMessage = 'An error occurred',
    redirectTo,
    resetOnSuccess = false,
    useIdempotencyKey = true,
  } = options;

  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<FormSubmitState>({
    isSubmitting: false,
    isSuccess: false,
    isError: false,
    error: null,
  });

  // Track current idempotency key
  const idempotencyKeyRef = useRef<string | null>(null);

  // Generate new key on mount and after successful submission
  const generateNewKey = useCallback(() => {
    idempotencyKeyRef.current = useIdempotencyKey ? generateIdempotencyKey() : null;
  }, [useIdempotencyKey]);

  // Initialize key
  if (useIdempotencyKey && !idempotencyKeyRef.current) {
    generateNewKey();
  }

  const submit = useCallback(
    async (input: TInput, formReset?: () => void) => {
      // Prevent double submission
      if (state.isSubmitting) {
        return;
      }

      setState({
        isSubmitting: true,
        isSuccess: false,
        isError: false,
        error: null,
      });

      try {
        // Add idempotency key to input if enabled
        const inputWithKey = useIdempotencyKey
          ? { ...input, idempotencyKey: idempotencyKeyRef.current }
          : input;

        const result = await action(inputWithKey);

        if (result.ok) {
          setState({
            isSubmitting: false,
            isSuccess: true,
            isError: false,
            error: null,
          });

          if (successMessage) {
            toast.success(successMessage);
          }

          onSuccess?.(result.data);

          if (resetOnSuccess && formReset) {
            formReset();
          }

          // Generate new key for next submission
          generateNewKey();

          if (redirectTo) {
            startTransition(() => {
              router.push(redirectTo);
            });
          }
        } else {
          setState({
            isSubmitting: false,
            isSuccess: false,
            isError: true,
            error: result.error,
          });

          toast.error(result.error || errorMessage);
          onError?.(result.error);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : errorMessage;
        setState({
          isSubmitting: false,
          isSuccess: false,
          isError: true,
          error: errorMsg,
        });

        toast.error(errorMsg);
        onError?.(errorMsg);
      }
    },
    [
      state.isSubmitting,
      action,
      onSuccess,
      onError,
      successMessage,
      errorMessage,
      redirectTo,
      resetOnSuccess,
      useIdempotencyKey,
      generateNewKey,
      router,
    ]
  );

  const reset = useCallback(() => {
    setState({
      isSubmitting: false,
      isSuccess: false,
      isError: false,
      error: null,
    });
    generateNewKey();
  }, [generateNewKey]);

  return {
    submit,
    reset,
    ...state,
    isPending: state.isSubmitting || isPending,
    idempotencyKey: idempotencyKeyRef.current,
  };
}

// ─── Submit Button Props Helper ──────────────────────────────────────────────

export function getSubmitButtonProps(isSubmitting: boolean) {
  return {
    disabled: isSubmitting,
    'aria-busy': isSubmitting,
    'aria-disabled': isSubmitting,
  };
}
