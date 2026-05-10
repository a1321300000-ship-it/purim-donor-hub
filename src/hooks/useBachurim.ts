import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBachurim, addBachur, updateBachur, deleteBachur, deleteBachurimBatch, resetBachurSequence, addBachurimBatch, Bachur } from "@/lib/store";

export function useBachurim() {
  return useQuery<Bachur[]>({
    queryKey: ["bachurim"],
    queryFn: getBachurim,
  });
}

export function useAddBachur() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: Omit<Bachur, "id" | "created_at" | "updated_at" | "full_name">) => addBachur(b),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bachurim"] }),
  });
}

export function useUpdateBachur() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Omit<Bachur, "id" | "full_name">> }) =>
      updateBachur(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bachurim"] }),
  });
}

export function useDeleteBachur() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteBachur(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bachurim"] }),
  });
}

export function useDeleteBachurimBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => deleteBachurimBatch(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bachurim"] }),
  });
}

export function useResetBachurSequence() {
  return useMutation({
    mutationFn: () => resetBachurSequence(),
  });
}

export function useAddBachurimBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bachurim: Omit<Bachur, "id" | "created_at" | "updated_at" | "full_name">[]) => addBachurimBatch(bachurim),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bachurim"] }),
  });
}
