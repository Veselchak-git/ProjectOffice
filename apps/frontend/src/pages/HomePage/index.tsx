/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import Icon from "@helpdesk-portal/icons/ArrowLeft.svg?react";
import { Button } from "@helpdesk-portal/ui-kit";

import { Counter } from "@/entities/counter/ui/Counter";

import { useFakeProviderValue } from "@/shared/lib/FakeProvider";

import { SimpleWrapper } from "@/shared/ui";

export const HomePage = () => {
    const providerValue = useFakeProviderValue();
    return (
        <SimpleWrapper>
            <Counter />
            <div>HomePage {providerValue.foo}</div>
            <Button>Click me</Button>

            <Button variant="stroke" startIcon={<Icon />}>
                Click me 2
            </Button>
        </SimpleWrapper>
    );
};
