const PARTICLES = [
  { left: "8%", size: 3, color: "#22D3EE", duration: 14, delay: 0 },
  { left: "22%", size: 2, color: "#3B82F6", duration: 18, delay: 3 },
  { left: "38%", size: 4, color: "#8B5CF6", duration: 12, delay: 1 },
  { left: "54%", size: 2, color: "#22D3EE", duration: 20, delay: 5 },
  { left: "68%", size: 3, color: "#3B82F6", duration: 16, delay: 2 },
  { left: "80%", size: 2, color: "#8B5CF6", duration: 22, delay: 4 },
  { left: "91%", size: 3, color: "#22D3EE", duration: 15, delay: 6 },
];

export default function SignalParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="nexus-particle"
          style={{
            left: p.left,
            bottom: "-10%",
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 8px ${p.color}`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}