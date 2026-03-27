import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSettings, saveSetting, AppSettings } from "@/lib/store";

export function useSettings() {
  return useQuery<AppSettings>({
    queryKey: ["settings"],
    queryFn: getSettings,
  });
}

export function useSaveSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: any }) =>
      saveSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}
