import { View } from "react-native";

// This is a shim for web and Android where the tab bar is generally opaque.
export default function TabBarBackground() {
  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#000000",
      }}
    />
  );
}

export function useBottomTabOverflow() {
  return 0;
}
