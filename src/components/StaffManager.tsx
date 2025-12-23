import { useState, useEffect } from 'react';
import { User } from '../types';
import { staffService } from '../services/api';
import {
    UserPlus,
    Edit3,
    Trash2,
    X,
    Check,
    Loader2,
    Users,
    Shield,
    ShieldCheck,
    UserCog,
    Eye,
    EyeOff,
} from 'lucide-react';
import Swal from 'sweetalert2';

interface StaffManagerProps {
    onBack: () => void;
}

interface StaffForm {
    username: string;
    password: string;
    confirmPassword: string;
    name: string;
    email: string;
    role: 'admin' | 'operator' | 'staff';
}

const initialForm: StaffForm = {
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    email: '',
    role: 'staff',
};

const roleConfig = {
    admin: {
        label: 'Admin',
        description: 'สิทธิ์เต็ม',
        icon: ShieldCheck,
        color: 'text-purple-600 bg-purple-100',
    },
    operator: {
        label: 'Operator',
        description: 'ดำเนินงาน',
        icon: UserCog,
        color: 'text-blue-600 bg-blue-100',
    },
    staff: {
        label: 'Staff',
        description: 'เพิ่ม/แก้ไขเท่านั้น',
        icon: Shield,
        color: 'text-gray-600 bg-gray-100',
    },
};

export function StaffManager({ onBack }: StaffManagerProps) {
    const [staffList, setStaffList] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<StaffForm>(initialForm);
    const [saving, setSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        loadStaff();
    }, []);

    const loadStaff = async () => {
        setLoading(true);
        try {
            const response = await staffService.getAll();
            setStaffList(response.data || response || []);
        } catch (error) {
            console.error('Failed to load staff:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate password match
        if (form.password && form.password !== form.confirmPassword) {
            Swal.fire({
                icon: 'error',
                title: 'รหัสผ่านไม่ตรงกัน',
                text: 'กรุณากรอกรหัสผ่านให้ตรงกัน',
            });
            return;
        }

        setSaving(true);

        try {
            if (editingId) {
                await staffService.update(editingId, {
                    name: form.name,
                    email: form.email,
                    role: form.role,
                    ...(form.password ? { password: form.password } : {}),
                });
                await Swal.fire({
                    icon: 'success',
                    title: 'แก้ไขสำเร็จ',
                    timer: 1500,
                    showConfirmButton: false,
                });
            } else {
                await staffService.create(form);
                await Swal.fire({
                    icon: 'success',
                    title: 'เพิ่มพนักงานสำเร็จ',
                    timer: 1500,
                    showConfirmButton: false,
                });
            }
            setShowForm(false);
            setEditingId(null);
            setForm(initialForm);
            loadStaff();
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: error.response?.data?.error || error.message,
            });
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (staff: User) => {
        setEditingId(staff.id);
        setForm({
            username: staff.username,
            password: '',
            confirmPassword: '',
            name: staff.name,
            email: staff.email,
            role: staff.role,
        });
        setShowPassword(false);
        setShowForm(true);
    };

    const handleDelete = async (staff: User) => {
        const result = await Swal.fire({
            title: 'ลบพนักงาน?',
            text: `ต้องการลบ "${staff.name}" หรือไม่?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'ลบ',
            cancelButtonText: 'ยกเลิก',
        });

        if (!result.isConfirmed) return;

        try {
            await staffService.delete(staff.id);
            await Swal.fire({
                icon: 'success',
                title: 'ลบสำเร็จ',
                timer: 1500,
                showConfirmButton: false,
            });
            loadStaff();
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'ไม่สามารถลบได้',
                text: error.response?.data?.error || error.message,
            });
        }
    };

    const openAddForm = () => {
        setEditingId(null);
        setForm(initialForm);
        setShowForm(true);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                    <X className="w-5 h-5" />
                    กลับ
                </button>
                <button
                    onClick={openAddForm}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition"
                >
                    <UserPlus className="w-5 h-5" />
                    เพิ่มพนักงาน
                </button>
            </div>

            {/* Staff List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-800">รายชื่อพนักงาน</h3>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                ) : staffList.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>ยังไม่มีพนักงาน</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {staffList.map((staff) => {
                            const role = roleConfig[staff.role] || roleConfig.staff;
                            const RoleIcon = role.icon;

                            return (
                                <div
                                    key={staff.id}
                                    className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition"
                                >
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                                        {staff.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-800 truncate">{staff.name}</p>
                                        <p className="text-sm text-gray-400 truncate">@{staff.username}</p>
                                    </div>
                                    <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${role.color}`}>
                                        <RoleIcon className="w-3 h-3" />
                                        {role.label}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleEdit(staff)}
                                            className="p-2 hover:bg-blue-50 rounded-lg transition text-blue-600"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(staff)}
                                            className="p-2 hover:bg-red-50 rounded-lg transition text-red-600"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-bold text-lg text-gray-800">
                                {editingId ? 'แก้ไขพนักงาน' : 'เพิ่มพนักงานใหม่'}
                            </h3>
                            <button
                                onClick={() => setShowForm(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ชื่อ-นามสกุล
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    placeholder="กรอกชื่อ-นามสกุล"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={form.username}
                                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    placeholder="กรอก username"
                                    required
                                    disabled={!!editingId}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {editingId ? 'รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)' : 'รหัสผ่าน'}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        placeholder="กรอกรหัสผ่าน"
                                        required={!editingId}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password - only show when creating new or changing password */}
                            {(!editingId || form.password) && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        ยืนยันรหัสผ่าน
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={form.confirmPassword}
                                            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                            className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                            placeholder="กรอกรหัสผ่านอีกครั้ง"
                                            required={!editingId || !!form.password}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {form.password && form.confirmPassword && form.password !== form.confirmPassword && (
                                        <p className="text-red-500 text-xs mt-1">รหัสผ่านไม่ตรงกัน</p>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    placeholder="กรอก email"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ระดับสิทธิ์
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(Object.keys(roleConfig) as Array<keyof typeof roleConfig>).map((key) => {
                                        const config = roleConfig[key];
                                        const Icon = config.icon;
                                        const isSelected = form.role === key;

                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setForm({ ...form, role: key })}
                                                className={`p-3 rounded-xl border-2 transition text-center ${isSelected
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <Icon className={`w-5 h-5 mx-auto mb-1 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                                                <p className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                                                    {config.label}
                                                </p>
                                                <p className="text-[10px] text-gray-400">{config.description}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 py-2.5 px-4 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Check className="w-5 h-5" />
                                    )}
                                    {editingId ? 'บันทึก' : 'เพิ่ม'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
