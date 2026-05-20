"use client";

import dynamic from "next/dynamic";

const HomeClient = dynamic(() => import("@/components/home-client").then((mod) => mod.HomeClient), {
  ssr: false,
});

export default function HomePage() {
  return <HomeClient />;
}
