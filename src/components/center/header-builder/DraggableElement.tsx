import React, { useState, useRef, useEffect } from "react";
import { Rnd } from "react-rnd";
import { HeaderElement, HeaderConfig } from "./types";
import { cn } from "@/lib/utils";
import { Move, Trash2, Edit2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DraggableElementProps {
  element: HeaderElement;
  config: HeaderConfig;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updatedElement: HeaderElement) => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  isEditor: boolean;
}

export const DraggableElement: React.FC<DraggableElementProps> = ({
  element,
  config,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  isEditor
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && textRef.current) {
        textRef.current.focus();
        // Move cursor to end
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(textRef.current);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
    }
  }, [isEditing]);

  if (!isEditor) {
    return (
      <div
        style={{
          position: "absolute",
          left: element.x,
          top: element.y,
          width: element.width,
          height: element.height,
          ...element.styles,
          overflow: "hidden"
        }}
      >
        {element.type === "text" ? (
          <div style={{ ...element.styles }}>{element.content}</div>
        ) : (
          <img src={element.content} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        )}
      </div>
    );
  }

  const handleDoubleClick = () => {
    if (element.type === "text") {
        setIsEditing(true);
    }
  };

  const handleBlur = () => {
    if (isEditing && textRef.current) {
        onUpdate({ ...element, content: textRef.current.innerText });
        setIsEditing(false);
    }
  };

  return (
    <Rnd
      size={{ width: element.width, height: element.height }}
      position={{ x: element.x, y: element.y }}
      dragGrid={[config.gridSize, config.gridSize]}
      resizeGrid={[config.gridSize, config.gridSize]}
      onDragStop={(e, d) => {
        onUpdate({ ...element, x: d.x, y: d.y });
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        onUpdate({
          ...element,
          width: ref.style.width,
          height: ref.style.height,
          ...position
        });
      }}
      bounds="parent"
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onDoubleClick={handleDoubleClick}
      className={cn(
        "group border border-transparent transition-all",
        isSelected && "border-primary ring-1 ring-primary/20 bg-primary/5",
        !isSelected && "hover:border-dashed hover:border-primary/40"
      )}
      enableResizing={isSelected && !isEditing}
      disableDragging={!isSelected || isEditing}
    >
      <div className="w-full h-full relative group">
        {isSelected && !isEditing && (
          <div className="absolute -top-10 left-0 flex items-center gap-1 bg-white shadow-lg border rounded-lg p-1 z-50">
             <div className="px-2 py-1 flex items-center gap-2 border-r">
                <Move className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">{element.type}</span>
             </div>
             <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-slate-100" onClick={(e) => { e.stopPropagation(); onDuplicate?.(); }}>
                <Copy className="h-3.5 w-3.5" />
             </Button>
             <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-red-50 hover:text-red-600" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                <Trash2 className="h-3.5 w-3.5" />
             </Button>
          </div>
        )}

        {element.type === "text" ? (
          <div
            ref={textRef}
            contentEditable={isEditing}
            onBlur={handleBlur}
            suppressContentEditableWarning
            className={cn(
                "w-full h-full outline-none",
                isEditing && "cursor-text"
            )}
            style={{
              ...element.styles,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word"
            }}
          >
            {element.content}
          </div>
        ) : (
          <div className="w-full h-full relative">
            <img
              src={element.content}
              alt=""
              className="w-full h-full object-contain pointer-events-none"
            />
          </div>
        )}
      </div>
    </Rnd>
  );
};
