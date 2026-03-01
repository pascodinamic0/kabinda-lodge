import { Monitor, Camera, Wifi, Coffee, LucideIcon } from "lucide-react";

const featureIconMap: Record<string, LucideIcon> = {
  "4K Display": Monitor,
  "Video Conferencing": Camera,
  "WiFi": Wifi,
  "High-Speed WiFi": Wifi,
  "Coffee Service": Coffee,
  "Coffee Machine": Coffee,
  "Refreshments": Coffee,
  "Premium Audio": Monitor,
  "Audio System": Monitor,
  "Projector": Monitor,
  "Whiteboard": Monitor,
  "Air Conditioning": Monitor,
  "Natural Lighting": Monitor,
  "Natural Light": Monitor,
  "Catering Available": Coffee,
  "Climate Control": Monitor,
};

export function getConferenceFeatureIcon(feature: string): LucideIcon {
  return featureIconMap[feature] || Monitor;
}
