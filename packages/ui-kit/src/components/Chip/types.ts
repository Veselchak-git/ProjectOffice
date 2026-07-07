export interface IChipProps {
    className?: string;
    color?: "accent" | "neutral" | "red" | "green" | "orange";
    children: string;
    disabled?: boolean;
    onRemove?: () => void;
}
