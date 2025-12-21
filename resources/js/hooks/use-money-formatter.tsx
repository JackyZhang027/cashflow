export default function useMoneyFormatter() {
    const format = (
        value: number | string,
        options?: Intl.NumberFormatOptions
    ): string => {
        const number = Number(value ?? 0);

        if (Number.isNaN(number)) {
            return '0.00';
        }

        return number.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            ...options,
        });
    };

    return { format };
}
