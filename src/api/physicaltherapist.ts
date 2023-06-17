import { AxiosResponse } from "axios";
import { CreateTherapistType, TherapistType } from "../pages/home/types";
import apiClient from "./client";

async function getAll(): Promise<TherapistType[]> {
    try {
        const response: AxiosResponse<{ data: TherapistType[] }> = await apiClient.get(`/physicaltherapist`);
        return response.data.data;
    } catch (error) {
        throw new Error('Failed to fetch therapists.');
    }
}

async function searchTherapistsByZipCode(zipCode: string): Promise<TherapistType[]> {
    try {
        const response: AxiosResponse<{ data: TherapistType[] }> = await apiClient.get(`/physicaltherapist/distance/${zipCode}`);
        return response.data.data;
    } catch (error) {
        throw new Error('Failed to fetch therapists.');
    }
}

async function update(id: string, data: TherapistType): Promise<TherapistType> {
    try {
        const response: AxiosResponse<{ data: TherapistType }> = await apiClient.put(`/physicaltherapist/${id}`, data);
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

        console.log("formdata: ", formData)
        const response: AxiosResponse<{ data: TherapistType }> = await apiClient.post(`/physicaltherapist`, formData);
        return response.data.data;
    } catch (error) {
        throw new Error('Failed to create therapist.');
    }
}

const PhysicalTherapistAPI = Object.freeze({
    getAll,
    searchTherapistsByZipCode,
    update,
    create
});

export default PhysicalTherapistAPI;