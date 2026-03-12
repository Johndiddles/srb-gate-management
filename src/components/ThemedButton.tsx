import React from "react";
import { Button as PaperButton } from "react-native-paper";

type PaperButtonProps = React.ComponentProps<typeof PaperButton>;

export default function ThemedButton({
  mode = "text",
  buttonColor,
  textColor,
  labelStyle,
  ...props
}: PaperButtonProps) {
  let defaultButtonColor = buttonColor;
  let defaultTextColor = textColor;

  if (mode === "contained") {
    defaultButtonColor = buttonColor || "#750670ff";
    defaultTextColor = textColor || "#ffffff";
  } else if (mode === "contained-tonal") {
    defaultButtonColor = buttonColor || "#e2e8f0";
    defaultTextColor = textColor || "#0f172a";
  } else if (mode === "outlined") {
    defaultTextColor = textColor || "#1e293b";
  } else if (mode === "text" || !mode) {
    defaultTextColor = textColor || "#000000";
  }

  return (
    <PaperButton
      mode={mode}
      buttonColor={defaultButtonColor}
      textColor={defaultTextColor}
      labelStyle={[
        defaultTextColor ? { color: defaultTextColor } : {},
        labelStyle,
      ]}
      {...props}
      theme={
        {
          ...props.theme,
          colors: {
            ...props.theme?.colors,
            outline: "#cbd5e1", // Explicit gray border for outlined buttons
            primary: "#059669",
          },
        } as any
      }
    />
  );
}
