export type DriveTimeSource = 'google' | 'estimate';

export type TherapistType = {
    id: number;
    name: string;
    address: string;
    address_two?: string;
    city: string;
    state: string;
    zip: string;
    email?: string;
    website?: string;
    phone: string;
    fax?: string;
    notes?: string;
    medicare_status: boolean;
    medicaid_status: boolean;
    cash_only: boolean;
    referral_form_url?: string;
    expectations_letter_url?: string;
    latitude?: number;
    longitude?: number;
    /** Drive miles when Google answered, straight-line miles otherwise. */
    distance?: number;
    drive_time_minutes?: number;
    drive_distance_miles?: number;
    drive_time_source?: DriveTimeSource;
};

export type SearchMeta = {
    zip: string;
    origin: { latitude: number; longitude: number };
    radius_requested: number;
    /** The radius held nothing (or too little); these are the nearest anyway. */
    expanded: boolean;
    /** At least one result is a straight-line estimate, not a real drive time. */
    degraded: boolean;
    result_count: number;
};

export type SearchResult = {
    therapists: TherapistType[];
    meta: SearchMeta | null;
};

/** A 422 the UI should show inline rather than treat as a crash. */
export class SearchValidationError extends Error {}

export type CreateTherapistType = Omit<TherapistType, 'referral_form_url' | 'expectations_letter_url' | 'id'> & {
    referral_form?: string | Blob;
    expectations_letter?: string | Blob;
}

export type UpdateTherapistType = Omit<TherapistType, 'referral_form_url' | 'expectations_letter_url' | 'id'> & {
    id?: number;
    referral_form?: string | Blob;
    expectations_letter?: string | Blob;
}
