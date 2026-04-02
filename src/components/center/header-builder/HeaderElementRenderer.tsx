import React from "react";
import { HeaderElement } from "./types";
import { cn } from "@/lib/utils";

interface HeaderElementRendererProps {
  element: HeaderElement;
  className?: string;
}

export const HeaderElementRenderer: React.FC<HeaderElementRendererProps> = ({ element, className }) => {
  return (
    <div
      className={cn("overflow-hidden", className)}
      style={{
        position: "absolute",
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        zIndex: 10
      }}
    >
      {element.type === "text" ? (
        <div
          style={{
            ...element.styles,
            width: "100%",
            height: "100%",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word"
          }}
        >
          {element.content}
        </div>
      ) : (
        <img
          src={element.content}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain"
          }}
        />
      )}
    </div>
  );
};
