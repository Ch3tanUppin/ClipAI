"use client";

import axios from "axios";
import { useAuthStore } from "@/store/auth-store";
import type { PlanType, UserProfile, Video } from "@/lib/types";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" }
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function signup(input: { email: string; password: string; displayName: string }) {
  const { data } = await api.post<{ token: string; user: UserProfile }>("/auth/signup", input);
  return data;
}

export async function login(input: { email: string; password: string }) {
  const { data } = await api.post<{ token: string; user: UserProfile }>("/auth/login", input);
  return data;
}

export async function requestUploadUrl(file: File) {
  const { data } = await api.post<{ uploadUrl: string; objectKey: string }>("/videos/upload-url", {
    fileName: file.name,
    contentType: file.type || "video/webm",
    sizeBytes: file.size
  });
  return data;
}

export async function createVideo(input: { title: string; description?: string; objectKey: string; sizeBytes: number }) {
  const { data } = await api.post<Video>("/videos", input);
  return data;
}

export async function listVideos() {
  const { data } = await api.get<Video[]>("/videos");
  return data;
}

export async function getSharedVideo(publicId: string) {
  const { data } = await api.get<Video>(`/videos/share/${publicId}`);
  return data;
}

export async function deleteVideo(id: string) {
  await api.delete(`/videos/${id}`);
}

export async function renameVideo(id: string, title: string) {
  const { data } = await api.patch<Video>(`/videos/${id}`, { title });
  return data;
}

export async function updateVideo(id: string, input: Partial<Pick<Video, "title" | "description" | "privacy" | "summary" | "transcript" | "ctaLabel" | "ctaUrl">>) {
  const { data } = await api.patch<Video>(`/videos/${id}/settings`, input);
  return data;
}

export async function generateAiSummary(id: string) {
  const { data } = await api.post<{ title: string; summary: string; transcript: string }>(`/videos/${id}/ai-summary`);
  return data;
}

export async function addSharedComment(publicId: string, input: { authorName: string; body: string; emoji?: string }) {
  const { data } = await api.post(`/videos/share/${publicId}/comments`, input);
  return data;
}

export async function addSharedReaction(publicId: string, emoji: string) {
  const { data } = await api.post<Record<string, number>>(`/videos/share/${publicId}/reactions`, { emoji });
  return data;
}

export async function createPaymentOrder(plan: PlanType) {
  const { data } = await api.post<{ orderId: string; amountPaise: number; currency: string; keyId: string }>("/payments/order", { plan });
  return data;
}

export async function verifyPayment(payload: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) {
  const { data } = await api.post("/payments/verify", payload);
  return data;
}
