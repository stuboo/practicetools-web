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

const PhysicalTherapistAPI = Object.freeze({
    getAll,
    searchTherapistsByZipCode
});

export default PhysicalTherapistAPI;