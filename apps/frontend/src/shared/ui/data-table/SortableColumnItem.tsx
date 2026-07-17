import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import GripIcon from "@helpdesk-portal/icons/GripIcon.svg?react";
import { Button, Checkbox } from "@helpdesk-portal/ui-kit";
import type { FC } from "react";

interface SortableColumnItemProps {
    id: string;
    label: string;
    isVisible: boolean;
    onToggle: () => void;
}

export const SortableColumnItem: FC<SortableColumnItemProps> = ({ id, label, isVisible, onToggle }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`sortable-column-item${isDragging ? " sortable-column-item--dragging" : ""}`}
        >
            <Button
                variant="link"
                size="s"
                className="sortable-column-item__drag-btn"
                type="button"
                {...attributes}
                {...listeners}
            >
                <GripIcon />
            </Button>
            <Checkbox inputSize="m" checked={isVisible} onCheckedChange={onToggle} />
            <span className="sortable-column-item__label" onClick={onToggle}>
                {label}
            </span>
        </div>
    );
};
