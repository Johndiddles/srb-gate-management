import React from "react";
import { Text as PaperText, useTheme } from "react-native-paper";

type PaperTextProps = React.ComponentProps<typeof PaperText>;

export default function ThemedText(props: PaperTextProps) {
  const theme = useTheme();
  return (
    <PaperText
      {...props}
      style={[
        { color: theme.colors.onSurface },
        props.style,
      ]}
    />
  );
}
