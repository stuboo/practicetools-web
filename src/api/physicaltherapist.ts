import axios, { AxiosResponse } from "axios";
import apiClient from "./client";
import {
    CreateTherapistType,
    SearchMeta,
    SearchResult,
    SearchValidationError,
    TherapistType,
    UpdateTherapistType,
} from "../pages/search-therapists/types";

async function getAll(): Promise<TherapistType[]> {
    try {
        const response: AxiosResponse<{ data: TherapistType[] }> = await apiClient.get(`/physicaltherapist`);
        return response.data.data;
    } catch (error) {
        throw new Error('Failed to fetch therapists.');
    }
}

async function searchTherapistsByZipCode(zipCode: string, distance = 15): Promise<SearchResult> {
    try {
        const response: AxiosResponse<{ data: TherapistType[]; meta?: SearchMeta }> =
            await apiClient.get(`/physicaltherapist/distance/${zipCode}?distance=${distance}`);
        return { therapists: response.data.data ?? [], meta: response.data.meta ?? null };
    } catch (error) {
        // A 422 is the API telling us the ZIP is bad or unknown, in words meant
        // for the clinician. Flattening it into a generic failure would throw
        // away the only useful part of the response.
        if (axios.isAxiosError(error) && error.response?.status === 422) {
            const message = (error.response.data as { message?: string } | undefined)?.message;
            throw new SearchValidationError(message || 'That ZIP code was not recognized.');
        }
        if (axios.isAxiosError(error) && error.response?.status === 429) {
            throw new SearchValidationError('Too many searches right now. Please try again shortly.');
        }
        throw new Error('Failed to fetch therapists.');
    }
}

async function update(id: string, data: UpdateTherapistType): Promise<TherapistType> {
    try {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('address', data.address);
        formData.append('address_two', data.address_two || '');
        formData.append('city', data.city);
        formData.append('state', data.state);
        formData.append('zip', data.zip);
        formData.append('phone', data.phone);
        formData.append('email', data.email || '');
        formData.append('website', data.website || '');
        formData.append('notes', data.notes || '');
        formData.append('fax', data.fax || '');
        formData.append('medicare_status', String(data.medicare_status));
        formData.append('medicaid_status', String(data.medicaid_status));
        formData.append('cash_only', String(data.cash_only));
        if (data.referral_form) {
            formData.append('referral_form', data.referral_form);
        }
        if (data.expectations_letter) {
            formData.append('expectations_letter', data.expectations_letter);
        }

        const response: AxiosResponse<{ data: TherapistType }> = await apiClient.put(`/physicaltherapist/${id}`, formData);
        return response.data.data;
    } catch (error) {
        throw new Error('Failed to update therapist.');
    }
}

async function create(data: CreateTherapistType): Promise<TherapistType> {
    try {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('address', data.address);
        formData.append('address_two', data.address_two || '');
        formData.append('city', data.city);
        formData.append('state', data.state);
        formData.append('zip', data.zip);
        formData.append('phone', data.phone);
        formData.append('email', data.email || '');
        formData.append('website', data.website || '');
        formData.append('notes', data.notes || '');
        formData.append('fax', data.fax || '');
        formData.append('medicare_status', String(data.medicare_status));
        formData.append('medicaid_status', String(data.medicaid_status));
        formData.append('cash_only', String(data.cash_only));
        if (data.referral_form) {
            formData.append('referral_form', data.referral_form);
        }
        if (data.expectations_letter) {
            formData.append('expectations_letter', data.expectations_letter);
        }

        const response: AxiosResponse<{ data: TherapistType }> = await apiClient.post(`/physicaltherapist`, formData);
        return response.data.data;
    } catch (error) {
        throw new Error('Failed to create therapist.');
    }
}

async function deleteData(id: string): Promise<unknown> {
    try {
        return await apiClient.delete(`/physicaltherapist/${id}`);
    } catch (error) {
        throw new Error('Failed to delete therapist.');
    }
}

async function deleteMultiple(idsToBeDeleted: number[]): Promise<unknown> {
    try {
        return await apiClient.post(`/physicaltherapist/delete-multiple`, idsToBeDeleted);
    } catch (error) {
        throw new Error('Failed to delete therapists.');
    }
}

const PhysicalTherapistAPI = Object.freeze({
    getAll,
    searchTherapistsByZipCode,
    update,
    create,
    deleteData,
    deleteMultiple
});

export default PhysicalTherapistAPI;