export type TherapistType = {
    id?: number;
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
    distance?: string;
};

export type CreateTherapistType = Omit<TherapistType, 'referral_form_url' & 'expectations_letter_url'> & {
    referral_form?: string | Blob;
    expectations_letter?: string | Blob;
}

export type UpdateTherapistType = Omit<TherapistType, 'referral_form_url' & 'expectations_letter_url'> & {
    referral_form?: string | Blob;
    expectations_letter?: string | Blob;
}