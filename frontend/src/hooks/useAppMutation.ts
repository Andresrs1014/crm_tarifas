import {
  useMutation,
  type MutateOptions,
  type UseMutationOptions,
  type UseMutationResult,
} from '@tanstack/react-query'

type MutationCallbacks<TData, TError, TVariables, TOnMutateResult> = Pick<
  MutateOptions<TData, TError, TVariables, TOnMutateResult>,
  'onSuccess' | 'onError' | 'onSettled'
>

export type AppMutationOptions<TData, TError, TVariables, TOnMutateResult> =
  UseMutationOptions<TData, TError, TVariables, TOnMutateResult> &
  MutationCallbacks<TData, TError, TVariables, TOnMutateResult>

function mergeMutateOptions<TData, TError, TVariables, TOnMutateResult>(
  hookCallbacks: MutationCallbacks<TData, TError, TVariables, TOnMutateResult>,
  callOptions?: MutateOptions<TData, TError, TVariables, TOnMutateResult>,
): MutateOptions<TData, TError, TVariables, TOnMutateResult> | undefined {
  const hasHook = hookCallbacks.onSuccess || hookCallbacks.onError || hookCallbacks.onSettled
  const hasCall = callOptions?.onSuccess || callOptions?.onError || callOptions?.onSettled
  if (!hasHook && !hasCall) return callOptions

  return {
    ...callOptions,
    onSuccess: (data, variables, onMutateResult, context) => {
      hookCallbacks.onSuccess?.(data, variables, onMutateResult, context)
      callOptions?.onSuccess?.(data, variables, onMutateResult, context)
    },
    onError: (error, variables, onMutateResult, context) => {
      hookCallbacks.onError?.(error, variables, onMutateResult, context)
      callOptions?.onError?.(error, variables, onMutateResult, context)
    },
    onSettled: (data, error, variables, onMutateResult, context) => {
      hookCallbacks.onSettled?.(data, error, variables, onMutateResult, context)
      callOptions?.onSettled?.(data, error, variables, onMutateResult, context)
    },
  }
}

/** useMutation con callbacks en el hook — compat v4 para React Query v5 (callbacks en mutate). */
export function useAppMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  options: AppMutationOptions<TData, TError, TVariables, TOnMutateResult>,
): UseMutationResult<TData, TError, TVariables, TOnMutateResult> {
  const { onSuccess, onError, onSettled, ...mutationOptions } = options
  const hookCallbacks = { onSuccess, onError, onSettled }

  const mutation = useMutation(mutationOptions)

  const mutate: typeof mutation.mutate = (variables, callOptions) => {
    mutation.mutate(variables, mergeMutateOptions(hookCallbacks, callOptions))
  }

  const mutateAsync: typeof mutation.mutateAsync = (variables, callOptions) =>
    mutation.mutateAsync(variables, mergeMutateOptions(hookCallbacks, callOptions))

  return { ...mutation, mutate, mutateAsync }
}
