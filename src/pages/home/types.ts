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
};
