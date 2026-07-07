import { RadioGroup } from "@base-ui/react/radio-group";
import { Radio as BaseRadio } from "@base-ui/react/radio";
import clsx from "clsx";
import { type FC } from "react";

import type { IRadioProps } from "./types";

import "./Radio.css";

export const Radio: FC<IRadioProps> = ({
    className,
    inputSize = "m",
    name,
    value,
    defaultValue,
    options,
    disabled = false,
    onValueChange
}) => {
    return (
        <RadioGroup
            className={clsx(
                "ui-kit-radio-group",
                `ui-kit-radio-size-${inputSize}`,
                className
            )}
            name={name}
            value={value}
            defaultValue={defaultValue}
            disabled={disabled}
            onValueChange={onValueChange}
        >
            {options.map((option) => (
                <BaseRadio.Root
                    key={option.value}
                    value={option.value}
                    className="ui-kit-radio"
                >
                    <BaseRadio.Indicator className="ui-kit-radio__root">
                        <span className="ui-kit-radio__indicator" />
                    </BaseRadio.Indicator>
                    <span className="ui-kit-radio__label">{option.label}</span>
                </BaseRadio.Root>
            ))}
        </RadioGroup>
    );
};
