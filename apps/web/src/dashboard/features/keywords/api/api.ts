import type { KeywordWithJobCount } from "@careerslk/types";
import { api } from "@dashboard-lib/axios";

export const keywordsApi = {
  list: () =>
    api.get<KeywordWithJobCount[]>("/admin/keywords").then((res) => res.data),
};
