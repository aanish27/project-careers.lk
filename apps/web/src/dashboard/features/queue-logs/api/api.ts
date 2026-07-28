import type { QueueLogSnapshot } from "@careerslk/types";
import { api } from "@dashboard-lib/axios";

export const queueLogsApi = {
  list: () =>
    api.get<QueueLogSnapshot[]>("/admin/queue-logs").then((res) => res.data),
};
