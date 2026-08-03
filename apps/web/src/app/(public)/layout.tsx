import { Footer } from "@web-app-components/footer";
import { ReactNode } from "react";

export default function layout({ children }: { children: ReactNode }) {
  return (
    <div className="container mx-auto px-8">
      {children}
      <Footer />
    </div>
  );
}
