import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSelectOptions, addSelectOption, deleteSelectOption, SelectOption } from "@/lib/store";

export function useSelectOptions(listName: string) {
  return useQuery<SelectOption[]>({
    queryKey: ["select_options", listName],
    queryFn: () => getSelectOptions(listName),
  });
}

export function useAddSelectOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listName, value }: { listName: string; value: string }) =>
      addSelectOption(listName, value),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["select_options"] }),
  });
}

export function useDeleteSelectOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSelectOption(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["select_options"] }),
  });
}
