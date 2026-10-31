import type { Plan } from "./types";

// ID proyek lama DIPERTAHANKAN agar tugas lokal pengguna dari Tahap 2 tetap terhubung.
export function createDemoPlans(): Plan[] {
  const now = new Date().toISOString();
  return [
    {
      id: "p-learning",
      name: "E-Modul Interaktif",
      description: "Pengembangan materi pembelajaran digital",
      kind: "project",
      category: "education",
      period: "monthly",
      status: "active",
      startDate: null,
      endDate: null,
      goal: null, // Project biasa tidak memiliki konfigurasi Goal
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "p-portfolio",
      name: "Portfolio Website",
      description: "Website pribadi dan dokumentasi karya",
      kind: "project",
      category: "work",
      period: "monthly",
      status: "active",
      startDate: null,
      endDate: null,
      goal: null, // Memenuhi struktur interface Plan
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "p-taskflow",
      name: "TaskFlow App",
      description: "Aplikasi manajemen rencana berbasis React",
      kind: "project",
      category: "personal",
      period: "yearly",
      status: "active",
      startDate: null,
      endDate: null,
      goal: null,
      createdAt: now,
      updatedAt: now,
    },
  ];
}
