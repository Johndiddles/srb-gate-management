import React from "react";
import { Searchbar as PaperSearchbar } from "react-native-paper";

type PaperSearchbarProps = React.ComponentProps<typeof PaperSearchbar>;

export default function ThemedSearchbar(props: PaperSearchbarProps) {
  return (
    <PaperSearchbar
      placeholderTextColor="#64748b" // Explicit Gray placeholder color
      iconColor="#64748b"
      inputStyle={[
        { color: "#1e293b" }, // Explicit Dark slate text color
        props.inputStyle,
      ]}
      {...props}
      style={[
        {
          backgroundColor: "#ffffff",
        },
        props.style,
      ]}
      theme={
        {
          ...props.theme,
          colors: {
            ...props.theme?.colors,
            onSurfaceVariant: "#64748b",
            elevation: {
              ...props.theme?.colors?.elevation,
              level3: "#ffffff", // Overrides default surface color in some themes
            },
          },
        } as any
      }
    />
  );
}
