import { useQuery } from "@tanstack/react-query";
import { getSummary } from "../api/summary.js";

export function useSummary(filters, enabled = true) {
  const params = {};

  if (filters.type) params.type = filters.type;
  if (filters.party) params.party = filters.party;

  if (filters.party === "single" && filters.party_id) {
    params.party_id = filters.party_id;
  }

  if (filters.date_from) params.date_from = filters.date_from;
  if (filters.date_to) params.date_to = filters.date_to;

  if (filters.status) params.status = filters.status;
  if (filters.direction) params.direction = filters.direction;
  if (filters.model) params.model = filters.model;
  if (filters.action) params.action = filters.action;

  if (filters.page) params.page = filters.page;
  if (filters.page_size) params.page_size = filters.page_size;

  return useQuery({
    queryKey: ["summary", params],
    queryFn: () => getSummary(params),
    enabled,
    placeholderData: (previousData) => previousData,
  });
}
