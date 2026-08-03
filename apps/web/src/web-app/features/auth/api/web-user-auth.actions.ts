"use server";

import { redirect } from "next/navigation";
import { webUserLogoutRequest } from "@web-app-lib/web-user-client";
import {
  destroyWebUserSession,
  getValidWebUserAccessToken,
} from "@web-app-lib/web-user-session";

export const logout = async (): Promise<void> => {
  const accessToken = await getValidWebUserAccessToken();

  if (accessToken) {
    await webUserLogoutRequest(accessToken).catch(() => {});
  }

  await destroyWebUserSession();
  redirect("/login");
};
