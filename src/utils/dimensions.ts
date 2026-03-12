import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

// Define a breakpoint for what you consider a tablet screen size
const tabletBreakpoint = 768; // Common breakpoint (e.g., in portrait mode)

export const isTabletByDimensions = () => {
  // Check the smaller dimension to handle both portrait and landscape
  const smallerDimension = Math.min(width, height);
  return smallerDimension >= tabletBreakpoint;
};
