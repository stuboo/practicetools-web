import { AxiosResponse } from "axios";
import apiClient from "./client";
import { Alternative, ProcedureAlias, Risk } from "../types";

async function getAll(): Promise<ProcedureAlias[]> {
    try {
        const response: AxiosResponse<ProcedureAlias[]> = await apiClient.get(`/procedure-alias`);
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch procedure alias.');
    }
}

async function risks(alias_ids: number[]): Promise<Risk[]> {
    try {
        const response: AxiosResponse<Risk[]> = await apiClient.get(`/procedure-alias/risks?${alias_ids.map((id) => `alias_ids=${id}&`)}`);
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch risks associated with the listed alias.');
    }
}

async function alternatives(alias_ids: number[]): Promise<Alternative[]> {
    try {
        const response: AxiosResponse<Alternative[]> = await apiClient.get(`/procedure-alias/alternatives?${alias_ids.map((id) => `alias_ids=${id}&`)}`);
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch alternatives for the listed alias.');
    }
}

// async function create(data: CreateProcedureAliasType): Promise<ProcedureAlias> {
//     try {
//         // const formData = new FormData();

//         // const response: AxiosResponse<{ data: TherapistType }> = await apiClient.post(`/physicaltherapist`, formData);
//         // return response.data.data;
//     } catch (error) {
//         throw new Error('Failed to create therapist.');
//     }
// }

const ProcedureAliasAPI = Object.freeze({
    getAll,
    risks,
    alternatives
});

export default ProcedureAliasAPI;