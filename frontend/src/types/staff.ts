export interface StaffMember {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    roleId: string;
    role?: { id: string; name: string };
    isActive: boolean;
    createdAt: string;
}

export interface Attendance {
    id: string;
    userId: string;
    user?: StaffMember;
    date: string;
    checkIn: string;
    checkOut: string | null;
    totalHours: number | null;
    status: 'present' | 'absent' | 'half_day' | 'on_leave';
    notes: string | null;
}

export interface LeaveRequest {
    id: string;
    userId: string;
    user?: StaffMember;
    leaveType: 'casual' | 'sick' | 'earned' | 'unpaid';
    startDate: string;
    endDate: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    approvedBy: string | null;
    approvedByUser?: StaffMember;
    createdAt: string;
}

export interface CreateLeaveRequestData {
    leaveType: 'casual' | 'sick' | 'earned' | 'unpaid';
    startDate: string;
    endDate: string;
    reason: string;
}

export interface MarkAttendanceData {
    userId: string;
    date?: string;
    checkIn: string;
    checkOut?: string;
    status: 'present' | 'absent' | 'half_day' | 'on_leave';
    notes?: string;
}
