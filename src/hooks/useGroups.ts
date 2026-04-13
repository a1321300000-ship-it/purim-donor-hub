import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DonorGroup {
  id: number;
  name: string;
  task_type: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: number;
  group_id: number;
  donor_id: number;
  sort_order: number;
}

export interface GroupBachurAssignment {
  id: number;
  group_id: number;
  bachur_id: number;
}

export function useGroups() {
  return useQuery<DonorGroup[]>({
    queryKey: ["donor_groups"],
    queryFn: async () => {
      const { data, error } = await supabase.from("donor_groups").select("*").order("id");
      if (error) throw error;
      return data as unknown as DonorGroup[];
    },
  });
}

export function useGroupMembers(groupId?: number) {
  return useQuery<GroupMember[]>({
    queryKey: ["group_members", groupId],
    queryFn: async () => {
      let q = supabase.from("group_members").select("*").order("sort_order");
      if (groupId) q = q.eq("group_id", groupId);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as GroupMember[];
    },
  });
}

export function useAllGroupMembers() {
  return useQuery<GroupMember[]>({
    queryKey: ["group_members_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("group_members").select("*");
      if (error) throw error;
      return data as unknown as GroupMember[];
    },
  });
}

export function useGroupBachurAssignments(groupId?: number) {
  return useQuery<GroupBachurAssignment[]>({
    queryKey: ["group_bachur_assignments", groupId ?? "all"],
    queryFn: async () => {
      let q = supabase.from("group_bachur_assignments").select("*");
      if (groupId !== undefined) q = q.eq("group_id", groupId);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as GroupBachurAssignment[];
    },
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (group: { name: string; task_type: string }) => {
      const { data, error } = await supabase.from("donor_groups").insert(group).select().single();
      if (error) throw error;
      return data as unknown as DonorGroup;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["donor_groups"] }),
  });
}

export function useUpdateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: { name?: string; task_type?: string } }) => {
      const { error } = await supabase.from("donor_groups").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["donor_groups"] }),
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("donor_groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["donor_groups"] });
      qc.invalidateQueries({ queryKey: ["group_members"] });
      qc.invalidateQueries({ queryKey: ["group_bachur_assignments"] });
    },
  });
}

export function useAddGroupMembers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (members: { group_id: number; donor_id: number; sort_order: number }[]) => {
      const { error } = await supabase.from("group_members").insert(members);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["group_members"] });
      qc.invalidateQueries({ queryKey: ["group_members_all"] });
    },
  });
}

export function useRemoveGroupMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("group_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["group_members"] });
      qc.invalidateQueries({ queryKey: ["group_members_all"] });
    },
  });
}

export function useUpdateMemberOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { id: number; sort_order: number }[]) => {
      for (const u of updates) {
        const { error } = await supabase.from("group_members").update({ sort_order: u.sort_order }).eq("id", u.id);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["group_members"] }),
  });
}

export function useAssignBachur() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (assignment: { group_id: number; bachur_id: number }) => {
      const { error } = await supabase.from("group_bachur_assignments").insert(assignment);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["group_bachur_assignments"] }),
  });
}

export function useUnassignBachur() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("group_bachur_assignments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["group_bachur_assignments"] }),
  });
}

export function useCreateGroupsBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (groups: { name: string; task_type: string; members: { donor_id: number; sort_order: number }[] }[]) => {
      for (const g of groups) {
        const { data, error } = await supabase.from("donor_groups").insert({ name: g.name, task_type: g.task_type }).select().single();
        if (error) throw error;
        const group = data as unknown as DonorGroup;
        if (g.members.length > 0) {
          const { error: mErr } = await supabase.from("group_members").insert(
            g.members.map((m) => ({ group_id: group.id, donor_id: m.donor_id, sort_order: m.sort_order }))
          );
          if (mErr) throw mErr;
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["donor_groups"] });
      qc.invalidateQueries({ queryKey: ["group_members"] });
      qc.invalidateQueries({ queryKey: ["group_members_all"] });
    },
  });
}
