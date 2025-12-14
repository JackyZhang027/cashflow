import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';

type Branch = {
    id?: number;
    code: string;
    name: string;
    address?: string;
    city?: string;
    province?: string;
    opened_at?: string | null;
    closed_at?: string | null;
    is_active: boolean;
};

type Props = {
    show: boolean;
    branch?: Branch | null;
    onClose: () => void;
};

export default function BranchFormModal({ show, branch, onClose }: Props) {
    const isEdit = Boolean(branch?.id);

    const { data, setData, post, put, processing, errors, reset } = useForm<Branch>({
        code: '',
        name: '',
        address: '',
        city: '',
        province: '',
        opened_at: '',
        closed_at: '',
        is_active: true,
    });

    useEffect(() => {
        if (branch) {
            setData({
                code: branch.code,
                name: branch.name,
                address: branch.address || '',
                city: branch.city || '',
                province: branch.province || '',
                opened_at: branch.opened_at || '',
                closed_at: branch.closed_at || '',
                is_active: branch.is_active,
            });
        } else {
            reset();
        }
    }, [branch]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEdit) {
            put(route('branches.update', branch!.id), {
                preserveScroll: true,
                onSuccess: () => onClose(),
            });
        } else {
            post(route('branches.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    onClose();
                },
            });
        }
    };

    return (
        <Modal
            show={show}
            title={isEdit ? 'Edit Branch' : 'Create Branch'}
            onClose={onClose}
        >
            <form onSubmit={submit} className="space-y-4">
                {/* Code */}
                <div>
                    <label className="block text-sm font-medium">Code</label>
                    <input
                        className={`w-full border rounded px-3 py-2 ${
                            isEdit ? 'bg-gray-100' : ''
                        }`}
                        disabled={isEdit}
                        value={data.code}
                        onChange={e => setData('code', e.target.value.toUpperCase())}
                    />
                    {errors.code && <p className="text-red-500 text-sm">{errors.code}</p>}
                </div>

                {/* Name */}
                <div>
                    <label className="block text-sm font-medium">Name</label>
                    <input
                        className="w-full border rounded px-3 py-2"
                        value={data.name}
                        onChange={e => setData('name', e.target.value)}
                    />
                </div>

                {/* Address */}
                <div>
                    <label className="block text-sm font-medium">Address</label>
                    <textarea
                        className="w-full border rounded px-3 py-2"
                        value={data.address}
                        onChange={e => setData('address', e.target.value)}
                    />
                </div>

                {/* City & Province */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium">City</label>
                        <input
                            className="w-full border rounded px-3 py-2"
                            value={data.city}
                            onChange={e => setData('city', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Province</label>
                        <input
                            className="w-full border rounded px-3 py-2"
                            value={data.province}
                            onChange={e => setData('province', e.target.value)}
                        />
                    </div>
                </div>

                {/* Active */}
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={data.is_active}
                        onChange={e => setData('is_active', e.target.checked)}
                    />
                    <span>Active</span>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border rounded cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={processing}
                        className={`px-4 py-2 rounded text-white cursor-pointer
                            ${processing ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600'}
                        `}
                    >
                        {processing ? 'Saving...' : isEdit ? 'Update' : 'Save'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
