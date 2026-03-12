import React from "react";
import { Text as PaperText } from "react-native-paper";

type PaperTextProps = React.ComponentProps<typeof PaperText>;

export default function ThemedText(props: PaperTextProps) {
  return (
    <PaperText
      {...props}
      style={[
        { color: "#1e293b" }, // Enforce default dark slate text color
        props.style,
      ]}
    />
  );
}
