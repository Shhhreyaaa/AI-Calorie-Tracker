"use client";

import dynamic from "next/dynamic";

const FloatingAICoach = dynamic(() => import("./FloatingAICoach"), {
  ssr: false
});

export default FloatingAICoach;
