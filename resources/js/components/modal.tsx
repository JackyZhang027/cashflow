import React, { PropsWithChildren } from 'react';

type Props = PropsWithChildren<{
    show: boolean;
    title?: string;
    onClose: () => void;
    maxWidth?: 'sm' | 'md' | 'lg';
}>;

const widths = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
};

export default function Modal({
    show,
    title,
    onClose,
    maxWidth = 'md',
    children,
}: Props) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className={`bg-white rounded-lg w-full ${widths[maxWidth]} p-6`}>
                <div className="flex items-center justify-between mb-4">
                    {title && <h2 className="text-lg font-semibold">{title}</h2>}
                    <button onClick={onClose} className="text-gray-500 cursor-pointer">✕</button>
                </div>

                {children}
            </div>
        </div>
    );
}
