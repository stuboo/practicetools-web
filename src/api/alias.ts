import { AxiosResponse } from "axios";
import apiClient from "./client";
import { Alternative, CreateProcedureAliasType, ProcedureAlias, Risk } from "../types";

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

async function create(data: CreateProcedureAliasType): Promise<ProcedureAlias> {
    // try {
    const response: AxiosResponse<{ data: ProcedureAlias }> = await apiClient.post(`/procedure-alias`, data);
    return response.data.data;
    // } catch (error) {
    // const e = error as AxiosError
    // const message = e.response?.data as string;
    // throw new Error(message || "Error occured while creating a new procedure alias");
    // throw error;
    // }
}

async function generateConsentForm(data: any): Promise<string> {
    // try {
    const response: AxiosResponse<string> = await apiClient.post(`/consent/generate-consent-form`, data);
    return response.data
}

const ProcedureAliasAPI = Object.freeze({
    getAll,
    risks,
    alternatives,
    create,
    generateConsentForm
});

export default ProcedureAliasAPI;