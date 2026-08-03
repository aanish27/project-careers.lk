import { buttonVariants } from "@ui/button";

export function GoogleLoginButton({ next }: { next?: string }) {
  const href = next
    ? `/api/auth/google?next=${encodeURIComponent(next)}`
    : "/api/auth/google";

  return (
    <a href={href} className={buttonVariants({ className: "w-full" })}>
      Continue with Google
    </a>
  );
}
