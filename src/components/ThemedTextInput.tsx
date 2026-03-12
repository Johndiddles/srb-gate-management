import React from "react";
import { TextInput as PaperTextInput } from "react-native-paper";

type PaperTextInputProps = React.ComponentProps<typeof PaperTextInput>;

export default function ThemedTextInput(props: PaperTextInputProps) {
  return (
    <PaperTextInput
      mode="outlined"
      textColor="#1e293b" // Explicit Dark slate text color for contrast on white
      outlineColor="#cbd5e1" // Explicit Gray border color
      activeOutlineColor="#059669" // Explicit Green active border
      placeholderTextColor="#64748b" // Explicit Gray placeholder color
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
            onSurfaceVariant: "#64748b", // Forces label and placeholder to be visible
            background: "#ffffff", // Ensures the label cutout background matches the input background
          },
        } as any
      }
    />
  );
}
