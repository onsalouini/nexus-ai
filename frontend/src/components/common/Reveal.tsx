import { ReactNode } from "react";
import { useInView } from "../../hooks/useInView";

type Props = {
  children: ReactNode;
  delay?: number;
  className?: string;
};

export default function Reveal({ children, delay = 0, className = "" }: Props) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`nexus-reveal ${inView ? "is-visible" : ""} ${className}`}
      style={{ transitionDelay: inView ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}