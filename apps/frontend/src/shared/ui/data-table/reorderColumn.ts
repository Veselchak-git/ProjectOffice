import type { DragEndEvent } from "@dnd-kit/core";

export function reorderColumn(event: DragEndEvent, columnOrder: string[], onOrderChange: (order: string[]) => void) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const prev = columnOrder;
    const oldIndex = prev.indexOf(String(active.id));
    const newIndex = prev.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    const next = [...prev];
    next.splice(newIndex, 0, ...next.splice(oldIndex, 1));
    onOrderChange(next);
}
