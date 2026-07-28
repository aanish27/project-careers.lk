export const keywordsKeys = {
  all: ["keywords"] as const,
  lists: () => [...keywordsKeys.all, "list"] as const,
};
