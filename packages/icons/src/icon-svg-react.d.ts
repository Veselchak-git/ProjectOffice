import type { ComponentProps, FunctionComponent } from "react";

declare const Icon: FunctionComponent<
    ComponentProps<"svg"> & {
        title?: string;
        titleId?: string;
        desc?: string;
        descId?: string;
    }
>;

export default Icon;
