export type PlotStatus = 'ACTIVE' | 'WITHDRAWN' | 'IN_PROGRESS' | 'SWAPPED' | 'COMPLETED';
export type UserRole = 'SUPER_ADMIN_REPORTER' | 'PRESIDENT' | 'ENGINEER_INSPECTOR';

export interface Plot {
    id: string;
    serialNo: number;
    beneficiaryName: string;
    lotteryDate: string | null;
    contractNo: string;
    contractExpiryDate: string | null;
    studName: string;
    plotNo: string;
    contactInfo: string | null;
    buildingPermits: string | null;
    requestsAndDecisions: string | null;
    officialLetters: string | null;
    notes: string | null;
    status: PlotStatus;
    updatedAt: string;
}

export type PlotInput = Omit<Plot, 'id' | 'updatedAt'>;
export type PlotPatch = Partial<Pick<Plot, 'status' | 'contactInfo' | 'buildingPermits' | 'requestsAndDecisions' | 'officialLetters' | 'notes'>>;

export interface CurrentUser {
    id: string;
    username: string;
    fullName: string;
    role: UserRole;
}

export interface Auth {
    token: string;
    user: CurrentUser;
}

export interface UserRow {
    id: string;
    username: string;
    fullName: string;
    role: UserRole;
    deviceInfo: string | null;
    ipAddress: string | null;
    isActive: boolean;
    revokedAt: string | null;
    isOnline: boolean;
}

export interface Paged<T> {
    items: T[];
    total: number;
}
