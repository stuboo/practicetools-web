import { AxiosResponse } from "axios";
import { TherapistType } from "../pages/home/types";
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

async function create(data: TherapistType): Promise<TherapistType> {
    try {
        const response: AxiosResponse<{ data: TherapistType }> = await apiClient.post(`/physicaltherapist`, data);
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