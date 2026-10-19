// FILE: src/lib/social-media/constants.ts
// Standard state types and initial constants for social media form submissions.
// This module must NOT contain "use server" so client components can import constants.

export type SocialMediaActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const INITIAL_SOCIAL_STATE: SocialMediaActionState = {
  status: "idle",
  message: "",
};
