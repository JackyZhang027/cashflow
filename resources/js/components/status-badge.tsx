import { act } from "react";

type Props = {
    status: 'pending' | 'approved' | 'rejected';
};

const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    approved: 'bg-green-100 text-green-800 border-green-300',
    rejected: 'bg-red-100 text-red-800 border-red-300',
    active: 'bg-green-100 text-green-800 border-green-300',
    inactive: 'bg-green-100 text-green-800 border-green-300',
};

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    active: 'Active',
    inactive: 'Inactive',
};

export default function StatusBadge({ status }: Props) {
    return (
        <span
            className={`
                inline-flex items-center px-2.5 py-0.5
                rounded-full text-xs font-medium
                border ${STATUS_STYLES[status]}
            `}
        >
            {STATUS_LABELS[status]}
        </span>
    );
}
