import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getDonors, addDonor, updateDonor, deleteDonor, deleteDonorsBatch, resetDonorSequence, addDonorsBatch, Donor } from "@/lib/store";

export function useDonors() {
  return useQuery<Donor[]>({
    queryKey: ["donors"],
    queryFn: getDonors,
  });
}

export function useAddDonor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (donor: Omit<Donor, "id" | "created_at" | "updated_at" | "full_name">) => addDonor(donor),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["donors"] }),
  });
}

export function useUpdateDonor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Omit<Donor, "id" | "full_name">> }) =>
      updateDonor(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["donors"] }),
  });
}

export function useDeleteDonor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteDonor(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["donors"] }),
  });
}

export function useDeleteDonorsBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => deleteDonorsBatch(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["donors"] }),
  });
}

export function useResetDonorSequence() {
  return useMutation({
    mutationFn: () => resetDonorSequence(),
  });
}

export function useAddDonorsBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (donors: Omit<Donor, "id" | "created_at" | "updated_at" | "full_name">[]) => addDonorsBatch(donors),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["donors"] }),
  });
}
