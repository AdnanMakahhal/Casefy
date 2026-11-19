import { GrainGradient } from "@paper-design/shaders-react";
import { useReducedMotion } from "motion/react";

export default function AuthGrainBackground() {
  const reducedMotion = useReducedMotion();
  return (
    <GrainGradient
      speed={reducedMotion ? 0 : 0.25}
      scale={1}
      rotation={0}
      offsetX={0}
      offsetY={0}
      softness={0.5}
      intensity={0.5}
      noise={0.25}
      shape="corners"
      frame={2854.5}
      colors={["#edf3ef", "#6c997c", "#294137", "#cfddd5"]}
      colorBack="#102019"
      className="absolute inset-0"
      style={{ width: "100%", height: "100%" }}
      maxPixelCount={1200000}
    />
  );
}
