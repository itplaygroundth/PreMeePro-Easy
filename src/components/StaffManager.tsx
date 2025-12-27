import { useState, useEffect } from 'react';
import { User } from '../types';
import { staffService, authService } from '../services/api';
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
    Clock,
    UserCheck,
    UserX,
} from 'lucide-react';
import Swal from 'sweetalert2';

// LINE icon component
function LineIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
        </svg>
    );
}

interface PendingLineUser {
    line_user_id: string;
    display_name: string;
    picture_url?: string;
    email?: string;
    created_at: string;
}

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
    const [pendingLineUsers, setPendingLineUsers] = useState<PendingLineUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showApproveForm, setShowApproveForm] = useState(false);
    const [selectedLineUser, setSelectedLineUser] = useState<PendingLineUser | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<StaffForm>(initialForm);
    const [approveForm, setApproveForm] = useState({ username: '', role: 'staff' as 'admin' | 'operator' | 'staff' });
    const [saving, setSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [activeTab, setActiveTab] = useState<'staff' | 'pending'>('staff');

    useEffect(() => {
        loadStaff();
        loadPendingLineUsers();
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

    const loadPendingLineUsers = async () => {
        try {
            const response = await authService.getPendingLineUsers();
            setPendingLineUsers(response.data || []);
        } catch (error) {
            console.error('Failed to load pending LINE users:', error);
        }
    };

    const handleApproveLineUser = async () => {
        if (!selectedLineUser) return;

        if (!approveForm.username.trim()) {
            Swal.fire({
                icon: 'error',
                title: 'กรุณากรอก Username',
            });
            return;
        }

        setSaving(true);
        try {
            await authService.approveLineUser({
                lineUserId: selectedLineUser.line_user_id,
                role: approveForm.role,
                username: approveForm.username,
                name: selectedLineUser.display_name,
                email: selectedLineUser.email,
            });

            await Swal.fire({
                icon: 'success',
                title: 'อนุมัติสำเร็จ',
                text: `${selectedLineUser.display_name} ได้รับการอนุมัติเป็น ${approveForm.role}`,
                timer: 2000,
                showConfirmButton: false,
            });

            setShowApproveForm(false);
            setSelectedLineUser(null);
            setApproveForm({ username: '', role: 'staff' });
            loadPendingLineUsers();
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

    const handleRejectLineUser = async (lineUser: PendingLineUser) => {
        const result = await Swal.fire({
            title: 'ปฏิเสธผู้ใช้?',
            text: `ต้องการปฏิเสธ "${lineUser.display_name}" หรือไม่?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'ปฏิเสธ',
            cancelButtonText: 'ยกเลิก',
        });

        if (!result.isConfirmed) return;

        try {
            await authService.rejectLineUser(lineUser.line_user_id);
            await Swal.fire({
                icon: 'success',
                title: 'ปฏิเสธสำเร็จ',
                timer: 1500,
                showConfirmButton: false,
            });
            loadPendingLineUsers();
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: error.response?.data?.error || error.message,
            });
        }
    };

    const openApproveForm = (lineUser: PendingLineUser) => {
        setSelectedLineUser(lineUser);
        setApproveForm({
            username: lineUser.display_name.toLowerCase().replace(/\s+/g, '_'),
            role: 'staff',
        });
        setShowApproveForm(true);
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

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('staff')}
                    className={`px-4 py-2 font-medium transition border-b-2 -mb-px ${activeTab === 'staff'
                            ? 'text-blue-600 border-blue-600'
                            : 'text-gray-500 border-transparent hover:text-gray-700'
                        }`}
                >
                    <Users className="w-4 h-4 inline mr-2" />
                    พนักงาน ({staffList.length})
                </button>
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-4 py-2 font-medium transition border-b-2 -mb-px flex items-center gap-2 ${activeTab === 'pending'
                            ? 'text-green-600 border-green-600'
                            : 'text-gray-500 border-transparent hover:text-gray-700'
                        }`}
                >
                    <LineIcon className="w-4 h-4" />
                    รอการอนุมัติ
                    {pendingLineUsers.length > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {pendingLineUsers.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Pending LINE Users Tab */}
            {activeTab === 'pending' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-yellow-600" />
                        <h3 className="font-semibold text-gray-800">ผู้ใช้ LINE ที่รอการอนุมัติ</h3>
                    </div>

                    {pendingLineUsers.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <LineIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>ไม่มีผู้ใช้รอการอนุมัติ</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {pendingLineUsers.map((lineUser) => (
                                <div
                                    key={lineUser.line_user_id}
                                    className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition"
                                >
                                    {lineUser.picture_url ? (
                                        <img
                                            src={lineUser.picture_url}
                                            alt={lineUser.display_name}
                                            className="w-10 h-10 rounded-xl object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 bg-[#00B900] rounded-xl flex items-center justify-center">
                                            <LineIcon className="w-6 h-6 text-white" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-800 truncate">{lineUser.display_name}</p>
                                        <p className="text-sm text-gray-400 truncate">
                                            {lineUser.email || 'ไม่มีอีเมล'} • {new Date(lineUser.created_at).toLocaleDateString('th-TH')}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => openApproveForm(lineUser)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-green-50 hover:bg-green-100 rounded-lg transition text-green-600 text-sm font-medium"
                                        >
                                            <UserCheck className="w-4 h-4" />
                                            อนุมัติ
                                        </button>
                                        <button
                                            onClick={() => handleRejectLineUser(lineUser)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition text-red-600 text-sm font-medium"
                                        >
                                            <UserX className="w-4 h-4" />
                                            ปฏิเสธ
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Staff List Tab */}
            {activeTab === 'staff' && (
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
            )}

            {/* LINE User Approve Modal */}
            {showApproveForm && selectedLineUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 10000 }}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-green-50">
                            <div className="flex items-center gap-3">
                                {selectedLineUser.picture_url ? (
                                    <img
                                        src={selectedLineUser.picture_url}
                                        alt={selectedLineUser.display_name}
                                        className="w-10 h-10 rounded-xl object-cover"
                                    />
                                ) : (
                                    <div className="w-10 h-10 bg-[#00B900] rounded-xl flex items-center justify-center">
                                        <LineIcon className="w-6 h-6 text-white" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-bold text-gray-800">อนุมัติผู้ใช้ LINE</h3>
                                    <p className="text-sm text-gray-500">{selectedLineUser.display_name}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowApproveForm(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={approveForm.username}
                                    onChange={(e) => setApproveForm({ ...approveForm, username: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                    placeholder="กรอก username"
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
                                        const isSelected = approveForm.role === key;

                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setApproveForm({ ...approveForm, role: key })}
                                                className={`p-3 rounded-xl border-2 transition text-center ${isSelected
                                                    ? 'border-green-500 bg-green-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <Icon className={`w-5 h-5 mx-auto mb-1 ${isSelected ? 'text-green-600' : 'text-gray-400'}`} />
                                                <p className={`text-sm font-medium ${isSelected ? 'text-green-700' : 'text-gray-700'}`}>
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
                                    onClick={() => setShowApproveForm(false)}
                                    className="flex-1 py-2.5 px-4 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="button"
                                    onClick={handleApproveLineUser}
                                    disabled={saving}
                                    className="flex-1 py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <UserCheck className="w-5 h-5" />
                                    )}
                                    อนุมัติ
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 10000 }}>
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
