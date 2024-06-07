import { type } from "os";

export type OSType = "Mac" | "Windows" | "Linux";

export function getOSType(): OSType {
  const osString = type();
  
  switch (osString) {
    case "Darwin":
      return "Mac";
    case "windows":
      return "Windows";
    default:
      return "Linux";
  }
}