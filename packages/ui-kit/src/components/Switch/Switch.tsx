import { Switch as BaseSwitch } from "@base-ui/react/switch";
import clsx from "clsx";
import { type FC } from "react";

import type { ISwitchProps } from "./types";

import "./Switch.css";

export const Switch: FC<ISwitchProps> = ({
    className,
    inputSize = "m",
    label,
    checked,
    defaultChecked,
    disabled = false,
    onCheckedChange
}) => {
    return (
        <BaseSwitch.Root
            className={clsx(
                "ui-kit-switch",
                `ui-kit-switch-size-${inputSize}`,
                className
            )}
            checked={checked}
            defaultChecked={defaultChecked}
            disabled={disabled}
            onCheckedChange={onCheckedChange}
        >
            <BaseSwitch.Thumb className="ui-kit-switch__thumb" />
            {label ? (
                <span className="ui-kit-switch__label">{label}</span>
            ) : null}
        </BaseSwitch.Root>
    );
};
