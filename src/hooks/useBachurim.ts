import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBachurim, addBachur, updateBachur, deleteBachur, addBachurimBatch, Bachur } from "@/lib/store";

export function useBachurim() {
  return useQuery<Bachur[]>({
    queryKey: ["bachurim"],
    queryFn: getBachurim,
  });
}

export function useAddBachur() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: Omit<Bachur, "id" | "created_at" | "updated_at">) => addBachur(b),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bachurim"] }),
  });
}

export function useUpdateBachur() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Omit<Bachur, "id">> }) =>
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

export function useAddBachurimBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bachurim: Omit<Bachur, "id" | "created_at" | "updated_at">[]) => addBachurimBatch(bachurim),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bachurim"] }),
  });
}
