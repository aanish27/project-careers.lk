"use server";

import { WebJobFormInput } from "@careerslk/types";
import { toActionErrorMessage } from "@lib/api-client";
import { submitJobPostingRequest } from "@web-app-lib/web-user-client";
import {
  getValidWebUserAccessToken,
  updateWebUserSessionUser,
} from "@web-app-lib/web-user-session";
import { redirect } from "next/navigation";

export type PostJobFormState =
  | {
      error?: string;
    }
  | undefined;

export const postJob = async (
  _state: PostJobFormState,
  data: WebJobFormInput,
): Promise<PostJobFormState> => {
  const accessToken = await getValidWebUserAccessToken();
  if (!accessToken) redirect("/login");

  const { image, name, websiteUrl, ...job } = data;

  try {
    const { webUser } = await submitJobPostingRequest(accessToken, {
      company: name ? { name, ...(websiteUrl && { websiteUrl }) } : undefined,
      job,
      image: image instanceof File && image.size > 0 ? image : undefined,
    });
    await updateWebUserSessionUser(webUser);
  } catch (err) {
    return {
      error: toActionErrorMessage(
        err,
        "Something went wrong. Please try again.",
      ),
    };
  }

  redirect("/account");
};
